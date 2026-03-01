import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, ImagePlus, Eye, Smartphone, Zap, ArrowRight, LayoutGrid, CheckCircle2, ShoppingCart, ShieldCheck, Upload, Share2, BookOpen, Crown, CreditCard, Rocket } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Flipbook } from '@/components/Flipbook';
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';

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

  // Demo album data
  const demoSheets = [
    "https://res.cloudinary.com/dzp0f9u5u/image/upload/v1740393962/demo_sheet_1_lh.jpg",
    "https://res.cloudinary.com/dzp0f9u5u/image/upload/v1740393962/demo_sheet_1_rh.jpg",
    "https://res.cloudinary.com/dzp0f9u5u/image/upload/v1740393962/demo_sheet_2_lh.jpg",
    "https://res.cloudinary.com/dzp0f9u5u/image/upload/v1740393962/demo_sheet_2_rh.jpg",
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <ImagePlus className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            EventFold
          </span>
        </div>
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
      <main className="relative pt-12 pb-24 px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
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

            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-24">
              <Link href="/create">
                <Button size="lg" className="rounded-[1.25rem] h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-white font-bold group">
                  Upload Your Free 1st Album <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Interactive Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full relative py-20"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full bg-gradient-to-b from-primary/5 to-transparent blur-[120px] -z-10" />

            <div className="text-center mb-16 px-4">
              <h2 className="text-3xl font-display font-bold mb-4">Interactive Preview</h2>
              <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-mono">Try flipping the pages below</p>
            </div>

            <div className="h-[500px] w-full max-w-5xl mx-auto flex items-center justify-center">
              <Flipbook
                sheets={demoSheets}
                frontCover={weddingCover}
                backCover={weddingCover}
                title="Cinematic Wedding Demo"
              />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Pricing / Plan Section - Competitive Strategy */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-6 tracking-tight">The <span className="text-primary">Best Price</span> in the Industry</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
              Why pay more elsewhere? Get full cinematic 3D features at half the price of Flipix. Switch today and save.
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
                <ul className="space-y-3 pt-4">
                  {['3D Page Flip', 'QR Sharing', 'Cloud Hosting'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-xs text-white/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pro Monthly - The Aggressive Option */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-b from-primary/20 to-indigo-600/10 border border-primary/40 relative shadow-2xl overflow-hidden scale-105 z-10">
              <div className="absolute top-0 right-0 p-6 opacity-20"><Crown className="w-16 h-16 text-primary" /></div>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">Best for Studios</div>

              <div className="space-y-6 pt-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Monthly Elite</span>
                <h3 className="text-2xl font-bold">Unlimited Albums</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">₹499</span>
                  <span className="text-sm font-medium text-white/20">/month</span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">Create as many wedding projects as you want. Full studio branding included.</p>
                <Button onClick={() => handleSubscribe('monthly')} className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                  Get Unlimited Now
                </Button>
                <ul className="space-y-3 pt-4">
                  {['UNLIMITED Albums', 'Studio Logo Branding', 'Password Protection', 'Background Music', 'Priority Support'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/80 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Yearly - The Long Term Strategy */}
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
                <ul className="space-y-3 pt-4">
                  {['Everything in Pro', 'White-Label Links', 'Early Access Features', 'API Access (Coming Soon)'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-xs text-white/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-white/20 text-xs font-bold uppercase tracking-[0.4em] mb-4">Trusted by 500+ Luxury Studios Worldwide</p>
            <div className="h-px w-20 bg-primary/20 mx-auto" />
          </div>
        </div>
      </section>

      {/* Custom Feature Grids */}
      <section className="py-32 bg-black/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><CreditCard className="w-6 h-6" /></div>
              <h4 className="text-xl font-bold">Easy Billing</h4>
              <p className="text-white/40 leading-relaxed text-sm">Pay securely via Stripe or UPI. No hidden subscriptions or contracts.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ShieldCheck className="w-6 h-6" /></div>
              <h4 className="text-xl font-bold">Secure Delivery</h4>
              <p className="text-white/40 leading-relaxed text-sm">Every album can be protected with a unique password for the client.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><LayoutGrid className="w-6 h-6" /></div>
              <h4 className="text-xl font-bold">Studio Dashboard</h4>
              <p className="text-white/40 leading-relaxed text-sm">Manage all your client projects from one centralized, elite portal.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><BookOpen className="w-4 h-4" /></div>
          <span className="font-display font-bold tracking-tight">EventFold Studio</span>
        </div>
        <p className="text-white/20 text-xs uppercase tracking-[0.4em]">Crafted for the World's Best Photographers</p>
      </footer>
    </div>
  );
}
