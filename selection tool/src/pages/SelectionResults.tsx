import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  XCircle,
  CircleDot,
  Star,
  MessageCircle,
  ArrowLeft,
  Download,
  Filter,
  BarChart3,
  Copy,
  Image,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getGallery, getSelectionStats } from '../lib/storage';
import { Gallery, SelectionFilter } from '../lib/types';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function SelectionResults() {
  const { id } = useParams<{ id: string }>();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [filter, setFilter] = useState<SelectionFilter>('selected');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (id) setGallery(getGallery(id));
  }, [id]);

  if (!gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass p-12 rounded-3xl">
          <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">
            Gallery Not Found
          </h2>
          <p className="text-muted-foreground">
            This gallery doesn't exist or has been deleted.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl glass text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const stats = getSelectionStats(gallery);
  const filteredPhotos = gallery.photos.filter((p) => {
    if (filter === 'selected') return p.selected === true;
    if (filter === 'rejected') return p.selected === false;
    if (filter === 'unreviewed') return p.selected === null;
    return true;
  });

  const ratedPhotos = gallery.photos
    .filter((p) => p.rating > 0)
    .sort((a, b) => b.rating - a.rating);

  const commentedPhotos = gallery.photos.filter(
    (p) => p.comment && p.comment.trim()
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const exportSelections = () => {
    const selected = gallery.photos.filter((p) => p.selected === true);
    const text = selected
      .map(
        (p, i) =>
          `${i + 1}. ${p.filename}${p.rating ? ` ⭐${p.rating}` : ''}${
            p.comment ? ` — "${p.comment}"` : ''
          }`
      )
      .join('\n');

    const blob = new Blob(
      [
        `Selection Results — ${gallery.name}\n`,
        `Client: ${gallery.clientName}\n`,
        `Date: ${new Date().toLocaleDateString()}\n`,
        `\nSelected Photos (${selected.length}/${gallery.photos.length}):\n\n`,
        text,
      ],
      { type: 'text/plain' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selections-${gallery.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Selections exported! 📄');
  };

  const copyFilenames = () => {
    const selected = gallery.photos.filter((p) => p.selected === true);
    const names = selected.map((p) => p.filename).join('\n');
    navigator.clipboard.writeText(names);
    showToast('Filenames copied to clipboard! 📋');
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[15%] left-[40%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[30%] w-[300px] h-[300px] rounded-full bg-emerald-500/3 blur-[100px]" />
      </div>

      <motion.div
        className="max-w-6xl mx-auto"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                Selection Results
              </h1>
              <p className="text-muted-foreground mt-1">
                {gallery.name} — {gallery.clientName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyFilenames}
                className="px-4 py-2.5 rounded-xl glass glass-hover text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
              >
                <Copy className="w-4 h-4" />
                Copy Filenames
              </button>
              <button
                onClick={exportSelections}
                className="px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium flex items-center gap-2 glow-primary hover:opacity-90 transition-all"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="p-5 rounded-2xl glass text-center">
            <div className="text-3xl font-display font-bold text-foreground mb-1">
              {stats.total}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Image className="w-4 h-4" />
              Total Photos
            </div>
          </div>
          <div className="p-5 rounded-2xl glass text-center">
            <div className="text-3xl font-display font-bold text-emerald-400 mb-1">
              {stats.selected}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Selected
            </div>
          </div>
          <div className="p-5 rounded-2xl glass text-center">
            <div className="text-3xl font-display font-bold text-red-400 mb-1">
              {stats.rejected}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <XCircle className="w-4 h-4 text-red-400" />
              Rejected
            </div>
          </div>
          <div className="p-5 rounded-2xl glass text-center">
            <div className="text-3xl font-display font-bold text-yellow-400 mb-1">
              {stats.unreviewed}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <CircleDot className="w-4 h-4 text-yellow-400" />
              Unreviewed
            </div>
          </div>
        </motion.div>

        {/* Top Rated */}
        {ratedPhotos.length > 0 && (
          <motion.div variants={fadeInUp} className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Top Rated Photos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ratedPhotos.slice(0, 6).map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-xl overflow-hidden glass relative group"
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2 flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: photo.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                    {photo.selected === true && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Client Comments */}
        {commentedPhotos.length > 0 && (
          <motion.div variants={fadeInUp} className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              Client Comments ({commentedPhotos.length})
            </h2>
            <div className="space-y-3">
              {commentedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-start gap-4 p-4 rounded-xl glass"
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-muted-foreground truncate">
                        {photo.filename}
                      </span>
                      {photo.selected === true && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {photo.selected === false && (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-foreground italic">
                      "{photo.comment}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filtered Photo Grid */}
        <motion.div variants={fadeInUp}>
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(
              [
                { key: 'selected', label: 'Selected', icon: CheckCircle2, count: stats.selected },
                { key: 'rejected', label: 'Rejected', icon: XCircle, count: stats.rejected },
                { key: 'unreviewed', label: 'Unreviewed', icon: CircleDot, count: stats.unreviewed },
                { key: 'all', label: 'All', icon: Image, count: stats.total },
              ] as const
            ).map((btn) => (
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

          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl">
              <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No photos in this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`rounded-xl overflow-hidden relative group ${
                    photo.selected === true
                      ? 'photo-selected'
                      : photo.selected === false
                      ? 'photo-rejected'
                      : ''
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2">
                    {photo.selected === true && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    {photo.selected === false && (
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <XCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  {photo.rating > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-white font-medium">
                        {photo.rating}
                      </span>
                    </div>
                  )}
                  {photo.comment && (
                    <div className="absolute bottom-2 right-2">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate font-mono">
                      {photo.filename}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl bg-card border border-border text-foreground text-sm font-medium shadow-2xl animate-fade-in-up">
          {toast}
        </div>
      )}
    </div>
  );
}
