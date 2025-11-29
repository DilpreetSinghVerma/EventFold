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
  const [pageWidth, setPageWidth] = useState(280);
  const [pageHeight, setPageHeight] = useState(420);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const w = Math.min(window.innerWidth - 40, 500);
      const h = w * 1.4;
      setPageWidth(w);
      setPageHeight(h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    setReady(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playFlipSound = () => {
    if (isMuted) return;
    try {
      const audio = new Audio('https://www.soundjay.com/misc/sounds/page-flip-01a.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  if (!ready) return null;

  // Build pages array
  const pages = [];
  
  // Front cover
  pages.push({
    type: 'cover',
    image: frontCover,
    key: 'cover-front',
  });

  // Inner front
  pages.push({
    type: 'inner',
    key: 'inner-front',
  });

  // Sheets
  if (sheets && sheets.length > 0) {
    sheets.forEach((sheet, idx) => {
      pages.push({
        type: 'sheet',
        image: sheet,
        key: `sheet-${idx}`,
      });
    });
  } else {
    pages.push({
      type: 'empty',
      key: 'no-sheets',
    });
  }

  // Inner back
  pages.push({
    type: 'inner',
    key: 'inner-back',
  });

  // Back cover
  pages.push({
    type: 'cover',
    image: backCover,
    key: 'cover-back',
  });

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
      {/* Volume */}
      <div className="absolute top-4 right-4 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMuted(!isMuted)} 
          className="rounded-full bg-black/40 text-white hover:bg-white/20"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Flipbook */}
      <div style={{ perspective: '1500px' }}>
        <HTMLFlipBook
          ref={book}
          width={pageWidth}
          height={pageHeight}
          size="fixed"
          minWidth={200}
          maxWidth={700}
          minHeight={250}
          maxHeight={900}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={false}
          usePortrait={false}
          autoSize={false}
          clickEventForward={false}
          useMouseEvents={true}
          swipeDistance={50}
          showPageCorners={true}
          disableFlipByClick={false}
          startPage={0}
          drawShadow={true}
          flippingTime={800}
          startZIndex={0}
          onFlip={playFlipSound}
          className="shadow-2xl"
          style={{ margin: '0 auto' }}
        >
          {pages.map((page) => {
            if (page.type === 'cover') {
              return (
                <div key={page.key} className="page flex items-center justify-center" style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#3d0000',
                  overflow: 'hidden',
                }}>
                  {page.image ? (
                    <img 
                      src={page.image} 
                      alt="Cover"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#3d0000' }} />
                  )}
                </div>
              );
            }

            if (page.type === 'inner') {
              return (
                <div key={page.key} className="page flex items-center justify-center" style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#FDFBF7',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#FDFBF7',
                  }} />
                </div>
              );
            }

            if (page.type === 'sheet') {
              return (
                <div key={page.key} className="page flex items-center justify-center" style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f0f0f0',
                  overflow: 'hidden',
                }}>
                  <img 
                    src={page.image} 
                    alt="Sheet"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              );
            }

            return (
              <div key={page.key} className="page flex items-center justify-center" style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f0f0f0',
                overflow: 'hidden',
              }}>
                <span style={{ color: '#999' }}>No sheets</span>
              </div>
            );
          })}
        </HTMLFlipBook>
      </div>

      {/* Controls */}
      <div className="flex gap-6 items-center z-40">
        <Button 
          size="icon" 
          onClick={() => { playFlipSound(); book.current?.pageFlip().flipPrev(); }}
          className="rounded-full w-12 h-12 bg-primary text-white hover:bg-primary/90 shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        <span className="text-white text-sm font-mono bg-black/60 px-4 py-2 rounded-full">Flip to browse</span>

        <Button 
          size="icon" 
          onClick={() => { playFlipSound(); book.current?.pageFlip().flipNext(); }}
          className="rounded-full w-12 h-12 bg-primary text-white hover:bg-primary/90 shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
