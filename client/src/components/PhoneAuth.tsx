import { useState, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PhoneAuth() {
    const { toast } = useToast();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const setupRecaptcha = () => {
        if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => {}
            });
        }
    };

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || phoneNumber.length < 10) {
            return toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid phone number with country code." });
        }

        setLoading(true);
        try {
            setupRecaptcha();
            const appVerifier = (window as any).recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(confirmation);
            setTimer(60);
            toast({ title: "OTP Sent", description: "Verification code sent to your phone." });
        } catch (error: any) {
            console.error("Firebase SMS error:", error);
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to send SMS. Check if Firebase is configured." });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationCode || verificationCode.length < 6) return;

        setLoading(true);
        try {
            const result = await confirmationResult?.confirm(verificationCode);
            const user = result?.user;
            if (user) {
                const idToken = await user.getIdToken();
                // Send to backend
                const response = await fetch("/api/auth/firebase", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken })
                });

                if (response.ok) {
                    toast({ title: "Welcome!", description: "Successfully signed in with phone." });
                    window.location.href = "/dashboard";
                } else {
                    const err = await response.json();
                    throw new Error(err.error || "Backend authentication failed");
                }
            }
        } catch (error: any) {
            console.error("OTP verification error:", error);
            toast({ variant: "destructive", title: "Verification Failed", description: "Invalid OTP or server error." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div id="recaptcha-container" />
            
            <AnimatePresence mode="wait">
                {!confirmationResult ? (
                    <motion.form
                        key="phone-input"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleSendCode}
                        className="space-y-4"
                    >
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                            <Input
                                type="tel"
                                placeholder="+91 98765-43210"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="h-14 pl-12 bg-white/5 border-white/5 focus:border-primary/50 rounded-xl"
                                required
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                        >
                            {loading ? "Sending..." : "Send Verification Code"}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </Button>
                    </motion.form>
                ) : (
                    <motion.form
                        key="otp-input"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleVerifyCode}
                        className="space-y-4"
                    >
                        <div className="relative group">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                            <Input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="h-14 pl-12 bg-white/5 border-white/5 focus:border-primary/50 rounded-xl tracking-[0.5em] font-bold text-center"
                                required
                                maxLength={6}
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? "Verifying..." : "Verify & Sign In"}
                            {!loading && <ShieldCheck className="w-4 h-4" />}
                        </Button>
                        <div className="flex justify-between items-center px-1">
                            <button 
                                type="button" 
                                onClick={() => setConfirmationResult(null)}
                                className="text-[10px] uppercase font-bold tracking-widest text-white/20 hover:text-white/40 transition-colors"
                            >
                                Change Number
                            </button>
                            {timer > 0 ? (
                                <span className="text-[10px] uppercase font-bold tracking-widest text-white/10 italic">Resend in {timer}s</span>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={handleSendCode}
                                    className="text-[10px] uppercase font-bold tracking-widest text-primary hover:text-primary/80"
                                >
                                    Resend Code
                                </button>
                            )}
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
