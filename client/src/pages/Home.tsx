import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, ImagePlus, Eye, Smartphone, Zap, ArrowRight, LayoutGrid, CheckCircle2, ShoppingCart, ShieldCheck, Upload, Share2, BookOpen, Crown, CreditCard, Rocket, Play } from "lucide-react";
import { useAuth } from "@/lib/auth";
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';
import { ContactForm } from '@/components/ContactForm';

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

  const handleSubscribe = (plan: string) => {
    if (user) {
      startRazorpayCheckout(plan);
    } else {
      setLocation('/login');
    }
  };



  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Decorative Blur Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/">
          <div className="h-20 cursor-pointer group">
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
      <main className="relative pt-12 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col items-center text-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                <Sparkles className="w-3 h-3" /> The Modern Standard for Wedding Studios
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.0] mb-4 tracking-tighter">
                Breathtaking <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">3D Digital</span> Albums.
              </h1>
              <p className="text-lg md:text-xl text-white/50 mb-8 leading-relaxed max-w-2xl mx-auto">
                Transform your paper albums into a stunning interactive 3D experience. Upload your first album for <strong>free</strong> and wow your clients today.
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
                  onClick={() => window.open('/demo', '_blank')}
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
                onClick={() => window.open('/demo', '_blank')}
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
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Pay As You Go</span>
                <h3 className="text-2xl font-bold">Standard Credit</h3>
                <div className="text-4xl font-display font-bold">₹99</div>
                <p className="text-sm text-white/40 leading-relaxed">Perfect for single events. High-resolution textures and 1 year of cloud storage included.</p>
                <Button onClick={() => user ? buyAlbumCredit() : setLocation('/login')} className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold">
                  Buy 1 Credit
                </Button>
              </div>
            </div>

            {/* Pro Monthly */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-b from-primary/20 to-indigo-600/10 border border-primary/40 relative shadow-2xl overflow-hidden scale-105 z-10">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Most Popular</div>
              <div className="space-y-6 pt-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Monthly Elite</span>
                <h3 className="text-2xl font-bold">Unlimited Albums</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">₹499</span>
                  <span className="text-sm font-medium text-white/20">/month</span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">Unlimited project creation for busy studios. Includes lifetime storage for all albums and custom branding.</p>
                <Button onClick={() => handleSubscribe('monthly')} className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20">
                  Select Pro Monthly
                </Button>
              </div>
            </div>

            {/* Yearly */}
            <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
              <div className="space-y-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Best Value</span>
                <h3 className="text-2xl font-bold">Elite Yearly</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">₹3,999</span>
                  <span className="text-sm font-medium text-white/20">/year</span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">The ultimate studio package. Includes white-labeling and lifetime storage for all albums.</p>
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
        <div className="flex items-center justify-center gap-3 mb-6">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-display font-bold tracking-tight">EventFold Studio</span>
        </div>
        <p className="text-white/20 text-xs uppercase tracking-[0.4em]">Crafted for the World's Best Photographers</p>
      </footer>
    </div>
  );
}
