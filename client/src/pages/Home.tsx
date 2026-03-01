import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, ImagePlus, Eye, Smartphone, Zap, ArrowRight, LayoutGrid, CheckCircle2, ShoppingCart, ShieldCheck, Upload, Share2, BookOpen, Crown, CreditCard, Rocket } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Flipbook } from '@/components/Flipbook';
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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

      {/* Pricing / Plan Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 tracking-tight">Simple Studio Pricing</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
              Start for free, then only pay for what you use. No monthly base fees, ever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="glass p-10 rounded-[3rem] border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <Rocket className="w-20 h-20 text-primary" />
              </div>
              <div className="space-y-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">New Studios</span>
                <h3 className="text-3xl font-bold">1st Album Free</h3>
                <p className="text-white/40 leading-relaxed">Full premium features, QR sharing, and cloud hosting for your first project.</p>
                <div className="text-4xl font-display font-bold">₹0<span className="text-sm font-medium text-white/20 ml-2">Lifetime</span></div>
                <Link href="/create">
                  <Button className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold mt-4">
                    Get Started Free
                  </Button>
                </Link>
                <ul className="space-y-4 pt-6">
                  {['3D Page Flip Engine', 'Cloud Image Hosting', 'Permanent QR Code', 'Cinematic Background Music'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Paid Tier */}
            <div className={`p-10 rounded-[3rem] bg-gradient-to-b from-primary/20 to-indigo-600/10 border border-primary/20 relative shadow-2xl overflow-hidden`}>
              <div className="absolute top-0 right-0 p-8 opacity-20">
                <Crown className="w-20 h-20 text-primary" />
              </div>
              <div className="space-y-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">Professional</span>
                <h3 className="text-3xl font-bold">Pay-Per-Album</h3>
                <p className="text-white/40 leading-relaxed">Scale your business easily. Buy credits for new wedding projects as needed.</p>
                <div className="text-4xl font-display font-bold">₹199<span className="text-sm font-medium text-white/20 ml-2">Per Credit</span></div>
                <Link href="/create">
                  <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold mt-4 shadow-lg shadow-primary/20">
                    Buy Album Credits
                  </Button>
                </Link>
                <ul className="space-y-4 pt-6">
                  {['Unlimited Hosting Time', 'Private Password Access', 'Studio Branding Logo', 'Priority Cloud Sync'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
