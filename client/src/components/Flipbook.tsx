import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlipbookProps {
  sheets: string[]; 
  frontCover: string;
  backCover: string;
}

export function Flipbook({ sheets, frontCover, backCover }: FlipbookProps) {
  const book = useRef<any>(null);
  const container = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [pageWidth, setPageWidth] = useState(400);
  const [pageHeight, setPageHeight] = useState(300);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      
      const maxWidth = Math.min(screenW - 60, 600);
      const maxHeight = Math.min(screenH - 250, 350);
      
      let w = maxWidth;
      let h = w * 0.6;
      
      if (h > maxHeight) {
        h = maxHeight;
        w = h / 0.6;
      }
      
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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 1));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleMouseWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!ready) return null;

  // Build pages array
  const pages = [];
  
  pages.push({
    type: 'cover',
    image: frontCover,
    key: 'cover-front',
  });

  pages.push({
    type: 'inner',
    key: 'inner-front',
  });

  // Each 12x36 sheet is split into two 12x18 pages
  if (sheets && sheets.length > 0) {
    sheets.forEach((sheet, idx) => {
      // Left page (12x18) - shows left half of panoramic image
      pages.push({
        type: 'sheet',
        image: sheet,
        position: 'left',
        key: `sheet-${idx}-left`,
      });
      
      // Right page (12x18) - shows right half of panoramic image
      pages.push({
        type: 'sheet',
        image: sheet,
        position: 'right',
        key: `sheet-${idx}-right`,
      });
    });
  } else {
    pages.push({
      type: 'empty',
      key: 'no-sheets',
    });
  }

  pages.push({
    type: 'inner',
    key: 'inner-back',
  });

  pages.push({
    type: 'cover',
    image: backCover,
    key: 'cover-back',
  });

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <div className="flex gap-2 bg-black/60 backdrop-blur-md rounded-full p-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomOut}
            className="rounded-full w-9 h-9 text-white hover:bg-white/20"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="flex items-center px-2 text-white text-xs font-mono">
            {Math.round(zoom * 100)}%
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomIn}
            className="rounded-full w-9 h-9 text-white hover:bg-white/20"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-white/20" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomReset}
            className="rounded-full w-9 h-9 text-white hover:bg-white/20"
            title="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMuted(!isMuted)} 
          className="rounded-full bg-black/40 text-white hover:bg-white/20"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Flipbook Container */}
      <div 
        ref={container}
        onWheel={handleMouseWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          perspective: '2500px',
          perspectiveOrigin: 'center center',
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px) rotateX(0deg) rotateY(0deg)`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            transformStyle: 'preserve-3d' as any,
            filter: 'drop-shadow(0 50px 100px rgba(0, 0, 0, 0.6)) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))',
          }}
        >
          <HTMLFlipBook
            ref={book}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            minWidth={300}
            maxWidth={1000}
            minHeight={200}
            maxHeight={800}
            maxShadowOpacity={0.1}
            showCover={true}
            mobileScrollSupport={false}
            usePortrait={false}
            autoSize={false}
            clickEventForward={false}
            useMouseEvents={true}
            swipeDistance={50}
            showPageCorners={false}
            disableFlipByClick={false}
            startPage={0}
            drawShadow={false}
            flippingTime={800}
            startZIndex={0}
            onFlip={playFlipSound}
            className="shadow-2xl"
            style={{ 
              margin: '0 auto',
              transformStyle: 'preserve-3d' as any,
              boxShadow: `
                0 0 40px rgba(0, 0, 0, 0.4),
                0 20px 60px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                inset 0 -1px 0 rgba(0, 0, 0, 0.5)
              `,
            }}
          >
            {pages.map((page: any) => {
              if (page.type === 'cover') {
                return (
                  <div key={page.key} className="page" style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#3d0000',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                  <div key={page.key} className="page" style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#FDFBF7',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                  <div key={page.key} className="page" style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f0f0f0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: `url(${page.image})`,
                    backgroundSize: '200% 100%',
                    backgroundPosition: page.position === 'left' ? '0% center' : '100% center',
                    backgroundRepeat: 'no-repeat',
                  }}>
                  </div>
                );
              }

              return (
                <div key={page.key} className="page" style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f0f0f0',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ color: '#999' }}>No sheets</span>
                </div>
              );
            })}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex gap-6 items-center z-40">
        <Button 
          size="icon" 
          onClick={() => { playFlipSound(); book.current?.pageFlip().flipPrev(); }}
          className="rounded-full w-12 h-12 bg-primary text-white hover:bg-primary/90 shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        <span className="text-white text-sm font-mono bg-black/60 px-4 py-2 rounded-full">Flip • Scroll to zoom • Drag to pan</span>

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
