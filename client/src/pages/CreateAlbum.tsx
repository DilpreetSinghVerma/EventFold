import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAlbumStore } from '@/lib/store';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreateAlbum() {
  const [, setLocation] = useLocation();
  const { addAlbum } = useAlbumStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    theme: 'royal',
    frontCover: null as File | null,
    backCover: null as File | null,
    sheets: [] as File[],
  });

  // Helper to convert file to base64 (for small prototype persistence)
  // In a real app, we'd upload to S3 and get a URL.
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onDropSheets = useCallback((acceptedFiles: File[]) => {
    setFormData(prev => ({
      ...prev,
      sheets: [...prev.sheets, ...acceptedFiles]
    }));
  }, []);

  const { getRootProps: getSheetRootProps, getInputProps: getSheetInputProps, isDragActive: isSheetDragActive } = useDropzone({ 
    onDrop: onDropSheets,
    accept: { 'image/*': [] } 
  });

  const handleCoverDrop = (file: File, type: 'front' | 'back') => {
    setFormData(prev => ({
      ...prev,
      [type === 'front' ? 'frontCover' : 'backCover']: file
    }));
  };

  const removeSheet = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sheets: prev.sheets.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.frontCover || !formData.backCover || formData.sheets.length === 0) return;
    
    setLoading(true);
    
    try {
      // Convert all files to base64 strings for storage
      // Warning: This is heavy for localStorage, but necessary for "persistence" in this mock stack
      const frontCoverBase64 = await fileToBase64(formData.frontCover);
      const backCoverBase64 = await fileToBase64(formData.backCover);
      const sheetPromises = formData.sheets.map(file => fileToBase64(file));
      const sheetBase64s = await Promise.all(sheetPromises);

      const newAlbum = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        date: formData.date,
        theme: formData.theme as any,
        frontCover: frontCoverBase64,
        backCover: backCoverBase64,
        sheets: sheetBase64s,
      };

      addAlbum(newAlbum);
      setLoading(false);
      setLocation('/dashboard');
    } catch (error) {
      console.error("Error processing files", error);
      setLoading(false);
      alert("Failed to process images. They might be too large for this demo.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100">
        <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/batik-ramp.png')] mix-blend-overlay"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">Create Royal Album</h1>
              <p className="opacity-80 text-sm">Design your 12x36 wedding masterpiece</p>
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
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="h-12 text-lg border-neutral-300 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-lg font-display">Event Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="h-12 border-neutral-300 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-display">Cover Images</Label>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Front Cover Upload */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Front Cover</span>
                    <CoverUploader 
                      file={formData.frontCover} 
                      onDrop={(f) => handleCoverDrop(f, 'front')} 
                      label="Upload Front"
                    />
                  </div>
                  
                  {/* Back Cover Upload */}
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
                  disabled={!formData.title || !formData.frontCover || !formData.backCover}
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
                  <p>Upload your album sheets designed in 12x36 aspect ratio. We will automatically handle the fold for the flipbook experience.</p>
                </div>
              </div>

              <div 
                {...getSheetRootProps()} 
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  isSheetDragActive 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-neutral-300 hover:border-primary/50 hover:bg-neutral-50'
                }`}
              >
                <input {...getSheetInputProps()} />
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="font-display text-xl font-medium mb-2">Drop your album sheets here</h3>
                <p className="text-neutral-400">Supports JPG, PNG (High Quality)</p>
              </div>

              {formData.sheets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-neutral-500 uppercase tracking-wider">Selected Sheets ({formData.sheets.length})</h4>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                    {formData.sheets.map((file, idx) => (
                      <div key={idx} className="relative h-24 bg-neutral-100 rounded-md overflow-hidden group border border-neutral-200 flex">
                        {/* Preview as panoramic strip */}
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="text-white text-xs font-medium">Sheet {idx + 1}</span>
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
                  {loading ? 'Creating Masterpiece...' : 'Create Album'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoverUploader({ file, onDrop, label }: { file: File | null, onDrop: (f: File) => void, label: string }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onDrop(files[0]),
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()}
      className={`aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-neutral-300 hover:border-primary/50'
      } ${file ? 'border-solid border-primary/20' : ''}`}
    >
      <input {...getInputProps()} />
      {file ? (
        <>
          <img src={URL.createObjectURL(file)} className="w-full h-full object-cover absolute inset-0" />
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
