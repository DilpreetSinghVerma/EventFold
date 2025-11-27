import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
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
      
      // Mobile-first responsive design
      const isPortrait = screenH > screenW;
      const isMobileScreen = screenW < 768;

      if (isMobileScreen) {
        // Mobile: Show single-page or very compact spread
        if (isPortrait) {
          // Portrait mobile: single page fitted to screen
          const width = Math.min(screenW - 30, 400);
          const height = width / 0.66; // Taller aspect for mobile
          setDimensions({ width, height });
        } else {
          // Landscape mobile: full spread but compact
          const totalW = screenW - 30;
          const totalH = Math.min(screenH - 180, totalW / 2.5);
          const pageW = totalW / 2;
          setDimensions({ width: pageW, height: totalH });
        }
      } else {
        // Desktop / Tablet: Double Page Spread View
        // Total Aspect Ratio: 36/12 = 3.0
        let totalW = Math.min(screenW - 60, 1200);
        let totalH = totalW / 2.8;
        
        if (totalH > screenH - 200) {
          totalH = screenH - 200;
          totalW = totalH * 2.8;
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
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  const next = () => book.current?.pageFlip().flipNext();
  const prev = () => book.current?.pageFlip().flipPrev();

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* Controls Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-xl">
         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/20">
           <ZoomOut className="w-4 h-4" />
         </Button>
         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/20">
           <Maximize className="w-4 h-4" />
         </Button>
         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/20">
           <ZoomIn className="w-4 h-4" />
         </Button>
         <div className="w-px h-4 bg-white/20 my-auto mx-1" />
         <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="h-8 w-8 rounded-full text-white hover:bg-white/20">
           {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
         </Button>
      </div>

      {/* Book Flip Viewer */}
      <div className="relative w-full h-full flex items-center justify-center">
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
                     mobileScrollSupport={false}
                     className="bg-transparent"
                     ref={book}
                     onFlip={playFlipSound}
                     usePortrait={false}
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
                     {sheets && sheets.length > 0 ? (
                       sheets.map((sheetUrl, index) => (
                         <React.Fragment key={index}>
                           {/* Left Page */}
                           <div className="page bg-white border-r border-neutral-200">
                             <div className="w-full h-full relative overflow-hidden bg-neutral-50">
                               {sheetUrl ? (
                                 <img 
                                   src={sheetUrl} 
                                   alt={`Sheet ${index + 1} Left`} 
                                   className="absolute inset-0 w-full h-full object-cover" 
                                   style={{ objectPosition: '0% 50%' }}
                                   onError={(e) => { console.error("Image failed to load:", sheetUrl); }}
                                 />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-neutral-400">No image</div>
                               )}
                               {/* Inner Shadow for Gutter */}
                               <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
                             </div>
                           </div>
                           
                           {/* Right Page */}
                           <div className="page bg-white border-l border-neutral-200">
                             <div className="w-full h-full relative overflow-hidden bg-neutral-50">
                               {sheetUrl ? (
                                 <img 
                                   src={sheetUrl} 
                                   alt={`Sheet ${index + 1} Right`} 
                                   className="absolute inset-0 w-full h-full object-cover" 
                                   style={{ objectPosition: '100% 50%' }}
                                   onError={(e) => { console.error("Image failed to load:", sheetUrl); }}
                                 />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-neutral-400">No image</div>
                               )}
                               {/* Inner Shadow for Gutter */}
                               <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                             </div>
                           </div>
                         </React.Fragment>
                       ))
                     ) : (
                       <div className="page bg-white"><div className="w-full h-full flex items-center justify-center text-neutral-400">No sheets</div></div>
                     )}

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
         </div>

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
