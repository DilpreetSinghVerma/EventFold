import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Save, 
  GripHorizontal, 
  Calendar, 
  Type, 
  Music, 
  Loader2, 
  Check, 
  ArrowLeft,
  LayoutGrid,
  ShieldCheck,
  Music2,
  Image as ImageIcon,
  CloudUpload,
  Trash2,
  Volume2,
  FolderHeart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AlbumEdit() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [album, setAlbum] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [theme, setTheme] = useState('');
  const [bgMusicUrl, setBgMusicUrl] = useState('');
  const [category, setCategory] = useState('');

  const musicInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingMusic, setUploadingMusic] = useState(false);

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload music under 15MB", variant: "destructive" });
      return;
    }

    setUploadingMusic(true);
    try {
      const sigRes = await fetch('/api/cloudinary-signature?resource_type=video');
      const { signature, timestamp, cloud_name, api_key, folder } = await sigRes.json();

      const cloudFormData = new FormData();
      cloudFormData.append('file', file);
      cloudFormData.append('signature', signature);
      cloudFormData.append('timestamp', timestamp);
      cloudFormData.append('api_key', api_key);
      cloudFormData.append('folder', folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`, {
        method: 'POST',
        body: cloudFormData,
      });

      const data = await res.json();
      if (res.ok) {
        setBgMusicUrl(data.secure_url);
        toast({ title: "Music Uploaded!", description: "Save changes to apply this track to the album.", className: "bg-green-500 text-white" });
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingMusic(false);
      if (musicInputRef.current) musicInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/albums/${id}`);
        if (!res.ok) throw new Error('Not found');

        const data = await res.json();

        setAlbum(data);
        setTitle(data.title);
        setDate(data.date);
        setTheme(data.theme);
        setBgMusicUrl(data.bgMusicUrl || '');
        setCategory(data.category || 'Uncategorized');
        
        // Use files included in the main album response
        const filesData = data.files || [];
        setFiles(filesData.filter((f: any) => f.fileType === 'sheet').sort((a: any, b: any) => a.orderIndex - b.orderIndex));
      } catch (err) {
        toast({ title: "Error", description: "Failed to load album data", variant: "destructive" });
        setLocation('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update metadata
      await fetch(`/api/albums/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, theme, bgMusicUrl, category })
      });

      // 2. Update sheet order
      const fileOrders = files.map((f, i) => ({ id: f.id, orderIndex: i }));
      await fetch(`/api/albums/${id}/files/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileOrders })
      });

      toast({ title: "Success", description: "Album details and order updated!", className: "bg-green-500 text-white" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                <ArrowLeft className="w-5 h-5 text-white/60" />
              </Button>
            </Link>
            <div>
               <h1 className="text-xl font-display font-bold">Studio Editor</h1>
               <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{album.title}</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-lg shadow-primary/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Settings Side */}
          <div className="lg:col-span-1 space-y-8">
            <section className="glass p-8 rounded-[2rem] border-white/5 space-y-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                     <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold">Project Info</h2>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-white/40 uppercase font-bold tracking-widest">Album Title</Label>
                    <div className="relative group">
                      <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                      <Input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-white/5 border-white/10 rounded-xl h-12 pl-12 focus:border-primary/50 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-white/40 uppercase font-bold tracking-widest">Event Date</Label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                      <Input 
                        type="date"
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-white/5 border-white/10 rounded-xl h-12 pl-12 focus:border-primary/50 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-white/40 uppercase font-bold tracking-widest">Project Category / Folder</Label>
                    <div className="relative group">
                      <FolderHeart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                      <Input 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Wedding 2026, Pre-Wedding..."
                        className="bg-white/5 border-white/10 rounded-xl h-12 pl-12 focus:border-primary/50 transition-all font-medium"
                      />
                    </div>
                  </div>
               </div>
            </section>

            <section className="glass p-8 rounded-[2rem] border-white/5 space-y-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FF9933]/10 flex items-center justify-center text-[#FF9933]">
                     <Music2 className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold italic">Soundtrack Settings</h2>
               </div>

                <div className="space-y-4">
                  <input
                    type="file"
                    ref={musicInputRef}
                    onChange={handleMusicUpload}
                    accept="audio/*"
                    className="hidden"
                  />
                  
                  {bgMusicUrl ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">Project Soundtrack</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest truncate">{bgMusicUrl.split('/').pop()?.split('?')[0] || 'Custom Audio Active'}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setBgMusicUrl('')}
                          className="text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button
                        onClick={() => musicInputRef.current?.click()}
                        disabled={uploadingMusic}
                        className="w-full h-12 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white/60 font-bold text-xs gap-2"
                      >
                        {uploadingMusic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                        Change Soundtrack
                      </Button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => musicInputRef.current?.click()}
                      className="group cursor-pointer border-2 border-dashed border-white/10 hover:border-primary/50 rounded-[1.5rem] p-10 text-center transition-all bg-white/[0.02] hover:bg-primary/5"
                    >
                      {uploadingMusic ? (
                        <div className="space-y-4">
                          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                          <p className="text-xs font-bold uppercase tracking-widest text-primary">Uploading track...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-white/20 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                             <CloudUpload className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">Upload Custom Audio</p>
                            <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">MP3, WAV under 15MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </section>
          </div>

          {/* Re-order Area */}
          <div className="lg:col-span-2 space-y-8">
            <section className="glass p-8 rounded-[2.5rem] border-white/5">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                       <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div>
                       <h2 className="text-lg font-bold">Re-Arrange Sheets</h2>
                       <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">Drag and drop to change spread sequence</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                     {files.length} Spreads
                  </div>
               </div>

               <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-4">
                 {files.map((file) => (
                   <Reorder.Item 
                     key={file.id} 
                     value={file}
                     className="group cursor-grab active:cursor-grabbing"
                   >
                     <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl p-4 flex items-center gap-6 transition-colors shadow-lg"
                     >
                        <div className="flex items-center gap-4">
                           <div className="text-[10px] font-black text-white/20 italic group-hover:text-primary transition-colors">
                             ORDER {files.indexOf(file) + 1}
                           </div>
                           <GripHorizontal className="w-5 h-5 text-white/10 group-hover:text-white/40" />
                        </div>

                        <div className="h-20 aspect-[12/18] rounded-lg overflow-hidden border border-white/5 bg-black/40 shadow-inner">
                           <img 
                             src={file.filePath} 
                             alt="Sheet Thumbnail" 
                             className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                           />
                        </div>

                        <div className="flex-1">
                           <p className="text-xs font-bold text-white/60 truncate max-w-[200px]">{file.filePath.split('/').pop()?.split('?')[0]}</p>
                           <p className="text-[10px] text-white/20 uppercase tracking-widest font-black mt-1">Status: Optimized</p>
                        </div>

                        <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <ImageIcon className="w-4 h-4 text-white/20" />
                        </div>
                     </motion.div>
                   </Reorder.Item>
                 ))}
               </Reorder.Group>

               {files.length === 0 && (
                 <div className="py-20 text-center space-y-4 opacity-40">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-white/10" />
                    <p className="text-sm font-medium tracking-widest uppercase">Initializing Canvas...</p>
                 </div>
               )}
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
