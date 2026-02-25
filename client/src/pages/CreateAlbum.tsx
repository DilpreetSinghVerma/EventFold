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
    setStatus('Initializing secure workspace...');

    try {
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
        const errorData = await albumResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initialize project on server');
      }
      const album = await albumResponse.json();

      setStatus('Syncing assets to high-speed cloud storage...');
      const uploadFormData = new FormData();

      uploadFormData.append('files', formData.frontCover);
      uploadFormData.append('fileType_0', 'cover_front');

      uploadFormData.append('files', formData.backCover);
      uploadFormData.append('fileType_1', 'cover_back');

      formData.sheets.forEach((sheet, index) => {
        uploadFormData.append('files', sheet);
        uploadFormData.append(`fileType_${index + 2}`, 'sheet');
      });

      const uploadResponse = await fetch(`/api/albums/${album.id}/files`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Asset synchronization failed');
      }

      setStatus('Finalizing generation...');
      addAlbum(album);
      setLoading(false);
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('Submission Error:', error);
      setLoading(false);
      setStatus('');
      alert(`Critical Failure: ${error.message}. Please check your connection and ensuring API keys are configured.`);
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
