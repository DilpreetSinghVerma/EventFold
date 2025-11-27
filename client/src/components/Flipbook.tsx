import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FlipbookProps {
  pages: string[];
  cover?: string;
}

export function Flipbook({ pages, cover }: FlipbookProps) {
  // currentPage represents the index of the page displayed on the RIGHT side.
  // 0 means cover is closed (or front cover).
  // If pages array is [p1, p2, p3, p4]
  // Index 0: Front Cover (Right side)
  // Index 1: Inside Front Cover (Left) | Page 1 (Right) -> but simpler:
  // Let's map pages linearly.
  // -1: Closed Front Cover (Viewable)
  // 0: Page 1 (Left), Page 2 (Right)
  
  // Simplified model for prototype:
  // Single Page View on Mobile
  // Double Page View on Desktop
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // We'll treat 'pages' as just the inner content. 
  // Cover is handled separately or as index -1.
  
  const totalPages = pages.length;
  
  const goNext = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // 3D Flip Effect logic is complex to get perfect in a quick prototype without a library.
  // We will use a high-quality "stack" transition or a simplified 3D flip using AnimatePresence.
  
  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[3/2] perspective-1000 select-none">
      {/* Book Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Pages Container */}
        <div className="relative w-[90%] h-[90%] bg-white shadow-2xl rounded-r-md border-l-4 border-l-neutral-200 flex overflow-hidden">
            {/* Left Page (Previous) */}
            <div className="w-1/2 h-full bg-neutral-50 relative overflow-hidden border-r border-neutral-100 hidden md:block">
               {currentIndex > 0 && (
                 <img 
                   src={pages[currentIndex - 1]} 
                   alt={`Page ${currentIndex}`}
                   className="w-full h-full object-cover opacity-90"
                 />
               )}
               {/* Paper shadow gradient */}
               <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
               
               {/* Page Number */}
               {currentIndex > 0 && (
                 <span className="absolute bottom-4 left-4 text-neutral-400 text-xs font-mono">
                   {currentIndex}
                 </span>
               )}
            </div>

            {/* Right Page (Current) */}
            <div className="w-full md:w-1/2 h-full bg-white relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, rotateY: -15 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full h-full origin-left"
                >
                   {currentIndex < totalPages ? (
                     <img 
                       src={pages[currentIndex]} 
                       alt={`Page ${currentIndex + 1}`}
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400">
                       <span className="font-display italic">End of Album</span>
                     </div>
                   )}
                   {/* Paper shadow gradient */}
                   <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/5 pointer-events-none" />
                   
                   {/* Page Number */}
                   {currentIndex < totalPages && (
                     <span className="absolute bottom-4 right-4 text-neutral-400 text-xs font-mono">
                       {currentIndex + 1}
                     </span>
                   )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Center Spine Highlight */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-black/10 to-transparent hidden md:block" />
        </div>

        {/* Controls */}
        <div className="absolute inset-y-0 -left-12 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goPrev} 
            disabled={currentIndex === 0}
            className="rounded-full hover:bg-white/50 hover:text-primary"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        </div>
        <div className="absolute inset-y-0 -right-12 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goNext} 
            disabled={currentIndex >= totalPages}
            className="rounded-full hover:bg-white/50 hover:text-primary"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Hint */}
      <div className="md:hidden absolute -bottom-8 left-0 right-0 text-center text-xs text-neutral-400">
        Swipe or tap arrows to flip
      </div>
    </div>
  );
}
