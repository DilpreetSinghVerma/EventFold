import { Link } from 'wouter';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, QrCode, Eye, Trash2, LayoutGrid, Calendar, LogOut, Settings as SettingsIcon, Lock, Loader2, Sparkles, User as UserIcon, Crown, Copy, Download, Share2, Check, ShieldAlert, BarChart3, FolderHeart, ChevronDown, Clock, TrendingUp, Building2, AlertTriangle } from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from '@/lib/auth';
import { ContactModal } from '@/components/ContactModal';
import { useQueryClient } from '@tanstack/react-query';

function ClientBrandingModalContent({ album, onSaved }: { album: any, onSaved: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"].includes(user?.email || "");
  const [name, setName] = useState(album.customBusinessName || '');
  const [whatsApp, setWhatsApp] = useState(album.customContactWhatsApp || '');
  const [logo, setLogo] = useState(album.customBusinessLogo || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onDropLogo = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('logo', file);
    setUploading(true);
    try {
      const res = await fetch(`/api/albums/${album.id}/client-logo`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setLogo(data.logoUrl);
      } else {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        alert(`Logo upload failed: ${err.error || 'Server Error'}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }, [album.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropLogo,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/albums/${album.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customBusinessName: name.trim() || null,
          customBusinessLogo: logo || null,
          customContactWhatsApp: whatsApp.trim() || null,
        }),
      });
      if (res.ok) {
        onSaved();
      } else {
        alert('Failed to save branding settings.');
      }
    } catch (e) {
      alert('Failed to connect to backend.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-emerald-400">
          <Building2 className="w-5 h-5" /> Client Studio Branding
        </DialogTitle>
        <DialogDescription className="text-white/40 text-[10px] font-black uppercase tracking-widest">
          Configure branding for this album (Overrides your studio settings)
        </DialogDescription>
      </DialogHeader>

      {album.isLabAlbum !== 1 && !isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-bold mb-1">Personal Album Upgrade</p>
            <p className="text-white/60 leading-relaxed">This album was created as a personal album. Saving branding changes will consume **1 Lab credit** to upgrade it to a Lab album.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Client Studio Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Royale Wedding Studio"
            className="h-11 bg-black/40 border-white/5 rounded-xl text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Client WhatsApp Number</label>
          <Input
            value={whatsApp}
            onChange={(e) => setWhatsApp(e.target.value)}
            placeholder="e.g. 919876543210"
            className="h-11 bg-black/40 border-white/5 rounded-xl text-sm text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Client Logo</label>
          <div
            {...getRootProps()}
            className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
              isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <input {...getInputProps()} />
            {logo ? (
              <div className="flex items-center justify-center gap-4">
                <img src={logo} alt="Client Logo" className="h-10 w-auto object-contain rounded-md" />
                <span className="text-xs text-white/40 font-bold">Drag to change logo</span>
              </div>
            ) : (
              <div className="text-xs text-white/40 font-bold">
                {uploading ? 'Uploading...' : 'Drag & drop client logo here, or click to upload'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs"
        >
          {saving ? 'Saving...' : 'Save Client Branding'}
        </Button>
      </div>
    </div>
  );
}

function TransferToLabModalContent({ album, onSaved }: { album: any, onSaved: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState(false);
  const isAdmin = user?.role === 'admin' || ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"].includes(user?.email || "");

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch(`/api/albums/${album.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLabAlbum: 1 }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        onSaved();
      } else {
        const err = await res.json().catch(() => ({ error: 'Upgrade failed' }));
        alert(`Upgrade failed: ${err.message || err.error || 'Server Error'}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-cyan-400">
          <Building2 className="w-5 h-5 animate-pulse" /> Transfer to Lab Dashboard
        </DialogTitle>
        <DialogDescription className="text-white/40 text-[10px] font-black uppercase tracking-widest">
          Move Personal Album to Lab Owner Suite
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-sm">
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-3">
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-cyan-400" />
          <div>
            <p className="font-bold mb-1">Move to Lab Suite</p>
            <p className="text-white/60 leading-relaxed font-sans">
              This action will move the album **"{album.title}"** to your **Lab Owner Suite** dashboard.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-3">
          <Check className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <p className="font-bold mb-1">No Broken Links or QR Codes</p>
            <p className="text-white/60 leading-relaxed font-sans">
              The album ID, URL, and QR code remain **exactly identical**. Your client won't face any interruption.
            </p>
          </div>
        </div>

        {!isAdmin && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse text-amber-400" />
            <div>
              <p className="font-bold mb-1 text-amber-400">Credit Cost: 1 Credit</p>
              <p className="text-white/60 leading-relaxed font-sans">
                Upgrading this album will consume **1 Lab credit**. You currently have **{user?.credits || 0} credits** available.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <Button
          onClick={handleUpgrade}
          disabled={upgrading || (!isAdmin && (user?.credits || 0) <= 0)}
          className="h-11 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs active:scale-95 transition-transform"
        >
          {upgrading ? 'Upgrading...' : (!isAdmin && (user?.credits || 0) <= 0 ? 'Insufficient Credits' : 'Confirm & Transfer (1 Credit)')}
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout, buyAlbumCredit, startRazorpayCheckout } = useAuth();
  const [albums, setAlbums] = useState<any[]>([]);
  const [dashboardMode, setDashboardMode] = useState<'personal' | 'lab'>('personal');
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [upgradingLifetimeId, setUpgradingLifetimeId] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin' || ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"].includes(user?.email || "");
  const isLabPlan = ['lab_monthly', 'lab_half_yearly', 'lab_yearly', 'lab_unlimited'].includes(user?.plan || '') || isAdmin;
  const modeFilteredAlbums = albums.filter(album => 
    dashboardMode === 'lab' ? album.isLabAlbum === 1 : album.isLabAlbum !== 1
  );
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [studioNameInput, setStudioNameInput] = useState('');
  const [savingStudioName, setSavingStudioName] = useState(false);
  const [studioNameSaved, setStudioNameSaved] = useState(false);
  const [studioNameError, setStudioNameError] = useState('');

  // Parse URL for success/cancel params
  const { search } = typeof window !== 'undefined' ? window.location : { search: '' };
  const params = new URLSearchParams(search);
  const success = params.get('success');

  const fetchAlbums = async () => {
    try {
      // Check health first to see if cloud sync is active
      const healthRes = await fetch('/api/health').catch(() => null);
      if (healthRes && healthRes.ok) {
        const health = await healthRes.json();
        setHealthData(health);
        setDbConnected(health.database === 'connected');
      } else {
        setDbConnected(false);
      }

      const response = await fetch('/api/albums');
      if (response.status === 401) return;
      if (!response.ok) throw new Error('Failed to fetch albums');
      const data = await response.json();
      setAlbums(data);
    } catch (e) {
      console.error("Dashboard Sync Error:", e);
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      setStudioNameInput(data?.businessName || '');
    } catch (e) { }
  };

  // Validates studio name — same rule enforced server-side too.
  // Must be 4+ chars and contain at least 2 real letters.
  // Blocks: ".", "..", "xyz", "123", "ab", etc.
  const isValidStudioName = (name: string) => {
    const t = name.trim();
    const letters = (t.match(/[a-zA-Z]/g) || []).length;
    return t.length >= 4 && letters >= 2 && t !== 'EventFold Studio';
  };

  const saveStudioName = async () => {
    const name = studioNameInput.trim();
    if (!isValidStudioName(name)) {
      setStudioNameError('Enter a real studio name — at least 4 characters with letters.');
      return;
    }
    setStudioNameError('');
    setSavingStudioName(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: name }),
      });
      if (res.ok) {
        setSettings((prev: any) => ({ ...prev, businessName: name }));
        setStudioNameSaved(true);
        setTimeout(() => setStudioNameSaved(false), 2500);
      }
    } catch (e) {}
    finally { setSavingStudioName(false); }
  };

  useEffect(() => {
    fetchAlbums();
    fetchSettings();
    if (success === 'true') {
      setTimeout(() => {
        window.history.replaceState({}, '', '/dashboard');
      }, 3000);
    }
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/albums/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setAlbums(albums.filter(a => a.id !== id));
      }
    } catch (e) {
      alert('Failed to delete album');
    }
  };


  const AlbumCard = ({ album, index }: { album: any, index: number }) => {
    const frontCover = album.files?.find((f: any) => f.fileType === 'cover_front')?.filePath;
    const coverUrl = frontCover ? ((frontCover.startsWith('/') || frontCover.startsWith('http')) ? frontCover : `/${frontCover}`) : '';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group relative"
      >
        <Card className={`overflow-hidden border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 shadow-2xl rounded-3xl group ${dashboardMode === 'lab' ? 'border-emerald-500/15 bg-emerald-950/5 hover:bg-emerald-950/10 hover:border-emerald-500/30' : ''}`}>
          <div className="relative aspect-[4/5] overflow-hidden">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={album.title}
                className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20">
                <LayoutGrid className="w-12 h-12" />
              </div>
            )}

            {/* Category Tag */}
            <div className="absolute top-4 right-4 z-20">
              <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[9px] font-black uppercase tracking-widest text-primary/80 px-2 py-0.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-all duration-500">
                {album.category || 'Uncategorized'}
              </Badge>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-80 lg:opacity-60 lg:group-hover:opacity-80 transition-opacity" />

            <div className="absolute inset-0 flex flex-col justify-end p-3 lg:p-6 translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 transition-transform duration-500 overflow-hidden">
              <div className="flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-100">
                <Link href={`/album/${album.id}`} className="w-full">
                  <Button className="w-full h-10 lg:h-11 rounded-xl bg-white text-black hover:bg-white/90 font-bold active:scale-95 transition-transform text-[11px] lg:text-sm shadow-xl">
                    <Eye className="w-4 h-4 mr-2" /> Open Album
                  </Button>
                </Link>

                {dashboardMode === 'lab' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full h-10 lg:h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold active:scale-95 transition-all text-[11px] lg:text-xs shadow-lg shadow-emerald-500/20 border-none">
                        <Building2 className="w-4 h-4 mr-2" /> Client Branding
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-[#0a0f0c] border-emerald-500/20 text-white rounded-[3rem] p-6 lg:p-8">
                      <ClientBrandingModalContent album={album} onSaved={fetchAlbums} />
                    </DialogContent>
                  </Dialog>
                )}

                {dashboardMode === 'personal' && isLabPlan && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full h-10 lg:h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold active:scale-95 transition-all text-[11px] lg:text-xs shadow-lg shadow-blue-500/20 border-none">
                        <Building2 className="w-4 h-4 mr-2" /> Transfer to Lab
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-[#0a0d14] border-blue-500/20 text-white rounded-[3rem] p-6 lg:p-8">
                      <TransferToLabModalContent album={album} onSaved={fetchAlbums} />
                    </DialogContent>
                  </Dialog>
                )}

                <div className="flex items-center gap-1.5 lg:gap-2">
                  <Link href={`/album/${album.id}/edit`} className="flex-1">
                    <Button variant="secondary" size="icon" title="Edit Album" className="w-full h-10 lg:h-11 rounded-xl glass border-none hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-1">
                      <SettingsIcon className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-black uppercase tracking-tighter hidden lg:inline">Edit</span>
                    </Button>
                  </Link>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="icon" title="View Analytics" className="flex-1 h-10 lg:h-11 rounded-xl glass border-none hover:bg-primary/20 hover:text-primary active:scale-95 transition-all flex items-center justify-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-black uppercase tracking-tighter hidden lg:inline">Stats</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-[#0a0a0b] border-white/10 text-white rounded-[2rem] p-6 lg:p-8">
                      <DialogHeader className="mb-6 lg:mb-8">
                        <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <TrendingUp className="w-5 h-5" />
                         </div>
                         <div>
                            <DialogTitle className="text-2xl font-bold">Studio Insights</DialogTitle>
                            <DialogDescription className="text-white/40 uppercase text-[10px] font-black tracking-widest">Analytics report for {album.title}</DialogDescription>
                         </div>
                      </div>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-3 gap-4 mb-10">
                       <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 px-1">Spread Performance</h4>
                       <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {album.files?.filter((f: any) => f.fileType === 'sheet').map((sheet: any, idx: number) => (
                             <div key={sheet.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40">
                                      <img src={sheet.filePath} className="w-full h-full object-cover opacity-60" />
                                   </div>
                                   <div>
                                      <p className="text-xs font-bold text-white/80">Spread #{idx + 1}</p>
                                      <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Index: {sheet.orderIndex}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-xs font-bold text-primary">{sheet.views || 0}</p>
                                   <p className="text-[9px] text-white/40 font-bold uppercase">Views</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {/* Admin Demo Management */}
                {["admin@eventfold.com", "dilpreetsinghverma@gmail.com"].includes(user?.email || "") && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="icon" className={`rounded-xl glass border-none ${album.isPublicDemo === 'true' ? 'text-primary' : 'text-white/40'}`}>
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-[#0a0a0b] border-white/10 text-white rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Public Demo Management</DialogTitle>
                        <DialogDescription className="text-white/40">
                          Configure how this album appears in the public demos gallery.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="font-bold">Show in Public Gallery</span>
                          <Button 
                            onClick={async () => {
                              const res = await fetch(`/api/albums/${album.id}/demo-status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isPublicDemo: album.isPublicDemo !== 'true' })
                              });
                              if (res.ok) fetchAlbums();
                            }}
                            className={`rounded-xl font-bold ${album.isPublicDemo === 'true' ? 'bg-primary' : 'bg-white/10'}`}
                          >
                            {album.isPublicDemo === 'true' ? 'Enabled' : 'Disabled'}
                          </Button>
                        </div>
                        {album.isPublicDemo === 'true' && (
                          <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Demo Category</label>
                            <div className="flex flex-wrap gap-2">
                              {['Wedding', 'Pre-Wedding', 'Birthday', 'Event'].map(cat => (
                                <Button
                                  key={cat}
                                  variant="ghost"
                                  onClick={async () => {
                                    const res = await fetch(`/api/albums/${album.id}/demo-status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isPublicDemo: true, demoCategory: cat })
                                    });
                                    if (res.ok) fetchAlbums();
                                  }}
                                  className={`rounded-xl text-xs h-9 border border-white/5 ${album.demoCategory === cat ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-white/40'}`}
                                >
                                  {cat}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-xl glass border-none">
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-[#0a0a0b] border-white/10 text-white rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">Share Memories</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-8 space-y-8">
                      <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl shadow-primary/30 qr-container-target scale-110">
                        <QRCodeSVG
                          value={`${window.location.origin}/album/${album.id}?shared=true`}
                          size={200}
                          level="H"
                          fgColor="#000000"
                        />
                      </div>
                      <div className="flex flex-col gap-3 w-full">
                        <Button
                          onClick={() => {
                            const url = `${window.location.origin}/album/${album.id}?shared=true`;
                            navigator.clipboard.writeText(url);
                            setCopiedId(album.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="w-full rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 h-12 flex items-center justify-center gap-2"
                        >
                          {copiedId === album.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          {copiedId === album.id ? 'Copied Link' : 'Copy Shareable Link'}
                        </Button>

                        <Button
                          onClick={() => {
                            const svg = document.querySelector('.qr-container-target svg') as SVGElement;
                            if (!svg) return;
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const img = new Image();
                            img.onload = () => {
                              canvas.width = 1200;
                              canvas.height = 1200;
                              if (ctx) {
                                ctx.fillStyle = 'white';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 100, 100, 1000, 1000);
                                const link = document.createElement('a');
                                link.download = `QR-${album.title}.png`;
                                link.href = canvas.toDataURL('image/png');
                                link.click();
                              }
                            };
                            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                          }}
                          className="w-full rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 h-12 flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Download QR Code
                        </Button>

                        <Button
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (!printWindow) return;
                            const qrCardHtml = `
                                <html>
                                  <head>
                                    <title>Premium Luxury Table Card - ${album.title}</title>
                                    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:wght@400;700&family=Lato:wght@300;400&display=swap" rel="stylesheet">
                                    <style>
                                      body { margin: 0; background: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Lato', sans-serif; -webkit-print-color-adjust: exact; }
                                      .card { 
                                        width: 500px; 
                                        height: 750px; 
                                        background: white; 
                                        padding: 40px; 
                                        display: flex; 
                                        flex-direction: column; 
                                        align-items: center; 
                                        justify-content: space-between; 
                                        text-align: center; 
                                        box-sizing: border-box; 
                                        position: relative;
                                        box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                                      }
                                      .luxury-border { 
                                        position: absolute; 
                                        inset: 20px; 
                                        border: 1px solid #d4af37; 
                                        pointer-events: none;
                                      }
                                      .luxury-border::after {
                                        content: '';
                                        position: absolute;
                                        inset: 3px;
                                        border: 2px solid #d4af37;
                                        clip-path: polygon(0 0, 30% 0, 30% 1%, 1% 1%, 1% 30%, 0 30%, 0 0, 70% 0, 70% 1%, 99% 1%, 99% 30%, 100% 30%, 100% 0, 100% 70%, 99% 70%, 99% 99%, 70% 99%, 70% 100%, 100% 100%, 0 100%, 0 70%, 1% 70%, 1% 99%, 30% 99%, 30% 100%, 0 100%);
                                      }
                                      .header { margin-top: 20px; }
                                      .logo { height: 60px; margin-bottom: 20px; border-radius: 12px; }
                                      .divider { width: 80px; height: 1px; background: linear-gradient(to right, transparent, #d4af37, transparent); margin: 20px auto; }
                                      .title { font-family: 'Cinzel', serif; font-size: 36px; font-weight: 700; color: #1a1a1a; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
                                      .subtitle { font-family: 'Playfair Display', serif; font-size: 16px; font-style: italic; color: #d4af37; margin-bottom: 30px; }
                                      .qr-section { position: relative; padding: 20px; }
                                      .qr-frame { 
                                        padding: 20px; 
                                        background: white; 
                                        border-radius: 20px; 
                                        box-shadow: 0 10px 30px rgba(212, 175, 55, 0.1);
                                        border: 1px solid #fcfaf0;
                                      }
                                      .instruction { 
                                        font-family: 'Cinzel', serif;
                                        font-size: 16px; 
                                        color: #444; 
                                        letter-spacing: 2px; 
                                        text-transform: uppercase;
                                        margin-top: 30px;
                                      }
                                      .scan-hint { font-size: 12px; color: #999; margin-top: 8px; font-weight: 300; }
                                      .footer { margin-bottom: 20px; }
                                      .branding { font-size: 10px; letter-spacing: 3px; color: #ccc; text-transform: uppercase; }
                                      @media print { 
                                        body { background: white; padding: 0; }
                                        .card { box-shadow: none; border: none; width: 100%; height: 100vh; }
                                        .no-print { display: none; }
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="card" id="luxury-card">
                                      <div class="luxury-border"></div>
                                      <div class="header">
                                        <img src="${window.location.origin}/branding material/bg version.png" class="logo" />
                                        <div class="title">${album.title}</div>
                                        <div class="subtitle">Digital Cinema Collection</div>
                                        <div class="divider"></div>
                                      </div>
                                      
                                      <div class="qr-section">
                                        <div class="qr-frame">
                                          <div id="qr-target"></div>
                                        </div>
                                      </div>
                                      
                                      <div class="footer">
                                        <div class="instruction">Scan to Relive</div>
                                        <div class="scan-hint">Open Camera & Point at QR Code</div>
                                        <div style="margin: 20px 0; height: 1px; width: 30px; background: #eee; margin-left: auto; margin-right: auto;"></div>
                                        <div class="branding">EventFold Cinematic Engine</div>
                                      </div>
                                      
                                      <button class="no-print" style="position:fixed; top: 40px; right: 200px; padding: 10px 20px; background: #1a1a1a; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-family: 'Lato'; box-shadow: 0 10px 30px rgba(0,0,0,0.2);" onclick="downloadCardImage()">Download Image</button>
                                      <button class="no-print" style="position:fixed; top: 40px; right: 40px; padding: 10px 20px; background: #1a1a1a; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-family: 'Lato'; box-shadow: 0 10px 30px rgba(0,0,0,0.2);" onclick="window.print()">Print Card</button>
                                    </div>
                                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                                    <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
                                    <script>
                                      new QRCode(document.getElementById("qr-target"), {
                                        text: "${window.location.origin}/album/${album.id}?shared=true",
                                        width: 200,
                                        height: 200,
                                        colorDark : "#000000",
                                        colorLight : "#ffffff",
                                        correctLevel : QRCode.CorrectLevel.H
                                      });

                                      function downloadCardImage() {
                                        const cardElement = document.getElementById('luxury-card');
                                        html2canvas(cardElement, {
                                          scale: 2, // Increase scale for better quality
                                          useCORS: true, // Important for images loaded from other origins
                                          allowTaint: true, // Allow tainting the canvas if images are from different origin
                                          ignoreElements: (element) => element.classList.contains('no-print') // Ignore buttons
                                        }).then(canvas => {
                                          const link = document.createElement('a');
                                          link.download = 'Luxury_QR_Card_${album.title}.png';
                                          link.href = canvas.toDataURL('image/png');
                                          link.click();
                                        });
                                      }
                                    </script>
                                  </body>
                                </html>
                              `;
                            printWindow.document.write(qrCardHtml);
                            printWindow.document.close();
                          }}
                          className="w-full rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-bold h-14 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group transition-all"
                        >
                          <Crown className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          Generate Luxury QR Card
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

          <CardContent className="pt-4 lg:pt-6 px-4 lg:px-6 relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-4 mb-2">
              <h3 className="text-xs lg:text-xl font-bold group-hover:text-primary transition-colors truncate lg:flex-1">{album.title}</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 lg:py-1 bg-primary/10 border border-primary/20 rounded-lg text-[9px] lg:text-[10px] font-bold text-primary animate-pulse shadow-sm w-fit">
                <Eye className="w-3 h-3" />
                {album.views || 0}
              </div>
            </div>
            {album.expiresAt && (
              <div className="flex flex-col gap-2 mb-2">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter w-fit ${new Date(album.expiresAt) < new Date() ? 'bg-red-500 text-white' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                  <Lock className="w-2 h-2" />
                  {new Date(album.expiresAt) < new Date() ? "TRIAL EXPIRED" : `${Math.ceil((new Date(album.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d Left`}
                </div>
                {new Date(album.expiresAt) < new Date() && (
                  <Button 
                    disabled={upgradingLifetimeId !== null}
                    onClick={async (e) => {
                      e.stopPropagation();
                      const isSubscribed = user && user.plan !== 'free' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();
                      
                      const confirmMsg = isSubscribed 
                        ? "You are a subscriber! Upgrade this album to Lifetime Hosting for FREE?" 
                        : "Use 1 credit to upgrade this album to Lifetime Hosting?";

                      if (window.confirm(confirmMsg)) {
                        setUpgradingLifetimeId(album.id);
                        try {
                          const res = await fetch(`/api/albums/${album.id}/lifetime`, { method: 'POST' });
                          if (res.ok) {
                            fetchAlbums();
                          } else {
                            const err = await res.json().catch(() => ({ error: "Upgrade failed" }));
                            alert(err.error || "Upgrade failed");
                          }
                        } catch (err: any) {
                          alert(`Network error: ${err.message}`);
                        } finally {
                          setUpgradingLifetimeId(null);
                        }
                      }
                    }}
                    className="h-7 text-[8px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-lg w-full"
                  >
                    <Crown className="w-3 h-3 mr-1" /> {upgradingLifetimeId === album.id ? "Upgrading..." : (user && user.plan !== 'free' ? "Upgrade for Free" : "Upgrade to Lifetime")}
                  </Button>
                )}
              </div>
            )}
            <div className="flex items-center text-[9px] lg:text-xs text-white/40 uppercase tracking-widest font-medium">
              <Calendar className="w-3 h-3 mr-2 hidden lg:block" />
              {new Date(album.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </div>
          </CardContent>

          <CardFooter className="pt-0 pb-6">
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-white/20 hover:text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={() => handleDelete(album.id, album.title)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

  return (
    <div className={`min-h-screen ${dashboardMode === 'lab' ? 'bg-[#030906]' : 'bg-background'} text-foreground pb-20 transition-colors duration-700`}>
      {/* Decorative Orbs */}
      <div className={`fixed top-0 right-0 w-[500px] h-[500px] ${dashboardMode === 'lab' ? 'bg-emerald-500/10' : 'bg-primary/5'} rounded-full blur-[120px] pointer-events-none transition-all duration-700`} />
      <div className={`fixed bottom-0 left-0 w-[500px] h-[500px] ${dashboardMode === 'lab' ? 'bg-teal-500/5' : 'bg-indigo-500/5'} rounded-full blur-[120px] pointer-events-none transition-all duration-700`} />

      {/* Navbar Overlay */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <div className="h-14 group cursor-pointer py-0.5">
              <img
                src="/branding material/without bg version.png"
                alt="EventFold"
                className="h-full w-auto object-contain transition-transform group-hover:scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              />
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-6 overflow-x-auto no-scrollbar py-2">
            {dbConnected === false && (
              <div className="flex flex-col items-end shrink-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-destructive/10 border border-destructive/20 rounded-full text-destructive text-[8px] md:text-[10px] font-bold hover:bg-destructive/20 transition-colors cursor-help">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-destructive" />
                      OFFLINE
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-[#0a0a0b] border-white/10 text-white rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-destructive">Cloud Connectivity Trace</DialogTitle>
                      <DialogDescription className="text-white/40">
                        Diagnostic data from the cinematic engine.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 p-4 font-mono text-[10px]">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-primary mb-1 uppercase tracking-widest font-black">Environment Metrics</p>
                        <pre className="text-white/60">{JSON.stringify(healthData?.env, null, 2)}</pre>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 max-h-40 overflow-auto">
                        <p className="text-destructive mb-1 uppercase tracking-widest font-black">Connection Error</p>
                        <p className="text-red-400 break-words">{healthData?.error || "No URL detected. System is running on volatile MemStorage."}</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-[9px] text-white/20 uppercase text-center">Check Vercel Environment Variables for DATABASE_URL</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {dbConnected === true && (
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-[8px] md:text-[10px] font-bold">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse" />
                  CLOUD
                </div>
              </div>
            )}

            <Link href="/settings">
              <Button variant="ghost" className="rounded-xl text-white/40 hover:text-white glass border-none shrink-0 h-9 px-3 text-[10px] uppercase font-bold">
                <SettingsIcon className="w-3.5 h-3.5 mr-2" /> Settings
              </Button>
            </Link>

            <ContactModal>
              <Button variant="ghost" className="rounded-xl text-white/40 hover:text-white glass border-none shrink-0 h-9 px-3 text-[10px] uppercase font-bold">
                Support
              </Button>
            </ContactModal>
            
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" className="rounded-xl text-primary font-bold bg-primary/10 border border-primary/20 hover:bg-primary/20 shrink-0 h-9 px-3 text-[10px] uppercase">
                  Terminal
                </Button>
              </Link>
            )}

            {isAdmin && (
              <Button
                variant="ghost"
                className="rounded-xl text-primary/60 hover:text-primary glass border-none shrink-0 h-9 px-3 text-[10px] uppercase font-bold"
                onClick={async () => {
                  if (window.confirm("SYNC DATABASE STRUCTURE?\n\nThis will update your database columns to match the latest features.")) {
                    const res = await fetch('/api/admin/db-sync', { method: 'POST' });
                    if (res.ok) alert("Synced!");
                  }
                }}
              >
                Sync DB
              </Button>
            )}

            <Button onClick={() => logout()} variant="ghost" className="rounded-xl text-white/40 hover:text-red-400 glass border-none shrink-0 h-9 px-3 text-[10px] uppercase font-bold">
              Sign Out
            </Button>

            <Link href={settings && settings.businessName && settings.businessName.trim() !== 'EventFold Studio' ? `/create?mode=${dashboardMode}` : '/settings'}>
              <Button
                className={`rounded-xl px-4 md:px-6 shrink-0 h-9 text-[10px] uppercase font-bold ${
                  settings && settings.businessName && settings.businessName.trim() !== 'EventFold Studio'
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30'
                }`}
              >
                {settings && settings.businessName && settings.businessName.trim() !== 'EventFold Studio' ? (
                  <><Plus className="w-3.5 h-3.5 mr-2" /> New Album</>
                ) : (
                  <><Building2 className="w-3.5 h-3.5 mr-2" /> Set Studio Name First</>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {success === 'true' && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl flex items-center justify-between">
            <span className="font-bold">Payment Successful! Your credit has been added.</span>
            <Button variant="ghost" size="sm" onClick={() => window.history.replaceState({}, '', '/dashboard')}>Dismiss</Button>
          </div>
        </div>
      )}

      {/* ── Studio Name Quick-Set Banner ─────────────────────────────────────────
           Inline editor — no need to navigate to Settings.
      ──────────────────────────────────────────────────────────────────────── */}
      {!isAdmin && settings !== null && (!settings?.businessName || settings.businessName.trim() === 'EventFold Studio') && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-4 md:p-6"
          >
            <div className="absolute inset-0 bg-amber-500/5 blur-2xl pointer-events-none" />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="font-bold text-amber-300 text-sm">Enter your studio name to start creating albums</p>
              </div>
              <div className="flex gap-2">
                <input
                  id="dashboard-studio-name"
                  type="text"
                  autoFocus
                  value={studioNameInput}
                  onChange={e => { setStudioNameInput(e.target.value); setStudioNameError(''); }}
                  onKeyDown={e => e.key === 'Enter' && saveStudioName()}
                  placeholder="e.g. Royale Photography Studio"
                  className={`flex-1 h-11 rounded-xl bg-black/40 text-white placeholder:text-white/20 px-4 text-sm font-medium focus:outline-none transition-colors ${studioNameError ? 'border border-red-500/60 focus:border-red-400' : 'border border-amber-500/40 focus:border-amber-400/70'}`}
                />
                <Button
                  onClick={saveStudioName}
                  disabled={savingStudioName || !studioNameInput.trim()}
                  className="shrink-0 h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-40"
                >
                  {savingStudioName ? <Loader2 className="w-4 h-4 animate-spin" /> : studioNameSaved ? <Check className="w-4 h-4" /> : 'Save'}
                </Button>
              </div>
              {studioNameError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {studioNameError}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}


      <header className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-bold font-mono text-primary uppercase tracking-[0.2em]">Dashboard Terminal</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-start md:items-center gap-4">
              <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">Welcome back, <span className="text-primary">{user?.name?.split(' ')[0]}</span></h2>
              {isLabPlan && (
                <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5 shadow-inner shrink-0 mt-2 md:mt-0">
                  <button
                    onClick={() => setDashboardMode('personal')}
                    className={`rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${dashboardMode === 'personal' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    Personal
                  </button>
                  <button
                    onClick={() => setDashboardMode('lab')}
                    className={`rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${dashboardMode === 'lab' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white'}`}
                  >
                    Lab Owner Suite
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6">
              {dbConnected === false && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Cloud Offline</span>
                </div>
              )}
              {dbConnected === true && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Cloud Active</span>
                </div>
              )}
              <div className="w-px h-6 bg-white/10 mx-2" />
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {isAdmin ? (
                  dashboardMode === 'lab' ? (
                    <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm font-bold text-emerald-400 shadow-2xl shadow-emerald-500/10 transition-all hover:scale-[1.02]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mr-1">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      </div>
                      LAB UNLIMITED · FOUNDER ACCESS
                      <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-md tracking-tighter uppercase">Unlimited</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-6 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-sm font-bold text-cyan-300 shadow-2xl shadow-cyan-500/10 transition-all hover:scale-[1.02]">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mr-1">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                      </div>
                      ADMIN MASTER · UNLIMITED CREDITS
                      <span className="ml-2 px-2 py-0.5 bg-cyan-500 text-white text-[8px] font-black rounded-md tracking-tighter uppercase">Founder Access</span>
                    </div>
                  )
                ) : (user?.plan === 'pro' || user?.plan === 'elite') ? (
                  <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl text-sm font-bold text-primary shadow-2xl shadow-primary/10 transition-all hover:scale-[1.01]">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mr-1">
                      <Crown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-tight uppercase opacity-50 mb-0.5">Active Premium Tier</div>
                      <div className="flex items-center gap-2 font-black leading-none uppercase">
                        {user?.plan === 'elite' ? 'ELITE LABS' : 'STORYTELLER PRO'} UNLIMITED
                        <span className="px-1.5 py-0.5 rounded-md bg-primary text-white text-[8px] animate-pulse">ACTIVE</span>
                      </div>
                      {user?.subscriptionExpiresAt && (
                        <div className="text-[9px] text-white/40 mt-1 uppercase tracking-widest font-bold">
                          Expires: {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold shadow-xl transition-all ${user?.credits === 0 ? 'bg-red-500/10 border border-red-500/40 text-red-500 shadow-red-500/10 scale-105' : 'bg-primary/10 border border-primary/20 text-primary shadow-primary/10'}`}>
                      <LayoutGrid className={`w-4 h-4 ${user?.credits === 0 ? 'animate-pulse' : ''}`} />
                      {user?.credits || 0} ALBUM CREDITS {user?.credits === 0 ? 'REMAINING' : 'AVAILABLE'}
                    </div>
                    <Button
                      onClick={buyAlbumCredit}
                      className="h-10 rounded-full bg-white/5 backdrop-blur-md text-white hover:bg-white/10 border border-white/10 font-bold px-6 group transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" /> BUY 1 CREDIT (₹99) <span className="ml-2 text-[10px] line-through opacity-50">₹199</span>
                    </Button>
                    <Button
                      onClick={() => startRazorpayCheckout('monthly')}
                      className="h-10 rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-xl shadow-primary/20 relative group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                      <Crown className="w-4 h-4 mr-2" /> UPGRADE TO UNLIMITED (₹199) <span className="ml-2 text-[10px] line-through opacity-70">₹499</span>
                      <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-cyan-400 text-black text-[8px] font-black rounded-full">HOT</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {dashboardMode === 'lab' ? 'Lab Owner Suite' : 'My Collections'}
          </h1>
          <p className="text-white/40">
            {dashboardMode === 'lab' 
              ? 'Manage B2B digital client albums with custom branding.' 
              : 'Manage and share your digital storytelling projects.'}
          </p>
        </div>

        {/* Gallery Controls: Categories & Search */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-md">
           <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
              <FolderHeart className="w-4 h-4 text-primary mr-2 shrink-0 hidden md:block" />
              {['All', ...Array.from(new Set(modeFilteredAlbums.map(a => a.category).filter(Boolean)))].map(cat => (
                 <Button
                    key={cat}
                    variant={activeCategory === cat ? 'default' : 'ghost'}
                    onClick={() => setActiveCategory(cat as string)}
                    className={`rounded-xl px-5 h-10 text-[10px] font-black uppercase tracking-widest transition-all ${
                       activeCategory === cat 
                       ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                       : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                 >
                    {cat}
                 </Button>
              ))}
           </div>
           
           <div className="relative w-full md:w-80 group">
              <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
              <Input 
                 placeholder="SEARCH GALLERIES..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-11 pl-12 bg-black/40 border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-primary/20 transition-all"
              />
           </div>
        </div>

        {modeFilteredAlbums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 glass rounded-[3rem] border-dashed border-white/10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <LayoutGrid className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {dashboardMode === 'lab' ? 'Lab Suite Empty' : 'Workspace Empty'}
            </h3>
            <p className="text-white/40 mb-8 max-w-sm text-center">
              {dashboardMode === 'lab' 
                ? 'Your Lab Owner suite has no albums. Create a new album under the Lab tab to begin.' 
                : 'Your digital shelf is waiting for its first masterpiece. Start your journey now.'}
            </p>
            <Link href={settings && settings.businessName && settings.businessName.trim() !== 'EventFold Studio' ? `/create?mode=${dashboardMode}` : '/settings'}>
              <Button size="lg" className="rounded-2xl px-10">
                {settings && settings.businessName && settings.businessName.trim() !== 'EventFold Studio' ? 'Create Album' : 'Configure Studio First'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 pb-32 w-full">
            <AnimatePresence>
              {modeFilteredAlbums.filter(album => {
                 const matchesCategory = activeCategory === 'All' || album.category === activeCategory;
                 const matchesSearch = album.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                       (album.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
                 return matchesCategory && matchesSearch;
              }).map((album, i) => (
                 <AlbumCard key={album.id} album={album} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div >
  );
}
