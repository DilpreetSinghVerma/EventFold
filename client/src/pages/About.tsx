import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Sparkles, BookOpen, Share2, Smartphone, ShieldCheck, Zap, Youtube, Linkedin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from 'react';

export default function About() {
  const { user } = useAuth();
  
  useEffect(() => {
    document.title = "Our Story | The Vision Behind EventFold Studio";
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as any } }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Royal Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-[#FF9933]/10 rounded-full blur-[120px] [animation-delay:2s] animate-pulse" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/">
          <div className="h-16 cursor-pointer group">
            <img
              src="/branding material/without bg version.png"
              alt="EventFold"
              className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/">
            <Button variant="ghost" className="text-sm font-medium text-white/50 hover:text-white transition-colors gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-8 pt-12 pb-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-16"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-[10px] font-bold tracking-[0.2em] uppercase mb-4 shadow-[0_0_20px_rgba(255,153,51,0.1)]">
              <Heart className="w-3 h-3 fill-current" /> Our Story
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight">
              The Soul Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] via-primary to-indigo-400">EventFold Studio</span>
            </h1>
          </motion.div>

          {/* Story Content */}
          <motion.div variants={itemVariants} className="prose prose-invert max-w-none space-y-12">
            <div className="space-y-6 text-xl md:text-2xl font-light leading-relaxed text-white/80">
              <p>
                <span className="text-white font-bold italic">Dilpreet Singh</span> always believed that memories are not just meant to be stored — they are meant to be <span className="text-primary italic">relived</span>.
              </p>
              <p>
                Growing up, he saw how special moments like weddings, birthdays, and celebrations were captured beautifully… but over time, those memories lost their charm.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 py-12">
              {[
                { icon: <BookOpen className="w-6 h-6" />, text: "Albums stayed on shelves." },
                { icon: <Smartphone className="w-6 h-6" />, text: "Photos got lost in phone galleries." },
                { icon: <Zap className="w-6 h-6" />, text: "Feelings slowly faded away." }
              ].map((item, index) => (
                <div key={index} className="glass p-8 rounded-[2rem] border-white/5 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-primary">
                    {item.icon}
                  </div>
                  <p className="text-sm font-medium text-white/60">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="space-y-8 text-lg font-light leading-relaxed text-white/70">
              <div className="p-8 md:p-12 glass rounded-[3rem] border-primary/20 bg-primary/5 text-center space-y-6">
                <blockquote className="text-2xl md:text-3xl font-display font-bold italic text-white line-height-tight">
                  “Why can’t memories feel the same way every time we see them?”
                </blockquote>
                <p className="text-sm font-bold uppercase tracking-widest text-[#FF9933]">Dilpreet Singh, Founder</p>
              </div>

              <div className="space-y-6 pt-12">
                <p>
                  That question led to an idea — an idea to <span className="text-white font-bold">transform the way people experience their memories</span>.
                </p>
               <p>
                  And that’s how <span className="text-primary font-bold">EventFold Studio</span> was born.
                </p>
                <p>
                  A platform that converts traditional albums into stunning digital flipbooks — where every page turns like a real story, and every memory can be shared instantly through a simple <span className="text-[#FF9933] font-bold">QR code</span>.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 py-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-white/40 font-bold">01</div>
                  <p className="text-sm">No more bulky albums sitting on shelves.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-white/40 font-bold">02</div>
                  <p className="text-sm">No more endless scrolling through phone galleries.</p>
                </div>
              </div>

              <p className="text-3xl md:text-4xl font-display font-bold text-center py-12 text-white">
                Just one scan… <br/><span className="text-primary">and the entire story comes alive.</span>
              </p>

              <div className="space-y-6 border-t border-white/5 pt-12">
                <p>
                  For Dilpreet, EventFold Studio is not just a business — <span className="text-white font-bold">it’s a mission to bring emotions back into memories</span>.
                </p>
                <p>
                  Because memories are not just pictures… they are feelings, stories, and moments that deserve to be experienced <span className="text-primary italic font-bold">again and again</span>.
                </p>
              </div>

              <div className="text-center pt-12">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full glass border-white/10 text-white/40 text-xs font-bold uppercase tracking-widest">
                  And this is just the beginning.
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Call */}
          <motion.div variants={itemVariants} className="text-center pt-24 space-y-8">
            <h2 className="text-3xl font-display font-bold">Ready to tell your story?</h2>
            <Link href="/create">
              <Button size="lg" className="rounded-2xl h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-white font-bold group">
                {user ? "Create New Album" : "Get Started Now"} <ArrowLeft className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform rotate-180" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      <footer className="py-20 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <a href="https://www.instagram.com/eventfoldstudio/" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF9933] transition-colors flex items-center gap-2">
            <Share2 className="w-3 h-3" /> Instagram
          </a>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <a href="https://www.linkedin.com/company/eventfoldstudio/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
            <Linkedin className="w-3 h-3" /> LinkedIn
          </a>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <a href="https://www.youtube.com/@eventfold_studio" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors flex items-center gap-2">
            <Youtube className="w-3 h-3" /> YouTube
          </a>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <Link href="/terms" className="hover:text-[#FF9933] transition-colors">Terms of Service</Link>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <Link href="/privacy" className="hover:text-[#FF9933] transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
