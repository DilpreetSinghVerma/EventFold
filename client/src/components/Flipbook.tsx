import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface FlipbookProps {
  pages: string[];
  cover?: string;
}

export function Flipbook({ pages, cover }: FlipbookProps) {
  const book = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const isMobile = useIsMobile();
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });

  // Adjust dimensions based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Mobile: Single page view, almost full width
        const width = Math.min(window.innerWidth - 40, 400);
        setDimensions({ width: width, height: width * 1.4 });
      } else {
        // Desktop: Double page view
        setDimensions({ width: 450, height: 600 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playFlipSound = () => {
    if (isMuted) return;
    // Using a publicly available sound effect URL
    const audio = new Audio('https://www.soundjay.com/misc/sounds/page-flip-01a.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play failed (interaction needed first)", e));
  };

  const onFlip = (e: any) => {
    playFlipSound();
  };

  const next = () => {
    book.current?.pageFlip().flipNext();
  };

  const prev = () => {
    book.current?.pageFlip().flipPrev();
  };

  // Combine cover and pages
  // HTMLFlipBook treats each child as a page.
  // Index 0 = Cover
  // Index 1 = Inside Cover (Left)
  // Index 2 = Page 1 (Right)
  // ...
  
  const allPages = [cover, ...pages];

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <div className="relative shadow-2xl rounded-sm">
        {/* @ts-ignore - react-pageflip types are sometimes tricky */}
        <HTMLFlipBook
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
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
          {/* Cover Page */}
          <div className="page page-cover" data-density="hard">
            <div className="w-full h-full overflow-hidden bg-neutral-100 border-r border-neutral-300">
               <img 
                 src={cover} 
                 alt="Cover" 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Inner Pages */}
          {pages.map((pageUrl, index) => (
            <div key={index} className="page bg-white">
              <div className="w-full h-full relative overflow-hidden border-l border-neutral-100">
                <img 
                  src={pageUrl} 
                  alt={`Page ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                
                {/* Shadow/Depth overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none" />
                
                {/* Page Number */}
                <div className="absolute bottom-4 right-4 text-xs text-neutral-400 font-mono">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
          
          {/* Back Cover */}
          <div className="page page-cover" data-density="hard">
            <div className="w-full h-full bg-[#FDFBF7] flex items-center justify-center border-l border-neutral-200">
              <div className="text-center opacity-50">
                <span className="font-display italic text-xl">The End</span>
                <div className="mt-2 w-8 h-px bg-neutral-400 mx-auto" />
              </div>
            </div>
          </div>
        </HTMLFlipBook>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center gap-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={prev}
          className="rounded-full hover:bg-white hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <div className="text-sm text-neutral-500 font-medium">
          Flip or Swipe
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={next}
          className="rounded-full hover:bg-white hover:text-primary transition-colors"
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
          className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-neutral-400" /> : <Volume2 className="w-5 h-5 text-primary" />}
        </Button>
      </div>
    </div>
  );
}
