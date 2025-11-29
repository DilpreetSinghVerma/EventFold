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
      const w = Math.min(window.innerWidth - 40, 450);
      const h = w * 1.5;
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
    const audio = new Audio('https://www.soundjay.com/misc/sounds/page-flip-01a.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  if (!ready) return null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-8">
      {/* Volume Control */}
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
      <HTMLFlipBook
        ref={book}
        width={pageWidth}
        height={pageHeight}
        size="fixed"
        minWidth={200}
        maxWidth={600}
        minHeight={300}
        maxHeight={800}
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
        flippingTime={900}
        startZIndex={0}
        onFlip={playFlipSound}
      >
        {/* Front Cover */}
        <div key="cover-front" style={{ width: '100%', height: '100%' }}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#3d0000',
            backgroundImage: frontCover ? `url(${frontCover})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              background: 'linear-gradient(to left, #D4AF37, #AA8C2C)',
              boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.5)',
            }} />
          </div>
        </div>

        {/* Inner front cover */}
        <div key="inner-front" style={{ width: '100%', height: '100%' }}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#FDFBF7',
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/light-wool.png")',
            backgroundOpacity: 0.3,
          }} />
        </div>

        {/* All sheets */}
        {sheets && sheets.length > 0 ? sheets.map((sheetUrl, idx) => (
          <React.Fragment key={`pages-${idx}`}>
            {/* Left page */}
            <div style={{ width: '100%', height: '100%', backgroundColor: '#fff' }}>
              <img 
                src={sheetUrl} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
                alt={`Page ${idx * 2 + 1}`}
                onError={() => console.log('Image load error')}
              />
            </div>
            {/* Right page */}
            <div style={{ width: '100%', height: '100%', backgroundColor: '#fff' }}>
              <img 
                src={sheetUrl} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
                alt={`Page ${idx * 2 + 2}`}
                onError={() => console.log('Image load error')}
              />
            </div>
          </React.Fragment>
        )) : (
          <div key="no-sheets" style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span>No sheets</span>
          </div>
        )}

        {/* Inner back cover */}
        <div key="inner-back" style={{ width: '100%', height: '100%' }}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#FDFBF7',
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/light-wool.png")',
            backgroundOpacity: 0.3,
          }} />
        </div>

        {/* Back Cover */}
        <div key="cover-back" style={{ width: '100%', height: '100%' }}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#3d0000',
            backgroundImage: backCover ? `url(${backCover})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              background: 'linear-gradient(to right, #D4AF37, #AA8C2C)',
              boxShadow: 'inset 4px 0 8px rgba(0,0,0,0.5)',
            }} />
          </div>
        </div>
      </HTMLFlipBook>

      {/* Navigation */}
      <div className="flex gap-6 items-center z-40">
        <Button 
          size="icon" 
          onClick={() => { playFlipSound(); book.current?.pageFlip().flipPrev(); }}
          className="rounded-full w-12 h-12 bg-primary text-white hover:bg-primary/90 shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        <span className="text-white text-sm font-mono bg-black/60 px-4 py-2 rounded-full">Flip Pages</span>

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
