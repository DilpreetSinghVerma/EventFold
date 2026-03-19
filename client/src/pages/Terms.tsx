import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Book, ShieldCheck, Scale, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
    return (
        <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 p-8 pb-32">
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            
            <header className="max-w-4xl mx-auto flex items-center justify-between mb-16 relative z-10">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 text-white/50 hover:text-white glass rounded-xl pr-6 pl-4">
                        <ArrowLeft className="w-4 h-4" /> Back Home
                    </Button>
                </Link>
                <div className="flex flex-col items-end text-right">
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white/40 uppercase tracking-widest leading-none">Legal</h1>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mt-2">Terms of Service</p>
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
                                <Scale className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-display font-bold">Terms of Service</h2>
                        </div>
                        <p className="text-white/60 leading-relaxed">
                            Welcome to EventFold Studio. By using our services, you agree to comply with and be bound by the following terms and conditions of use. Please read these terms carefully.
                        </p>
                        <p className="text-xs text-white/30 italic">Last Updated: March 20, 2026</p>
                    </section>

                    <div className="space-y-8 prose prose-invert max-w-none">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono">01.</span> Account Registration
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                To access EventFold Studio, you must register through Google Authentication. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono">02.</span> Subscription & Payments
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                All payments are processed through Razorpay. Fees are non-refundable unless stated otherwise. 
                                High-resolution cloud storage is provided based on your active plan (Trial, Credit, or Elite).
                            </p>
                            <ul className="text-white/50 space-y-2 text-sm list-disc pl-5">
                                <li>Trial albums are stored for 7 days.</li>
                                <li>Credit-based albums are stored for 1 year.</li>
                                <li>Elite/Pro plans include lifetime storage during active subscription.</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono">03.</span> Content Ownership
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                You (the Studio) retain all intellectual property rights to the photographs and media you upload. EventFold Studio does not claim ownership over your content. You grant us a limited license to host and transform your media for the sole purpose of providing the 3D viewer service.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono">04.</span> Acceptable Use
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                You agree not to upload content that is illegal, harmful, threatening, abusive, or otherwise objectionable. We reserve the right to remove any content or terminate accounts that violate these terms.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-primary text-sm font-mono">05.</span> Limitation of Liability
                            </h3>
                            <p className="text-white/50 leading-relaxed text-sm italic">
                                EventFold Studio is provided "as is" without warranty of any kind. In no event shall we be liable for any damages arising out of the use or inability to use our services.
                            </p>
                        </div>

                        <div className="space-y-4 pt-12 border-t border-white/5">
                            <h3 className="text-xl font-bold text-white">Governing Law</h3>
                            <p className="text-white/50 leading-relaxed text-sm">
                                These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
