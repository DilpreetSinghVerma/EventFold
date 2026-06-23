import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, ZoomIn, ZoomOut, RotateCcw, Maximize2, Play, Pause, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlipbookProps {
  /** Pre-split 12×18 half-pages in order: [lh0, rh0, lh1, rh1, …] */
  sheets: { url: string; id: string }[];
  frontCover: string;
  backCover: string;
  title?: string;
  scale?: number;
  videos?: { filePath: string; orderIndex: number }[];
  uiVisible?: boolean;
  contactWhatsApp?: string;
  businessName?: string;
  isMuted?: boolean;
  isSlideshowActive?: boolean;
  onSlideshowEnd?: () => void;
  onPageChange?: (current: number, total: number) => void;
  audioUrl?: string;
  pageWidth?: number;
  pageHeight?: number;
}

export const Flipbook = forwardRef(({
  sheets,
  frontCover,
  backCover,
  title = 'Photo Album',
  scale = 1,
  contactWhatsApp,
  businessName,
  videos = [],
  uiVisible = true,
  isMuted = false,
  isSlideshowActive = false,
  onSlideshowEnd,
  onPageChange,
  audioUrl,
  pageWidth,
  pageHeight
}: FlipbookProps, ref) => {
  const book = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    next: () => book.current?.pageFlip().flipNext(),
    prev: () => book.current?.pageFlip().flipPrev()
  }));

  const container = useRef<HTMLDivElement>(null);
  const [localPageWidth, setLocalPageWidth] = useState(360);
  const [localPageHeight, setLocalPageHeight] = useState(240);

  const finalPageWidth = pageWidth || localPageWidth;
  const finalPageHeight = pageHeight || localPageHeight;

  const [ready, setReady] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const slideshowTimer = useRef<NodeJS.Timeout | null>(null);
  const totalPageCount = 2 + sheets.length; // Front + Back + Sheets

  // Background music audio element
  const [isFlipping, setIsFlipping] = useState(false);
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  const flipAudio = useRef<HTMLAudioElement | null>(null);
  const lastFlipTime = useRef(0);
  const isFlipPlaying = useRef(false);

  useEffect(() => {
    // Soft piano / wedding-style royalty-free background music or custom upload
    const defaultMusicUrl = '/music.mp3';
    
    let music: HTMLAudioElement | null = null;
    if (audioUrl !== 'none') {
      music = new Audio(audioUrl || defaultMusicUrl);
      music.loop = true;
      music.volume = 0;
      music.load();
    }
    bgMusic.current = music;

    const flip = new Audio('/page flip sound.mp3');
    flip.volume = 0.5; // Slightly louder for premium tactile feel
    flipAudio.current = flip;

    // Prefetch audio
    music.load();
    flip.load();

    // Preload the first few pages immediately plus covers
    if (sheets.length > 0) {
      const preloadNext = (urls: string[]) => {
        urls.forEach(url => {
          if (!url) return;
          const img = new Image();
          img.src = url;
        });
      };
      // Preload the first few pages immediately plus covers
      preloadNext([frontCover, backCover, ...sheets.map(s => (s as any).url || s).slice(0, 12)]);
    }

    return () => {
      music.pause();
      music.src = '';
      flip.pause();
      flip.src = '';
    };
  }, [audioUrl]);

  // Handle music fade-in and state
  const fadeInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!bgMusic.current) return;

    if (fadeInterval.current) clearInterval(fadeInterval.current);

    // Only play music if album is opened at least once OR if explicitly unmuted
    if (!isMuted && isOpened) {
      bgMusic.current.play().then(() => {
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
      }).catch(err => console.warn("Audio blocked:", err));
    } else {
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
  }, [isMuted, isOpened, audioUrl]); // Added isOpened and audioUrl as triggers

  useEffect(() => {
    const handleResize = () => {
      const screenW = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const screenH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const isMobile = screenW < 1024;

      // Single page ratio is 1.5. Spread is 3.0.
      const PAGE_RATIO = 1.5;
      const multiplier = 2;

      // Vertical space usage: be more aggressive on mobile landscape to clear UI
      const isLandscape = screenW > screenH;
      // Increase padding in mobile landscape from 40 to 85 to clear title and controls
      const verticalPadding = isMobile ? (isLandscape ? 85 : 140) : 340;
      const horizontalPadding = isMobile ? (isLandscape ? 40 : 40) : 500;

      let availW = screenW - horizontalPadding;
      let availH = screenH - verticalPadding;

      // Ensure we don't have negative availability
      availW = Math.max(availW, 200);
      availH = Math.max(availH, 150);

      let w, h;
      if (isMobile && isLandscape) {
        // Size the page to fit the height, letting the width overflow to default to 100% zoom
        h = availH;
        w = h * PAGE_RATIO;
      } else {
        w = availW / multiplier;
        h = w / PAGE_RATIO;
        if (h > availH) {
          h = availH;
          w = h * PAGE_RATIO;
        }
      }

      setLocalPageWidth(Math.floor(w));
      setLocalPageHeight(Math.floor(h));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Tiny delay to ensure DOM dimensions are stable
    const timer = setTimeout(() => {
        setReady(true);
    }, 100);

    // Initial sync
    if (onPageChange) onPageChange(0, sheets.length + 2);
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timer);
    };
  }, [sheets.length]);

  const playFlipSound = () => {
    if (isMuted || !flipAudio.current || isFlipPlaying.current) return;
    const now = Date.now();
    if (now - lastFlipTime.current < 1200) return; 
    
    isFlipPlaying.current = true;
    lastFlipTime.current = now;
    
    try {
      flipAudio.current.currentTime = 0;
      flipAudio.current.play().then(() => {
        // Reset lock once the audio is decently along or after animation
        setTimeout(() => { isFlipPlaying.current = false; }, 1100);
      }).catch(() => { isFlipPlaying.current = false; });
    } catch (e) { isFlipPlaying.current = false; }
  };

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



  useEffect(() => {
    if (isSlideshowActive) {
      slideshowTimer.current = setInterval(() => {
        if (book.current) {
          const state = book.current.pageFlip().getState();
          if (state === 'read') {
            book.current.pageFlip().flipNext();
            // If we reached the end, stop slideshow
            if (currentPage >= totalPageCount - 1) {
              onSlideshowEnd?.();
            }
          }
        }
      }, 4000);
    } else {
      if (slideshowTimer.current) clearInterval(slideshowTimer.current);
    }
    return () => { if (slideshowTimer.current) clearInterval(slideshowTimer.current); };
  }, [isSlideshowActive, currentPage, totalPageCount]);

  if (!ready) return null;

  const pages: { type: string; image?: string; video?: string; key: string; id?: string }[] = [];
  pages.push({ type: 'cover', image: frontCover, key: 'cover-front' });
  sheets.forEach((half, idx) => {
    const videoForSheet = (videos || []).find(v => v.orderIndex === idx);
    pages.push({
      type: 'sheet',
      image: half.url,
      video: videoForSheet?.filePath,
      key: `half-${idx}`,
      id: half.id
    });
  });
  pages.push({ type: 'cover', image: backCover, key: 'cover-back' });

  const pageBase: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    display: 'block',
    backgroundColor: '#000',
    WebkitBackfaceVisibility: 'hidden',
    backfaceVisibility: 'hidden',
    transform: 'translate3d(0, 0, 0)',
    WebkitTransform: 'translate3d(0, 0, 0)',
    willChange: 'transform',
  };

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center bg-transparent overflow-visible" style={{ minHeight: 0 }}>
      {/* ── Book Container ── */}
      <div
        ref={container}
        className="flex items-center justify-center w-full h-full lg:overflow-visible"
        style={{
          perspective: window.innerWidth < 1024 ? 'none' : '1400px',
          touchAction: 'auto'
        }}
      >
          {window.innerWidth < 1024 ? (
            // Mobile: plain div, no 3D transforms — full GPU power goes to the flip animation
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ display: 'inline-block' }}
            >
              <div
                style={{
                  display: 'inline-block',
                  transform: `translate3d(${(currentPage === 0 && window.innerWidth < 1024) ? -(finalPageWidth / 2) : 0}px, 0, 0)`,
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  willChange: 'transform'
                }}
              >
            <HTMLFlipBook
              ref={book}
              width={finalPageWidth}
              height={finalPageHeight}
              size="fixed"
              minWidth={50}
              maxWidth={3000}
              minHeight={50}
              maxHeight={3000}
              maxShadowOpacity={0}
              showCover={true}
              mobileScrollSupport={false}
              className="shadow-none"
              style={{
                display: 'block',
                willChange: 'transform',
                transformStyle: 'preserve-3d',
                WebkitTransformStyle: 'preserve-3d',
              }}
              startPage={0}
              drawShadow={window.innerWidth >= 1024}
              onChangeState={(e: any) => {
                if (e.data === 'flipping') {
                  playFlipSound();
                }
              }}
              flippingTime={1200}
              usePortrait={false}
              startZIndex={0}
              autoSize={false}
              clickEventForward={true}
              useMouseEvents={window.innerWidth >= 1024}
              swipeDistance={window.innerWidth < 1024 ? 15 : 30}
              showPageCorners={window.innerWidth >= 1024}
              disableFlipByClick={window.innerWidth < 1024}
              onFlip={(e: any) => {
                playFlipSound();
                const pg = e.data;
                setCurrentPage(pg);
                if (onPageChange) onPageChange(pg, totalPageCount);
                if (pg > 0 && !isOpened) {
                  setIsOpened(true);
                  if (!isMuted && bgMusic.current) {
                    bgMusic.current.play().catch(e => console.warn("Music failed to play:", e));
                  }
                }
                if (pg === 0 && isOpened) {
                  setIsOpened(false);
                  if (bgMusic.current) {
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
              {pages.map((page, index) => {
                const isMobileLayout = window.innerWidth < 1024;
                const isCurrentSpread = Math.abs(index - currentPage) <= 2;
                const isPreloading = Math.abs(index - currentPage) <= 4;
                // react-pageflip's layout engine crashes if we hot-swap "hard" pages using windowing.
                // Mobile GPU jitter is already fixed by removing the CSS transitions.

                let pageClass = "page";
                let pageDensity = "soft";

                if (page.type === 'cover') {
                  pageClass = "page hard";
                  pageDensity = "hard";
                } else if (page.type === 'sheet') {
                  pageClass = `page ${isMobileLayout ? 'hard' : ''}`;
                  pageDensity = isMobileLayout ? 'hard' : 'soft';
                }


                const isNear = Math.abs(index - currentPage) <= (isMobileLayout ? 6 : 8);

                if (page.type === 'cover') {
                  return (
                    <div key={page.key} className={pageClass} 
                      data-density={pageDensity}
                      onClickCapture={(e) => {
                        if (window.innerWidth < 1024) e.stopPropagation();
                      }}
                      style={{
                        ...pageBase,
                        backgroundColor: '#000',
                      }}
                    >
                      {isNear && (
                        <>
                          <img
                            src={page.image}
                            alt="cover"
                            loading="eager"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              WebkitBackfaceVisibility: 'hidden',
                              backfaceVisibility: 'hidden',
                              transform: 'translate3d(0, 0, 0)',
                              WebkitTransform: 'translate3d(0, 0, 0)',
                              willChange: 'transform',
                            }}
                          />
                          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/leather.png")` }} />
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/10 pointer-events-none" />
                          <div className="absolute inset-4 border border-white/10 rounded-sm pointer-events-none" />
                          <div style={{ position: 'absolute', inset: 0, boxShadow: window.innerWidth >= 1024 ? 'inset 0 0 100px rgba(0,0,0,0.8)' : 'none', pointerEvents: 'none', zIndex: 10 }} />
                        </>
                      )}
                    </div>
                  );
                }
                if (page.type === 'sheet') {
                  const isLeftHalf = (index - 1) % 2 === 0;
                  const driftAnimate = isSlideshowActive && !isFlipping ? {
                    scale: [1, 1.05],
                    y: [0, 8]
                  } : { scale: 1, y: 0 };

                  return (
                    <div key={page.key} className={`${pageClass} group`}
                      data-density={pageDensity}
                      onClickCapture={(e) => {
                        if (window.innerWidth < 1024) e.stopPropagation();
                      }}
                      style={{
                        ...pageBase,
                        backgroundColor: '#0a0a0a',
                      }}
                    >
                      {isNear && (
                        <>
                          <motion.img
                            src={page.image}
                            alt="sheet"
                            loading="eager"
                            animate={driftAnimate}
                            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: isLeftHalf ? 'left' : 'right',
                              display: 'block',
                              backgroundColor: '#0a0a0a',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              zIndex: 1,
                              WebkitBackfaceVisibility: 'hidden',
                              backfaceVisibility: 'hidden',
                              transform: 'translate3d(0, 0, 0)',
                              WebkitTransform: 'translate3d(0, 0, 0)',
                              willChange: 'transform',
                            }}
                          />
                          {page.video && (
                            <video
                              src={isPreloading ? page.video : undefined}
                              autoPlay={isCurrentSpread}
                              loop
                              muted
                              playsInline
                              preload="metadata"
                              onLoadedData={(e) => {
                                (e.currentTarget as HTMLVideoElement).style.opacity = '1';
                              }}
                              onCanPlay={(e) => {
                                (e.currentTarget as HTMLVideoElement).style.opacity = '1';
                              }}
                              ref={(el) => {
                                if (!el) return;
                                if (isCurrentSpread) {
                                  if (el.paused && el.src) {
                                    el.play().catch(() => {});
                                    el.style.opacity = '1';
                                  }
                                } else {
                                  if (!el.paused) el.pause();
                                }
                                if (!el.src || el.src === '') {
                                  el.style.opacity = '0';
                                }
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: isLeftHalf ? 'left' : 'right',
                                display: 'block',
                                backgroundColor: 'transparent',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 2,
                                opacity: 0,
                                transition: 'opacity 0.4s ease-in-out',
                                WebkitBackfaceVisibility: 'hidden',
                                backfaceVisibility: 'hidden',
                                transform: 'translate3d(0, 0, 0)',
                                WebkitTransform: 'translate3d(0, 0, 0)',
                              }}
                            />
                          )}

                          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/paper-fibers.png")`, zIndex: 3 }} />
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            [isLeftHalf ? 'right' : 'left']: 0,
                            width: 30,
                            height: '100%',
                            background: isLeftHalf
                              ? 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)'
                              : 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)',
                            pointerEvents: 'none',
                            zIndex: 10,
                          }} />
                        </>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </HTMLFlipBook>
            </div>
            </motion.div>
          ) : (
            // Desktop: full 3D tilt animation
            <motion.div
              initial={{
                opacity: 0,
                y: 100,
                scale: 0.9 * scale,
                rotateZ: -12,
                rotateX: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: scale,
                rotateZ: isOpened ? 0 : -5,
                rotateX: isOpened ? 0 : 8,
                rotateY: isOpened ? 0 : 4,
              }}
              transition={{
                opacity: { duration: 0.8, ease: 'easeOut' },
                y: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                rotateZ: isOpened ? { type: 'spring', stiffness: 60, damping: 20 } : { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                rotateX: isOpened ? { type: 'spring', stiffness: 60, damping: 20 } : { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                rotateY: isOpened ? { type: 'spring', stiffness: 60, damping: 20 } : { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
              }}
              style={{
                transformStyle: 'preserve-3d',
                display: 'inline-block',
                filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))'
              }}
            >
            <HTMLFlipBook
              ref={book}
              width={finalPageWidth}
              height={finalPageHeight}
              size="fixed"
              minWidth={50}
              maxWidth={3000}
              minHeight={50}
              maxHeight={3000}
              maxShadowOpacity={0.3}
              showCover={true}
              mobileScrollSupport={false}
              className="shadow-2xl"
              style={{
                display: 'block',
                willChange: 'transform',
                transformStyle: 'preserve-3d',
                WebkitTransformStyle: 'preserve-3d',
              }}
              startPage={0}
              drawShadow={true}
              onChangeState={(e: any) => {
                if (e.data === 'flipping') {
                  playFlipSound();
                }
              }}
              flippingTime={1200}
              usePortrait={false}
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
                if (onPageChange) onPageChange(pg, totalPageCount);
                if (pg > 0 && !isOpened) {
                  setIsOpened(true);
                  if (!isMuted && bgMusic.current) {
                    bgMusic.current.play().catch(e => console.warn("Music failed to play:", e));
                  }
                }
                if (pg === 0 && isOpened) {
                  setIsOpened(false);
                  if (bgMusic.current) {
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
              {pages.map((page, index) => {
                const isNear = Math.abs(index - currentPage) <= 8;
                const isCurrentSpread = Math.abs(index - currentPage) <= 2;
                const isPreloading = Math.abs(index - currentPage) <= 4;

                if (page.type === 'cover') {
                  return (
                    <div key={page.key} className="page hard" data-density="hard"
                      style={{ ...pageBase }}>
                      {isNear && (
                        <>
                          <img src={page.image} alt="cover" loading="eager"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              WebkitBackfaceVisibility: 'hidden',
                              backfaceVisibility: 'hidden',
                              transform: 'translate3d(0, 0, 0)',
                              WebkitTransform: 'translate3d(0, 0, 0)',
                              willChange: 'transform',
                            }} />
                          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/leather.png")` }} />
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/10 pointer-events-none" />
                          <div className="absolute inset-4 border border-white/10 rounded-sm pointer-events-none" />
                          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)', pointerEvents: 'none', zIndex: 10 }} />
                        </>
                      )}
                    </div>
                  );
                }
                if (page.type === 'sheet') {
                  const isLeftHalf = (index - 1) % 2 === 0;
                  return (
                    <div key={page.key} className="page" data-density="soft"
                      style={{ ...pageBase, backgroundColor: '#0a0a0a' }}>
                      {isNear && (
                        <>
                          <img
                            src={page.image}
                            alt="sheet"
                            loading="eager"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: isLeftHalf ? 'left' : 'right',
                              display: 'block',
                              backgroundColor: '#0a0a0a',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              zIndex: 1,
                              WebkitBackfaceVisibility: 'hidden',
                              backfaceVisibility: 'hidden',
                              transform: 'translate3d(0, 0, 0)',
                              WebkitTransform: 'translate3d(0, 0, 0)',
                              willChange: 'transform',
                            }}
                          />
                          {page.video && (
                            <video 
                              src={isPreloading ? page.video : undefined}
                              autoPlay={isCurrentSpread}
                              loop 
                              muted 
                              playsInline
                              preload="metadata"
                              onLoadedData={(e) => {
                                (e.currentTarget as HTMLVideoElement).style.opacity = '1';
                              }}
                              onCanPlay={(e) => {
                                (e.currentTarget as HTMLVideoElement).style.opacity = '1';
                              }}
                              ref={(el) => {
                                if (!el) return;
                                if (isCurrentSpread) {
                                  if (el.paused && el.src) {
                                    el.play().catch(() => {});
                                    el.style.opacity = '1';
                                  }
                                } else {
                                  if (!el.paused) el.pause();
                                }
                                if (!el.src || el.src === '') {
                                  el.style.opacity = '0';
                                }
                              }}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover', 
                                objectPosition: isLeftHalf ? 'left' : 'right', 
                                display: 'block', 
                                backgroundColor: 'transparent',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 2,
                                opacity: 0,
                                transition: 'opacity 0.4s ease-in-out'
                              }} 
                            />
                          )}
                          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/paper-fibers.png")`, zIndex: 3 }} />
                          <div style={{ position: 'absolute', top: 0, [isLeftHalf ? 'right' : 'left']: 0, width: 30, height: '100%',
                            background: isLeftHalf
                              ? 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)'
                              : 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)',
                            pointerEvents: 'none', zIndex: 10 }} />
                        </>
                      )}
                    </div>
                  );
                }
                return <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#000' }} />;
              })}
            </HTMLFlipBook>
            </motion.div>
          )}
      </div>
    </div>
  );
});

Flipbook.displayName = 'Flipbook';
