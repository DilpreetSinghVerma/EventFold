import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import cookieSession from "cookie-session";
import { storage } from "./storage";
import { type User } from "../shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { sendVerificationEmail } from "./lib/email";


const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}


export function setupAuth(app: Express) {
    if (app.get("env") === "production") {
        app.set("trust proxy", 1);
    }


    app.use(cookieSession({
        name: 'session',
        keys: [process.env.SESSION_SECRET || "eventfold-secret-key"],
        maxAge: 24 * 60 * 60 * 1000,
        secure: false, // Changed to false for easier testing on Vercel preview/proxied domains
        sameSite: 'lax',
    }));

    // COOKIE-SESSION PASSPORT SHIM
    // cookie-session doesn't have regenerate() or save() but passport expects them.
    app.use((req: any, _res, next) => {
        if (req.session && !req.session.regenerate) {
            req.session.regenerate = (cb: any) => cb();
        }
        if (req.session && !req.session.save) {
            req.session.save = (cb: any) => cb();
        }
        next();
    });

    app.use(passport.initialize());
    app.use(passport.session());

    // Google Strategy (Main)
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID || "dummy",
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
                callbackURL: "/api/auth/google/callback",
                proxy: true,
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0].value;
                    if (!email) return done(new Error("No email found from Google"));

                    let user = await storage.getUserByGoogleId(profile.id);
                    if (!user) {
                        user = await storage.getUserByEmail(email);
                        if (user) {
                            // Link Google account and ensure verified
                            user = await storage.updateUser(user.id, { 
                                googleId: profile.id,
                                isVerified: 1,
                                avatar: user.avatar || profile.photos?.[0].value || null
                            });
                        } else {
                            user = await storage.createUser({
                                googleId: profile.id,
                                email: email,
                                name: profile.displayName,
                                avatar: profile.photos?.[0].value || null,
                                plan: 'free',
                                stripeCustomerId: null,
                                subscriptionId: null,
                                razorpayCustomerId: null,
                                razorpaySubscriptionId: null,
                                password: null,
                                isVerified: 1, // Google users are pre-verified
                                verificationCode: null,
                            });
                        }
                    }
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    // Local Strategy
    passport.use(
        new LocalStrategy(
            { usernameField: "email" },
            async (email, password, done) => {
                try {
                    // Logic for the specific test account given to Razorpay
                    if (email === "dilpreetsinghverma@gmail.com" && password === "eventfold_secure_secret_2026") {
                        let user = await storage.getUserByEmail(email);
                        if (!user) {
                            user = await storage.createUser({
                                googleId: null,
                                email: email,
                                name: "Admin Reviewer",
                                avatar: null,
                                plan: 'free',
                                stripeCustomerId: null,
                                subscriptionId: null,
                                password: null, // Test account doesn't need hashed password for this check
                                razorpayCustomerId: null,
                                razorpaySubscriptionId: null,
                                isVerified: 1, // Admin is auto-verified
                                verificationCode: null,
                            });
                        }

                        return done(null, user);
                    }

                    const user = await storage.getUserByEmail(email);
                    if (!user || !user.password) {
                        return done(null, false, { message: "Invalid credentials" });
                    }

                    const isMatch = await comparePasswords(password, user.password);
                    if (!isMatch) {
                        return done(null, false, { message: "Invalid credentials" });
                    }

                    return done(null, user);
                } catch (e) {
                    return done(e);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, (user as User).id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    // Auth Routes
    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get(
        "/api/auth/google/callback",
        passport.authenticate("google", { failureRedirect: "/login" }),
        (req, res) => {
            res.redirect("/dashboard");
        }
    );

    // Local Login Route
    app.post("/api/auth/login", (req, res, next) => {
        passport.authenticate("local", (err: any, user: any, info: any) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({ error: info?.message || "Login failed" });
            req.logIn(user, (err) => {
                if (err) return next(err);
                res.json(user);
            });
        })(req, res, next);
    });


    // Register Route
    app.post("/api/auth/register", async (req, res, next) => {
        try {
            const { email, password, name } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: "Email and password are required" });
            }

            const cleanEmail = email.toLowerCase().trim();
            const existingUser = await storage.getUserByEmail(cleanEmail);
            if (existingUser) {
                return res.status(400).json({ error: "User already exists" });
            }

            // Generate a 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const hashedPassword = await hashPassword(password);

            const user = await storage.createUser({
                googleId: null,
                email: cleanEmail,
                name: name || cleanEmail.split('@')[0],
                avatar: null,
                plan: 'free',
                stripeCustomerId: null,
                subscriptionId: null,
                password: hashedPassword,
                razorpayCustomerId: null,
                razorpaySubscriptionId: null,
                isVerified: 0,
                verificationCode: otp,
            });

            await sendVerificationEmail(cleanEmail, otp);


            req.logIn(user, (err) => {
                if (err) return next(err);
                res.status(201).json({ ...user, requiresVerification: true });
            });
        } catch (e) {
            next(e);
        }
    });

    // Verification Route
    app.post("/api/auth/verify", async (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
        const { code } = req.body;
        const user = req.user as User;

        if (user.isVerified === 1) {
            return res.json({ success: true, message: "Already verified" });
        }

        if (user.verificationCode === code) {
            const updatedUser = await storage.updateUser(user.id, { isVerified: 1, verificationCode: null });
            // Update session user
            Object.assign(req.user as any, updatedUser);
            return res.json({ success: true, user: updatedUser });
        }

        res.status(400).json({ error: "Invalid verification code" });
    });

    // Resend Code Route
    app.post("/api/auth/resend-code", async (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
        const user = req.user as User;

        if (user.isVerified === 1) {
            return res.json({ success: true, message: "Already verified" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await storage.updateUser(user.id, { verificationCode: otp });
        
        if (user.email) {
            await sendVerificationEmail(user.email, otp);
        }
        res.json({ success: true, message: "New code sent" });
    });

    app.get("/api/auth/me", (req, res) => {


        if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

        const user = req.user as User;


        res.json(user);
    });

    app.post("/api/auth/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.json({ success: true });
        });
    });
}
