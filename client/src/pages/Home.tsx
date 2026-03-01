import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, ImagePlus, Eye, Smartphone, Zap, ArrowRight, LayoutGrid, CheckCircle2, ShoppingCart, ShieldCheck, Upload, Share2, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import travelCover from '@assets/generated_images/travel_album_cover_art.png';
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 selection:text-white">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto backdrop-blur-sm">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <ImagePlus className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            EventFold
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            My Gallery
          </Link>
          <Link href="/create">
            <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white border-none shadow-lg shadow-primary/20">
              Create Now
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-16 pb-32 px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-8">
              <Sparkles className="w-3 h-3" /> Digital Storytelling
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-bold leading-[1.05] mb-8 tracking-tighter">
              Premium <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-400 to-cyan-400">
                Storytelling.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed font-sans">
              Transform your professional photography into immersive, cloud-secured cinematic experiences. The elite standard for modern business-to-client album delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href={user ? "/dashboard" : "/login"}>
                <Button size="lg" className="rounded-2xl h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-white glow-primary border-none font-bold">
                  {user ? "View My Projects" : "Get Started for Free"} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              {!user && (
                <Link href="/login">
                  <Button size="lg" variant="outline" className="rounded-2xl h-16 px-10 text-lg glass border-none font-bold">
                    Studio Login
                  </Button>
                </Link>
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-16 flex items-center gap-12 border-t border-white/5 pt-10">
              <div>
                <div className="text-3xl font-bold text-white">4K+</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Resolution</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-3xl font-bold text-white">0s</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Hosting Cost</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-3xl font-bold text-white">∞</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Storage</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="relative perspective-2000 hidden lg:block"
          >
            {/* Main Showcase Album */}
            <div className="relative z-20 transform-style-3d rotate-[-5deg] hover:rotate-0 transition-all duration-700 ease-out group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-indigo-500/30 rounded-2xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <img
                src={weddingCover}
                alt="Wedding Album"
                className="relative w-[480px] h-[600px] object-cover rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/10"
              />
              {/* Floating Badge */}
              <div className="absolute bottom-10 -right-10 glass rounded-2xl p-6 shadow-2xl animate-bounce-subtle">
                <div className="flex items-center gap-4 text-white">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-widest">Permanent</div>
                    <div className="text-xs text-white/60">Cloud Secured</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Album */}
            <div className="absolute top-20 left-20 -z-10 rotate-[10deg] opacity-40 blur-[2px] hover:blur-none transition-all duration-700">
              <img
                src={travelCover}
                alt="Travel Album"
                className="w-[400px] h-[500px] object-cover rounded-2xl border border-white/5 shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-32 relative bg-black/20">
        <div className="max-w-7xl mx-auto px-8 overflow-visible">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Upload className="w-6 h-6" />}
              title="Seamless Cloud Upload"
              description="High-fidelity image processing with direct cloud integration. Your albums are preserved in full resolution forever."
              gradient="from-blue-500 to-cyan-400"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Physics-Based Interaction"
              description="Our custom engine delivers a tactile page-flipping experience that mimics the weight and feel of high-end paper."
              gradient="from-indigo-500 to-purple-500"
            />
            <FeatureCard
              icon={<Share2 className="w-6 h-6" />}
              title="Business-to-Client Delivery"
              description="A single QR scan connects your studio with the physical world. No apps required—just instant, premium access for your elite clients."
              gradient="from-primary to-rose-400"
            />
          </div>
        </div>
      </section>

      {/* Footer Backdrop */}
      <footer className="py-12 px-8 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <BookOpen className="w-5 h-5" />
            <span className="font-display font-bold tracking-tight">EventFold</span>
          </div>
          <div className="text-muted-foreground text-sm uppercase tracking-[0.2em]">
            &copy; 2026 Crafted with Precision
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: { icon: React.ReactNode, title: string, description: string, gradient: string }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group p-10 rounded-[2.5rem] glass hover:bg-white/[0.08] transition-all duration-500 relative overflow-hidden"
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-10 transition-opacity blur-3xl`} />
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-8 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
        <div className="text-white">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-lg">{description}</p>
    </motion.div>
  );
}
