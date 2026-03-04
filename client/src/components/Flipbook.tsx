import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, Play, Pause, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlipbookProps {
  /** Pre-split 12×18 half-pages in order: [lh0, rh0, lh1, rh1, …] */
  sheets: string[];
  frontCover: string;
  backCover: string;
  title?: string;
  scale?: number;
  videos?: { filePath: string; orderIndex: number }[];
  uiVisible?: boolean;
  contactWhatsApp?: string;
  businessName?: string;
}

export function Flipbook({
  sheets,
  frontCover,
  backCover,
  title = 'Photo Album',
  scale = 1,
  contactWhatsApp,
  businessName,
  videos = [],
  uiVisible = true
}: FlipbookProps) {
  const book = useRef<any>(null);
  const container = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [pageWidth, setPageWidth] = useState(360);
  const [pageHeight, setPageHeight] = useState(240);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // true after the first page flip — triggers the "opening" animation
  const [isOpened, setIsOpened] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const slideshowTimer = useRef<NodeJS.Timeout | null>(null);
  const totalPageCount = 2 + sheets.length; // Front + Back + Sheets

  useEffect(() => {
    setTotalPages(totalPageCount);
  }, [totalPageCount]);

  // Background music audio element
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  const flipAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Soft piano / wedding-style royalty-free background music
    const musicUrl = '/music.mp3';

    const music = new Audio(musicUrl);
    music.loop = true;
    music.volume = 0;
    bgMusic.current = music;

    const flip = new Audio('https://www.soundjay.com/misc/sounds/page-flip-01a.mp3');
    flip.volume = 0.3;
    flipAudio.current = flip;

    // Prefetch audio
    music.load();
    flip.load();

    return () => {
      music.pause();
      music.src = '';
      flip.pause();
      flip.src = '';
    };
  }, []);

  // Handle music fade-in and state
  const fadeInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!bgMusic.current) return;

    if (fadeInterval.current) clearInterval(fadeInterval.current);

    if (!isMuted) {
      bgMusic.current.play().then(() => {
        // Fade in to 0.15 volume
        fadeInterval.current = setInterval(() => {
          if (!bgMusic.current) return;
          let newVol = bgMusic.current.volume + 0.01;
          if (newVol >= 0.15) {
            bgMusic.current.volume = 0.15;
            if (fadeInterval.current) clearInterval(fadeInterval.current);
          } else {
            bgMusic.current.volume = newVol;
          }
        }, 50);
      }).catch((err) => {
        console.warn("Autoplay still blocked, will retry on interaction:", err);
      });
    } else {
      // Fade out and pause
      fadeInterval.current = setInterval(() => {
        if (!bgMusic.current) return;
        let newVol = bgMusic.current.volume - 0.02;
        if (newVol <= 0) {
          bgMusic.current.volume = 0;
          bgMusic.current.pause();
          if (fadeInterval.current) clearInterval(fadeInterval.current);
        } else {
          bgMusic.current.volume = newVol;
        }
      }, 50);
    }

    return () => {
      if (fadeInterval.current) clearInterval(fadeInterval.current);
    };
  }, [isMuted]); // Removed isOpened requirement

  useEffect(() => {
    const handleResize = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const isMobile = screenW < 768;

      // Single page ratio is 1.5. Spread is 3.0.
      const PAGE_RATIO = 1.5;
      const multiplier = 2;

      // Vertical space usage: be more aggressive on mobile
      const isLandscape = screenW > screenH;
      const verticalPadding = isMobile ? (isLandscape ? 20 : 140) : 220;
      const horizontalPadding = isMobile ? (isLandscape ? 60 : 40) : 120;

      let availW = screenW - horizontalPadding;
      let availH = screenH - verticalPadding;

      // Ensure we don't have negative availability
      availW = Math.max(availW, 200);
      availH = Math.max(availH, 150);

      let w = availW / multiplier;
      let h = w / PAGE_RATIO;

      if (h > availH) {
        h = availH;
        w = h * PAGE_RATIO;
      }

      setPageWidth(Math.floor(w));
      setPageHeight(Math.floor(h));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    setReady(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playFlipSound = () => {
    if (isMuted || !flipAudio.current) return;
    try {
      flipAudio.current.currentTime = 0;
      flipAudio.current.play().catch(() => { });
    } catch (e) { }
  };

  const handleZoomIn = () => setZoom((p) => Math.min(p + 0.2, 3));
  const handleZoomOut = () => setZoom((p) => Math.max(p - 0.2, 1));
  const handleZoomReset = () => { setZoom(1); setPanX(0); setPanY(0); };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      container.current?.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleSlideshow = () => {
    setIsSlideshowActive(!isSlideshowActive);
  };

  useEffect(() => {
    if (isSlideshowActive) {
      slideshowTimer.current = setInterval(() => {
        if (book.current) {
          const state = book.current.pageFlip().getState();
          if (state === 'read') {
            book.current.pageFlip().flipNext();
            // If we reached the end, stop slideshow
            if (currentPage >= totalPages - 1) {
              setIsSlideshowActive(false);
            }
          }
        }
      }, 4000);
    } else {
      if (slideshowTimer.current) clearInterval(slideshowTimer.current);
    }
    return () => { if (slideshowTimer.current) clearInterval(slideshowTimer.current); };
  }, [isSlideshowActive, currentPage, totalPages]);

  useEffect(() => { if (zoom === 1) { setPanX(0); setPanY(0); } }, [zoom]);

  const handleMouseWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      e.deltaY < 0 ? handleZoomIn() : handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const el = container.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const maxPanX = (width * (zoom - 1)) / 2;
    const maxPanY = (height * (zoom - 1)) / 2;
    setPanX(Math.max(-maxPanX, Math.min(maxPanX, e.clientX - dragStart.x)));
    setPanY(Math.max(-maxPanY, Math.min(maxPanY, e.clientY - dragStart.y)));
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!ready) return null;

  // ─────────────────────────────────────────────────────────────────
  // BUILD PAGE SEQUENCE
  //
  // sheets[] = [lh0, rh0, lh1, rh1, …] — already-split 12×18 halves.
  // react-pageflip with showCover=true:
  //   pages[0]      → front cover (alone, right side)
  //   pages[1..n-2] → spreads (must be EVEN count)
  //   pages[n-1]    → back cover (alone, left side)
  //
  // Spreads start immediately with the first sheet — no title/intro page.
  //   [1, 2]  =  lh0 | rh0   (sheet 1 panoramic)
  //   [3, 4]  =  lh1 | rh1   (sheet 2 panoramic)
  //   …
  // sheets.length is always EVEN, so content count is always EVEN ✓
  // ─────────────────────────────────────────────────────────────────

  const pages: { type: string; image?: string; video?: string; key: string }[] = [];

  pages.push({ type: 'cover', image: frontCover, key: 'cover-front' });

  // Panoramic halves — each pair [lh, rh] forms one seamless spread
  sheets.forEach((half, idx) => {
    // Check if this sheet index has an associated video
    // (We'll assume video corresponds to sheet index for simplicity, or we can use orderIndex)
    const videoForSheet = videos.find(v => v.orderIndex === idx);
    pages.push({
      type: 'sheet',
      image: half,
      video: videoForSheet?.filePath,
      key: `half-${idx}`
    });
  });

  pages.push({ type: 'cover', image: backCover, key: 'cover-back' });



  // ─────────────────────────────────────────────────────────────────
  // BASE STYLES
  // ─────────────────────────────────────────────────────────────────
  const pageBase: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    display: 'block',
  };

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center bg-transparent overflow-hidden" style={{ minHeight: 0 }}>

      {/* ── Controls Bar REMOVED (Controlled by Viewer for Pinch/Zoom) ── */}

      {/* ── Book Container ── */}
      <div
        ref={container}
        onWheel={handleMouseWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex items-center justify-center w-full h-full"
        style={{
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          perspective: '1400px',
          touchAction: 'none' // Absolute control for manual page turns
        }}
      >
        {/* Zoom / pan wrapper */}
        <div style={{
          transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}>
          {/* ── Album tilt & entrance animation ── */}
          <motion.div
            initial={{
              opacity: 0,
              y: 100,
              scale: 0.9 * scale,
              rotateZ: -12,
              rotateX: 25,
              perspective: '2000px',
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: scale,
              // More premium tilt when closed, flat when opened
              rotateZ: (isOpened || window.innerWidth < 768) ? 0 : -5,
              rotateX: (isOpened || window.innerWidth < 768) ? 0 : 8,
              rotateY: (isOpened || window.innerWidth < 768) ? 0 : 4,
            }}
            transition={{
              opacity: { duration: 0.8, ease: 'easeOut' },
              y: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
              rotateZ: isOpened
                ? { type: 'spring', stiffness: 60, damping: 20 }
                : { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
              rotateX: isOpened
                ? { type: 'spring', stiffness: 60, damping: 20 }
                : { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
              rotateY: isOpened
                ? { type: 'spring', stiffness: 60, damping: 20 }
                : { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
            }}
            style={{
              transformStyle: 'preserve-3d',
              display: 'inline-block',
              filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))'
            }}
          >
            {/* Cinematic Floor Reflection / Shadow */}
            <motion.div
              animate={{
                opacity: isOpened ? 0.3 : 0.6,
                scaleX: isOpened ? 1.2 : 0.85,
                translateY: isOpened ? 40 : 30,
                rotateX: isOpened ? 0 : 5,
                filter: 'blur(40px)',
              }}
              transition={{ type: 'spring', stiffness: 40, damping: 20 }}
              style={{
                position: 'absolute',
                bottom: -40,
                left: '-10%',
                right: '-10%',
                height: 100,
                background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.3) 0%, transparent 70%)',
                zIndex: -2,
                pointerEvents: 'none',
              }}
            />
            {/* Drop shadow — shifts with tilt for realism */}
            <motion.div
              animate={{
                opacity: isOpened ? 0.35 : 0.55,
                scaleX: isOpened ? 1 : 0.94,
                translateY: isOpened ? 16 : 22,
                translateX: isOpened ? 0 : 12,
                rotateZ: isOpened ? 0 : -3,
                filter: isOpened ? 'blur(22px)' : 'blur(28px)',
              }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              style={{
                position: 'absolute',
                bottom: -20,
                left: '5%',
                right: '5%',
                height: 30,
                backgroundColor: '#000',
                borderRadius: '50%',
                zIndex: -1,
              }}
            />

            <HTMLFlipBook
              ref={book}
              width={pageWidth}
              height={pageHeight}
              size="fixed"
              minWidth={50}
              maxWidth={3000}
              minHeight={50}
              maxHeight={3000}
              maxShadowOpacity={window.innerWidth < 768 ? 0.2 : 0.4}
              showCover={true}
              mobileScrollSupport={true}
              className="shadow-2xl"
              style={{ display: 'block' }}
              startPage={0}
              drawShadow={true}
              flippingTime={800}
              usePortrait={false}
              startZIndex={0}
              autoSize={false}
              clickEventForward={true} // Always forward clicks for smooth flipping
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
              onChangeState={(e: any) => {
                if (e.data === 'read') {
                  // Wait for the animation to finish before updating current page
                  // but we mainly rely on onFlip for the exact page index.
                }
              }}
              onFlip={(e: any) => {
                playFlipSound();
                const pg = e.data;
                setCurrentPage(pg);

                // Browser unblock: try to play sounds on interaction
                if (pg > 0 && !isOpened) {
                  setIsOpened(true);
                  if (!isMuted && bgMusic.current) {
                    // Important: Most browsers won't play music until first click.
                    // This flip counts as a click.
                    bgMusic.current.play().catch(e => console.warn("Music failed to play:", e));
                  }
                }

                if (pg === 0 && isOpened) {
                  setIsOpened(false);
                  if (bgMusic.current) {
                    // Fade out
                    const interval = setInterval(() => {
                      if (bgMusic.current && bgMusic.current.volume > 0.01) {
                        bgMusic.current.volume -= 0.01;
                      } else {
                        if (bgMusic.current) {
                          bgMusic.current.pause();
                          bgMusic.current.volume = 0;
                        }
                        clearInterval(interval);
                      }
                    }, 50);
                  }
                }
              }}
            >
              {pages.map((page) => {

                // ── Cover (front & back) ──
                if (page.type === 'cover') {
                  return (
                    <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#000', willChange: 'transform' }}>
                      <img
                        src={page.image}
                        alt="cover"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {/* Premium Leather Texture Overlay */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/leather.png")` }} />
                      {/* Subtle lighting overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/10 pointer-events-none" />
                      {/* Gold Foil Border Effect */}
                      <div className="absolute inset-4 border border-white/10 rounded-sm pointer-events-none" />
                      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)', pointerEvents: 'none' }} />
                    </div>
                  );
                }

                // ── Title page ──
                if (page.type === 'title') {
                  return (
                    <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'serif', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase' }}>Photo Album</div>
                      <div style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'serif', fontStyle: 'italic', fontSize: 18, letterSpacing: '0.08em', textAlign: 'center', padding: '0 20px' }}>{title}</div>
                      <div style={{ width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  );
                }

                // ── Blank / filler page ──
                if (page.type === 'blank') {
                  return (
                    <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#111' }}>
                      <div style={{ position: 'absolute', inset: '20%', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }} />
                    </div>
                  );
                }

                // ── Sheet half-page (12×18 landscape) ──
                // Alternating: even index = left half (spine shadow on RIGHT)
                //              odd index  = right half (spine shadow on LEFT)
                if (page.type === 'sheet') {
                  const pageIndex = pages.indexOf(page);
                  // Sheets start at pages[1]: lh at odd offsets from cover, rh at even
                  // Index 1=lh0, 2=rh0, 3=lh1, 4=rh1 …  → isLeftHalf when (pageIndex-1)%2===0
                  const isLeftHalf = (pageIndex - 1) % 2 === 0;

                  return (
                    <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#000', willChange: 'transform' }}>
                      {page.video ? (
                        <video
                          src={page.video}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: isLeftHalf ? 'right' : 'left',
                            display: 'block',
                            backgroundColor: '#0a0a0a',
                          }}
                        />
                      ) : (
                        <img
                          src={page.image}
                          alt="sheet"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: isLeftHalf ? 'right' : 'left',
                            display: 'block',
                            backgroundColor: '#0a0a0a',
                          }}
                        />
                      )}
                      {/* High-end Paper Texture */}
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/paper-fibers.png")` }} />

                      {/* Deep Spine Lighting */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        [isLeftHalf ? 'right' : 'left']: 0,
                        width: 40,
                        height: '100%',
                        background: isLeftHalf
                          ? 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 30%, transparent 100%)'
                          : 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 30%, transparent 100%)',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }} />

                      {/* Corner lighting */}
                      <div style={{
                        position: 'absolute',
                        [isLeftHalf ? 'top' : 'bottom']: 0,
                        [isLeftHalf ? 'left' : 'right']: 0,
                        width: '60%',
                        height: '40%',
                        background: `radial-gradient(circle at ${isLeftHalf ? '0% 0%' : '100% 100%'}, rgba(255,255,255,0.05) 0%, transparent 70%)`,
                        pointerEvents: 'none',
                        zIndex: 5,
                      }} />
                    </div>
                  );
                }

                return <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#111' }} />;
              })}
            </HTMLFlipBook>
          </motion.div>  {/* end album tilt wrapper */}
        </div>            {/* end zoom/pan wrapper */}

        {/* ── Lead Generator (Inside Fullscreen Container) ── */}
        <AnimatePresence>
          {contactWhatsApp && uiVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 100 }}
              transition={{ delay: 0, duration: 0.5 }}
              className="absolute bottom-6 left-6 z-[100] flex flex-col items-start gap-3"
            >
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl max-w-[200px] hidden xl:block">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Inquiry Hub</p>
                <p className="text-[10px] text-white/50 leading-relaxed font-medium capitalize text-left">
                  Love these photos? Contact <span className="text-white font-bold">{businessName || 'the Studio'}</span> for your next event.
                </p>
              </div>

              <Button
                onClick={() => window.open(`https://wa.me/${contactWhatsApp.replace(/[^0-9]/g, '')}?text=Hi! I saw your work on EventFold and I'm interested in booking for an event.`, '_blank')}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all hover:scale-110 active:scale-95 border-none p-0 group"
              >
                <span className="relative">
                  <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile Side Navigation ── */}
        <div className="md:hidden absolute inset-y-0 left-0 w-12 flex items-center justify-start pl-2 z-50 pointer-events-none">
          <Button
            onClick={() => { playFlipSound(); book.current?.pageFlip().flipPrev(); }}
            className="rounded-full w-10 h-10 bg-black/40 backdrop-blur-md text-white border border-white/10 p-0 pointer-events-auto"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </div>
        <div className="md:hidden absolute inset-y-0 right-0 w-12 flex items-center justify-end pr-2 z-50 pointer-events-none">
          <Button
            onClick={() => { playFlipSound(); book.current?.pageFlip().flipNext(); }}
            className="rounded-full w-10 h-10 bg-black/40 backdrop-blur-md text-white border border-white/10 p-0 pointer-events-auto"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>            {/* end container */}

      {/* ── Navigation ── */}
      <motion.div
        animate={{
          y: uiVisible ? 0 : 100,
          opacity: uiVisible ? 1 : 0
        }}
        className="absolute bottom-5 z-[80] flex items-center gap-6"
      >
        <Button
          onClick={() => { playFlipSound(); book.current?.pageFlip().flipPrev(); }}
          className="rounded-full w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white border border-white/15 p-0 transition-all"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 h-5" />
        </Button>
        <span className="text-white/40 text-[10px] md:text-xs font-mono select-none">
          {currentPage + 1} / {totalPageCount}
        </span>
        <Button
          onClick={() => { playFlipSound(); book.current?.pageFlip().flipNext(); }}
          className="rounded-full w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white border border-white/15 p-0 transition-all"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4 md:w-5 h-5" />
        </Button>
      </motion.div>
    </div >
  );
}
