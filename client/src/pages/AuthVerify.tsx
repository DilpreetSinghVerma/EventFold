import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function AuthVerify() {
    const { user, isLoading } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [code, setCode] = useState("");
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            setLocation("/login");
        } else if (!isLoading && user?.isVerified === 1) {
            setLocation("/dashboard");
        }
    }, [user, isLoading, setLocation]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });

            if (res.ok) {
                toast({ title: "Email Verified!", description: "Welcome to the elite standard of album delivery." });
                await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                setLocation("/dashboard");
            } else {
                const data = await res.json();
                toast({ variant: "destructive", title: "Verification Failed", description: data.error || "Invalid code." });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
        } finally {
            setVerifying(false);
        }
    };

    if (isLoading) return null;

    return (
        <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px] animate-pulse pointer-events-none opacity-40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="w-full max-w-[500px] relative z-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-bold tracking-[0.3em] uppercase mb-8 backdrop-blur-md">
                    <ShieldCheck className="w-3 h-3" /> Identity Verification
                </div>

                <h1 className="text-4xl font-bold tracking-tight mb-4">Check your email</h1>
                <p className="text-white/40 mb-12">
                    We've sent a 6-digit verification code to <span className="text-white font-medium">{user?.email}</span>.
                </p>

                <Card className="glass border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                    <CardContent className="p-10 space-y-8">
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="h-16 pl-12 text-center text-2xl tracking-[0.5em] font-bold bg-white/5 border-white/5 focus:border-primary/50 rounded-2xl"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={verifying || code.length !== 6}
                                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg gap-3"
                            >
                                {verifying ? "Verifying..." : "Complete Setup"}
                                {!verifying && <ArrowRight className="w-4 h-4" />}
                            </Button>
                        </form>

                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">
                            Didn't receive the code? 
                            <button 
                                type="button"
                                onClick={async () => {
                                    try {
                                        const res = await fetch("/api/auth/resend-code", { method: "POST" });
                                        if (res.ok) {
                                            toast({ title: "Code Resent!", description: "Please check your inbox." });
                                        }
                                    } catch (e) {
                                        toast({ variant: "destructive", title: "Error", description: "Failed to resend code." });
                                    }
                                }}
                                className="ml-2 text-primary hover:text-primary/80 transition-colors"
                            >
                                Resend Code
                            </button>
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
