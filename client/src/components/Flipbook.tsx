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
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      
      const isPortrait = screenH > screenW;
      const isMobileScreen = screenW < 768;

      if (isMobileScreen) {
        if (isPortrait) {
          const width = Math.min(screenW - 30, 380);
          const height = width * 0.65;
          setDimensions({ width, height });
        } else {
          const totalW = screenW - 40;
          const totalH = Math.min(screenH - 160, totalW * 0.55);
          const pageW = totalW / 2;
          setDimensions({ width: pageW, height: totalH });
        }
      } else {
        let totalW = Math.min(screenW - 80, 1000);
        let totalH = totalW * 0.6;
        
        if (totalH > screenH - 180) {
          totalH = screenH - 180;
          totalW = totalH / 0.6;
        }
        
        const pageW = totalW / 2;
        setDimensions({ width: pageW, height: totalH });
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
    book.current?.pageFlip().flipNext();
    playFlipSound();
  };

  const prev = () => {
    book.current?.pageFlip().flipPrev();
    playFlipSound();
  };

  // Calculate total pages: front cover + back cover + (sheets * 2 pages each)
  const totalPages = 2 + (sheets?.filter(Boolean).length || 0) * 2;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Sound Control */}
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

      {/* Book Container with 3D Effects */}
      <div 
        className="relative"
        style={{
          perspective: '1500px',
          transformStyle: 'preserve-3d' as any,
        }}
      >
        {/* Outer Book Shadow */}
        <div 
          className="absolute inset-0 rounded-lg shadow-2xl"
          style={{
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.8), inset -2px 0 10px rgba(0, 0, 0, 0.3)',
            transform: 'translateZ(-20px)',
          }}
        />

        {/* Flipbook */}
        <div
          style={{
            transformStyle: 'preserve-3d' as any,
            transform: 'rotateX(0deg)',
          }}
        >
          <HTMLFlipBook
            ref={book}
            width={dimensions.width}
            height={dimensions.height}
            size="fixed"
            minWidth={150}
            maxWidth={1200}
            minHeight={100}
            maxHeight={1000}
            maxShadowOpacity={0.6}
            showCover={true}
            mobileScrollSupport={false}
            usePortrait={false}
            autoSize={false}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={50}
            showPageCorners={true}
            disableFlipByClick={false}
            onFlip={playFlipSound}
            style={{ 
              margin: '0 auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
            className="bg-white"
          >
            {/* Front Cover - Closed Book View */}
            <div className="page" data-density="hard">
              <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#3d0000] via-[#5c1a1a] to-[#2a0000]">
                {frontCover && (
                  <img 
                    src={frontCover} 
                    alt="Front Cover" 
                    className="w-full h-full object-cover" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />
                {/* Gold Spine Edge */}
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-[#D4AF37] via-[#D4AF37] to-[#AA8C2C]" />
                {/* 3D Depth Effect */}
                <div className="absolute inset-0 shadow-inset" style={{
                  boxShadow: 'inset 20px 0 40px rgba(0,0,0,0.5)'
                }} />
              </div>
            </div>

            {/* Inner Back of Front Cover */}
            <div className="page" data-density="hard">
              <div className="w-full h-full bg-[#FDFBF7] relative overflow-hidden border-l-2 border-[#D4AF37]/30">
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/gold-seamless.png')]" />
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 to-transparent" />
              </div>
            </div>

            {/* Content Sheets */}
            {sheets && sheets.length > 0 ? (
              sheets.map((sheetUrl, index) => (
                <React.Fragment key={`sheet-${index}`}>
                  {/* Left Page */}
                  <div className="page">
                    <div className="w-full h-full relative overflow-hidden bg-white">
                      {sheetUrl ? (
                        <>
                          <img 
                            src={sheetUrl} 
                            alt={`Sheet ${index + 1} Left`}
                            className="w-full h-full object-cover"
                            style={{ 
                              objectPosition: '0% 50%',
                              transform: 'scaleX(1)',
                            }}
                            onError={(e) => {
                              console.error("Failed to load image:", sheetUrl);
                              (e.target as HTMLImageElement).style.backgroundColor = '#f0f0f0';
                            }}
                          />
                          {/* Inner Shadow */}
                          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/15 to-transparent pointer-events-none" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400">
                          Loading...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Page */}
                  <div className="page">
                    <div className="w-full h-full relative overflow-hidden bg-white">
                      {sheetUrl ? (
                        <>
                          <img 
                            src={sheetUrl} 
                            alt={`Sheet ${index + 1} Right`}
                            className="w-full h-full object-cover"
                            style={{ 
                              objectPosition: '100% 50%',
                              transform: 'scaleX(1)',
                            }}
                            onError={(e) => {
                              console.error("Failed to load image:", sheetUrl);
                              (e.target as HTMLImageElement).style.backgroundColor = '#f0f0f0';
                            }}
                          />
                          {/* Inner Shadow */}
                          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400">
                          Loading...
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))
            ) : (
              <div className="page">
                <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-neutral-400">
                  No sheets
                </div>
              </div>
            )}

            {/* Inner Back of Back Cover */}
            <div className="page" data-density="hard">
              <div className="w-full h-full bg-[#FDFBF7] relative overflow-hidden border-r-2 border-[#D4AF37]/30">
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/gold-seamless.png')]" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/10 to-transparent" />
              </div>
            </div>

            {/* Back Cover - Closed Book View */}
            <div className="page" data-density="hard">
              <div className="w-full h-full relative overflow-hidden bg-gradient-to-bl from-[#3d0000] via-[#5c1a1a] to-[#2a0000]">
                {backCover && (
                  <img 
                    src={backCover} 
                    alt="Back Cover" 
                    className="w-full h-full object-cover" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-black/30" />
                {/* Gold Spine Edge */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#AA8C2C]" />
                {/* 3D Depth Effect */}
                <div className="absolute inset-0" style={{
                  boxShadow: 'inset -20px 0 40px rgba(0,0,0,0.5)'
                }} />
              </div>
            </div>
          </HTMLFlipBook>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute bottom-6 flex gap-8 z-40">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prev}
          className="rounded-full w-12 h-12 border-white/30 bg-black/50 text-white hover:bg-white hover:text-primary backdrop-blur-sm shadow-lg transition-all hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={next}
          className="rounded-full w-12 h-12 border-white/30 bg-black/50 text-white hover:bg-white hover:text-primary backdrop-blur-sm shadow-lg transition-all hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Page Counter */}
      <div className="absolute bottom-6 left-6 text-white text-sm font-mono bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
        {totalPages > 0 ? `Tap to flip` : 'Loading...'}
      </div>
    </div>
  );
}
