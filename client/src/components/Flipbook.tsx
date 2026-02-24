import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlipbookProps {
  /** Pre-split 12×18 half-pages in order: [lh0, rh0, lh1, rh1, …] */
  sheets: string[];
  frontCover: string;
  backCover: string;
  title?: string;
}

export function Flipbook({ sheets, frontCover, backCover, title = 'Photo Album' }: FlipbookProps) {
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

      // Each page is landscape 18:12 = 1.5:1
      // Open book = two pages = 3:1 ratio
      const PAGE_RATIO = 18 / 12; // 1.5

      // Available space: subtract sticky header (~65px), controls (~56px), nav (~80px)
      const availH = Math.min(screenH - 220, 460);
      const availW = screenW - 80;

      // Fit two landscape pages side by side
      let h = availH;
      let w = h * PAGE_RATIO; // single page width

      if (w * 2 > availW) {
        w = availW / 2;
        h = w / PAGE_RATIO;
      }

      setPageWidth(Math.max(Math.floor(w), 160));
      setPageHeight(Math.max(Math.floor(h), 107));
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

  const pages: { type: string; image?: string; key: string }[] = [];

  pages.push({ type: 'cover', image: frontCover, key: 'cover-front' });

  // Panoramic halves — each pair [lh, rh] forms one seamless spread
  sheets.forEach((half, idx) => {
    pages.push({ type: 'sheet', image: half, key: `half-${idx}` });
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
    <div className="relative w-full flex-1 flex flex-col items-center justify-center bg-[#1a1a1a] overflow-hidden" style={{ minHeight: 0 }}>

      {/* ── Controls Bar ── */}
      <div className="absolute top-4 z-50 flex gap-2 bg-black/60 backdrop-blur-md rounded-full px-3 py-2 border border-white/10">
        <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom out" className="text-white hover:bg-white/20 rounded-full w-8 h-8"><ZoomOut className="w-4 h-4" /></Button>
        <div className="flex items-center px-2 text-white text-xs font-mono min-w-[3rem] justify-center">{Math.round(zoom * 100)}%</div>
        <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom in" className="text-white hover:bg-white/20 rounded-full w-8 h-8"><ZoomIn className="w-4 h-4" /></Button>
        <div className="w-px h-4 bg-white/20 mx-1 self-center" />
        <Button variant="ghost" size="icon" onClick={handleZoomReset} title="Reset zoom" className="text-white hover:bg-white/20 rounded-full w-8 h-8"><RotateCcw className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Toggle Fullscreen" className="text-white hover:bg-white/20 rounded-full w-8 h-8">
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
        <div className="w-px h-4 bg-white/20 mx-1 self-center" />
        <Button variant="ghost" size="icon" onClick={toggleSlideshow} title={isSlideshowActive ? "Pause Slideshow" : "Play Slideshow"} className={`text-white hover:bg-white/20 rounded-full w-8 h-8 ${isSlideshowActive ? 'bg-primary/40' : ''}`}>
          {isSlideshowActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsMuted(!isMuted);
            // Force play if unmuting explicitly
            if (isMuted && bgMusic.current && isOpened) {
              bgMusic.current.play().catch(e => console.error("Manual play failed", e));
            }
          }}
          title="Toggle sound"
          className={`text-white hover:bg-white/20 rounded-full w-8 h-8 ${!isMuted && isOpened ? 'text-primary animate-pulse' : ''}`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* ── Book Container ── */}
      <div
        ref={container}
        onWheel={handleMouseWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex items-center justify-center w-full h-full"
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default', perspective: '1400px' }}
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
              y: 60,
              scale: 0.82,
              rotateZ: -6,
              rotateX: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              // Cover: tilt like a real album resting on a table
              // Opened: spring straight
              rotateZ: isOpened ? 0 : -3,
              rotateX: isOpened ? 0 : 4,
            }}
            transition={{
              opacity: { duration: 0.5, ease: 'easeOut' },
              y: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
              rotateZ: isOpened
                ? { type: 'spring', stiffness: 90, damping: 18 }
                : { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
              rotateX: isOpened
                ? { type: 'spring', stiffness: 90, damping: 18 }
                : { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
            }}
            style={{ transformStyle: 'preserve-3d', display: 'inline-block' }}
          >
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
              minWidth={120}
              maxWidth={600}
              minHeight={80}
              maxHeight={400}
              maxShadowOpacity={0.4}
              showCover={true}
              mobileScrollSupport={true}
              className="shadow-2xl"
              style={{}}
              startPage={0}
              drawShadow={true}
              flippingTime={900}
              usePortrait={false}   /* Always landscape — two pages side by side */
              startZIndex={0}
              autoSize={false}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
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
                    <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#1a1a1a' }}>
                      <img
                        src={page.image}
                        alt="cover"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      {/* Subtle vignette on cover edges */}
                      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)', pointerEvents: 'none' }} />
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
                    <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#0a0a0a' }}>
                      <img
                        src={page.image}
                        alt="sheet"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          display: 'block',
                        }}
                      />
                      {/* Spine-side gradient shadow for depth */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        [isLeftHalf ? 'right' : 'left']: 0,
                        width: 20,
                        height: '100%',
                        background: isLeftHalf
                          ? 'linear-gradient(to left, rgba(0,0,0,0.35), transparent)'
                          : 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)',
                        pointerEvents: 'none',
                      }} />
                    </div>
                  );
                }

                return <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#111' }} />;
              })}
            </HTMLFlipBook>
          </motion.div>  {/* end album tilt wrapper */}
        </div>          {/* end zoom/pan wrapper */}
      </div>            {/* end container */}

      {/* ── Navigation ── */}
      <div className="absolute bottom-5 z-40 flex items-center gap-6">
        <Button
          onClick={() => { playFlipSound(); book.current?.pageFlip().flipPrev(); }}
          className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white border border-white/15 p-0 transition-all"
          title="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-white/40 text-xs font-mono select-none">
          {currentPage + 1} / {totalPageCount}
        </span>
        <Button
          onClick={() => { playFlipSound(); book.current?.pageFlip().flipNext(); }}
          className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-md text-white border border-white/15 p-0 transition-all"
          title="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
