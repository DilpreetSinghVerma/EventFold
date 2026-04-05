import { Camera, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Camera className="w-4 h-4 text-primary" />
          <span>SelectionPro by EventFold Studio</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
          <span>by Elite Labs</span>
        </div>
      </div>
    </footer>
  );
}
