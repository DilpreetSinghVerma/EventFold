import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Plus,
  Image,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  Copy,
  Sparkles,
  FolderOpen,
  BarChart3,
  XCircle,
  CircleDot,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getGalleries, deleteGallery, getSelectionStats, saveGallery } from '../lib/storage';
import { createDemoGallery } from '../lib/demo-data';
import { Gallery } from '../lib/types';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Dashboard() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setGalleries(getGalleries());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this gallery? This action cannot be undone.')) {
      deleteGallery(id);
      setGalleries(getGalleries());
      showToast('Gallery deleted');
    }
  };

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/gallery/${id}`;
    navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard! 📋');
  };

  const handleCreateDemo = () => {
    const demo = createDemoGallery();
    saveGallery(demo);
    setGalleries(getGalleries());
    showToast('Demo gallery created! 🎉');
  };

  const totalPhotos = galleries.reduce((sum, g) => sum + g.photos.length, 0);
  const completedGalleries = galleries.filter(
    (g) => g.status === 'completed'
  ).length;
  const pendingGalleries = galleries.filter(
    (g) => g.status === 'pending' || g.status === 'in-progress'
  ).length;

  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    'in-progress': {
      label: 'In Progress',
      icon: CircleDot,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[20%] right-[30%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-violet-700/5 blur-[100px]" />
      </div>

      <motion.div
        className="max-w-6xl mx-auto"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your photo selection galleries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateDemo}
              className="px-4 py-2.5 rounded-xl glass glass-hover text-sm text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Add Demo
            </button>
            <Link
              to="/create"
              className="px-5 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center gap-2 glow-primary hover:opacity-90 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Gallery
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            {
              icon: FolderOpen,
              label: 'Total Galleries',
              value: galleries.length,
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
            {
              icon: Image,
              label: 'Total Photos',
              value: totalPhotos,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
            },
            {
              icon: CheckCircle2,
              label: 'Completed',
              value: completedGalleries,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
            },
            {
              icon: Clock,
              label: 'Awaiting',
              value: pendingGalleries,
              color: 'text-yellow-400',
              bg: 'bg-yellow-500/10',
            },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl glass">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-display font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Galleries List */}
        {galleries.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            className="text-center py-20 glass rounded-3xl"
          >
            <Camera className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold mb-2">
              No Galleries Yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first gallery or try the demo to see how SelectionPro
              works.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCreateDemo}
                className="px-5 py-2.5 rounded-xl glass glass-hover text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Try Demo
              </button>
              <Link
                to="/create"
                className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Gallery
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} className="space-y-4">
            {galleries.map((gallery) => {
              const stats = getSelectionStats(gallery);
              const status = statusConfig[gallery.status];
              const progress =
                ((stats.selected + stats.rejected) / stats.total) * 100;

              return (
                <div
                  key={gallery.id}
                  className="p-5 rounded-2xl glass glass-hover transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Cover thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                      {gallery.photos[gallery.coverIndex] ? (
                        <img
                          src={gallery.photos[gallery.coverIndex].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {gallery.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color} flex items-center gap-1`}
                        >
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {gallery.clientName} · {gallery.photos.length} photos ·{' '}
                        {new Date(gallery.createdAt).toLocaleDateString()}
                      </p>

                      {/* Mini stats */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {stats.selected}
                        </span>
                        <span className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-3 h-3" />
                          {stats.rejected}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <CircleDot className="w-3 h-3" />
                          {stats.unreviewed}
                        </span>

                        {/* Progress */}
                        <div className="flex-1 max-w-[200px]">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-muted-foreground">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyLink(gallery.id)}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                        title="Copy share link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/gallery/${gallery.id}`}
                        className="w-9 h-9 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all"
                        title="Open gallery"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/results/${gallery.id}`}
                        className="w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-all"
                        title="View results"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(gallery.id)}
                        className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-all"
                        title="Delete gallery"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
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
