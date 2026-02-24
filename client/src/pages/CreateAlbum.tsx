import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { useAlbumStore, ImageStorage } from '@/lib/store';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, ImagePlus, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreateAlbum() {
  const [, setLocation] = useLocation();
  const { addAlbum } = useAlbumStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    theme: 'royal',
    frontCover: null as File | null,
    backCover: null as File | null,
    sheets: [] as File[],
  });

  // --- FIX: Manage object URLs to prevent memory leaks ---
  const [sheetPreviews, setSheetPreviews] = useState<string[]>([]);
  const prevPreviewsRef = useRef<string[]>([]);

  useEffect(() => {
    // Revoke old URLs before creating new ones
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

  // Step 1 validation — title, date, front and back cover required
  const step1Valid = !!formData.title.trim() && !!formData.date && !!formData.frontCover && !!formData.backCover;

  const handleSubmit = async () => {
    if (!formData.frontCover || !formData.backCover || formData.sheets.length === 0) return;

    setLoading(true);
    setStatus('Creating album on server...');

    try {
      // 1. Create the album metadata on server
      const albumResponse = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          date: formData.date,
          theme: formData.theme,
        }),
      });

      if (!albumResponse.ok) throw new Error('Failed to create album metadata');
      const album = await albumResponse.json();

      // 2. Prepare files for upload
      setStatus('Uploading images to server...');
      const uploadFormData = new FormData();

      // Add cover files
      uploadFormData.append('files', formData.frontCover);
      uploadFormData.append('fileType_0', 'cover_front');

      uploadFormData.append('files', formData.backCover);
      uploadFormData.append('fileType_1', 'cover_back');

      // Add sheet files
      formData.sheets.forEach((sheet, index) => {
        uploadFormData.append('files', sheet);
        uploadFormData.append(`fileType_${index + 2}`, 'sheet');
      });

      // 3. Upload all files to the server
      const uploadResponse = await fetch(`/api/albums/${album.id}/files`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload images');

      setStatus('Finalizing album...');

      // 4. Force state update and redirect
      addAlbum(album); // Add to local store for immediate UI update
      setLoading(false);
      setLocation('/dashboard');
    } catch (error) {
      console.error('Error processing files', error);
      setLoading(false);
      alert('Something went wrong while saving to the server. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Back Button Header */}
      <div className="sticky top-0 z-50 px-6 py-4 bg-white/50 backdrop-blur-md border-b border-neutral-200">
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2 text-primary hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100">
          <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/batik-ramp.png')] mix-blend-overlay"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold">Create Album</h1>
                <p className="opacity-80 text-sm">High Quality Storage Enabled</p>
              </div>
              <span className="text-sm font-mono bg-white/20 px-3 py-1 rounded-full">Step {step} of 2</span>
            </div>
          </div>

          <div className="p-8">
            {step === 1 ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-lg font-display">Album Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Priya & Rahul's Wedding"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-12 text-lg border-neutral-300 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-lg font-display">Event Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="h-12 border-neutral-300 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-display">Cover Images</Label>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Front Cover</span>
                      <CoverUploader
                        file={formData.frontCover}
                        onDrop={(f) => handleCoverDrop(f, 'front')}
                        label="Upload Front"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Back Cover</span>
                      <CoverUploader
                        file={formData.backCover}
                        onDrop={(f) => handleCoverDrop(f, 'back')}
                        label="Upload Back"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!step1Valid}
                    size="lg"
                    className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  >
                    Next: Add Sheets
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-sm text-neutral-600 flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">Upload 12x36 Panoramic Sheets</p>
                    <p>We support full-resolution uploads. Images are stored securely in your browser's local database.</p>
                  </div>
                </div>

                <div
                  {...getSheetRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${isSheetDragActive
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-neutral-300 hover:border-primary/50 hover:bg-neutral-50'
                    }`}
                >
                  <input {...getSheetInputProps()} />
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10" />
                  </div>
                  <h3 className="font-display text-xl font-medium mb-2">Drop your album sheets here</h3>
                  <p className="text-neutral-400">Supports High-Res JPG, PNG</p>
                </div>

                {formData.sheets.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-neutral-500 uppercase tracking-wider">Selected Sheets ({formData.sheets.length})</h4>
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                      {formData.sheets.map((file, idx) => (
                        <div key={idx} className="relative h-24 bg-neutral-100 rounded-md overflow-hidden group border border-neutral-200 flex">
                          {/* FIX: use pre-created object URLs from state, not inline */}
                          {sheetPreviews[idx] && (
                            <img
                              src={sheetPreviews[idx]}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="text-white text-xs font-medium">{file.name} — Sheet {idx + 1}</span>
                            <button
                              onClick={() => removeSheet(idx)}
                              className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-8 flex justify-between border-t border-neutral-100">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={formData.sheets.length === 0 || loading}
                    size="lg"
                    className="rounded-full px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {loading ? status || 'Processing...' : 'Create Album'}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoverUploader({ file, onDrop, label }: { file: File | null; onDrop: (f: File) => void; label: string }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onDrop(files[0]),
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  // FIX: manage object URL for cover preview with proper cleanup
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
      className={`aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all ${isDragActive ? 'border-primary bg-primary/5' : 'border-neutral-300 hover:border-primary/50'
        } ${file ? 'border-solid border-primary/20' : ''}`}
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        <>
          <img src={previewUrl} className="w-full h-full object-cover absolute inset-0" alt="cover preview" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white font-medium text-sm">Change</span>
          </div>
        </>
      ) : (
        <>
          <ImagePlus className="w-8 h-8 text-neutral-300 mb-2" />
          <span className="text-xs text-neutral-400 font-medium">{label}</span>
        </>
      )}
    </div>
  );
}
