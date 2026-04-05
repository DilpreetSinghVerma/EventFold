import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Star, MessageCircle } from 'lucide-react';
import { Photo } from '../lib/selection-types';
import { getOptimizedUrl } from '../lib/selection-api';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onSelect: (id: string) => void;
  onReject: (id: string) => void;
  onRate: (id: string, rating: number) => void;
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  onSelect,
  onReject,
  onRate,
}: LightboxProps) {
  const photo = photos[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0)
        onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1)
        onNavigate(currentIndex + 1);
    },
    [currentIndex, photos.length, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 z-10 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 z-10 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-[90vw] max-h-[75vh] flex items-center justify-center">
        <img
          src={getOptimizedUrl(photo.url, 2000)}
          alt={photo.filename}
          className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
        />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-xl mx-auto">
          <p className="text-white/50 text-xs font-mono text-center mb-3">
            {photo.filename}
          </p>

          {/* Stars */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onRate(photo.id, star === photo.rating ? 0 : star)}
                className="transition-transform duration-150 hover:scale-125"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= photo.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Select / Reject */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onSelect(photo.id)}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                photo.selected === 1
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                  : 'bg-white/10 text-white hover:bg-emerald-500/20 hover:text-emerald-300'
              }`}
            >
              <Check className="w-5 h-5" />
              Select
            </button>
            <button
              onClick={() => onReject(photo.id)}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                photo.selected === 0
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                  : 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-300'
              }`}
            >
              <X className="w-5 h-5" />
              Reject
            </button>
          </div>

          {photo.comment && (
            <div className="mt-3 flex items-start gap-2 text-sm text-white/60 justify-center">
              <MessageCircle className="w-4 h-4 mt-0.5 text-primary" />
              <p className="italic">"{photo.comment}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
