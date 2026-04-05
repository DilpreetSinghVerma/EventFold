import { Camera, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary transition-all duration-300 group-hover:scale-110">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-tight text-foreground leading-none">
              SelectionPro
            </span>
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground flex items-center gap-1">
              by EventFold <Sparkles className="w-2.5 h-2.5 text-primary" />
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Dashboard
          </Link>
          <Link
            to="/create"
            className="px-4 py-2 rounded-xl text-sm font-medium gradient-primary text-white hover:opacity-90 transition-all duration-200 glow-primary"
          >
            New Gallery
          </Link>
        </div>
      </div>
    </nav>
  );
}
