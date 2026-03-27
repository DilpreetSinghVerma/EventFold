import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutGrid, 
  Search, 
  FolderHeart, 
  Eye, 
  Calendar, 
  ExternalLink,
  MessageCircle,
  Loader2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Portfolio() {
  const { userId } = useParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: studio, isLoading: loadingStudio } = useQuery<any>({
    queryKey: [`/api/studios/${userId}`],
    enabled: !!userId
  });

  const { data: albums = [], isLoading: loadingAlbums } = useQuery<any[]>({
    queryKey: [`/api/studios/${userId}/albums`],
    enabled: !!userId
  });

  if (loadingStudio || loadingAlbums) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  const filteredAlbums = albums.filter(album => {
    const matchesCategory = activeCategory === 'All' || album.category === activeCategory;
    const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (album.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', ...Array.from(new Set(albums.map((a: any) => a.category).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30">
      {/* Decorative Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 p-4 mb-8 backdrop-blur-3xl"
          >
            {studio?.logo ? (
              <img src={studio.logo} alt={studio.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary">
                <Sparkles className="w-10 h-10" />
              </div>
            )}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4"
          >
            {studio?.name || 'Cinematic Studio'}
          </motion.h1>
          
          <motion.p 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-white/40 uppercase text-[10px] font-black tracking-[0.4em] mb-8"
          >
            Premium Digital Experiences / {studio?.owner}
          </motion.p>

          <div className="flex gap-4">
            {studio?.whatsapp && (
              <Button asChild className="rounded-2xl px-8 h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold gap-2">
                <a href={`https://wa.me/${studio.whatsapp}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="w-4 h-4" /> Book an Appointment
                </a>
              </Button>
            )}
            <Button variant="outline" className="rounded-2xl px-8 h-12 glass border-white/10 font-bold">
              About Studio
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-16">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 md:pb-0 w-full md:w-auto no-scrollbar">
            <FolderHeart className="w-4 h-4 text-primary mr-2 shrink-0 opacity-40" />
            {categories.map((cat: any) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'ghost'}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl px-5 h-10 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
            <Input 
              placeholder="SEARCH PORTFOLIO..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 bg-white/[0.03] border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Portfolio Grid */}
        {filteredAlbums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
            <LayoutGrid className="w-16 h-16 mb-6" />
            <h3 className="text-2xl font-bold">No Collections Found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
              {filteredAlbums.map((album, idx) => {
                const cover = album.files?.find((f: any) => f.fileType === 'cover_front')?.filePath;
                return (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link href={`/album/${album.id}`}>
                      <Card className="group relative aspect-[4/5] bg-[#0c0c0d] border-white/5 overflow-hidden rounded-[2.5rem] cursor-pointer hover:border-primary/20 transition-all duration-500 shadow-2xl">
                        {/* Artwork */}
                        <div className="absolute inset-0">
                          {cover ? (
                            <img src={cover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                          ) : (
                            <div className="w-full h-full bg-white/[0.02]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 p-8 flex flex-col justify-end">
                           <Badge className="w-fit mb-3 bg-primary/20 text-primary border-primary/20 backdrop-blur-md text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg">
                              {album.category || 'Uncategorized'}
                           </Badge>
                           <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{album.title}</h3>
                           
                           <div className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {album.date}</span>
                              <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" /> {album.views || 0}</span>
                           </div>

                           <div className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-500 backdrop-blur-xl">
                              <ChevronRight className="w-5 h-5" />
                           </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer Branded */}
      <footer className="py-20 px-6 border-t border-white/5 bg-white/[0.01]">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
            <div className="flex items-center gap-4">
               <div className="h-8">
                  <img src="/branding material/without bg version.png" className="h-full w-auto grayscale" />
               </div>
               <p className="text-[10px] font-bold uppercase tracking-widest">Powered by EventFold Cinematic Studio</p>
            </div>
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
               <Link href="/terms">Terms</Link>
               <Link href="/privacy">Privacy</Link>
               <span>© 2026 {studio?.name}</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
