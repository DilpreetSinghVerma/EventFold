import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Building2, Lock, Smartphone, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
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
                <h1 className="text-2xl font-bold font-display tracking-tight text-white/40 uppercase tracking-widest">Brand Profile</h1>
            </header>

            <main className="max-w-4xl mx-auto">
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Nav Card */}
                        <Card className="glass border-white/5 h-fit">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3 text-primary">
                                    <Building2 className="w-5 h-5" />
                                    <span className="font-bold text-sm uppercase tracking-widest">Studio Info</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/40">
                                    <Lock className="w-5 h-5" />
                                    <span className="font-bold text-sm uppercase tracking-widest">Security</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profile Content */}
                        <div className="md:col-span-2 space-y-8">
                            <Card className="glass border-white/5 overflow-hidden">
                                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                                    <CardTitle>Studio Identity</CardTitle>
                                    <CardDescription>Customize how your business appears to your clients.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label>Business Name</Label>
                                        <Input
                                            value={settings.businessName}
                                            onChange={e => setSettings({ ...settings, businessName: e.target.value })}
                                            placeholder="e.g. Royale Photography Studio"
                                            className="bg-white/5 border-white/10 h-12 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Business Logo URL</Label>
                                        <Input
                                            value={settings.businessLogo}
                                            onChange={e => setSettings({ ...settings, businessLogo: e.target.value })}
                                            placeholder="https://cloudinary.com/your-logo.png"
                                            className="bg-white/5 border-white/10 h-12 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact WhatsApp</Label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                            <Input
                                                value={settings.contactWhatsApp}
                                                onChange={e => setSettings({ ...settings, contactWhatsApp: e.target.value })}
                                                placeholder="+91 98765 43210"
                                                className="bg-white/5 border-white/10 h-12 rounded-xl pl-12"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass border-white/5 overflow-hidden">
                                <CardHeader className="bg-white/[0.02] border-b border-white/5">
                                    <CardTitle>Management Access</CardTitle>
                                    <CardDescription>Control who can access the dashboard and create albums.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label>Dashboard Passcode</Label>
                                        <Input
                                            type="password"
                                            value={settings.adminPassword}
                                            onChange={e => setSettings({ ...settings, adminPassword: e.target.value })}
                                            className="bg-white/5 border-white/10 h-12 rounded-xl"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="h-14 rounded-2xl px-12 bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : success ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                    {saving ? 'Saving...' : success ? 'Changes Saved' : 'Update Profile'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
