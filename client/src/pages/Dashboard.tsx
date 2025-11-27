import { Link } from 'wouter';
import { useAlbumStore } from '@/lib/store';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, QrCode, Eye, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const { albums } = useAlbumStore();
  // We'll use the current window location to generate the QR code
  // This ensures it points to the correct URL whether in dev or deployed
  const origin = window.location.origin;

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">My Albums</h1>
            <p className="text-neutral-500">Manage and share your digital flipbooks.</p>
          </div>
          <Link href="/create">
            <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
              <Plus className="w-4 h-4 mr-2" /> New Album
            </Button>
          </Link>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-200">
            <h3 className="text-xl font-display mb-4">No albums yet</h3>
            <p className="text-neutral-500 mb-8">Create your first digital flipbook to get started.</p>
            <Link href="/create">
              <Button>Create Album</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {albums.map((album) => (
              <div key={album.id} className="group relative">
                <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={album.cover} 
                      alt={album.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Link href={`/album/${album.id}`}>
                        <Button variant="secondary" className="rounded-full">
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <CardContent className="pt-6">
                    <h3 className="font-display text-xl font-bold mb-1">{album.title}</h3>
                    <p className="text-sm text-neutral-400">{album.date} • {album.pages.length} pages</p>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-neutral-50 pt-4 pb-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-primary">
                          <QrCode className="w-4 h-4 mr-2" /> QR Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-display text-center text-2xl">Scan to View</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center p-6 space-y-4">
                          <div className="p-4 bg-white rounded-xl shadow-inner border">
                            <QRCodeSVG 
                              value={`${origin}/album/${album.id}`} 
                              size={200}
                              level="H"
                              imageSettings={{
                                src: "/favicon.png",
                                x: undefined,
                                y: undefined,
                                height: 24,
                                width: 24,
                                excavate: true,
                              }}
                            />
                          </div>
                          <p className="text-center text-sm text-neutral-500 max-w-[80%]">
                            Scan this code to view <strong>{album.title}</strong>.
                            <br/><br/>
                            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
                              Note: Ensure your device is on the same network if testing locally.
                            </span>
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-destructive">
                       <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Decorative stack effect behind card */}
                <div className="absolute -z-10 top-2 left-2 right-[-4px] bottom-[-4px] bg-neutral-200 rounded-lg" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
