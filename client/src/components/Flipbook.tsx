import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
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
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [scale, setScale] = useState(1);

  // Indian Wedding Album: 12x36 Sheet (Open Spread).
  // Split into two 12x18 pages.
  // Aspect Ratio of one page = 18(W) / 12(H) = 1.5.
  
  useEffect(() => {
    const handleResize = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      
      // We prioritize showing the SPREAD (Double Page) whenever possible.
      // Only use single page on very narrow portrait phones.
      const isPortrait = screenH > screenW;
      const isVerySmall = screenW < 600;

      if (isPortrait && isVerySmall) {
        // Mobile Portrait: Single Page View
        // Page Aspect: 1.5 (Landscape page)
        // We fit width.
        const width = Math.min(screenW - 20, 500);
        const height = width / 1.5; 
        setDimensions({ width, height });
      } else {
        // Desktop / Landscape Tablet: Double Page View
        // We want to show the full 12x36 spread.
        // Total Aspect Ratio: 36/12 = 3.0.
        // Available Width constraint: screenW - 40.
        // Available Height constraint: screenH - 100.
        
        let totalW = Math.min(screenW - 40, 1600);
        let totalH = totalW / 3; // Maintain 1:3 ratio for the spread
        
        // Check height constraint
        if (totalH > (screenH - 150)) {
           totalH = screenH - 150;
           totalW = totalH * 3;
        }
        
        // Single Page dimensions
        const pageW = totalW / 2;
        const pageH = totalH;
        
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

  const next = () => book.current?.pageFlip().flipNext();
  const prev = () => book.current?.pageFlip().flipPrev();

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* Zoom Wrapper */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Controls Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-xl">
               <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="h-8 w-8 rounded-full text-white hover:bg-white/20">
                 <ZoomOut className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="icon" onClick={() => resetTransform()} className="h-8 w-8 rounded-full text-white hover:bg-white/20">
                 <Maximize className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="h-8 w-8 rounded-full text-white hover:bg-white/20">
                 <ZoomIn className="w-4 h-4" />
               </Button>
               <div className="w-px h-4 bg-white/20 my-auto mx-1" />
               <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="h-8 w-8 rounded-full text-white hover:bg-white/20">
                 {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
               </Button>
            </div>

            <TransformComponent
              wrapperClass="!w-full !h-full flex items-center justify-center"
              contentClass="flex items-center justify-center"
            >
               <div className="relative py-10 px-4 perspective-[2000px]">
                 {/* The Album Book Effect */}
                 <div className="relative transition-transform duration-500 ease-out transform-style-3d shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                   
                   {/* @ts-ignore */}
                   <HTMLFlipBook
                     width={dimensions.width}
                     height={dimensions.height}
                     size="fixed"
                     minWidth={200}
                     maxWidth={1000}
                     minHeight={133}
                     maxHeight={1000}
                     maxShadowOpacity={0.5}
                     showCover={true}
                     mobileScrollSupport={true}
                     className="bg-transparent"
                     ref={book}
                     onFlip={playFlipSound}
                     usePortrait={dimensions.width < 400} // Only use portrait mode if pages are very small
                     startZIndex={0}
                     autoSize={true}
                     clickEventForward={true}
                     useMouseEvents={true}
                     swipeDistance={30}
                     showPageCorners={true}
                     disableFlipByClick={false}
                     style={{ margin: '0 auto' }}
                   >
                     {/* Front Cover */}
                     <div className="page" data-density="hard">
                        <div className="w-full h-full relative overflow-hidden bg-[#3d0000] border-r-4 border-[#D4AF37] shadow-inner">
                          <img src={frontCover} alt="Front Cover" className="w-full h-full object-cover opacity-95" />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                          {/* Gold Spine Effect */}
                          <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-[#D4AF37] to-[#AA8C2C]" />
                        </div>
                     </div>

                     {/* Inner Sheets */}
                     {sheets.map((sheetUrl, index) => (
                       <React.Fragment key={index}>
                         {/* Left Page */}
                         <div className="page bg-white border-r border-neutral-200">
                           <div className="w-full h-full relative overflow-hidden">
                             <img 
                               src={sheetUrl} 
                               alt={`Sheet ${index + 1} Left`} 
                               className="w-[200%] h-full max-w-none object-cover object-left" 
                             />
                             {/* Inner Shadow for Gutter */}
                             <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
                           </div>
                         </div>
                         
                         {/* Right Page */}
                         <div className="page bg-white border-l border-neutral-200">
                           <div className="w-full h-full relative overflow-hidden">
                             <img 
                               src={sheetUrl} 
                               alt={`Sheet ${index + 1} Right`} 
                               className="w-[200%] h-full max-w-none object-cover object-right" 
                             />
                             {/* Inner Shadow for Gutter */}
                             <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                           </div>
                         </div>
                       </React.Fragment>
                     ))}

                     {/* Back Cover */}
                     <div className="page" data-density="hard">
                        <div className="w-full h-full relative overflow-hidden bg-[#3d0000] border-l-4 border-[#D4AF37] shadow-inner">
                          <img src={backCover} alt="Back Cover" className="w-full h-full object-cover opacity-95" />
                          <div className="absolute inset-0 bg-gradient-to-l from-black/30 to-transparent" />
                          {/* Gold Spine Effect */}
                          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C]" />
                        </div>
                     </div>
                   </HTMLFlipBook>
                 </div>
               </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Navigation Arrows (Outside Zoom) */}
      <div className="absolute bottom-8 flex gap-12 z-40 pointer-events-none">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prev}
          className="rounded-full w-14 h-14 border-white/20 bg-black/50 text-white hover:bg-white hover:text-primary backdrop-blur-sm pointer-events-auto shadow-lg"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={next}
          className="rounded-full w-14 h-14 border-white/20 bg-black/50 text-white hover:bg-white hover:text-primary backdrop-blur-sm pointer-events-auto shadow-lg"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
