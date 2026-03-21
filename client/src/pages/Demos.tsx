import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, ArrowLeft, Loader2, Sparkles, LayoutGrid, Music, Smartphone, MessageCircle } from 'lucide-react';

export default function Demos() {
  const [demos, setDemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Wedding', 'Pre-Wedding', 'Birthday', 'Event'];

  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const res = await fetch('/api/public-demos');
        if (res.ok) {
          const data = await res.json();
          setDemos(data);
        }
      } catch (e) {
        console.error("Failed to fetch demos", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDemos();
  }, []);

  const filteredDemos = selectedCategory === 'All' 
    ? demos 
    : demos.filter(d => d.demoCategory === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 overflow-x-hidden pb-20">
      {/* Decorative Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Header */}
      <header className="relative pt-20 pb-16 px-8 max-w-7xl mx-auto text-center">
        <Link href="/">
          <Button variant="ghost" className="absolute top-20 left-8 rounded-xl text-white/40 hover:text-white glass border-none hidden lg:flex">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-6"
        >
          <Sparkles className="w-3 h-3" /> Experience the Premium Cinema
        </motion.div>
        
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
          Cinematic <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Demos</span>
        </h1>
        <p className="text-white/40 text-lg max-w-2xl mx-auto mb-12">
          Explore our collection of immersive 3D flipbooks. Witness how your stories can be told in the modern digital age.
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map(cat => (
            <Button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-2xl px-6 h-11 font-bold transition-all ${selectedCategory === cat ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/20' : 'bg-white/5 text-white/40 hover:text-white border border-white/5'}`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </header>

      {/* Demo Grid */}
      <main className="max-w-7xl mx-auto px-8">
        {filteredDemos.length === 0 ? (
          <div className="text-center py-32 glass rounded-[3rem] border-dashed border-white/10">
            <LayoutGrid className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white/40">No demos found for this category yet.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode='popLayout'>
              {filteredDemos.map((demo, index) => (
                <DemoCard key={demo.id} demo={demo} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

function DemoCard({ demo, index }: { demo: any, index: number }) {
  const frontCover = demo.files?.find((f: any) => f.fileType === 'cover_front')?.filePath;
  const coverUrl = frontCover ? ((frontCover.startsWith('/') || frontCover.startsWith('http')) ? frontCover : `/${frontCover}`) : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.1 }}
      className="group relative"
    >
      <Link href={`/album/${demo.id}?shared=true`} target="_blank">
        <Card className="overflow-hidden border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 shadow-2xl rounded-[2.5rem] group cursor-pointer border hover:border-primary/30">
          <div className="relative aspect-[4/5] overflow-hidden">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={demo.title}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20">
                <LayoutGrid className="w-12 h-12" />
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-[9px] font-bold text-primary uppercase tracking-widest">
                {demo.demoCategory || 'Featured'}
              </div>
            </div>

            {/* Hover Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
              <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500 space-y-4">
                <div className="flex items-center gap-4 text-white/60">
                   <div className="flex items-center gap-1.5"><Music className="w-3 h-3" /> <span className="text-[10px] font-bold">Immersive Audio</span></div>
                   <div className="flex items-center gap-1.5"><Smartphone className="w-3 h-3" /> <span className="text-[10px] font-bold">Mobile First</span></div>
                </div>
                <h3 className="text-2xl font-bold">{demo.title}</h3>
                <p className="text-white/40 text-sm line-clamp-2">By {demo.branding?.businessName || 'EventFold Studio'}</p>
                <div className="pt-2">
                   <Button className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg shadow-primary/20">
                      <Play className="w-4 h-4 mr-2 fill-current" /> Launch 3D Viewer
                   </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
