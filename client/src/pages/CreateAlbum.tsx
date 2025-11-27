import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAlbumStore } from '@/lib/store';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import travelCover from '@assets/generated_images/travel_album_cover_art.png';
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';
import birthdayCover from '@assets/generated_images/birthday_album_cover_art.png';

export default function CreateAlbum() {
  const [, setLocation] = useLocation();
  const { addAlbum } = useAlbumStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    theme: 'classic',
    files: [] as File[],
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...acceptedFiles]
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] } 
  });

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newAlbum = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title,
      date: formData.date,
      theme: formData.theme as 'classic' | 'travel' | 'fun',
      // Randomly assign one of our generated covers based on theme
      cover: formData.theme === 'travel' ? travelCover : 
             formData.theme === 'fun' ? birthdayCover : weddingCover,
      // Use placeholders for the uploaded files since we can't really store them in this mock
      pages: Array.from({ length: Math.max(formData.files.length, 6) }).map((_, i) => 
        `https://picsum.photos/seed/${Math.random()}/800/1000`
      ),
    };

    addAlbum(newAlbum);
    setLoading(false);
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-100">
        <div className="bg-primary/5 p-6 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-primary-foreground mix-blend-difference text-neutral-800">Create New Album</h1>
            <span className="text-sm font-mono text-neutral-400">Step {step} of 2</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1 bg-neutral-200 mt-4 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Album Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Summer Vacation 2024" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="text-lg h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Event Date</Label>
                <Input 
                  id="date" 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <Label>Select Theme</Label>
                <RadioGroup 
                  defaultValue="classic" 
                  value={formData.theme}
                  onValueChange={(val) => setFormData({...formData, theme: val})}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="classic" id="classic" className="peer sr-only" />
                    <Label 
                      htmlFor="classic"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-neutral-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <span className="font-display text-lg mb-2">Classic</span>
                      <div className="w-full h-12 bg-neutral-100 rounded-md border border-neutral-200" />
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="travel" id="travel" className="peer sr-only" />
                    <Label 
                      htmlFor="travel"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-neutral-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <span className="font-display text-lg mb-2">Travel</span>
                      <div className="w-full h-12 bg-[#E3DCC2] rounded-md border border-neutral-200" />
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="fun" id="fun" className="peer sr-only" />
                    <Label 
                      htmlFor="fun"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-neutral-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <span className="font-display text-lg mb-2">Fun</span>
                      <div className="w-full h-12 bg-pink-100 rounded-md border border-neutral-200" />
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!formData.title}
                  size="lg"
                  className="rounded-full px-8"
                >
                  Next Step
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="font-medium text-lg mb-1">Click or drag photos here</h3>
                <p className="text-neutral-400 text-sm">Supports JPG, PNG (Max 10MB)</p>
              </div>

              {formData.files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-neutral-500">Selected Photos ({formData.files.length})</h4>
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                    {formData.files.map((file, idx) => (
                      <div key={idx} className="relative aspect-square bg-neutral-100 rounded-md overflow-hidden group">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          className="w-full h-full object-cover" 
                        />
                        <button 
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={formData.files.length === 0 || loading}
                  size="lg"
                  className="rounded-full px-8"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? 'Creating...' : 'Create Album'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
