import { useParams, Link } from 'wouter';
import { useAlbumStore, ImageStorage } from '@/lib/store';
import { Flipbook } from '@/components/Flipbook';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Home, Loader2, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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
  const [loadStatus, setLoadStatus] = useState('Connecting to server…');
  const [copied, setCopied] = useState(false);

  // Track split blob URLs so we can revoke them on unmount (memory cleanup)
  const splitUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    // Revoke all split blob URLs when viewer unmounts
    return () => {
      splitUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  useEffect(() => {
    const fetchAndLoad = async () => {
      if (!id) return;

      try {
        setLoadStatus('Fetching album data…');
        const response = await fetch(`/api/albums/${id}`);
        if (!response.ok) throw new Error('Album not found on server');
        const albumData = await response.json();
        setAlbum(albumData);

        // Find covers and sheets from the files array
        const frontFile = albumData.files.find((f: any) => f.fileType === 'cover_front');
        const backFile = albumData.files.find((f: any) => f.fileType === 'cover_back');
        const sheetFiles = albumData.files
          .filter((f: any) => f.fileType === 'sheet')
          .sort((a: any, b: any) => a.orderIndex - b.orderIndex);

        const getUrl = (path: string) => path.startsWith('/') ? path : `/${path}`;

        setLoadedFrontCover(getUrl(frontFile?.filePath || ''));
        setLoadedBackCover(getUrl(backFile?.filePath || ''));

        // --- Load and split panoramic sheets ---
        setLoadStatus(`Splitting ${sheetFiles.length} panoramic sheets…`);
        const halves: string[] = [];
        for (let i = 0; i < sheetFiles.length; i++) {
          setLoadStatus(`Processing sheet ${i + 1} of ${sheetFiles.length}…`);
          const url = getUrl(sheetFiles[i].filePath);
          const [left, right] = await splitPanoramicSheet(url);
          halves.push(left, right);
        }

        splitUrlsRef.current = halves;
        setLoadedSheets(halves);
      } catch (e) {
        console.error('Failed to load album', e);
        setLoadStatus('Error: Could not load album. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndLoad();
  }, [id]);

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
    } catch (e) { /* user cancelled */ }
  };

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center">
          <h2 className="text-2xl font-display mb-4">Album not found</h2>
          <Link href="/dashboard"><Button>Return Home</Button></Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="font-display text-lg mb-2">Preparing Your Album</p>
          <p className="text-white/50 text-sm">{loadStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none" />

      {/* Header - Only shown for Admins (not shared) */}
      {!isShared && (
        <header className="px-6 py-4 flex items-center justify-between bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="rounded-full text-white hover:bg-white/10 hover:text-primary flex gap-2 items-center pl-2 pr-4">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Menu</span>
              </Button>
            </Link>
            <div className="h-6 w-px bg-white/20 mx-2 hidden sm:block" />
            <h1 className="font-display font-bold text-lg text-white tracking-widest">{album.title}</h1>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-primary/50 text-primary hover:bg-primary hover:text-white bg-transparent transition-all"
              onClick={handleShare}
            >
              {copied
                ? <><Check className="w-4 h-4 mr-2" /> Copied!</>
                : <><Share2 className="w-4 h-4 mr-2" /> Share</>}
            </Button>
          </div>
        </header>
      )}

      {/* Floating Album Title for Customers (Shared View) */}
      {isShared && (
        <div className="absolute top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10"
          >
            <h1 className="font-display font-bold text-sm text-white/90 tracking-[0.3em] uppercase">{album.title}</h1>
          </motion.div>
        </div>
      )}

      {/* Flipbook Viewer — sheets[] are already split 12×18 halves */}
      <main className="flex-1 flex flex-col items-center justify-center overflow-hidden">
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
