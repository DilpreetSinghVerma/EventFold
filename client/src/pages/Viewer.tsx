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
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-neutral-100 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display font-bold text-lg">{album.title}</h1>
            <p className="text-xs text-neutral-500 hidden sm:block">{album.date}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-full">
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
      </header>

      {/* Viewer Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 overflow-hidden">
        <Flipbook pages={album.pages} cover={album.cover} />
        
        <div className="mt-8 text-center opacity-60">
          <p className="font-display italic text-neutral-400">FlipiX Viewer</p>
        </div>
      </main>
    </div>
  );
}
