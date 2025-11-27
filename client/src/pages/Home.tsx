import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Upload, Share2 } from 'lucide-react';
import travelCover from '@assets/generated_images/travel_album_cover_art.png';
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="font-display text-2xl font-bold tracking-tight">FlipiX</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">My Albums</Link>
          <Link href="/create">
            <Button className="rounded-full px-6">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-display font-medium leading-[1.1] mb-6">
              Your memories, <br/>
              <span className="italic text-primary">beautifully turned.</span>
            </h1>
            <p className="text-xl text-neutral-500 mb-8 max-w-md leading-relaxed">
              Transform your photos into elegant digital flipbooks. Share them with a simple QR code and relive the moments page by page.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/create">
                <Button size="lg" className="rounded-full h-14 px-8 text-lg">
                  Create Album <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg bg-white/50 hover:bg-white">
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Abstract Composition of Albums */}
            <div className="relative z-10 rotate-[-6deg] translate-y-4 hover:translate-y-0 transition-transform duration-500 ease-out">
              <img 
                src={weddingCover} 
                alt="Wedding Album" 
                className="w-80 h-80 object-cover rounded-sm shadow-2xl border-4 border-white"
              />
            </div>
            <div className="absolute top-12 left-48 z-0 rotate-[12deg] hover:rotate-[8deg] transition-transform duration-500">
              <img 
                src={travelCover} 
                alt="Travel Album" 
                className="w-72 h-72 object-cover rounded-sm shadow-xl border-4 border-white opacity-90"
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Upload className="w-6 h-6" />}
              title="Simple Upload"
              description="Drag and drop your photos. We organize them into beautiful spreads automatically."
            />
            <FeatureCard 
              icon={<BookOpen className="w-6 h-6" />}
              title="Realistic Flip"
              description="Experience your photos like a real book with our smooth, tactile page-turning engine."
            />
            <FeatureCard 
              icon={<Share2 className="w-6 h-6" />}
              title="Instant Sharing"
              description="Generate a unique QR code for each album. Perfect for events, weddings, and gifts."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-100 hover:shadow-lg transition-shadow duration-300">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="font-display text-2xl font-medium mb-3">{title}</h3>
      <p className="text-neutral-500 leading-relaxed">{description}</p>
    </div>
  );
}
