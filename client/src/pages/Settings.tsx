import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Building2, Lock, Smartphone, Globe, CheckCircle2, Loader2, Sparkles, Upload, X, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

export default function Settings() {
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [settings, setSettings] = useState({
        businessName: '',
        businessLogo: '',
        contactWhatsApp: '',
        adminPassword: '',
    });

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            });
    }, []);

    const onDropLogo = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        const formData = new FormData();
        formData.append('logo', file);

        setUploadingLogo(true);
        try {
            const res = await fetch('/api/settings/logo', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, businessLogo: data.logoUrl }));
            }
        } catch (e) {
            console.error("Logo upload failed", e);
        } finally {
            setUploadingLogo(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onDropLogo,
        accept: { 'image/*': [] },
        multiple: false
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-background text-foreground p-8 pb-32">
            <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-12">
                <Link href="/dashboard">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white glass rounded-xl pr-6 pl-4">
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Button>
                </Link>
                <div className="flex flex-col items-end">
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white/40 uppercase tracking-widest leading-none">Studio Profile</h1>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mt-2">Elite Edition</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Status Sidebar */}
                        <div className="space-y-4">
                            <Card className="glass border-white/5 overflow-hidden">
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                            <img src="/logo.png" alt="EventFold Logo" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Studio</p>
                                            <p className="font-bold truncate max-w-[120px]">{settings.businessName || 'Untitled'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="text-white/40">Branding</span>
                                            <span className={settings.businessLogo ? 'text-green-400' : 'text-orange-400'}>
                                                {settings.businessLogo ? 'Active' : 'Missing Logo'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="text-white/40">WhatsApp</span>
                                            <span className={settings.contactWhatsApp ? 'text-green-400' : 'text-orange-400'}>
                                                {settings.contactWhatsApp ? 'Connected' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="p-6 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20">
                                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> Pro Tip
                                </p>
                                <p className="text-xs text-indigo-200/60 leading-relaxed">
                                    A high-resolution PNG logo looks best on the transparent cinematic viewer.
                                </p>
                            </div>
                        </div>

                        {/* Profile Content */}
                        <div className="md:col-span-2 space-y-8">
                            <Card className="glass border-white/5 overflow-hidden">
                                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                                    <CardTitle>Studio Identity</CardTitle>
                                    <CardDescription>Customize how your business appears to your clients.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    {/* Logo Upload Section */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold uppercase tracking-widest text-white/40">Studio Logo</Label>
                                        <div className="flex flex-col sm:flex-row items-center gap-8">
                                            <div
                                                className={`w-24 h-24 rounded-[1.5rem] border-2 border-dashed transition-all flex items-center justify-center relative overflow-hidden group ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                                                {...getRootProps()}
                                            >
                                                <input {...getInputProps()} />
                                                {settings.businessLogo ? (
                                                    <>
                                                        <img src={settings.businessLogo} alt="Logo" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Upload className="w-6 h-6 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <ImagePlus className="w-8 h-8 text-white/10" />
                                                )}
                                                {uploadingLogo && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-sm font-bold">Studio Branding</p>
                                                <p className="text-xs text-white/40 leading-relaxed">
                                                    Drag and drop your logo file here. Supported formats: PNG, JPG, SVG. We optimize it for you.
                                                </p>
                                                {settings.businessLogo && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 px-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSettings({ ...settings, businessLogo: '' });
                                                        }}
                                                    >
                                                        <X className="w-3 h-3 mr-2" /> Remove Logo
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold uppercase tracking-widest text-white/40">Business Name</Label>
                                        <Input
                                            value={settings.businessName}
                                            onChange={e => setSettings({ ...settings, businessName: e.target.value })}
                                            placeholder="e.g. Royale Photography Studio"
                                            className="bg-white/5 border-white/10 h-14 rounded-2xl text-lg font-medium px-6"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-bold uppercase tracking-widest text-white/40">Contact WhatsApp</Label>
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">Lead Gen active</span>
                                        </div>
                                        <div className="relative">
                                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                            <Input
                                                value={settings.contactWhatsApp}
                                                onChange={e => setSettings({ ...settings, contactWhatsApp: e.target.value })}
                                                placeholder="+91 98765 43210"
                                                className="bg-white/5 border-white/10 h-14 rounded-2xl pl-14 text-lg font-medium"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass border-white/5 overflow-hidden">
                                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                                    <CardTitle>Management Access</CardTitle>
                                    <CardDescription>Internal security for your studio dashboard.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold uppercase tracking-widest text-white/40">Dashboard Passcode</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                            <Input
                                                type="password"
                                                value={settings.adminPassword}
                                                onChange={e => setSettings({ ...settings, adminPassword: e.target.value })}
                                                className="bg-white/5 border-white/10 h-14 rounded-2xl pl-14 text-lg font-mono tracking-widest"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="h-16 rounded-[1.5rem] px-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all shadow-xl shadow-primary/30 active:scale-95"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : success ? <CheckCircle2 className="w-5 h-5 mr-3 text-white" /> : <Save className="w-5 h-5 mr-3" />}
                                    {saving ? 'Synchronizing Profile...' : success ? 'Profile Updated' : 'Push Brand Changes'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
