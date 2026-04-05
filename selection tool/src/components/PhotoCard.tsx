import { useState } from 'react';
import { Check, X, Star, MessageCircle, Maximize2 } from 'lucide-react';
import { Photo } from '../lib/types';

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onSelect: (id: string) => void;
  onReject: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  onComment: (id: string, comment: string) => void;
  onOpenLightbox: (index: number) => void;
  watermark?: string;
}

export default function PhotoCard({
  photo,
  index,
  onSelect,
  onReject,
  onRate,
  onComment,
  onOpenLightbox,
  watermark,
}: PhotoCardProps) {
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState(photo.comment);
  const [imageLoaded, setImageLoaded] = useState(false);

  const borderClass =
    photo.selected === true
      ? 'photo-selected'
      : photo.selected === false
      ? 'photo-rejected'
      : '';

  const overlayClass =
    photo.selected === true
      ? 'bg-emerald-500/10'
      : photo.selected === false
      ? 'bg-red-500/10'
      : '';

  return (
    <div
      className={`photo-card group relative rounded-2xl overflow-hidden ${borderClass} ${watermark ? 'photo-watermark' : ''}`}
      data-watermark={watermark}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Skeleton */}
      {!imageLoaded && (
        <div className="w-full aspect-[4/3] bg-muted animate-pulse rounded-2xl" />
      )}

      {/* Image */}
      <img
        src={photo.url}
        alt={photo.filename}
        onLoad={() => setImageLoaded(true)}
        onClick={() => onOpenLightbox(index)}
        className={`w-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105 ${
          imageLoaded ? 'block' : 'hidden'
        }`}
        loading="lazy"
      />

      {/* Selection Status Badge */}
      {photo.selected !== null && (
        <div
          className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center ${
            photo.selected
              ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
              : 'bg-red-500 shadow-lg shadow-red-500/30'
          }`}
        >
          {photo.selected ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <X className="w-4 h-4 text-white" />
          )}
        </div>
      )}

      {/* Overlay on hover */}
      <div
        className={`absolute inset-0 ${overlayClass} opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end`}
      >
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
          {/* File name */}
          <p className="text-xs text-white/60 mb-2 truncate font-mono">
            {photo.filename}
          </p>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={(e) => {
                  e.stopPropagation();
                  onRate(photo.id, star === photo.rating ? 0 : star);
                }}
                className="transition-transform duration-150 hover:scale-125"
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= photo.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-white/30'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(photo.id);
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-200 ${
                photo.selected === true
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white/10 text-white hover:bg-emerald-500/20 hover:text-emerald-300'
              }`}
            >
              <Check className="w-4 h-4" />
              Select
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(photo.id);
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-200 ${
                photo.selected === false
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-300'
              }`}
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComment(!showComment);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                photo.comment
                  ? 'bg-primary/20 text-primary'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(index);
              }}
              className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all duration-200"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comment input */}
      {showComment && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/90 backdrop-blur-xl border-t border-white/10">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onBlur={() => {
              onComment(photo.id, commentText);
              setShowComment(false);
            }}
            placeholder="Add a note for the photographer..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 resize-none"
            rows={2}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
