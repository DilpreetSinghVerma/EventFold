import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, ImagePlus, Eye, Smartphone, Zap, ArrowRight, LayoutGrid, CheckCircle2, ShoppingCart, ShieldCheck, Upload, Share2, BookOpen, Crown, CreditCard, Rocket } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Flipbook } from '@/components/Flipbook';
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';

// Local demo assets
import demoFront from '@assets/demo_album/cover_front.png';
import demoBack from '@assets/demo_album/cover_back.png';
import demoSheet1L from '@assets/demo_album/sheet1_l.png';
import demoSheet1R from '@assets/demo_album/sheet1_r.png';
import demoSheet2L from '@assets/demo_album/sheet2_l.png';
import demoSheet2R from '@assets/demo_album/sheet2_r.png';

export default function Home() {
  const { user, startStripeCheckout } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubscribe = (plan: string) => {
    if (user) {
      startStripeCheckout(plan);
    } else {
      setLocation('/login');
    }
  };

  // Local demo sheets
  const demoSheets = [
    demoSheet1L,
    demoSheet1R,
    demoSheet2L,
    demoSheet2R,
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Decorative Blur Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-10 max-w-7xl mx-auto">
        <Link href="/">
          <div className="h-40 cursor-pointer group">
            <img
              src="/branding material/without bg version.png"
              alt="EventFold"
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
      <main className="relative pt-32 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col items-center text-center gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-8">
                <Sparkles className="w-3 h-3" /> The Modern Standard for Wedding Studios
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.0] mb-8 tracking-tighter">
                Breathtaking <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">3D Digital</span> Albums.
              </h1>
              <p className="text-lg md:text-xl text-white/50 mb-12 leading-relaxed max-w-2xl mx-auto">
                Transform your paper albums into a stunning interactive 3D experience. Upload your first album for <strong>free</strong> and wow your clients today.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Link href="/create">
                  <Button size="lg" className="rounded-[1.25rem] h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-white font-bold group">
                    Upload Your Free 1st Album <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Interactive Demo Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
              className="w-full relative py-12"
            >
              {/* Cinematic Studio Environment */}
              <div className="h-[700px] w-full max-w-6xl mx-auto flex items-center justify-center relative rounded-[4rem] bg-[#080808] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden group">
                {/* Dynamic Spotlight */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.15),transparent_60%)] pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent pointer-events-none" />

                {/* Minimal Mesh Floor */}
                <div className="absolute bottom-0 w-full h-[30%] opacity-[0.05] pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <Flipbook
                  sheets={demoSheets}
                  frontCover={demoFront}
                  backCover={demoBack}
                  title="Studio Demo Experience"
                  scale={0.8}
                  contactWhatsApp="+919876543210"
                  businessName="EventFold Studio"
                />

                {/* Interactive Hint */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full glass border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                    <Zap className="w-3 h-3 text-primary" /> Click corners to flip pages
                  </p>
                </div>
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
            {/* Free Tier */}
            <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
              <div className="space-y-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Starter</span>
                <h3 className="text-2xl font-bold">1st Album Free</h3>
                <div className="text-4xl font-display font-bold">₹0</div>
                <p className="text-sm text-white/40 leading-relaxed">Perfect to test our 3D cinematic engine with your first client.</p>
                <Link href="/create">
                  <Button className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold">
                    Start Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro Monthly */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-b from-primary/20 to-indigo-600/10 border border-primary/40 relative shadow-2xl overflow-hidden scale-105 z-10">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Best for Studios</div>
              <div className="space-y-6 pt-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Monthly Elite</span>
                <h3 className="text-2xl font-bold">Unlimited Albums</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">₹499</span>
                  <span className="text-sm font-medium text-white/20">/month</span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">Create as many wedding projects as you want. Full studio branding included.</p>
                <Button onClick={() => handleSubscribe('monthly')} className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
                  Get Unlimited Now
                </Button>
              </div>
            </div>

            {/* Yearly */}
            <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
              <div className="space-y-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Power Studio</span>
                <h3 className="text-2xl font-bold">Elite Yearly</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">₹3,999</span>
                  <span className="text-sm font-medium text-white/20">/year</span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">Save 33% compared to monthly. Professional standard for top wedding photographers.</p>
                <Button onClick={() => handleSubscribe('yearly')} className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold">
                  Choose Yearly
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-display font-bold tracking-tight">EventFold Studio</span>
        </div>
        <p className="text-white/20 text-xs uppercase tracking-[0.4em]">Crafted for the World's Best Photographers</p>
      </footer>
    </div>
  );
}
