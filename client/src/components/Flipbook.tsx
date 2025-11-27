import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface FlipbookProps {
  sheets: string[]; // 12x36 Panoramic Sheets
  frontCover: string;
  backCover: string;
}

export function Flipbook({ sheets, frontCover, backCover }: FlipbookProps) {
  const book = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const isMobile = useIsMobile();
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });

  // 12x36 Sheet = 12(H) x 36(W).
  // This sheet represents a SPREAD (Left + Right Page).
  // So the SPREAD aspect ratio is 1:3.
  // A single page is half of that: 12(H) x 18(W).
  // Aspect Ratio of Single Page = 12:18 = 2:3.
  
  // On Desktop: We show 2 pages. Total aspect 2 * (2:3) = 4:3. (Wait, 2 width units vs 3 height units).
  // Page Width = 18 units. Page Height = 12 units.
  // Wait, 12x36 is Landscape panoramic. Height 12, Width 36.
  // Split in half: Left Page is 12x18 (Height 12, Width 18). Right Page is 12x18.
  // 12:18 simplifies to 2:3 ratio.
  // So Height is 2 units, Width is 3 units? No. 
  // Height = 12, Width = 18.
  // Ratio Width/Height = 1.5. (Landscape page).
  
  // Indian Wedding albums are often Landscape 12x36.
  // So a single page is 18 inches wide x 12 inches high.
  // That's a LANDSCAPE page.
  
  useEffect(() => {
    const handleResize = () => {
      // Base calculation on available screen height/width
      const maxWidth = Math.min(window.innerWidth - 40, 1400); // Max width container
      
      if (window.innerWidth < 768) {
        // Mobile: Single Page View
        // Page Aspect Ratio: 3:2 (Width:Height) -> 1.5
        // We want to fit width.
        const width = Math.min(window.innerWidth - 20, 500);
        const height = width / 1.5; 
        setDimensions({ width, height });
      } else {
        // Desktop: Double Page View
        // Each page is width W, height H.
        // Total Flipbook Width = 2 * W.
        // We want page aspect ratio 1.5 (18/12).
        // Let's set a base Page Height.
        // e.g., Height = 500px.
        // Page Width = 500 * 1.5 = 750px.
        // Total Book Width = 1500px. (Might be too big for small screens)
        
        // Let's constrain by Max Width.
        // Available Width = maxWidth.
        // Single Page Width = maxWidth / 2.
        // Page Height = Single Page Width / 1.5.
        
        const pageW = Math.min(600, maxWidth / 2);
        const pageH = pageW / 1.5;
        
        setDimensions({ width: pageW, height: pageH });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playFlipSound = () => {
    if (isMuted) return;
    const audio = new Audio('https://www.soundjay.com/misc/sounds/page-flip-01a.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  const onFlip = () => {
    playFlipSound();
  };

  const next = () => book.current?.pageFlip().flipNext();
  const prev = () => book.current?.pageFlip().flipPrev();

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full py-8">
      {/* Book Container with shadow */}
      <div className="relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-sm bg-black/5">
        {/* @ts-ignore */}
        <HTMLFlipBook
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={300}
          maxWidth={1000}
          minHeight={200}
          maxHeight={1000}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          className="bg-transparent"
          ref={book}
          onFlip={onFlip}
          usePortrait={isMobile}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {/* Front Cover */}
          <div className="page" data-density="hard">
             <div className="w-full h-full relative overflow-hidden bg-[#3d0000] border-r-2 border-[#FFD700]">
               <img src={frontCover} alt="Front Cover" className="w-full h-full object-cover" />
               {/* Texture Overlay */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
               {/* Gold Border */}
               <div className="absolute inset-4 border-2 border-[#FFD700] opacity-80 rounded-sm" />
             </div>
          </div>

          {/* Inner Sheets - Split into Left and Right Pages */}
          {sheets.map((sheetUrl, index) => (
            <React.Fragment key={index}>
              {/* Left Page of the Sheet */}
              <div className="page bg-white">
                <div className="w-full h-full relative overflow-hidden border-r border-neutral-200">
                  {/* We simulate cropping by using object-position */}
                  <img 
                    src={sheetUrl} 
                    alt={`Sheet ${index + 1} Left`} 
                    className="w-[200%] h-full max-w-none object-cover object-left" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2 text-[10px] text-neutral-400">{index * 2 + 1}</div>
                </div>
              </div>
              
              {/* Right Page of the Sheet */}
              <div className="page bg-white">
                <div className="w-full h-full relative overflow-hidden border-l border-neutral-200">
                  <img 
                    src={sheetUrl} 
                    alt={`Sheet ${index + 1} Right`} 
                    className="w-[200%] h-full max-w-none object-cover object-right" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 right-2 text-[10px] text-neutral-400">{index * 2 + 2}</div>
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Back Cover */}
          <div className="page" data-density="hard">
             <div className="w-full h-full relative overflow-hidden bg-[#3d0000] border-l-2 border-[#FFD700]">
               <img src={backCover} alt="Back Cover" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
               <div className="absolute inset-4 border-2 border-[#FFD700] opacity-80 rounded-sm" />
             </div>
          </div>
        </HTMLFlipBook>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center gap-8">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prev}
          className="rounded-full w-12 h-12 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <span className="font-display text-primary font-bold tracking-wider text-sm uppercase">
          Flip to Explore
        </span>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={next}
          className="rounded-full w-12 h-12 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Sound Toggle */}
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-primary"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
