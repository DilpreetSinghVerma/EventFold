import { useParams, Link } from 'wouter';
import { useAlbumStore } from '@/lib/store';
import { Flipbook } from '@/components/Flipbook';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2 } from 'lucide-react';

export default function Viewer() {
  const { id } = useParams();
  const { getAlbum } = useAlbumStore();
  const album = getAlbum(id || '');

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

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none" />
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10 hover:text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display font-bold text-lg text-white tracking-widest">{album.title}</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-full border-primary/50 text-primary hover:bg-primary hover:text-white bg-transparent">
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
      </header>

      {/* Viewer Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
        <Flipbook 
          sheets={album.sheets} 
          frontCover={album.frontCover} 
          backCover={album.backCover} 
        />
      </main>
    </div>
  );
}
