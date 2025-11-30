import { useParams, Link, useLocation } from 'wouter';
import { useAlbumStore, ImageStorage } from '@/lib/store';
import { Flipbook } from '@/components/Flipbook';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Home, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Viewer() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { getAlbum } = useAlbumStore();
  const album = getAlbum(id || '');
  
  // Check if this is a shared view from QR code
  const isShared = new URLSearchParams(window.location.search).get('shared') === 'true';
  
  const [loadedSheets, setLoadedSheets] = useState<string[]>([]);
  const [loadedFrontCover, setLoadedFrontCover] = useState<string>('');
  const [loadedBackCover, setLoadedBackCover] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      if (!album) return;
      
      try {
        // Check if images are URLs (mock data) or IDs (real data)
        // URLs usually start with http, /, or data:
        const isMockFront = album.frontCover.startsWith('http') || album.frontCover.startsWith('/') || album.frontCover.startsWith('data:');
        const isMockBack = album.backCover.startsWith('http') || album.backCover.startsWith('/') || album.backCover.startsWith('data:');
        
        if (isMockFront) {
          setLoadedFrontCover(album.frontCover);
        } else {
          const front = await ImageStorage.load(album.frontCover);
          setLoadedFrontCover(front || album.frontCover);
        }
        
        if (isMockBack) {
          setLoadedBackCover(album.backCover);
        } else {
          const back = await ImageStorage.load(album.backCover);
          setLoadedBackCover(back || album.backCover);
        }
        
        // Load sheets
        const loadedSheetData = await Promise.all(
          album.sheets.map(async (sheet) => {
            const isMockSheet = sheet.startsWith('http') || sheet.startsWith('/') || sheet.startsWith('data:');
            if (isMockSheet) return sheet;
            const loaded = await ImageStorage.load(sheet);
            return loaded || sheet;
          })
        );
        setLoadedSheets(loadedSheetData.filter(Boolean) as string[]);
      } catch (e) {
        console.error("Failed to load images", e);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [album]);

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center">
          <h2 className="text-2xl font-display mb-4">Album not found</h2>
          <Link href="/dashboard">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="font-display">Loading High-Res Images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none" />
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {isShared ? (
            <div>
              <h1 className="font-display font-bold text-lg text-white tracking-widest">{album.title}</h1>
            </div>
          ) : (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="rounded-full text-white hover:bg-white/10 hover:text-primary flex gap-2 items-center pl-2 pr-4">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Back to Menu</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/20 mx-2 hidden sm:block"></div>
              <div>
                <h1 className="font-display font-bold text-lg text-white tracking-widest">{album.title}</h1>
              </div>
            </>
          )}
        </div>
        
        <div className="flex gap-3">
           {!isShared && (
             <Link href="/dashboard">
               <Button variant="outline" size="sm" className="rounded-full border-white/20 text-white hover:bg-white hover:text-neutral-900 bg-transparent sm:hidden">
                 <Home className="w-4 h-4" />
               </Button>
             </Link>
           )}
           {!isShared && (
             <Button variant="outline" size="sm" className="rounded-full border-primary/50 text-primary hover:bg-primary hover:text-white bg-transparent">
               <Share2 className="w-4 h-4 mr-2" /> Share
             </Button>
           )}
        </div>
      </header>

      {/* Viewer Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
        <Flipbook 
          sheets={loadedSheets} 
          frontCover={loadedFrontCover} 
          backCover={loadedBackCover} 
        />
      </main>
    </div>
  );
}
