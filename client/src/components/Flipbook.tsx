import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlipbookProps {
  sheets: string[]; 
  frontCover: string;
  backCover: string;
}

export function Flipbook({ sheets, frontCover, backCover }: FlipbookProps) {
  const book = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 300, height: 480 });

  useEffect(() => {
    const handleResize = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      
      const isMobile = screenW < 768;

      if (isMobile) {
        // Mobile: compact but still showing 2-page spread
        const w = Math.min(screenW - 30, 280);
        const h = w * 1.4; // Height ratio for book
        setDimensions({ width: w, height: h });
      } else {
        // Desktop: larger spread
        const w = Math.min(screenW - 100, 500);
        const h = w * 1.3;
        setDimensions({ width: w, height: h });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playFlipSound = () => {
    if (isMuted) return;
    const audio = new Audio('https://www.soundjay.com/misc/sounds/page-flip-01a.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const next = () => {
    playFlipSound();
    book.current?.pageFlip().flipNext();
  };

  const prev = () => {
    playFlipSound();
    book.current?.pageFlip().flipPrev();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
      {/* Sound Control */}
      <div className="absolute top-4 right-4 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMuted(!isMuted)} 
          className="rounded-full bg-black/40 text-white hover:bg-white/20"
          data-testid="button-mute-volume"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Flipbook Container */}
      <div className="flex items-center justify-center" style={{ perspective: '1500px' }}>
        {/* @ts-ignore */}
        <HTMLFlipBook
          ref={book}
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={150}
          maxWidth={800}
          minHeight={200}
          maxHeight={1000}
          maxShadowOpacity={0.7}
          showCover={true}
          mobileScrollSupport={false}
          usePortrait={false}
          autoSize={false}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={50}
          showPageCorners={true}
          disableFlipByClick={false}
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          startZIndex={0}
          onFlip={playFlipSound}
          style={{ margin: '0 auto' }}
          className="shadow-2xl"
        >
          {/* Front Cover */}
          <div className="page flex items-center justify-center" data-density="hard">
            <div className="w-full h-full relative bg-gradient-to-br from-[#3d0000] via-[#5c1a1a] to-[#2a0000] shadow-inner overflow-hidden">
              {frontCover ? (
                <img 
                  src={frontCover} 
                  alt="Front Cover" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).style.backgroundColor = '#3d0000'; }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#4a0e0e] to-[#2a0000]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20" />
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#D4AF37] to-[#AA8C2C]" style={{ boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.5)' }} />
            </div>
          </div>

          {/* Inner Front Cover (usually blank/cream) */}
          <div className="page flex items-center justify-center">
            <div className="w-full h-full bg-[#FDFBF7] relative border-l border-[#D4AF37]/20 shadow-inner">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/light-wool.png')]" />
            </div>
          </div>

          {/* Content Sheets */}
          {sheets && sheets.length > 0 ? (
            sheets.filter(Boolean).map((sheetUrl, idx) => (
              <React.Fragment key={`sheet-pair-${idx}`}>
                {/* Left Page of Spread */}
                <div className="page flex items-center justify-center">
                  <div className="w-full h-full relative bg-white shadow-inner overflow-hidden">
                    <img 
                      src={sheetUrl} 
                      alt={`Page ${idx * 2 + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.backgroundColor = '#f5f5f5'; }}
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Right Page of Spread */}
                <div className="page flex items-center justify-center">
                  <div className="w-full h-full relative bg-white shadow-inner overflow-hidden">
                    <img 
                      src={sheetUrl} 
                      alt={`Page ${idx * 2 + 2}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.backgroundColor = '#f5f5f5'; }}
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                  </div>
                </div>
              </React.Fragment>
            ))
          ) : (
            <div className="page flex items-center justify-center">
              <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                No sheets available
              </div>
            </div>
          )}

          {/* Inner Back Cover (usually blank/cream) */}
          <div className="page flex items-center justify-center">
            <div className="w-full h-full bg-[#FDFBF7] relative border-r border-[#D4AF37]/20 shadow-inner">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/light-wool.png')]" />
            </div>
          </div>

          {/* Back Cover */}
          <div className="page flex items-center justify-center" data-density="hard">
            <div className="w-full h-full relative bg-gradient-to-bl from-[#3d0000] via-[#5c1a1a] to-[#2a0000] shadow-inner overflow-hidden">
              {backCover ? (
                <img 
                  src={backCover} 
                  alt="Back Cover" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLImageElement).style.backgroundColor = '#3d0000'; }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-bl from-[#4a0e0e] to-[#2a0000]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-l from-black/30 via-transparent to-black/20" />
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C]" style={{ boxShadow: 'inset 3px 0 8px rgba(0,0,0,0.5)' }} />
            </div>
          </div>
        </HTMLFlipBook>
      </div>

      {/* Navigation Controls */}
      <div className="flex gap-6 items-center z-40">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prev}
          className="rounded-full w-12 h-12 border-white/30 bg-black/60 text-white hover:bg-white hover:text-primary backdrop-blur-sm shadow-lg transition-all hover:scale-110"
          data-testid="button-prev-page"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <span className="text-white text-sm font-mono bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
          Tap to flip
        </span>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={next}
          className="rounded-full w-12 h-12 border-white/30 bg-black/60 text-white hover:bg-white hover:text-primary backdrop-blur-sm shadow-lg transition-all hover:scale-110"
          data-testid="button-next-page"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
