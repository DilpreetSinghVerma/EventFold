import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ArrowLeft, Plus, Minus, HelpCircle, Sparkles, Smartphone, ShieldCheck, Zap, Heart, CreditCard, Share2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const faqs = [
  {
    question: "What is EventFold Studio?",
    answer: "EventFold Studio is a premium platform for photographers and creators to transform traditional static albums into immersive, 3D cinematic digital flipbooks. Our engine brings photos to life with realistic page-turning animations, background music, and instant sharing.",
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    question: "How do I share my albums with clients?",
    answer: "Every album you create generates a unique QR code and a shareable link. You can download the QR code to print on table cards or send the link directly via WhatsApp, Instagram, or Email. Your clients just need to scan any QR code to launch the experience instantly.",
    icon: <Share2 className="w-5 h-5" />
  },
  {
    question: "Is the first album really free?",
    answer: "Yes! We want you to experience the magic of EventFold first-hand. Your first project is on us—completely free with all premium features included, so you can show your clients the future of digital storytelling.",
    icon: <Heart className="w-5 h-5" />
  },
  {
    question: "How long will my albums stay online?",
    answer: "We offer Secure Lifetime Hosting for all projects. Once your album is live, it's there forever. No annual renewal fees or storage limits for your memories.",
    icon: <ShieldCheck className="w-5 h-5" />
  },
  {
    question: "Can I use my own brand logo?",
    answer: "Absolutely! Our Elite Studio and Agency plans allow you to upload your own professional logo, which will then appear on the viewer for all your albums, ensuring your brand stays front and center.",
    icon: <Smartphone className="w-5 h-5" />
  },
  {
    question: "Are my albums private?",
    answer: "Yes. You have the option to set a dedicated passcode for each album. Only people with the password will be able to view the content, ensuring your clients' privacy is always protected.",
    icon: <Zap className="w-5 h-5" />
  },
  {
    question: "What are the pricing models?",
    answer: "We offer a flexible pay-as-you-go model at ₹49 per album, a Monthly Unlimited plan at ₹199 for high-volume studios, and a Yearly Elite plan at ₹899 for the best value. All plans include lifetime hosting.",
    icon: <CreditCard className="w-5 h-5" />
  }
];

function FAQItem({ item, isOpen, onClick }: { item: typeof faqs[0], isOpen: boolean, onClick: () => void }) {
  return (
    <motion.div 
      initial={false}
      className={`border-b border-white/5 transition-all duration-500 overflow-hidden ${isOpen ? 'bg-white/[0.02]' : ''}`}
    >
      <button
        onClick={onClick}
        className="w-full py-8 px-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-6">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-white/5 text-white/20 group-hover:text-white/40'}`}>
            {item.icon}
          </div>
          <span className={`text-lg md:text-xl font-bold transition-colors ${isOpen ? 'text-white' : 'text-white/60'}`}>
            {item.question}
          </span>
        </div>
        <div className={`transition-transform duration-500 ${isOpen ? 'rotate-180 text-primary' : 'text-white/20'}`}>
          {isOpen ? <Minus className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="px-24 pb-8 text-white/60 text-lg leading-relaxed max-w-3xl">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const { user } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Royal Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10 text-primary/5">
        <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] animate-slow-spin opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
            <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
          </svg>
        </div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/">
          <div className="h-16 cursor-pointer group">
            <img src="/branding material/without bg version.png" alt="EventFold" className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-110" />
          </div>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="text-sm font-medium text-white/50 hover:text-white transition-colors gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-8 pt-12 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-16"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-4 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
              <HelpCircle className="w-3 h-3" /> Frequently Asked Questions
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight">
              Curiosities or <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] via-primary to-indigo-400">Questions?</span>
            </h1>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">Everything you need to know about EventFold Studio and the next generation of digital albums.</p>
          </div>

          <div className="glass border-white/5 rounded-[3rem] overflow-hidden">
            {faqs.map((faq, index) => (
              <FAQItem 
                key={index} 
                item={faq} 
                isOpen={openIndex === index} 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>

          {/* Need More Help */}
          <div className="text-center pt-24 space-y-8">
            <div className="p-12 md:p-16 glass rounded-[4rem] border-white/5 space-y-8 max-w-3xl mx-auto relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl font-display font-bold">Still have questions?</h2>
                <p className="text-white/40">We're here to help you create the perfect experience for your clients. Drop us a message.</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/create">
                    <Button size="lg" className="rounded-2xl h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-white font-bold group">
                      Get Started <Zap className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                    </Button>
                  </Link>
                  <a href="https://www.instagram.com/eventfoldstudio/" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="lg" className="rounded-2xl h-16 px-10 text-lg border-white/10 hover:bg-white/5 text-white font-bold gap-3">
                      <Share2 className="w-5 h-5" /> Visit Instagram
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="py-20 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <Link href="/about" className="hover:text-primary transition-colors">Our Story</Link>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <Link href="/terms" className="hover:text-[#FF9933] transition-colors">Terms of Service</Link>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <Link href="/privacy" className="hover:text-[#FF9933] transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
