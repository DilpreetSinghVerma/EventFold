import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import {
  Check,
  X,
  Camera,
  Clock,
  Filter,
  Send,
  CheckCircle2,
  XCircle,
  CircleDot,
  LayoutGrid,
  Image as ImageIcon,
  Rows3,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGallery, updatePhoto, updateGallery, calculateSelectionStats } from '../lib/selection-api';
import { Gallery, SelectionFilter, Photo } from '../lib/selection-types';
import { Loader2 } from 'lucide-react';
import PhotoCard from '../components/SelectionPhotoCard';
import Lightbox from '../components/SelectionLightbox';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function SelectionClientGallery() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<SelectionFilter>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [toast, setToast] = useState('');

  const { data: gallery, isLoading, error } = useQuery({
    queryKey: ['/api/selection/galleries', id],
    queryFn: () => fetchGallery(id!),
    enabled: !!id
  });

  const photoMutation = useMutation({
    mutationFn: ({ photoId, updates }: { photoId: string, updates: Partial<Photo> }) => updatePhoto(photoId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/selection/galleries', id] });
    }
  });

  const galleryMutation = useMutation({
    mutationFn: (updates: Partial<Gallery>) => updateGallery(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/selection/galleries', id] });
    }
  });

  useEffect(() => {
    if (gallery?.password) {
      setIsLocked(true);
    }
  }, [gallery?.id]);

  const unlockGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === gallery?.password) {
      setIsLocked(false);
    } else {
      showToast('Incorrect password ❌');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

  if (!gallery || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center glass p-12 rounded-3xl max-w-sm">
          <ImageIcon className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">
            Gallery Not Found
          </h2>
          <p className="text-muted-foreground">
            This gallery link may have expired or is invalid.
          </p>
        </div>
      </div>
    );
  }

  const stats = calculateSelectionStats(gallery.photos || []);

  const filteredPhotos = (gallery.photos || []).filter((p) => {
    if (filter === 'selected') return p.selected === 1;
    if (filter === 'rejected') return p.selected === 0;
    if (filter === 'unreviewed') return p.selected === null;
    return true;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleSelect = (photoId: string) => {
    const photo = gallery.photos?.find((p) => p.id === photoId);
    if (!photo) return;

    const newSelected = photo.selected === 1 ? null : 1;

    // Check max selections
    if (
      newSelected === 1 &&
      gallery.maxSelections &&
      stats.selected >= gallery.maxSelections
    ) {
      showToast(`Maximum ${gallery.maxSelections} selections allowed`);
      return;
    }

    photoMutation.mutate({ photoId, updates: { selected: newSelected } });
  };

  const handleReject = (photoId: string) => {
    const photo = gallery.photos?.find((p) => p.id === photoId);
    if (!photo) return;

    const newSelected = photo.selected === 0 ? null : 0;
    photoMutation.mutate({ photoId, updates: { selected: newSelected } });
  };

  const handleRate = (photoId: string, rating: number) => {
    photoMutation.mutate({ photoId, updates: { rating } });
  };

  const handleComment = (photoId: string, comment: string) => {
    photoMutation.mutate({ photoId, updates: { comment } });
  };

  const handleSubmit = () => {
    if (gallery.minSelections && stats.selected < gallery.minSelections) {
      showToast(`Please select at least ${gallery.minSelections} photos`);
      return;
    }
    galleryMutation.mutate({ status: 'completed' });
    showToast('Selections submitted successfully! 🎉');
  };

  const daysLeft = gallery.deadline
    ? Math.max(
        0,
        Math.ceil(
          (new Date(gallery.deadline).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const filterButtons: { key: SelectionFilter; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'all', label: 'All', icon: LayoutGrid, count: stats.total },
    { key: 'selected', label: 'Selected', icon: CheckCircle2, count: stats.selected },
    { key: 'rejected', label: 'Rejected', icon: XCircle, count: stats.rejected },
    { key: 'unreviewed', label: 'Unreviewed', icon: CircleDot, count: stats.unreviewed },
  ];

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass p-8 rounded-3xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Protected Gallery</h2>
          <p className="text-muted-foreground mb-8">This gallery is private. Please enter the password provided by your photographer.</p>
          
          <form onSubmit={unlockGallery} className="space-y-4">
            <input
              type="password"
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-center text-lg"
            />
            <button 
              type="submit"
              className="w-full py-4 rounded-xl gradient-primary text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Access Gallery
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 relative">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[30%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-emerald-500/3 blur-[100px]" />
      </div>

      <motion.div
        className="max-w-7xl mx-auto"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={fadeInUp} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              {gallery.photographerName && (
                <p className="text-sm text-primary mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  {gallery.photographerName}
                </p>
              )}
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
                {gallery.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Hello {gallery.clientName}! Please review and select your
                favorite photos.
              </p>
            </div>

            {daysLeft !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm">
                <Clock
                  className={`w-4 h-4 ${
                    daysLeft <= 2 ? 'text-red-400' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={
                    daysLeft <= 2 ? 'text-red-400' : 'text-muted-foreground'
                  }
                >
                  {daysLeft === 0
                    ? 'Deadline today!'
                    : `${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining`}
                </span>
              </div>
            )}
          </div>

          {gallery.message && (
            <div className="p-4 rounded-2xl glass mb-6 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {gallery.message}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-4 p-3 rounded-xl glass">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-foreground font-semibold">
                  {stats.selected}
                </span>
                <span className="text-muted-foreground">selected</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5 text-sm">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-foreground font-semibold">
                  {stats.rejected}
                </span>
                <span className="text-muted-foreground">rejected</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5 text-sm">
                <CircleDot className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground font-semibold">
                  {stats.unreviewed}
                </span>
                <span className="text-muted-foreground">remaining</span>
              </div>
            </div>

            {(gallery.minSelections || gallery.maxSelections) && (
              <div className="px-3 py-2 rounded-xl bg-primary/10 text-sm text-primary">
                Select{' '}
                {gallery.minSelections && gallery.maxSelections
                  ? `${gallery.minSelections}-${gallery.maxSelections}`
                  : gallery.minSelections
                  ? `at least ${gallery.minSelections}`
                  : `up to ${gallery.maxSelections}`}{' '}
                photos
              </div>
            )}

            <div className="flex-1 min-w-[200px]">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${((stats.selected + stats.rejected) / stats.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap items-center justify-between gap-3 mb-6"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === btn.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <btn.icon className="w-3.5 h-3.5" />
                {btn.label}
                <span className="text-xs opacity-60">({btn.count})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl glass">
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'masonry'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Rows3 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl">
              <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No photos match this filter.
              </p>
            </div>
          ) : viewMode === 'masonry' ? (
            <div className="masonry-grid">
              {filteredPhotos.map((photo, i) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  index={i}
                  watermark={gallery.watermarkText}
                  onSelect={handleSelect}
                  onReject={handleReject}
                  onRate={handleRate}
                  onComment={handleComment}
                  onOpenLightbox={() =>
                    setLightboxIndex(
                      gallery.photos.findIndex((p) => p.id === photo.id)
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, i) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  index={i}
                  watermark={gallery.watermarkText}
                  onSelect={handleSelect}
                  onReject={handleReject}
                  onRate={handleRate}
                  onComment={handleComment}
                  onOpenLightbox={() =>
                    setLightboxIndex(
                      gallery.photos.findIndex((p) => p.id === photo.id)
                    )
                  }
                />
              ))}
            </div>
          )}
        </motion.div>

        {gallery.status !== 'completed' && (
          <motion.div variants={fadeInUp} className="mt-10 text-center">
            <button
              onClick={handleSubmit}
              disabled={galleryMutation.isPending}
              className="px-10 py-4 rounded-2xl gradient-primary text-white font-semibold text-lg glow-primary-lg hover:opacity-90 transition-all duration-300 inline-flex items-center gap-2"
            >
              {galleryMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Submit Selections ({stats.selected} photos)
            </button>
            {gallery.minSelections && stats.selected < gallery.minSelections && (
              <p className="text-sm text-muted-foreground mt-3">
                Please select at least {gallery.minSelections} photos to submit.
              </p>
            )}
          </motion.div>
        )}

        {gallery.status === 'completed' && (
          <motion.div
            variants={fadeInUp}
            className="mt-10 p-8 rounded-3xl glass text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold mb-2">
              Selections Submitted!
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Thank you, {gallery.clientName}! Your photographer has received
              your selections. You selected {stats.selected} out of{' '}
              {stats.total} photos.
            </p>
          </motion.div>
        )}
      </motion.div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={gallery.photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          onSelect={handleSelect}
          onReject={handleReject}
          onRate={handleRate}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl bg-card border border-border text-foreground text-sm font-medium shadow-2xl animate-fade-in-up">
          {toast}
        </div>
      )}
    </div>
  );
}
