import { useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import {
  Upload,
  X,
  Image as ImageIcon,
  Camera,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowRight,
  FileImage,
  Hash,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGallery } from '../lib/selection-api';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

interface PreviewPhoto {
  file?: File;
  url: string;
  filename: string;
}

export default function SelectionCreateGallery() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [photographerName, setPhotographerName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [password, setPassword] = useState('');
  const [watermark, setWatermark] = useState('PROOFS - DO NOT COPY');
  const [minSelections, setMinSelections] = useState('');
  const [maxSelections, setMaxSelections] = useState('');
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<PreviewPhoto[]>([]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newPhotos: PreviewPhoto[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
        filename: f.name,
      }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed.file) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 2000;
        const MAX_HEIGHT = 2000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", 0.7);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadToCloudinary = async (file: File, sig: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', sig.signature);
    formData.append('timestamp', sig.timestamp);
    formData.append('api_key', sig.api_key);
    formData.append('folder', sig.folder);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url;
  };

  const createMutation = useMutation({
    mutationFn: createGallery,
    onSuccess: (gallery) => {
      queryClient.invalidateQueries({ queryKey: ['/api/selection/galleries'] });
      setLocation(`/selection/gallery/${gallery.id}`);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) return;

    setLoading(true);
    setStatus('Preparing secure connection...');

    try {
      // 1. Get Cloudinary signature
      const sigRes = await fetch('/api/cloudinary-signature');
      if (!sigRes.ok) throw new Error('Could not connect to Cloudinary');
      const sig = await sigRes.json();

      // 2. Upload photos
      const uploadedPhotos: { url: string; filename: string }[] = [];
      const CONCURRENCY = 10;
      
      for (let i = 0; i < photos.length; i += CONCURRENCY) {
        const chunk = photos.slice(i, i + CONCURRENCY);
        const results = await Promise.all(chunk.map(async (p, idx) => {
          try {
            const num = i + idx + 1;
            if (num <= photos.length) setStatus(`Uploading photos... (${num}/${photos.length})`);
            
            // Web-optimized compression
            const compressed = p.file ? await compressImage(p.file) : null;
            const url = compressed ? await uploadToCloudinary(compressed, sig) : p.url;
            return { url, filename: p.filename };
          } catch (err) {
            console.error("Upload error:", err);
            return null;
          }
        }));
        
        const valid = results.filter(Boolean) as { url: string; filename: string }[];
        uploadedPhotos.push(...valid);
      }

      setStatus('Finalizing gallery...');
      createMutation.mutate({
        name,
        clientName,
        clientEmail,
        photographerName: photographerName || user?.name || 'Studio',
        photos: uploadedPhotos as any, // Cast to any because the backend handles the ID/defaults
        deadline,
        password,
        watermarkText: watermark,
        minSelections: minSelections ? parseInt(minSelections) : undefined,
        maxSelections: maxSelections ? parseInt(maxSelections) : undefined,
        message,
        status: 'pending'
      });

    } catch (error: any) {
      console.error(error);
      alert('Error creating gallery: ' + error.message);
      setLoading(false);
    }
  };

  const handleDemo = () => {
    alert("Demo galleries are now disabled for real-time cloud sync. Please upload your own photos to test!");
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-violet-700/5 blur-[100px]" />
      </div>

      <motion.div
        className="max-w-4xl mx-auto"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fadeInUp} className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-3">
            Create <span className="gradient-text">Gallery</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload photos and share them with your client for selection.
          </p>

          <button
            onClick={handleDemo}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl glass glass-hover text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Try with demo gallery
          </button>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <motion.div variants={fadeInUp} className="p-6 rounded-2xl glass">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Gallery Details
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Gallery Name *
                </label>
                <div className="relative">
                  <FileImage className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sharma Wedding — Dec 2025"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={photographerName}
                    onChange={(e) => setPhotographerName(e.target.value)}
                    placeholder="Your studio name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Client Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., Priya & Arjun"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Client Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Selection Deadline
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Gallery Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground flex items-center">🔐</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Optional password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Watermark Text
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground flex items-center">🖋️</span>
                  <input
                    type="text"
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Min Selections
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      min="0"
                      value={minSelections}
                      onChange={(e) => setMinSelections(e.target.value)}
                      placeholder="e.g., 5"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Max Selections
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      min="0"
                      value={maxSelections}
                      onChange={(e) => setMaxSelections(e.target.value)}
                      placeholder="e.g., 20"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm text-muted-foreground mb-2">
                Message to Client
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A personal message that your client will see when they open the gallery..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="p-6 rounded-2xl glass">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Photos
              {photos.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono">
                  {photos.length}
                </span>
              )}
            </h2>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                dragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border hover:border-primary/50 hover:bg-white/[0.01]'
              }`}
            >
              <Upload
                className={`w-10 h-10 mx-auto mb-4 transition-colors ${
                  dragOver ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <p className="text-foreground font-medium mb-1">
                {dragOver ? 'Drop your photos here' : 'Drag & drop photos here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse • JPG, PNG, WebP supported
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />
            </div>

            {photos.length > 0 && (
              <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {photos.map((photo, i) => (
                  <div
                    key={i}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-muted"
                  >
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white truncate">
                        {photo.filename}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={!name || !clientName || photos.length === 0 || loading}
              className="px-8 py-4 rounded-2xl gradient-primary text-white font-semibold text-lg flex items-center gap-2 glow-primary-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 min-w-[220px] justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{status}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Create Gallery</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
