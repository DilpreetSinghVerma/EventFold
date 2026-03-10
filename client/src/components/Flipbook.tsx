import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, ZoomIn, ZoomOut, RotateCcw, Maximize2, Play, Pause, MessageCircle } from 'lucide-react';
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
  isMuted?: boolean;
  isSlideshowActive?: boolean;
  onSlideshowEnd?: () => void;
  onPageChange?: (current: number, total: number) => void;
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
  onPageChange
}: FlipbookProps, ref) => {
  const book = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    next: () => book.current?.pageFlip().flipNext(),
    prev: () => book.current?.pageFlip().flipPrev()
  }));

  const container = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(360);
  const [pageHeight, setPageHeight] = useState(240);
  const [ready, setReady] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const slideshowTimer = useRef<NodeJS.Timeout | null>(null);
  const totalPageCount = 2 + sheets.length; // Front + Back + Sheets

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

      // Vertical space usage: be more aggressive on mobile landscape to clear UI
      const isLandscape = screenW > screenH;
      const verticalPadding = isMobile ? (isLandscape ? 60 : 140) : 340; // Reduced from 120 to 60 for larger view
      const horizontalPadding = isMobile ? (isLandscape ? 100 : 40) : 500; // Reduced from 160 to 100 for larger view

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
    // Initial sync
    if (onPageChange) onPageChange(0, sheets.length + 2);
    return () => window.removeEventListener('resize', handleResize);
  }, [sheets.length]);

  const playFlipSound = () => {
    if (isMuted || !flipAudio.current) return;
    try {
      flipAudio.current.currentTime = 0;
      flipAudio.current.play().catch(() => { });
    } catch (e) { }
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

  const pages: { type: string; image?: string; video?: string; key: string }[] = [];
  pages.push({ type: 'cover', image: frontCover, key: 'cover-front' });
  sheets.forEach((half, idx) => {
    const videoForSheet = videos.find(v => v.orderIndex === idx);
    pages.push({
      type: 'sheet',
      image: half,
      video: videoForSheet?.filePath,
      key: `half-${idx}`
    });
  });
  pages.push({ type: 'cover', image: backCover, key: 'cover-back' });

  const pageBase: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    display: 'block',
  };

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center bg-transparent overflow-visible" style={{ minHeight: 0 }}>
      {/* ── Book Container ── */}
      <div
        ref={container}
        className="flex items-center justify-center w-full h-full lg:overflow-visible"
        style={{
          perspective: '1400px',
          touchAction: 'auto'
        }}
      >
        <div>
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
              flippingTime={2000}
              usePortrait={false}
              startZIndex={0}
              autoSize={false}
              clickEventForward={true}
              useMouseEvents={window.innerWidth >= 1024}
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
              {pages.map((page) => {
                if (page.type === 'cover') {
                  return (
                    <div key={page.key} className="page" style={{
                      ...pageBase,
                      backgroundColor: '#000',
                      willChange: 'transform',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'translate3d(0,0,0)',
                      WebkitTransform: 'translate3d(0,0,0)',
                      transformStyle: 'preserve-3d',
                      WebkitTransformStyle: 'preserve-3d',
                    }}>
                      <img
                        src={page.image}
                        alt="cover"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/leather.png")` }} />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/10 pointer-events-none" />
                      <div className="absolute inset-4 border border-white/10 rounded-sm pointer-events-none" />
                      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)', pointerEvents: 'none' }} />
                    </div>
                  );
                }
                if (page.type === 'sheet') {
                  const pageIndex = pages.indexOf(page);
                  const isLeftHalf = (pageIndex - 1) % 2 === 0;
                  return (
                    <div key={page.key} className="page" style={{
                      ...pageBase,
                      backgroundColor: '#000',
                      willChange: 'transform',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'translate3d(0,0,0)',
                      WebkitTransform: 'translate3d(0,0,0)',
                      transformStyle: 'preserve-3d',
                      WebkitTransformStyle: 'preserve-3d',
                    }}>
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
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/paper-fibers.png")` }} />
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
                    </div>
                  );
                }
                return <div key={page.key} className="page" style={{ ...pageBase, backgroundColor: '#111' }} />;
              })}
            </HTMLFlipBook>
          </motion.div>
        </div>
      </div>





    </div>
  );
});
