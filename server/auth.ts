import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { type User } from "../shared/schema";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

export function setupAuth(app: Express) {
    const MemoryStore = createMemoryStore(session);
    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "eventfold-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Changed to false to allow session persistence on Vercel proxied domains
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        },
        store: new MemoryStore({
            checkPeriod: 86400000,
        }),
    };

    if (app.get("env") === "production") {
        app.set("trust proxy", 1);
    }

    app.use(session(sessionSettings));
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
