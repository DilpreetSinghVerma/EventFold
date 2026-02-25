import { useParams, Link } from 'wouter';
import { useAlbumStore, ImageStorage } from '@/lib/store';
import { Flipbook } from '@/components/Flipbook';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Home, Loader2, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

// ─────────────────────────────────────────────────────────────────
// Split a panoramic 12×36 image into [leftHalf, rightHalf] blobs.
// Each half is 12×18 and forms one page in the flipbook spread.
// ─────────────────────────────────────────────────────────────────
function splitPanoramicSheet(url: string): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Allow cross-origin for external URLs (picsum, etc.) — not needed for blob:
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const halfW = Math.floor(W / 2);

      const leftCanvas = document.createElement('canvas');
      leftCanvas.width = halfW;
      leftCanvas.height = H;
      leftCanvas.getContext('2d')!.drawImage(img, 0, 0, halfW, H, 0, 0, halfW, H);

      const rightCanvas = document.createElement('canvas');
      rightCanvas.width = W - halfW;
      rightCanvas.height = H;
      rightCanvas.getContext('2d')!.drawImage(img, halfW, 0, W - halfW, H, 0, 0, W - halfW, H);

      leftCanvas.toBlob((lb) => {
        if (!lb) { reject(new Error('left blob failed')); return; }
        rightCanvas.toBlob((rb) => {
          if (!rb) { reject(new Error('right blob failed')); return; }
          resolve([URL.createObjectURL(lb), URL.createObjectURL(rb)]);
        }, 'image/jpeg', 0.95);
      }, 'image/jpeg', 0.95);
    };
    img.onerror = () => reject(new Error('Image load failed: ' + url));
    img.src = url;
  });
}

export default function Viewer() {
  const { id } = useParams();
  const [album, setAlbum] = useState<any>(null);

  const isShared = new URLSearchParams(window.location.search).get('shared') === 'true';

  const [loadedSheets, setLoadedSheets] = useState<string[]>([]);
  const [loadedFrontCover, setLoadedFrontCover] = useState<string>('');
  const [loadedBackCover, setLoadedBackCover] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState('Establishing connection…');
  const [copied, setCopied] = useState(false);

  const splitUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      splitUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  useEffect(() => {
    const fetchAndLoad = async () => {
      if (!id) return;

      try {
        setLoadStatus('Decrypting project metadata…');
        const response = await fetch(`/api/albums/${id}`);
        if (!response.ok) throw new Error('Album not found on server');
        const albumData = await response.json();
        setAlbum(albumData);

        const frontFile = albumData.files.find((f: any) => f.fileType === 'cover_front');
        const backFile = albumData.files.find((f: any) => f.fileType === 'cover_back');
        const sheetFiles = albumData.files
          .filter((f: any) => f.fileType === 'sheet')
          .sort((a: any, b: any) => a.orderIndex - b.orderIndex);

        const getUrl = (path: string) => (path.startsWith('/') || path.startsWith('http')) ? path : `/${path}`;

        setLoadedFrontCover(getUrl(frontFile?.filePath || ''));
        setLoadedBackCover(getUrl(backFile?.filePath || ''));

        setLoadStatus(`Processing ${sheetFiles.length} cinematic spreads…`);
        const halves: string[] = [];
        for (let i = 0; i < sheetFiles.length; i++) {
          setLoadStatus(`Rendering spread ${i + 1}/${sheetFiles.length}…`);
          const url = getUrl(sheetFiles[i].filePath);
          const [left, right] = await splitPanoramicSheet(url);
          halves.push(left, right);
        }

        splitUrlsRef.current = halves;
        setLoadedSheets(halves);
      } catch (e) {
        console.error('Failed to load album', e);
        setLoadStatus('Terminal Error: Project unavailable or deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndLoad();
  }, [id]);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const shareUrl = `${window.location.origin}/album/${id}?shared=true`;

  const handleShare = async () => {
    const url = `${window.location.origin}/album/${id}?shared=true`;
    try {
      if (navigator.share) {
        await navigator.share({ title: album?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) { }
  };

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center glass p-12 rounded-[2rem] border-white/5">
          <h2 className="text-2xl font-bold mb-6">Project Missing</h2>
          <Link href="/dashboard"><Button className="rounded-xl">Return to Terminal</Button></Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white overflow-hidden">
        <div className="fixed inset-0 bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="text-center relative">
          <div className="w-20 h-20 mb-8 mx-auto relative">
            <Loader2 className="w-20 h-20 animate-spin text-primary opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
            </div>
          </div>
          <p className="font-display font-bold text-2xl mb-3 tracking-tight">Initializing Cinematic Feed</p>
          <p className="text-white/40 text-sm font-mono uppercase tracking-[0.2em]">{loadStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden selection:bg-primary/30">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header - Glassmorphism */}
      {!isShared && (
        <header className="px-8 h-20 flex items-center justify-between glass border-none border-b border-white/5 sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="rounded-xl transition-all hover:bg-white/5 pl-3 pr-5 gap-3">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline font-bold">Close Project</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <h1 className="font-display font-bold text-lg text-white/90 tracking-tight truncate max-w-[200px] md:max-w-md">{album.title}</h1>
          </div>

          <div className="flex gap-4">
            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-xl border-white/10 glass transition-all duration-500 font-bold px-6"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share Feed
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-dark border-white/5 rounded-[2.5rem] sm:max-w-md p-8 overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 blur-[80px] -z-10" />
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Cinematic Sharing</DialogTitle>
                  <DialogDescription className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mb-6">
                    Scan to view on any mobile device
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-8 py-4">
                  <div className="p-6 bg-white rounded-[2rem] shadow-[0_0_50px_rgba(139,92,246,0.3)] relative group transition-transform hover:scale-105 duration-500">
                    <QRCodeSVG
                      value={shareUrl}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="w-full space-y-4">
                    <p className="text-center text-white/60 text-sm px-4">
                      Share this unique QR code with your clients. They can experience the full cinematic flipbook directly on their smartphones.
                    </p>

                    <Button
                      onClick={handleShare}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 transition-all font-bold gap-3 text-lg"
                    >
                      {copied ? <><Check className="w-5 h-5" /> Copied Secure Link</> : <><Share2 className="w-5 h-5" /> Copy Shareable Link</>}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>
      )}

      {/* Customer Title */}
      {isShared && (
        <div className="absolute top-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark px-8 py-3 rounded-2xl border-white/5 flex items-center gap-4"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h1 className="font-display font-bold text-xs text-white/90 tracking-[0.4em] uppercase">{album.title}</h1>
          </motion.div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center relative">
        <Flipbook
          sheets={loadedSheets}
          frontCover={loadedFrontCover}
          backCover={loadedBackCover}
          title={album.title}
        />
      </main>
    </div>
  );
}
