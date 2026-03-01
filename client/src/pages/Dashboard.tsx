import { Link } from 'wouter';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, QrCode, Eye, Trash2, LayoutGrid, Calendar, LogOut, Settings as SettingsIcon, Lock, Loader2, Sparkles, User as UserIcon, Crown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from '@/lib/auth';

export default function Dashboard() {
  const { user, logout, buyAlbumCredit, startStripeCheckout } = useAuth();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<any>(null);

  // Parse URL for success/cancel params
  const { search } = typeof window !== 'undefined' ? window.location : { search: '' };
  const params = new URLSearchParams(search);
  const success = params.get('success');

  const fetchAlbums = async () => {
    try {
      // Check health first to see if cloud sync is active
      const healthRes = await fetch('/api/health').catch(() => null);
      if (healthRes && healthRes.ok) {
        const health = await healthRes.json();
        setDbConnected(health.database === 'connected');
      } else {
        setDbConnected(false);
      }

      const response = await fetch('/api/albums');
      if (response.status === 401) return;
      if (!response.ok) throw new Error('Failed to fetch albums');
      const data = await response.json();
      setAlbums(data);
    } catch (e) {
      console.error("Dashboard Sync Error:", e);
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (e) { }
  };

  useEffect(() => {
    fetchAlbums();
    fetchSettings();
    if (success === 'true') {
      setTimeout(() => {
        window.history.replaceState({}, '', '/dashboard');
      }, 3000);
    }
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/albums/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setAlbums(albums.filter(a => a.id !== id));
      }
    } catch (e) {
      alert('Failed to delete album');
    }
  };

  const AlbumCard = ({ album, index }: { album: any, index: number }) => {
    const frontCover = album.files?.find((f: any) => f.fileType === 'cover_front')?.filePath;
    const coverUrl = frontCover ? ((frontCover.startsWith('/') || frontCover.startsWith('http')) ? frontCover : `/${frontCover}`) : '';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group relative"
      >
        <Card className="overflow-hidden border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 shadow-2xl rounded-3xl group">
          <div className="relative aspect-[4/5] overflow-hidden">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={album.title}
                className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20">
                <LayoutGrid className="w-12 h-12" />
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

            <div className="absolute inset-0 flex flex-col justify-end p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                <Link href={`/album/${album.id}`} className="flex-1">
                  <Button className="w-full rounded-xl bg-white text-black hover:bg-white/90">
                    <Eye className="w-4 h-4 mr-2" /> Open
                  </Button>
                </Link>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-xl glass border-none">
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-[#0a0a0b] border-white/10 text-white rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">Share Memories</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-8 space-y-6">
                      <div className="p-6 bg-white rounded-[2rem] shadow-2xl shadow-primary/20">
                        <QRCodeSVG
                          value={`${window.location.origin}/album/${album.id}?shared=true`}
                          size={240}
                          level="H"
                          fgColor="#000000"
                        />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-lg font-bold">{album.title}</p>
                        <p className="text-sm text-white/40 max-w-[240px]">
                          Scan this code to view the cinematic flipbook on any mobile device.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <CardContent className="pt-6 relative">
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors truncate">{album.title}</h3>
            <div className="flex items-center text-xs text-white/40 uppercase tracking-widest font-medium">
              <Calendar className="w-3 h-3 mr-2" />
              {new Date(album.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </CardContent>

          <CardFooter className="pt-0 pb-6">
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-white/20 hover:text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={() => handleDelete(album.id, album.title)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Decorative Orbs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar Overlay */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{settings?.businessName || 'EventFold Studio'}</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Project Management Center</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {dbConnected === false && (
              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-full text-destructive text-[10px] font-bold">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  OFFLINE MODE
                </div>
                <span className="text-[10px] text-white/20 mt-1 uppercase">Local only · Add DATABASE_URL for Mobile</span>
              </div>
            )}
            {dbConnected === true && (
              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  CLOUD SYNC ACTIVE
                </div>
                <span className="text-[10px] text-white/20 mt-1 uppercase">Ready for Mobile QR Sharing</span>
              </div>
            )}
            <Link href="/settings">
              <Button variant="ghost" className="rounded-xl text-white/40 hover:text-white glass border-none">
                <SettingsIcon className="w-4 h-4 mr-2" /> Settings
              </Button>
            </Link>
            <Button onClick={() => logout()} variant="ghost" className="rounded-xl text-white/40 hover:text-red-400 glass border-none group">
              <LogOut className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" /> Sign Out
            </Button>
            <Link href="/create">
              <Button className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> New Album
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {success === 'true' && (
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl flex items-center justify-between">
            <span className="font-bold">Payment Successful! Your credit has been added.</span>
            <Button variant="ghost" size="sm" onClick={() => window.history.replaceState({}, '', '/dashboard')}>Dismiss</Button>
          </div>
        </div>
      )}

      <header className="max-w-7xl mx-auto px-8 pt-16 pb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-bold font-mono text-primary uppercase tracking-[0.2em]">Dashboard Terminal</span>
            </div>
            <h2 className="text-5xl font-display font-bold tracking-tight">Welcome back, <span className="text-primary">{user?.name?.split(' ')[0]}</span></h2>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2 px-6 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-bold text-primary shadow-xl shadow-primary/10">
                <LayoutGrid className="w-4 h-4" />
                {user?.credits || 0} ALBUM CREDITS AVAILABLE
              </div>
              <Button
                onClick={buyAlbumCredit}
                className="h-10 rounded-full bg-white/5 backdrop-blur-md text-white hover:bg-white/10 border border-white/10 font-bold px-6 group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" /> BUY 1 CREDIT (₹199)
              </Button>
              {user?.plan !== 'pro' && (
                <Button
                  onClick={() => startStripeCheckout('monthly')}
                  className="h-10 rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-xl shadow-primary/20 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                  <Crown className="w-4 h-4 mr-2" /> UPGRADE TO UNLIMITED (₹499)
                  <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-cyan-400 text-black text-[8px] font-black rounded-full">HOT</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">My Collections</h1>
          <p className="text-white/40">Manage and share your digital storytelling projects.</p>
        </div>

        {albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 glass rounded-[3rem] border-dashed border-white/10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <LayoutGrid className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Workspace Empty</h3>
            <p className="text-white/40 mb-8 max-w-sm text-center">Your digital shelf is waiting for its first masterpiece. Start your journey now.</p>
            <Link href="/create">
              <Button size="lg" className="rounded-2xl px-10">Create First Album</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {albums.map((album, i) => (
                <AlbumCard key={album.id} album={album} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
