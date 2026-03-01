import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import cookieSession from "cookie-session";
import { storage } from "./storage";
import { type User } from "../shared/schema";

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
                            // Link Google account to existing user email if needed
                            // (Simplification: just return the user)
                        } else {
                            user = await storage.createUser({
                                googleId: profile.id,
                                email: email,
                                name: profile.displayName,
                                avatar: profile.photos?.[0].value || null,
                                plan: 'free',
                                stripeCustomerId: null,
                                subscriptionId: null,
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

    app.get("/api/auth/me", (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
        res.json(req.user);
    });

    app.post("/api/auth/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.json({ success: true });
        });
    });
}
