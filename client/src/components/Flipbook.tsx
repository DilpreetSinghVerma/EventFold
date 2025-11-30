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
  const [pageHeight, setPageHeight] = useState(600);
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
      
      const maxHeight = Math.min(screenH - 120, 600);
      const maxWidth = Math.min((screenW - 40) / 2, 450);
      
      let h = maxHeight;
      let w = h * (2/3); // Aspect ratio for a SINGLE page (half a sheet)
      
      if (w > maxWidth) {
        w = maxWidth;
        h = w / (2/3);
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

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 1));
  const handleZoomReset = () => { setZoom(1); setPanX(0); setPanY(0); };

  const handleMouseWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
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

  const handleMouseUp = () => setIsDragging(false);

  if (!ready) return null;

  // --- BUILD PAGES ---
  const pages = [];
  
  // 1. Front Cover (Right)
  pages.push({ type: 'cover', image: frontCover, key: 'cover-front' });
  
  // 2. Inner Front (Left)
  pages.push({ type: 'inner', key: 'inner-front' });

  // 3. Title Page (Right) - THIS FIXES THE GLITCH
  // We need this filler page so the first spread starts on the Left side
  pages.push({ type: 'title', key: 'title-page' });

  // 4. The Spreads
  if (sheets && sheets.length > 0) {
    sheets.forEach((sheet, idx) => {
      // Left Page
      pages.push({ type: 'spread-left', image: sheet, key: `sheet-${idx}-left` });
      // Right Page
      pages.push({ type: 'spread-right', image: sheet, key: `sheet-${idx}-right` });
    });
  } else {
    pages.push({ type: 'empty', key: 'empty-1' });
    pages.push({ type: 'empty', key: 'empty-2' });
  }

  // 5. Back Cover
  pages.push({ type: 'inner', key: 'inner-back' });
  pages.push({ type: 'cover', image: backCover, key: 'cover-back' });

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-[#1a1a1a] overflow-hidden">
      
      {/* Controls Bar */}
      <div className="absolute top-4 z-50 flex gap-2 bg-black/60 backdrop-blur-md rounded-full p-2 border border-white/10">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-white/20 rounded-full w-8 h-8"><ZoomOut className="w-4 h-4" /></Button>
          <div className="flex items-center px-2 text-white text-xs font-mono">{Math.round(zoom * 100)}%</div>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-white/20 rounded-full w-8 h-8"><ZoomIn className="w-4 h-4" /></Button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <Button variant="ghost" size="icon" onClick={handleZoomReset} className="text-white hover:bg-white/20 rounded-full w-8 h-8"><RotateCcw className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-white hover:bg-white/20 rounded-full w-8 h-8">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
      </div>

      {/* Book Container */}
      <div 
        ref={container}
        onWheel={handleMouseWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex items-center justify-center w-full h-full"
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <div style={{
            transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            transformStyle: 'preserve-3d' as any,
        }}>
          <HTMLFlipBook
            ref={book}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            minWidth={200}
            maxWidth={800}
            minHeight={300}
            maxHeight={1000}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={false}
            className="shadow-2xl"
            startPage={0}
            drawShadow={true}
            flippingTime={1000}
            usePortrait={false}
            startZIndex={0}
            autoSize={true}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={false}
            disableFlipByClick={false}
            onFlip={playFlipSound}
          >
            {pages.map((page: any) => {
              // Standard styling
              const baseStyle: React.CSSProperties = { 
                width: '100%', 
                height: '100%', 
                overflow: 'hidden', 
                backgroundColor: '#fff', 
                position: 'relative' 
              };
              
              if (page.type === 'cover') {
                if (!page.image) {
                  return <div key={page.key} className="page" style={{ ...baseStyle, backgroundColor: '#fdfbf7' }} />;
                }
                return <div key={page.key} className="page" style={baseStyle}><img src={page.image} alt="cover" className="w-full h-full object-cover" /></div>;
              }

              // TITLE PAGE (The Fix)
              if (page.type === 'title') {
                return (
                    <div key={page.key} className="page" style={{ ...baseStyle, backgroundColor: '#fdfbf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <div className="text-gray-400 font-serif italic">Wedding Album</div>
                    </div>
                );
              }

              if (page.type === 'spread-left') {
                return (
                  <div key={page.key} className="page" style={{ ...baseStyle }}>
                    {/* Shadow on right edge to create spine effect */}
                    <div className="absolute top-0 right-0 w-8 h-full z-10" 
                         style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.2), transparent)' }} />
                    
                    <div style={{ width: '200%', height: '100%', position: 'absolute', left: 0, top: 0 }}>
                        <img src={page.image} className="w-full h-full object-cover" style={{ objectPosition: 'left center' }} alt="left-spread" />
                    </div>
                  </div>
                );
              }
              
              if (page.type === 'spread-right') {
                return (
                  <div key={page.key} className="page" style={baseStyle}>
                    {/* Shadow on left edge to create spine effect */}
                    <div className="absolute top-0 left-0 w-8 h-full z-10" 
                         style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)' }} />

                    <div style={{ width: '200%', height: '100%', position: 'absolute', left: '-100%', top: 0 }}>
                          <img src={page.image} className="w-full h-full object-cover" style={{ objectPosition: 'right center' }} alt="right-spread" />
                    </div>
                  </div>
                );
              }

              return <div key={page.key} className="page" style={{ ...baseStyle, backgroundColor: '#fdfbf7' }} />;
            })}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute bottom-6 z-40 flex gap-8">
        <Button onClick={() => { playFlipSound(); book.current?.pageFlip().flipPrev(); }} className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 p-0"><ChevronLeft /></Button>
        <Button onClick={() => { playFlipSound(); book.current?.pageFlip().flipNext(); }} className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 p-0"><ChevronRight /></Button>
      </div>
    </div>
  );
}
