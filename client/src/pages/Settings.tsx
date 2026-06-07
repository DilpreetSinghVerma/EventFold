import { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Building2, Lock, Smartphone, Globe, CheckCircle2, Loader2, Sparkles, Upload, X, ImagePlus, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/lib/auth';
import { CreditCard, Rocket, Crown, History, ExternalLink } from 'lucide-react';

export default function Settings() {
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const { user, buyAlbumCredit, startRazorpayCheckout } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'billing'>('profile');
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
            const res = await fetch('/api/settings/logo', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, businessLogo: data.logoUrl }));
            } else {
                const err = await res.json().catch(() => ({ error: 'Upload failed' }));
                alert(`Logo upload failed: ${err.error || 'Server Error'}`);
            }
        } catch (e: any) {
            alert(`Network error: ${e.message}`);
        } finally {
            setUploadingLogo(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onDropLogo,
        accept: { 'image/*': [] },
        multiple: false
    });

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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
            } else {
                const err = await res.json().catch(() => ({ error: 'Update failed' }));
                alert(`Settings update failed: ${err.error || 'Server Error'}`);
            }
        } catch (e: any) {
            alert(`Network error: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    const studioNameIsSet =
        settings.businessName &&
        settings.businessName.trim() !== '' &&
        settings.businessName.trim() !== 'EventFold Studio';

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-8 pb-32">
            <header className="max-w-4xl mx-auto w-full flex items-center justify-between mb-10">
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

            <main className="max-w-4xl mx-auto space-y-6">

                {/* ── STUDIO NAME HERO FIELD ──────────────────────────────────────────────
                     This is the most critical setting. It must be set before any album
                     can be created. Shown at the very top, impossible to miss.
                ──────────────────────────────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative rounded-3xl border p-6 md:p-8 overflow-hidden transition-all duration-500 ${
                        studioNameIsSet
                            ? 'border-green-500/20 bg-green-500/5'
                            : 'border-amber-500/40 bg-amber-500/10'
                    }`}
                >
                    {/* Background glow */}
                    <div className={`absolute inset-0 blur-3xl pointer-events-none opacity-20 ${studioNameIsSet ? 'bg-green-500' : 'bg-amber-500'}`} />

                    <div className="relative space-y-5">
                        {/* Header row */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${studioNameIsSet ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                                    <Building2 className={`w-5 h-5 ${studioNameIsSet ? 'text-green-400' : 'text-amber-400'}`} />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">Studio Name</p>
                                    <p className="text-xs text-white/40">Shown on every shared album link</p>
                                </div>
                            </div>

                            {/* Status badge */}
                            <AnimatePresence mode="wait">
                                {studioNameIsSet ? (
                                    <motion.div
                                        key="set"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Active</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="missing"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full animate-pulse"
                                    >
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Required to create albums</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Large name input */}
                        <Input
                            id="studio-name-input"
                            value={settings.businessName}
                            onChange={e => setSettings({ ...settings, businessName: e.target.value })}
                            placeholder="e.g.  Royale Photography Studio"
                            className={`h-16 rounded-2xl text-xl font-bold px-6 transition-all duration-300 ${
                                studioNameIsSet
                                    ? 'bg-green-500/10 border-green-500/30 text-white placeholder:text-white/20 focus:border-green-400/60'
                                    : 'bg-amber-500/10 border-amber-500/40 text-white placeholder:text-amber-200/30 focus:border-amber-400/60'
                            }`}
                            autoFocus={!studioNameIsSet}
                        />

                        {/* Help text + quick save row */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            {!studioNameIsSet ? (
                                <p className="text-xs text-amber-400/70 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    You must set your studio name before creating or sharing albums.
                                </p>
                            ) : (
                                <p className="text-xs text-green-400/60">
                                    ✓ Your studio identity is ready. Clients will see this on every shared album.
                                </p>
                            )}

                            <Button
                                type="button"
                                onClick={() => handleSave()}
                                disabled={saving || !studioNameIsSet}
                                className="shrink-0 h-11 rounded-2xl px-7 bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-40"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : success ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                {saving ? 'Saving...' : success ? 'Saved!' : 'Save Name'}
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* ── REST OF SETTINGS ─────────────────────────────────────────────────── */}
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Status Sidebar */}
                        <div className="space-y-4">
                            <Card className="glass border-white/5 overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-6">
                                        <div className="h-14">
                                            <img src="/branding material/without bg version.png" alt="EventFold" className="h-full w-auto object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Active Studio</p>
                                            <p className={`font-bold truncate text-sm ${studioNameIsSet ? 'text-white' : 'text-amber-400/60 italic'}`}>
                                                {studioNameIsSet ? settings.businessName : 'Not set yet'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mt-4">
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="text-white/40">Studio Name</span>
                                            <span className={studioNameIsSet ? 'text-green-400' : 'text-amber-400'}>{studioNameIsSet ? 'Set ✓' : 'Required'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="text-white/40">Branding</span>
                                            <span className={settings.businessLogo ? 'text-green-400' : 'text-orange-400'}>{settings.businessLogo ? 'Active' : 'Missing Logo'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="text-white/40">WhatsApp</span>
                                            <span className={settings.contactWhatsApp ? 'text-green-400' : 'text-orange-400'}>{settings.contactWhatsApp ? 'Connected' : 'Offline'}</span>
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

                            <div className="space-y-2 pt-4">
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full justify-start rounded-xl h-12 gap-3 transition-all ${activeTab === 'profile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    <Building2 className="w-4 h-4" /> Studio Identity
                                </Button>
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={() => setActiveTab('billing')}
                                    className={`w-full justify-start rounded-xl h-12 gap-3 transition-all ${activeTab === 'billing' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    <CreditCard className="w-4 h-4" /> Billing &amp; Plan
                                </Button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="md:col-span-2 space-y-8">
                            {activeTab === 'profile' ? (
                                <>
                                    <Card className="glass border-white/5 overflow-hidden">
                                        <CardHeader className="bg-white/[0.02] border-b border-white/5">
                                            <CardTitle>Studio Identity</CardTitle>
                                            <CardDescription>Upload your logo and add your WhatsApp for client contact.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-8">
                                            {/* Logo */}
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
                                                            Drag and drop your logo file here. Supported formats: PNG, JPG, SVG.
                                                        </p>
                                                        {settings.businessLogo && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                type="button"
                                                                className="h-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 px-0"
                                                                onClick={(e) => { e.stopPropagation(); setSettings({ ...settings, businessLogo: '' }); }}
                                                            >
                                                                <X className="w-3 h-3 mr-2" /> Remove Logo
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* WhatsApp */}
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
                                </>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <Card className="glass border-white/5 p-8 flex flex-col items-center text-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <Rocket className="w-8 h-8 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Current Plan</p>
                                                <h3 className="text-2xl font-bold capitalize">{user?.plan === 'pro' ? 'Elite Unlimited' : 'Basic Plan'}</h3>
                                            </div>
                                            {user?.plan === 'free' && (
                                                <Button onClick={() => startRazorpayCheckout('monthly')} className="w-full rounded-xl bg-primary shadow-lg shadow-primary/20 mt-2">
                                                    Upgrade to Unlimited
                                                </Button>
                                            )}
                                        </Card>

                                        <Card className="glass border-white/5 p-8 flex flex-col items-center text-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                                <Sparkles className="w-8 h-8 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Available Credits</p>
                                                <h3 className="text-2xl font-bold">{user?.plan === 'pro' ? 'Unlimited' : `${user?.credits || 0} Album Credits`}</h3>
                                            </div>
                                            {user?.plan === 'free' && (
                                                <Button onClick={buyAlbumCredit} variant="outline" className="w-full rounded-xl border-white/10 hover:bg-white/5 mt-2">
                                                    Add 1 Credit (₹99) <span className="ml-2 text-[10px] line-through opacity-50">₹199</span>
                                                </Button>
                                            )}
                                        </Card>
                                    </div>

                                    <Card className="glass border-white/5 overflow-hidden">
                                        <CardHeader className="bg-white/[0.02] border-b border-white/5">
                                            <div>
                                                <CardTitle>Razorpay Billing</CardTitle>
                                                <CardDescription>Manage your payments and invoices securely.</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#0d0d0f] border border-white/5">
                                                <History className="w-5 h-5 text-white/20 mt-1" />
                                                <div className="space-y-1">
                                                    <p className="font-bold">Automated Invoicing</p>
                                                    <p className="text-sm text-white/40 leading-relaxed">
                                                        All transactions are securely processed via Razorpay. You will receive an email receipt for every transaction which you can use for your studio records.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {user?.plan !== 'pro' && (
                                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-primary/20 to-indigo-600/10 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Crown className="w-5 h-5 text-primary" />
                                                    <h3 className="text-xl font-bold">Try the Elite Experience</h3>
                                                </div>
                                                <p className="text-sm text-white/60">Unlock unlimited albums, custom branding, and 50GB vault storage.</p>
                                            </div>
                                            <Button onClick={() => startRazorpayCheckout('monthly')} className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/30 shrink-0">
                                                Upgrade Now (₹199) <span className="ml-2 text-[10px] line-through opacity-70">₹499</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
