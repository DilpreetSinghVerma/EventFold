import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Key } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 p-8 pb-32">
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
            
            <header className="max-w-4xl mx-auto flex items-center justify-between mb-16 relative z-10">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 text-white/50 hover:text-white glass rounded-xl pr-6 pl-4">
                        <ArrowLeft className="w-4 h-4" /> Back Home
                    </Button>
                </Link>
                <div className="flex flex-col items-end text-right">
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white/40 uppercase tracking-widest leading-none">Security</h1>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mt-2">Privacy Policy</p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-12"
                >
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-display font-bold">Privacy Policy</h2>
                        </div>
                        <p className="text-white/60 leading-relaxed">
                            Your privacy is paramount. This policy outlines how EventFold Studio collects, uses, and protects your information and the information of your clients.
                        </p>
                        <p className="text-xs text-white/30 italic">Last Updated: March 20, 2026</p>
                    </section>

                    <div className="space-y-8 prose prose-invert max-w-none">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono tracking-widest uppercase">Collecting Data</span>
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                We collect information you provide directly to us through Google Authentication, including your name, email address, and avatar. 
                                We also collect the photographs and media you upload to create your albums.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono tracking-widest uppercase">Usage of Media</span>
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                Photographs uploaded to EventFold Studio are used exclusively for displaying your digital albums in the 3D viewer. 
                                We optimize these images using Cloudinary for performance and web delivery. We do not sell, rent, or trade your photographs or your clients' photographs to third parties.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono tracking-widest uppercase">Data Storage</span>
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                We utilize secure cloud storage via Neon and Cloudinary. 
                                We follow industry best practices to protect your data from unauthorized access or disclosure.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono tracking-widest uppercase">Payments</span>
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                Payment information is handled securely by Razorpay. We do not store your credit card or sensitive financial information on our own servers.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono tracking-widest uppercase">User Rights</span>
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                You have the right to access, correct, or delete your personal data. 
                                You can delete your albums and associated photographs at any time through the studio dashboard. 
                                Deleting an album removes it and all its associated photographs from our servers.
                            </p>
                        </div>

                        <div className="space-y-4 pt-12 border-t border-white/5">
                            <h3 className="text-xl font-bold text-white">Contact Us</h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                If you have any questions about this Privacy Policy, please contact us at:
                            </p>
                            <a href="mailto:eventfoldstudio@gmail.com" className="text-primary font-bold hover:underline">eventfoldstudio@gmail.com</a>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
