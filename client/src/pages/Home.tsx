import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, ImagePlus, Eye, Smartphone, Zap, ArrowRight, LayoutGrid, CheckCircle2, ShoppingCart, ShieldCheck, Upload, Share2, BookOpen, Crown, CreditCard, Rocket, Play, Linkedin, Youtube } from "lucide-react";
import { useAuth } from "@/lib/auth";
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';
import { ContactForm } from '@/components/ContactForm';
import { useEffect } from 'react';

// Local demo assets
import demoFront from '@assets/demo_album/cover_front.png';
import demoBack from '@assets/demo_album/cover_back.png';
import demoSheet1L from '@assets/demo_album/sheet1_l.png';
import demoSheet1R from '@assets/demo_album/sheet1_r.png';
import demoSheet2L from '@assets/demo_album/sheet2_l.png';
import demoSheet2R from '@assets/demo_album/sheet2_r.png';

export default function Home() {
  const { user, startRazorpayCheckout, buyAlbumCredit } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "EventFold Studio | Elite 3D Digital Albums for Photographers";
  }, []);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EventFold Studio",
    "url": "https://eventfoldstudio.com",
    "logo": "https://eventfoldstudio.com/branding material/without bg version.png",
    "sameAs": [
      "https://www.instagram.com/eventfoldstudio/"
    ]
  };

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "EventFold Digital Album Engine",
    "description": "Transform traditional albums into cinematic 3D digital flipbooks with secure lifetime hosting.",
    "brand": {
      "@type": "Brand",
      "name": "EventFold"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": "49",
      "availability": "https://schema.org/InStock",
      "url": "https://eventfoldstudio.com"
    }
  };

  const handleSubscribe = (plan: string) => {
    if (user) {
      startRazorpayCheckout(plan);
    } else {
      setLocation('/login');
    }
  };



  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />

      {/* Royal Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Top Right Decorative Intricate Mandala */}
        <div className="absolute top-[-15%] right-[-10%] w-[900px] h-[900px] opacity-10 animate-slow-spin pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <defs>
              <pattern id="mandala-petal" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M5 0 Q10 5 5 10 Q0 5 5 0" fill="currentColor" opacity="0.5" />
              </pattern>
            </defs>
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 1" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            {/* Layers of petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                <path d="M50 10 Q60 25 50 40 Q40 25 50 10" fill="currentColor" opacity="0.3" />
                <path d="M50 5 Q65 25 50 45 Q35 25 50 5" fill="none" stroke="currentColor" strokeWidth="0.2" />
              </g>
            ))}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                <path d="M50 15 Q55 25 50 35 Q45 25 50 15" fill="currentColor" opacity="0.2" />
              </g>
            ))}
            <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M50 42 A8 8 0 0 1 50 58 A8 8 0 0 1 50 42" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="0.5 0.5" />
          </svg>
        </div>
        
        {/* Bottom Left Decorative Intricate Mandala */}
        <div className="absolute bottom-[-20%] left-[-15%] w-[1200px] h-[1200px] opacity-[0.08] animate-slow-spin pointer-events-none [animation-direction:reverse]">
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#FF9933]">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.1" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                <path d="M50 5 C60 15 65 30 50 45 C35 30 40 15 50 5" fill="currentColor" opacity="0.15" />
                <circle cx="50" cy="15" r="1.5" fill="currentColor" />
              </g>
            ))}
            <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 1" />
          </svg>
        </div>
      </div>
      
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#FF9933]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/">
          <div className="h-20 cursor-pointer group">
            <img
              src="/branding material/without bg version.png"
              alt="EventFold Studio Logo - Elite 3D Digital Albums"
              className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
            {user ? "Dashboard" : "Studio Log In"}
          </Link>
          <Link href="/create">
            <Button className="rounded-2xl px-6 bg-primary hover:bg-primary/90 text-white border-none shadow-lg shadow-primary/20 font-bold">
              {user ? "New Project" : "Start Free"}
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-12 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col items-center text-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF9933]/10 border border-[#FF9933]/20 text-[#FF9933] text-[10px] font-bold tracking-[0.2em] uppercase mb-4 shadow-[0_0_20px_rgba(255,153,51,0.1)]">
                <Sparkles className="w-3 h-3" /> Digital Shagun for the Modern Studio
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.0] mb-4 tracking-tighter">
                Cinematic <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] via-primary to-indigo-400">Royal Digital</span> Albums.
              </h1>
              <p className="text-lg md:text-xl text-white/50 mb-8 leading-relaxed max-w-2xl mx-auto italic">
                Preserve your "Shubh-Vivah" memories in an interactive 3D royal experience.
                Upload your first "Shaadi" project for <strong>free</strong> and honor your traditions.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Link href="/create">
                  <Button size="lg" className="rounded-[1.25rem] h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-white font-bold group">
                    Upload Your Free 1st Album <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setLocation('/demos')}
                  className="rounded-[1.25rem] h-16 px-10 text-lg border-white/10 hover:bg-white/5 text-white font-bold group"
                >
                  <Eye className="w-5 h-5 mr-3" /> Launch Demo Experience
                </Button>
              </div>
            </motion.div>

            {/* Static Visual Representation of the Experience */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
              className="w-full relative py-12"
            >
              {/* Cinematic Studio Environment - Simplified for better flow */}
              <div
                onClick={() => setLocation('/demos')}
                className="h-[500px] w-full max-w-6xl mx-auto flex items-center justify-center relative rounded-[4rem] bg-[#080808] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden group cursor-pointer"
              >
                {/* Dynamic Spotlight */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.15),transparent_60%)] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-8 group-hover:scale-110 transition-transform duration-700">
                  <div className="relative">
                    <img
                      src={demoFront}
                      alt="Demo Album"
                      className="w-80 h-auto rounded-lg shadow-2xl transition-all duration-500 group-hover:shadow-primary/20 rotate-[-4deg] group-hover:rotate-0"
                    />
                    <div className="absolute inset-0 rounded-lg bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="px-6 py-2 rounded-full bg-primary text-white font-bold flex items-center gap-3 shadow-lg shadow-primary/40">
                      <Play className="w-4 h-4 fill-current" /> Play 3D Experience
                    </div>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">Click to launch immersive viewer</p>
                  </div>
                </div>

                {/* Minimal Mesh Floor */}
                <div className="absolute bottom-0 w-full h-[30%] opacity-[0.05] pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Pricing / Plan Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-6 tracking-tight">Simple <span className="text-primary">Pricing</span></h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              Get full cinematic 3D features at half the price of competitors. Start for free and grow as you need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Pay Per Album (Mid-Tier) */}
            <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
              <div className="space-y-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Studio Credit</span>
                <h3 className="text-2xl font-bold">Single Project</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display font-bold text-white">₹49</span>
                  <span className="text-xl text-white/20 line-through">₹99</span>
                  <span className="text-sm font-medium text-white/20">/ album</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="w-4 h-4 text-primary" /> Full 3D Cinematic Engine</div>
                  <div className="flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="w-4 h-4 text-primary" /> Theme-Specific Soundtracks</div>
                  <div className="flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="w-4 h-4 text-primary" /> Password Protection</div>
                  <div className="flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="w-4 h-4 text-primary" /> Secure Lifetime Hosting</div>
                </div>
                <Button onClick={() => user ? buyAlbumCredit() : setLocation('/login')} className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold">
                  Purchase 1 Credit
                </Button>
              </div>
            </div>

            {/* Pro Monthly */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-b from-primary/20 to-indigo-600/10 border border-primary/40 relative shadow-2xl overflow-hidden scale-105 z-10">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Most Popular</div>
              <div className="space-y-6 pt-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Elite Studio</span>
                <h3 className="text-2xl font-bold">Unlimited Events</h3>
                <div className="flex flex-col mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-white">₹199</span>
                    <span className="text-sm font-medium text-white/40 line-through">₹499</span>
                    <span className="text-sm font-medium text-white/20">/mo</span>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">Only ~₹20 / project</span>
                    <span className="text-[9px] text-white/40 font-bold uppercase">Save 60% vs. Single Credit</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-white/80"><CheckCircle2 className="w-4 h-4 text-primary" /> **Unlimited** 3D Projects</div>
                  <div className="flex items-center gap-2 text-xs text-white/80"><CheckCircle2 className="w-4 h-4 text-primary" /> Custom Business Logo</div>
                  <div className="flex items-center gap-2 text-xs text-white/80"><CheckCircle2 className="w-4 h-4 text-primary" /> Direct WhatsApp Booking</div>
                  <div className="flex items-center gap-2 text-xs text-white/80"><CheckCircle2 className="w-4 h-4 text-primary" /> Lifetime Cloud Archiving</div>
                </div>
                <Button onClick={() => handleSubscribe('monthly')} className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
                  Select Studio Monthly
                </Button>
              </div>
            </div>

            {/* Yearly */}
            <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
              <div className="space-y-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Agency Special</span>
                <h3 className="text-2xl font-bold">Elite Agency</h3>
                <div className="flex flex-col mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-white">₹899</span>
                    <span className="text-sm font-medium text-white/40 line-through">₹3,999</span>
                    <span className="text-sm font-medium text-white/20">/yr</span>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">Only ~₹7 / project</span>
                    <span className="text-[9px] text-white/40 font-bold uppercase">Save 85% vs. Single Credit</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="w-4 h-4 text-primary" /> Everything in Monthly</div>
                  <div className="flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="w-4 h-4 text-primary" /> Early-Access to New Themes</div>
                  <div className="flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="w-4 h-4 text-primary" /> Priority Customer Support</div>
                  <div className="flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="w-4 h-4 text-primary" /> White-Labeling Ready</div>
                </div>
                <Button onClick={() => handleSubscribe('yearly')} className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold">
                  Get Elite Yearly
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 text-center flex flex-col items-center">
        <div className="w-full max-w-xl mx-auto mb-20 px-4">
          <ContactForm />
        </div>
        <div className="flex items-center justify-center gap-6 mb-8 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
          <Link href="/about" className="hover:text-[#FF9933] transition-colors uppercase">Our Story</Link>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <Link href="/faq" className="hover:text-primary transition-colors uppercase">FAQ</Link>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <Link href="/terms" className="hover:text-[#FF9933] transition-colors">Terms of Service</Link>
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
          <Link href="/privacy" className="hover:text-[#FF9933] transition-colors">Privacy Policy</Link>
        </div>
        <p className="text-white/20 text-xs uppercase tracking-[0.4em]">Designed for India's Elite Wedding Creators</p>
      </footer>
    </div>
  );
}
