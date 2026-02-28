import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useAlbumStore } from '@/lib/store';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, ImagePlus, ArrowLeft, CheckCircle2, CloudUpload, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateAlbum() {
  const [, setLocation] = useLocation();
  const { addAlbum } = useAlbumStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    theme: 'modern', // Default to modern
    frontCover: null as File | null,
    backCover: null as File | null,
    sheets: [] as File[],
  });

  const [sheetPreviews, setSheetPreviews] = useState<string[]>([]);
  const prevPreviewsRef = useRef<string[]>([]);

  useEffect(() => {
    prevPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    const newUrls = formData.sheets.map((f) => URL.createObjectURL(f));
    prevPreviewsRef.current = newUrls;
    setSheetPreviews(newUrls);

    return () => {
      newUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [formData.sheets]);

  const onDropSheets = useCallback((acceptedFiles: File[]) => {
    setFormData((prev) => ({
      ...prev,
      sheets: [...prev.sheets, ...acceptedFiles],
    }));
  }, []);

  const { getRootProps: getSheetRootProps, getInputProps: getSheetInputProps, isDragActive: isSheetDragActive } = useDropzone({
    onDrop: onDropSheets,
    accept: { 'image/*': [] },
  });

  const handleCoverDrop = (file: File, type: 'front' | 'back') => {
    setFormData((prev) => ({
      ...prev,
      [type === 'front' ? 'frontCover' : 'backCover']: file,
    }));
  };

  const removeSheet = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sheets: prev.sheets.filter((_, i) => i !== index),
    }));
  };

  const step1Valid = !!formData.title.trim() && !!formData.date && !!formData.frontCover && !!formData.backCover;

  const handleSubmit = async () => {
    if (!formData.frontCover || !formData.backCover || formData.sheets.length === 0) return;

    setLoading(true);
    setStatus('Initializing project workspace...');

    try {
      // 1. Create the Album metadata in our database
      const albumResponse = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          date: formData.date,
          theme: formData.theme,
        }),
      });

      if (!albumResponse.ok) {
        const errBody = await albumResponse.json().catch(() => ({}));
        throw new Error(errBody.message || errBody.error || 'Could not create album record. Check DATABASE_URL on Vercel.');
      }
      const album = await albumResponse.json();

      // --- Helper: Compress image to drastically reduce upload size ---
      const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            // Standardize extremely large sheets to a maximum practical dimension
            const MAX_WIDTH = 2500;
            const MAX_HEIGHT = 2500;
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
            if (!ctx) return resolve(file); // Fallback to original

            ctx.drawImage(img, 0, 0, width, height);

            // Compress to 85% JPEG
            canvas.toBlob(
              (blob) => {
                if (!blob) return resolve(file); // Fallback
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              },
              "image/jpeg",
              0.85
            );
          };
          img.onerror = () => resolve(file); // If unparseable, skip compression
          img.src = URL.createObjectURL(file);
        });
      };

      // 2. Get Secure Signature from our server for Cloudinary
      setStatus('Securing cloud connection...');
      const sigResponse = await fetch('/api/cloudinary-signature');
      if (!sigResponse.ok) {
        const errBody = await sigResponse.json().catch(() => ({}));
        throw new Error(errBody.error || 'Cloudinary handshake failed. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set on Vercel.');
      }
      const { signature, timestamp, cloud_name, api_key, folder } = await sigResponse.json();

      // Helper to upload a single file to Cloudinary
      const uploadToCloudinary = async (file: File, label: string) => {
        const cloudFormData = new FormData();
        cloudFormData.append('file', file);
        cloudFormData.append('signature', signature);
        cloudFormData.append('timestamp', timestamp);
        cloudFormData.append('api_key', api_key);
        cloudFormData.append('folder', folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
          method: 'POST',
          body: cloudFormData,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data.error?.message || data.error || res.statusText;
          throw new Error(`${label}: ${msg} (Cloudinary free tier: 10MB max per file)`);
        }
        return data.secure_url;
      };

      // 3. Compress and Upload all files directly from Browser to Cloudinary (Parallel)
      setStatus('Compressing and streaming assets to cloud storage...');

      const filesToProcess = [
        { file: formData.frontCover, type: 'cover_front', order: 0 },
        { file: formData.backCover, type: 'cover_back', order: 1 },
        ...formData.sheets.map((s, i) => ({ file: s, type: 'sheet', order: i + 2 }))
      ];

      // Execute all uploads concurrently
      const uploadPromises = filesToProcess.map(async (item, index) => {
        const label = item.type === 'cover_front' ? 'Front cover' : item.type === 'cover_back' ? 'Back cover' : `Sheet ${index - 1}`;

        // Compress the raw >10MB file down to <1MB
        const compressed = await compressImage(item.file);

        // Upload the compressed fast file
        const url = await uploadToCloudinary(compressed, label);

        return {
          filePath: url,
          fileType: item.type,
          orderIndex: item.order
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // 4. Send the URLs to our server to link them to the album
      setStatus('Finalizing architecture...');
      const batchResponse = await fetch(`/api/albums/${album.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: uploadedFiles }),
      });

      if (!batchResponse.ok) {
        const errBody = await batchResponse.json().catch(() => ({}));
        throw new Error(errBody.message || errBody.error || 'Metadata synchronization failed');
      }

      setStatus('Deployment successful!');
      addAlbum(album);

      setTimeout(() => {
        setLoading(false);
        setLocation('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Submission Error:', error);
      setLoading(false);
      setStatus('');
      alert(`[BROWSER ERROR] ${error.message}\n\nTechnical Tip: Check your internet connection or ensure your Cloudinary account hasn't reached its storage limit.`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 selection:bg-primary/30">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-12">
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white glass rounded-xl pr-6 pl-4">
            <ArrowLeft className="w-4 h-4" /> Back to Gallery
          </Button>
        </Link>
        <div className="flex gap-2">
          {[1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'w-2 bg-white/10'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-4xl glass rounded-[2.5rem] border-white/5 shadow-2xl overflow-hidden p-8 md:p-12">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="space-y-12"
              >
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight">Project Identity</h1>
                  <p className="text-muted-foreground">Define the metadata for your cinematic collection.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-sm font-bold uppercase tracking-[0.15em] text-white/40 ml-1">Album Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Modern Architecture 2026"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-14 bg-white/[0.03] border-white/5 rounded-2xl px-6 focus:ring-primary/20 transition-all text-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="date" className="text-sm font-bold uppercase tracking-[0.15em] text-white/40 ml-1">Production Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="h-14 bg-white/[0.03] border-white/5 rounded-2xl px-6 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-sm font-bold uppercase tracking-[0.15em] text-white/40 ml-1">Cover Architecture</Label>
                    <p className="text-xs text-muted-foreground ml-1">Upload the front and back visuals for your physical album mockup.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-primary/80 uppercase tracking-widest">1. Front Aspect</span>
                        {formData.frontCover && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      </div>
                      <div className="relative">
                        <CoverUploader
                          file={formData.frontCover}
                          onDrop={(f) => handleCoverDrop(f, 'front')}
                          label="Upload your front cover"
                        />
                        {!formData.frontCover && (
                          <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-8 opacity-40">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Required</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-primary/80 uppercase tracking-widest">2. Back Aspect</span>
                        {formData.backCover && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      </div>
                      <div className="relative">
                        <CoverUploader
                          file={formData.backCover}
                          onDrop={(f) => handleCoverDrop(f, 'back')}
                          label="Upload your back cover"
                        />
                        {!formData.backCover && (
                          <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-8 opacity-40">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Required</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!step1Valid}
                    size="lg"
                    className="h-14 rounded-2xl px-12 bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20"
                  >
                    Asset Ingestion <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight">Content Spreads</h1>
                  <p className="text-muted-foreground">Upload your high-fidelity panoramic sheets.</p>
                </div>

                <div
                  {...getSheetRootProps()}
                  className={`border-2 border-dashed rounded-[2rem] p-16 text-center cursor-pointer transition-all duration-500 overflow-hidden relative group ${isSheetDragActive
                    ? 'border-primary bg-primary/10 scale-[1.01]'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    }`}
                >
                  <input {...getSheetInputProps()} />
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${isSheetDragActive ? 'bg-primary text-white scale-110 rotate-12' : 'bg-white/5 text-primary group-hover:scale-110'}`}>
                    <CloudUpload className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Drop Project Sheets</h3>
                  <p className="text-muted-foreground">Panoramic 12×36 resolution recommended</p>

                  {isSheetDragActive && (
                    <motion.div
                      layoutId="glow"
                      className="absolute inset-0 bg-primary/5 pointer-events-none"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Queue ({formData.sheets.length})</h4>
                    {formData.sheets.length > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs text-destructive hover:bg-destructive/10" onClick={() => setFormData(p => ({ ...p, sheets: [] }))}>Clear All</Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence>
                      {formData.sheets.map((file, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative aspect-video glass rounded-xl overflow-hidden group border-white/5"
                        >
                          {sheetPreviews[idx] && (
                            <img
                              src={sheetPreviews[idx]}
                              alt="preview"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                            <span className="text-[10px] text-white/60 mb-2 truncate max-w-full font-mono">{file.name}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeSheet(idx); }}
                              className="w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white rounded-lg flex items-center justify-center transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md glass text-[10px] font-bold text-white/80">#{idx + 1}</div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="pt-10 flex justify-between items-center border-t border-white/5">
                  <Button variant="ghost" className="rounded-xl h-14 px-8 text-muted-foreground" onClick={() => setStep(1)}>Prerequisites</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={formData.sheets.length === 0 || loading}
                    className="h-16 rounded-[1.25rem] px-14 text-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : null}
                    {loading ? status || 'Processing...' : 'Finalize Generation'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function CoverUploader({ file, onDrop, label }: { file: File | null; onDrop: (f: File) => void; label: string }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onDrop(files[0]),
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  return (
    <div
      {...getRootProps()}
      className={`relative aspect-[3/4] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group overflow-hidden ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
        } ${file ? 'border-solid border-primary/40' : ''}`}
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        <>
          <img src={previewUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="cover preview" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
              <CloudUpload className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xs tracking-widest uppercase">Modify Asset</span>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-[2rem] bg-white/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6">
            <ImagePlus className="w-8 h-8 text-primary" />
          </div>
          <span className="text-xs text-white/40 font-bold uppercase tracking-widest">{label}</span>
        </>
      )}
    </div>
  );
}
