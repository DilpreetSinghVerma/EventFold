import { useParams, Link } from 'wouter';
import { useAlbumStore, ImageStorage } from '@/lib/store';
import { Flipbook } from '@/components/Flipbook';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Music,
  Volume2,
  VolumeX,
  Share2,
  ArrowLeft,
  Smartphone,
  MessageCircle,
  Building2,
  Home,
  Loader2,
  Check,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// ─────────────────────────────────────────────────────────────────
// Split a panoramic 12×36 image into [leftHalf, rightHalf] blobs.
// Each half is 12×18 and forms one page in the flipbook spread.
// ─────────────────────────────────────────────────────────────────
// Helper to get split halves via Cloudinary transformations for instant mobile loading
function getCloudinaryHalves(url: string, widthCap?: number): [string, string] | null {
  if (!url.includes('res.cloudinary.com')) return null;
  const match = url.match(/(.*\/upload\/)(v[0-9]+\/)?(.*)/);
  if (!match) return null;
  const base = match[1];
  const version = match[2] || '';
  const tail = match[3];

  const w = widthCap ? `,w_${widthCap}` : '';
  const left = `${base}c_crop,g_west,w_0.5,h_1.0,q_auto:eco,f_auto${w}/${version}${tail}`;
  const right = `${base}c_crop,g_east,w_0.5,h_1.0,q_auto:eco,f_auto${w}/${version}${tail}`;
  return [left, right];
}

// Simple optimization for single images (covers)
function optimizeCloudinary(url: string, widthCap?: number): string {
  if (!url.includes('res.cloudinary.com')) return url;
  const match = url.match(/(.*\/upload\/)(v[0-9]+\/)?(.*)/);
  if (!match) return url;
  const base = match[1];
  const version = match[2] || '';
  const tail = match[3];
  const w = widthCap ? `,w_${widthCap}` : '';
  return `${base}q_auto:eco,f_auto${w}/${version}${tail}`;
}

export default function Viewer() {
  const { id } = useParams();
  const [album, setAlbum] = useState<any>(null);

  const isShared = new URLSearchParams(window.location.search).get('shared') === 'true';

  const [loadedSheets, setLoadedSheets] = useState<string[]>([]);
  const [loadedFrontCover, setLoadedFrontCover] = useState<string>('');
  const [loadedBackCover, setLoadedBackCover] = useState<string>('');
  const [loadedVideos, setLoadedVideos] = useState<{ filePath: string; orderIndex: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [loadStatus, setLoadStatus] = useState('Establishing connection…');
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const flipbookRef = useRef<any>(null);
  const [settings, setSettings] = useState<any>(null);

  const [isPortrait, setIsPortrait] = useState(false);
  const [isSmallHeight, setIsSmallHeight] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [pageInfo, setPageInfo] = useState({ current: 0, total: 0 });
  const splitUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 1024;
      const smallH = window.innerHeight < 500;
      const mobileL = window.innerWidth > window.innerHeight && window.innerWidth < 1024;
      setIsPortrait(portrait);
      setIsSmallHeight(smallH);
      setIsMobileLandscape(mobileL);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    // UI is always visible now as requested
    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  useEffect(() => {
    return () => {
      splitUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  useEffect(() => {
    // Proactive Preloading: Trigger browser cache for all sheets once URLs are ready
    if (loadedSheets.length > 0) {
      const preloadImages = () => {
        [loadedFrontCover, loadedBackCover, ...loadedSheets].forEach(url => {
          if (!url) return;
          const img = new Image();
          img.src = url;
        });
      };
      
      // Small delay to allow initial render to be priority
      const timer = setTimeout(preloadImages, 1000);
      return () => clearTimeout(timer);
    }
  }, [loadedSheets, loadedFrontCover, loadedBackCover]);

  useEffect(() => {
    const fetchAndLoad = async () => {
      if (!id) return;

      try {
        // Fetch album data
        setLoadStatus('Decrypting project metadata…');
        const response = await fetch(`/api/albums/${id}`);
        if (!response.ok) throw new Error('Album not found on server');
        const albumData = await response.json();
        setAlbum(albumData);
        setSettings(albumData.branding);

        const frontFile = albumData.files.find((f: any) => f.fileType === 'cover_front');
        const backFile = albumData.files.find((f: any) => f.fileType === 'cover_back');
        const sheetFiles = albumData.files
          .filter((f: any) => f.fileType === 'sheet')
          .sort((a: any, b: any) => a.orderIndex - b.orderIndex);

        const videoFiles = albumData.files
          .filter((f: any) => f.fileType === 'video')
          .map((f: any) => ({
            filePath: (f.filePath.startsWith('/') || f.filePath.startsWith('http')) ? f.filePath : `/${f.filePath}`,
            orderIndex: f.orderIndex
          }));

        setLoadedVideos(videoFiles);

        const getUrl = (path: string) => (path.startsWith('/') || path.startsWith('http')) ? path : `/${path}`;

        const widthCap = window.innerWidth < 1024 ? 800 : undefined;

        setLoadedFrontCover(optimizeCloudinary(getUrl(frontFile?.filePath || ''), widthCap));
        setLoadedBackCover(optimizeCloudinary(getUrl(backFile?.filePath || ''), widthCap));

        setLoadStatus(`Processing ${sheetFiles.length} cinematic spreads…`);
        const halves: string[] = [];
        for (let i = 0; i < sheetFiles.length; i++) {
          const url = getUrl(sheetFiles[i].filePath);

          // TRY CLOUDINARY SPLIT FIRST (Instant)
          const cloudHalves = getCloudinaryHalves(url, widthCap);
          if (cloudHalves) {
            halves.push(...cloudHalves);
          } else {
            // Fallback for local blobs/manual uploads (Slow)
            setLoadStatus(`Rendering spread ${i + 1}/${sheetFiles.length}…`);
            const [left, right] = await splitPanoramicSheet(url);
            halves.push(left, right);
          }
        }

        splitUrlsRef.current = halves;
        setLoadedSheets(halves);

        // Proactive Initial Pre-warming
        setLoadStatus('Pre-warming cinematic covers…');
        const initialToPreload = [
          optimizeCloudinary(getUrl(frontFile?.filePath || ''), widthCap),
          ...halves.slice(0, 12)
        ].filter(Boolean);

        await Promise.all(initialToPreload.map(url => new Promise(resolve => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // don't block forever
          img.src = url;
        })));

      } catch (e) {
        console.error('Failed to load album or settings', e);
        setLoadStatus('Terminal Error: Project unavailable or deleted.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndLoad();
  }, [id]);

  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Always use the live internet viewer (Vercel) for Customer links
  const origin = import.meta.env.VITE_PUBLIC_VIEWER_URL || 'https://eventfold.vercel.app';
  // Extract custom uploaded music from the album, or fall back to default theme music
  const customAudio = album?.files?.find((f: any) => f.fileType === 'audio')?.filePath;
  const defaultMusicUrl = album?.theme === 'royal' ? 'https://res.cloudinary.com/dzp0f9u5u/video/upload/v1740393962/royalty_wedding_bg_music_oc9z3p.mp3' : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const musicUrl = customAudio || defaultMusicUrl;
  const shareUrl = `${origin}/album/${id}?shared=true`;

  const handleShare = async () => {
    const url = `${origin}/album/${id}?shared=true`;
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

  const isInstagram = /Instagram/i.test(navigator.userAgent);
  const isFacebook = /FBAN|FBAV/i.test(navigator.userAgent);
  const isIABB = isInstagram || isFacebook;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (window.innerWidth < 1024 && !hasStarted && !loading) {
    if (isIABB) {
      const currentUrl = window.location.href.replace(/^https?:\/\//, '');
      const encodedUrl = encodeURIComponent(window.location.href);
      // Improved Chrome Intent URL
      const chromeIntent = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      
      const copyUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#030303] text-white p-8 text-center relative overflow-hidden">
          <div className="fixed inset-0 bg-primary/10 blur-[120px] rounded-full -z-10" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm w-full space-y-8"
          >
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                <Smartphone className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tight">Better in Browser</h2>
              <p className="text-white/60 text-sm leading-relaxed px-4">
                The Instagram browser doesn't support the full 3D cinematic engine. Open this in your system browser.
              </p>
            </div>

            <div className="space-y-4">
              {isAndroid ? (
                <div className="space-y-3">
                  <Button
                    size="lg"
                    onClick={() => {
                        window.location.replace(chromeIntent);
                    }}
                    className="w-full rounded-2xl h-16 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-2xl shadow-primary/40"
                  >
                    Launch in Chrome
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={copyUrl}
                    className="w-full rounded-2xl h-16 bg-white/5 border border-white/10 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                    {copied ? 'Link Copied!' : 'Copy Link to Paste'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                        <p className="text-sm">Tap the <strong>三个圆点 (···)</strong> or <strong>分享 icon</strong></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                        <p className="text-sm">Select <strong>Open in Safari / Browser</strong></p>
                    </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={copyUrl}
                        className="w-full rounded-2xl h-16 bg-white/10 text-white font-semibold flex items-center justify-center gap-2"
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                        {copied ? 'Link Copied!' : 'Copy Link for Browser'}
                    </Button>
                </div>
              )}

              <button
                onClick={() => setHasStarted(true)}
                className="text-white/40 text-xs uppercase tracking-widest hover:text-white/60 transition-colors mt-8 inline-block"
              >
                Continue in Instagram anyway
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030303] text-white p-8 text-center relative overflow-hidden">
        <div className="fixed inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-sm"
        >
          <div className="w-24 h-24 mb-8 mx-auto bg-primary/20 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <Play className="w-10 h-10 text-primary fill-primary ml-1 relative z-10" />
          </div>
          <h2 className="text-4xl font-display font-bold mb-4 tracking-tight leading-tight">Your Digital Cinema is Ready</h2>
          <p className="text-white/40 text-sm font-mono uppercase tracking-[0.2em] mb-12">Tap below for the full immersive experience</p>
          <Button
            size="lg"
            onClick={async () => {
              try {
                await document.documentElement.requestFullscreen();
              } catch (e) { }
              // Wait for fullscreen transition (if any) and DOM to settle
              setTimeout(() => setHasStarted(true), 300);
            }}
            className="w-full rounded-2xl h-16 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-2xl shadow-primary/40 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            Start Immersive View
          </Button>
        </motion.div>
      </div>
    );
  }

  const BrandingHeader = () => (
    <motion.div
      initial={false}
      animate={{
        y: (uiVisible && window.innerWidth < 1024) ? -120 : (uiVisible ? 0 : -120),
        opacity: (uiVisible && window.innerWidth < 1024) ? 0 : (uiVisible ? 1 : 0)
      }}
      className={`absolute top-0 left-0 right-0 p-3 md:p-6 z-[60] flex items-center justify-between pointer-events-none transition-all duration-500`}
    >
      <div className={`flex items-center gap-2 md:gap-4 bg-black/70 backdrop-blur-3xl border border-white/5 pointer-events-auto shadow-2xl transition-all duration-300 ${isSmallHeight || isMobileLandscape || window.innerWidth >= 1024 ? 'px-3 py-1.5 rounded-xl' : 'px-8 py-5 rounded-3xl'}`}>
        {settings?.businessLogo ? (
          <img src={settings.businessLogo} alt="Logo" className={`${isSmallHeight || isMobileLandscape || window.innerWidth >= 1024 ? 'h-5 md:h-7' : 'h-14'} w-auto rounded-lg object-contain`} />
        ) : (
          <img src="/branding material/without bg version.png" alt="EventFold" className={`${isSmallHeight || isMobileLandscape || window.innerWidth >= 1024 ? 'h-5 md:h-7' : 'h-12'} w-auto object-contain`} />
        )}
        {!(isSmallHeight || isMobileLandscape || window.innerWidth >= 1024) && <div className="w-px h-6 bg-white/10 mx-1" />}
        <div className="flex flex-col">
          {!(isSmallHeight || isMobileLandscape || window.innerWidth >= 1024) && <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mb-1">{album?.theme || 'Project'}</span>}
          <span className={`${isSmallHeight || isMobileLandscape || window.innerWidth >= 1024 ? 'text-[10px] md:text-sm' : 'text-base'} font-bold text-white tracking-tight leading-none`}>{settings?.businessName || 'EventFold Studio'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        {settings?.contactWhatsApp && window.innerWidth >= 1024 && (
          <Button
            onClick={() => window.open(`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}`, '_blank')}
            className={`rounded-xl bg-green-500 hover:bg-green-600 text-white border-none shadow-lg shadow-green-500/20 px-5 font-bold ${isSmallHeight ? 'h-9 px-3 text-xs' : 'h-11'}`}
          >
            <MessageCircle className={`${isSmallHeight ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
            <span className="hidden sm:inline">Contact Studio</span>
          </Button>
        )}
      </div>
    </motion.div>
  );

  const PasswordWall = () => {
    const [pwd, setPwd] = useState('');
    const [err, setErr] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const submit = async () => {
      setIsUnlocking(true);
      setErr(false);
      try {
        const res = await fetch(`/api/albums/${id}/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });
        if (res.ok) {
          window.location.reload(); // Refresh to fetch full data
        } else {
          setErr(true);
        }
      } catch (e) {
        setErr(true);
      } finally {
        setIsUnlocking(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white p-6 relative overflow-hidden">
        <div className="fixed inset-0 bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />
        <BrandingHeader />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md glass p-10 rounded-[3rem] border-white/5 text-center space-y-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 blur-[80px] -z-10" />
          <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-2xl shadow-primary/20">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-display font-bold tracking-tight">Protected Project</h2>
            <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">Enter Studio Access Key</p>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <input
                type="password"
                placeholder="••••"
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setErr(false); }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className={`w-full h-16 bg-white/[0.03] border-white/10 rounded-2xl px-6 text-2xl text-center font-mono focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all outline-none ${err ? 'border-red-500/50 bg-red-500/5' : ''}`}
                autoFocus
              />
              {err && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs font-bold mt-3 uppercase tracking-widest"
                >
                  Invalid Access Key
                </motion.p>
              )}
            </div>

            <Button
              onClick={submit}
              disabled={!pwd || isUnlocking}
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 group overflow-hidden relative"
            >
              {isUnlocking ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  Unlock Collection <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>

          <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]">
            Studio Security · End-to-End Encrypted
          </p>
        </motion.div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white overflow-hidden relative">
        <div className="fixed inset-0 bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />

        <BrandingHeader />

        <div className="text-center relative pt-20">
          <div className="w-20 h-20 mb-8 mx-auto relative flex items-center justify-center">
            <Loader2 className="w-20 h-20 animate-spin text-primary opacity-20 absolute" />
            <div className="w-4 h-4 bg-primary rounded-full animate-ping" />
          </div>
          <p className="font-display font-bold text-2xl mb-3 tracking-tight">Initializing Cinematic Feed</p>
          <p className="text-white/40 text-sm font-mono uppercase tracking-[0.2em]">{loadStatus}</p>
        </div>
      </div>
    );
  }

  // Show password wall if protected and not unlocked
  if (album.isProtected && !album.isUnlocked) {
    return <PasswordWall />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden selection:bg-primary/30">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Brand Header (Only in shared view) */}
      {isShared && <BrandingHeader />}

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
        <div className="absolute top-4 md:top-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <motion.div
            initial={false}
            animate={{
              y: (uiVisible && window.innerWidth < 1024) ? -100 : ((uiVisible || !isSmallHeight) ? 0 : -60),
              opacity: (uiVisible && window.innerWidth < 1024) ? 0 : ((uiVisible || !isSmallHeight) ? 1 : 0),
              scale: isSmallHeight ? 0.8 : 1
            }}
            className="glass-dark px-4 md:px-8 py-2 md:py-3 rounded-2xl border-white/5 flex items-center gap-3 md:gap-4"
          >
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse" />
            <h1 className="font-display font-bold text-[10px] md:text-xs text-white/90 tracking-[0.4em] uppercase">{album.title}</h1>
          </motion.div>
        </div>
      )}

      <main
        className="relative w-full flex-1 flex flex-col items-center justify-center bg-transparent lg:overflow-visible"
        style={{ touchAction: 'none', minHeight: 0 }}
      >
        <TransformWrapper
          initialScale={window.innerWidth < 1024 ? 1.08 : 1}
          maxScale={window.innerWidth < 1024 ? 4 : 2}
          centerOnInit={true}
          centerZoomedOut={true}
          limitToBounds={true}
          smooth={true}
          minScale={1}
          onTransformed={(ref) => setScale(ref.state.scale)}
          wheel={{ step: 0.1, disabled: window.innerWidth >= 1024 }}
          doubleClick={{ disabled: false }}
          pinch={{ disabled: false }}
          panning={{
            disabled: window.innerWidth >= 1024
          }}
        >
          {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
            <>
              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "transparent",
                  overflow: "visible" // Allow zoom/pan to extend outside viewport without clipping
                }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "visible"
                }}
              >
                <div
                  className="w-full h-full flex items-center justify-center lg:overflow-visible"
                >
                  <Flipbook
                    ref={flipbookRef}
                    sheets={loadedSheets}
                    frontCover={loadedFrontCover}
                    backCover={loadedBackCover}
                    title={album.title}
                    contactWhatsApp={isShared ? settings?.contactWhatsApp : undefined}
                    businessName={settings?.businessName}
                    videos={loadedVideos}
                    uiVisible={uiVisible}
                    isMuted={isMuted}
                    isSlideshowActive={isSlideshowActive}
                    onSlideshowEnd={() => setIsSlideshowActive(false)}
                    onPageChange={(current, total) => setPageInfo({ current, total })}
                    audioUrl={musicUrl}
                  />
                </div>
              </TransformComponent>

              {/* Safe-Zone Navigation Arrows (Always at screen edges, non-overlapping) */}
              <div className="absolute inset-y-0 left-0 w-16 md:w-24 flex items-center justify-center z-[100] pointer-events-none">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => flipbookRef.current?.prev()}
                  className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-md text-white/60 hover:text-white hover:bg-black/60 border border-white/5 pointer-events-auto transition-all shadow-2xl"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </Button>
              </div>
              <div className="absolute inset-y-0 right-0 w-16 md:w-24 flex items-center justify-center z-[100] pointer-events-none">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => flipbookRef.current?.next()}
                  className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-md text-white/60 hover:text-white hover:bg-black/60 border border-white/5 pointer-events-auto transition-all shadow-2xl"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </Button>
              </div>

              {/* Floating Zoom Controls (Responsive - Now visible on both) */}
              <motion.div
                animate={{
                  y: uiVisible ? 0 : (window.innerWidth < 1024 ? -120 : 100),
                  opacity: uiVisible ? 1 : 0
                }}
                className={`${window.innerWidth < 1024 ? 'fixed top-4 left-1/2 -translate-x-1/2' : 'absolute bottom-10'} z-[70] flex gap-1 md:gap-2 glass-dark px-3 py-1.5 md:px-4 md:py-2 rounded-2xl border-white/5 shadow-2xl scale-90 md:scale-100 transition-all duration-500`}
              >
                {window.innerWidth < 1024 && !isShared && (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" size="icon" title="Close" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10">
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    </Link>
                    <div className="w-px h-6 bg-white/10 mx-1 self-center" />
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={() => zoomOut()} title="Zoom out" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10"><ZoomOut className="w-4 h-4 md:w-5 h-5" /></Button>
                <div className="flex items-center px-2 md:px-3 text-white/90 text-[10px] md:text-sm font-bold min-w-[2.5rem] md:min-w-[3.5rem] justify-center tracking-tighter">
                  {Math.round((scale || 1) * 100)}%
                </div>
                <Button variant="ghost" size="icon" onClick={() => zoomIn()} title="Zoom in" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10"><ZoomIn className="w-4 h-4 md:w-5 h-5" /></Button>
                <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 self-center" />
                <Button variant="ghost" size="icon" onClick={() => resetTransform()} title="Reset" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10"><RotateCcw className="w-4 h-4 md:w-5 h-5" /></Button>
                <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 self-center" />

                {/* Music Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? "Unmute" : "Mute"}
                  className={`${isMuted ? 'text-white/30' : 'text-primary animate-pulse'} hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 md:w-5 h-5" /> : <Volume2 className="w-4 h-4 md:w-5 h-5" />}
                </Button>

                {/* Slideshow Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSlideshowActive(!isSlideshowActive)}
                  title={isSlideshowActive ? "Stop Slideshow" : "Start Slideshow"}
                  className={`${isSlideshowActive ? 'text-primary' : 'text-white/60'} hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10`}
                >
                  {isSlideshowActive ? <Pause className="w-4 h-4 md:w-5 h-5" /> : <Play className="w-4 h-4 md:w-5 h-5" />}
                </Button>

                <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 self-center" />
                <Button variant="ghost" size="icon" onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => { });
                  } else {
                    document.exitFullscreen();
                  }
                }} title="Screen" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10">
                  <Maximize2 className="w-4 h-4 md:w-5 h-5" />
                </Button>

                <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 self-center" />

                {/* Shared Album Button */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleShare} 
                    title="Share Album" 
                    className={`${copied ? 'text-green-400' : 'text-white/60'} hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10`}
                >
                  {copied ? <Check className="w-4 h-4 md:w-5 h-5" /> : <Share2 className="w-4 h-4 md:w-5 h-5" />}
                </Button>

                <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 self-center" />

                {/* Page Counter integrated into Control Center */}
                <div className="flex items-center px-2 md:px-3 text-white/40 text-[10px] md:text-xs font-mono select-none tracking-widest min-w-[3.5rem] md:min-w-[4.5rem] justify-center">
                  {pageInfo.current + 1}<span className="mx-1 text-white/10">/</span>{pageInfo.total}
                </div>
              </motion.div>
            </>
          )}
        </TransformWrapper>

        {/* Rotate Overlay */}
        <AnimatePresence>
          {isPortrait && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative mb-8">
                <motion.div
                  animate={{ rotate: 90 }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                  className="p-6 bg-primary/20 rounded-[2rem] text-primary"
                >
                  <Smartphone className="w-16 h-16" />
                </motion.div>
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-4 -right-4 w-6 h-6 bg-primary rounded-full blur-md"
                />
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">Cinematic View Ready</h2>
              <p className="text-white/40 text-lg leading-relaxed max-w-sm mb-8">
                Please <span className="text-white font-bold">rotate your device</span> to landscape for the full immersive 3D experience.
              </p>
              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold uppercase tracking-widest opacity-60">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Orientation Tracking
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
// Keep fallback for local dev
function splitPanoramicSheet(url: string): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
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
        }, 'image/jpeg', 0.9);
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => reject(new Error('Image load failed: ' + url));
    img.src = url;
  });
}
