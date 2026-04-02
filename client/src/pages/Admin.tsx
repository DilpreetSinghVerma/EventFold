import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Album } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Minus, Trash2, Eye, LayoutDashboard, Users, BookCopy, ShieldAlert, TrendingUp, Activity, Database, Globe, Search, ArrowUpCircle, CheckCircle2, XCircle, Sparkles, Cloud, HardDrive, Wifi, Zap, AlertTriangle, RefreshCw, IndianRupee, PieChart, BarChart3, Clock, Crown, CreditCard, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [cloudUsage, setCloudUsage] = useState<any>(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cleanupData, setCleanupData] = useState<any>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const fetchCleanup = async () => {
    setCleanupLoading(true);
    try {
      const res = await fetch('/api/admin/storage-cleanup');
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      setCleanupData(data);
    } catch (e: any) {
      setCleanupData({ error: e.message });
    } finally {
      setCleanupLoading(false);
    }
  };

  const fetchCloudUsage = async () => {
    setCloudLoading(true);
    setCloudError(null);
    try {
      const res = await fetch('/api/admin/cloud-usage');
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to fetch cloud usage');
      }
      const data = await res.json();
      setCloudUsage(data);
    } catch (e: any) {
      setCloudError(e.message);
    } finally {
      setCloudLoading(false);
    }
  };

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: albums, isLoading: albumsLoading } = useQuery<Album[]>({
    queryKey: ["/api/admin/albums"],
  });

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.includes(searchTerm)
  );

  const filteredAlbums = albums?.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const creditMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/credits`, { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Credits updated successfully" });
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated" });
    },
  });

  const planMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { plan }); // Reusing role route for simplicity on server
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User plan updated" });
    },
  });

  const demoMutation = useMutation({
    mutationFn: async ({ albumId, isPublicDemo }: { albumId: string; isPublicDemo: boolean }) => {
      const res = await apiRequest("PATCH", `/api/albums/${albumId}/demo-status`, { isPublicDemo });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
      toast({ title: "Demo status updated" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      await apiRequest("DELETE", `/api/albums/${albumId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
      toast({ title: "Album deleted" });
    },
  });

  const totalCredits = users?.reduce((acc, u) => acc + u.credits, 0) || 0;
  const totalViews = albums?.reduce((acc, a) => acc + (a.views || 0), 0) || 0;

  if (!user || (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[#030303] text-white">
        <ShieldAlert className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2 uppercase tracking-widest">Access Denied</h1>
        <p className="text-white/40 mb-8 max-w-sm">You do not have the required security clearing to access the Platform Command Center.</p>
        <Link href="/dashboard">
          <Button className="rounded-xl px-8 border-white/10 hover:bg-white/5" variant="outline">Return to Safety</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <ShieldAlert className="text-primary w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Admin Command Center</h1>
            </div>
            <p className="text-white/40 max-w-xl">Ultimate oversight for the EventFold Cinematic Engine. Manage users, monitor growth, and control global content.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/10 hover:bg-white/5 rounded-xl h-12 px-6">Return to Personal Workspace</Button>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input 
              placeholder="Search Users, Emails or Album Titles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 rounded-xl h-12 focus:border-primary/50 transition-all font-medium"
            />
          </div>
          <Button 
            variant="secondary" 
            className="h-12 rounded-xl bg-green-500/10 text-green-400 border border-green-400/20 flex gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> System Health: Cinematic Engine Active
          </Button>
          <Button 
            onClick={async () => {
              if (window.confirm("BROADCAST EXPIRY REMINDERS?\n\nThis will scan all users and send a luxury email to anyone whose subscription expires in exactly 7 days.")) {
                const res = await apiRequest("POST", "/api/admin/dispatch-reminders");
                const data = await res.json();
                toast({ title: `Reminders dispatched to ${data.count} users` });
              }
            }}
            variant="outline" 
            className="h-12 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 flex gap-2 font-bold"
          >
            <Sparkles className="w-4 h-4" /> Dispatch Retention Alerts
          </Button>
        </div>

        {/* Global Intelligence Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden glass">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Total Creators</p>
                  <p className="text-2xl font-black">{users?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden glass">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                  <BookCopy className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Platform Albums</p>
                  <p className="text-2xl font-black">{albums?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden glass">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Global Reach</p>
                  <p className="text-2xl font-black">{totalViews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden glass">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Circulating Credits</p>
                  <p className="text-2xl font-black">{totalCredits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-8">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="users" className="data-[state=active]:bg-primary rounded-lg flex gap-2">
              <Users className="w-4 h-4" /> Users Management
            </TabsTrigger>
            <TabsTrigger value="albums" className="data-[state=active]:bg-primary rounded-lg flex gap-2">
              <BookCopy className="w-4 h-4" /> Global Albums
            </TabsTrigger>
            <TabsTrigger value="cloud" className="data-[state=active]:bg-primary rounded-lg flex gap-2" onClick={() => { if (!cloudUsage) fetchCloudUsage(); }}>
              <Cloud className="w-4 h-4" /> Cloud Storage
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-primary rounded-lg flex gap-2">
              <IndianRupee className="w-4 h-4" /> Revenue
            </TabsTrigger>
            <TabsTrigger value="funnel" className="data-[state=active]:bg-primary rounded-lg flex gap-2">
              <BarChart3 className="w-4 h-4" /> Funnel
            </TabsTrigger>
            <TabsTrigger value="cleanup" className="data-[state=active]:bg-primary rounded-lg flex gap-2" onClick={() => { if (!cleanupData) fetchCleanup(); }}>
              <Trash2 className="w-4 h-4" /> Cleanup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-white/5 border-white/10 overflow-hidden">
               <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-lg flex items-center gap-2">
                   <Users className="w-5 h-5 text-primary" /> Active Platform Users
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-white/[0.01]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/50">Name</TableHead>
                        <TableHead className="text-white/50">Email</TableHead>
                        <TableHead className="text-white/50">Credits</TableHead>
                        <TableHead className="text-white/50">Plan</TableHead>
                        <TableHead className="text-white/50">Role</TableHead>
                        <TableHead className="text-white/50 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((u) => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                          <TableCell className="font-medium underline decoration-primary/30 underline-offset-4">{u.name || "N/A"}</TableCell>
                          <TableCell className="text-white/60">{u.email || "Google ID User"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 bg-white/5 w-fit px-3 py-1 rounded-full border border-white/5">
                              <Badge variant="outline" className="bg-primary/20 border-primary/40 text-primary-foreground">{u.credits}</Badge>
                              <div className="flex gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 hover:bg-red-500/20 text-red-400"
                                  onClick={() => creditMutation.mutate({ userId: u.id, amount: -1 })}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 hover:bg-green-500/20 text-green-400"
                                  onClick={() => creditMutation.mutate({ userId: u.id, amount: 1 })}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={u.plan} 
                              onValueChange={(val) => planMutation.mutate({ userId: u.id, plan: val })}
                            >
                              <SelectTrigger className="w-[100px] bg-white/5 border-white/10 h-8 rounded-lg text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0a0a0b] border-white/10 text-white">
                                <SelectItem value="free">FREE</SelectItem>
                                <SelectItem value="pro">PRO</SelectItem>
                                <SelectItem value="elite">ELITE</SelectItem>
                              </SelectContent>
                            </Select>
                            {u.subscriptionExpiresAt && (
                              <div className="mt-2 flex flex-col gap-1">
                                <div className="text-[8px] uppercase tracking-tighter text-white/30 flex justify-between">
                                  <span>Start:</span>
                                  <span className="text-white/60 font-mono">{u.subscriptionStartedAt ? new Date(u.subscriptionStartedAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="text-[8px] uppercase tracking-tighter text-white/30 flex justify-between">
                                  <span>End:</span>
                                  <span className="text-primary font-mono font-bold">{new Date(u.subscriptionExpiresAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              className={`h-7 px-2 text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/40 border border-white/5'}`}
                              onClick={() => roleMutation.mutate({ userId: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                            >
                              {u.role}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-white/20 hover:text-red-500 transition-colors"
                              onClick={() => confirm("Delete user? All their albums will be lost.") && deleteUserMutation.mutate(u.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="albums">
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-lg flex items-center gap-2">
                   <BookCopy className="w-5 h-5 text-primary" /> Global Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {albumsLoading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-white/[0.01]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/50">Album Title</TableHead>
                        <TableHead className="text-white/50">Owner ID</TableHead>
                        <TableHead className="text-white/50">Date Created</TableHead>
                        <TableHead className="text-white/50">Security</TableHead>
                        <TableHead className="text-white/50">Status</TableHead>
                        <TableHead className="text-white/50 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlbums?.map((a) => (
                        <TableRow key={a.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                          <TableCell className="font-bold">
                            <div className="flex items-center gap-3">
                              {(a as any).coverUrl ? (
                                <img src={(a as any).coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                  <BookCopy className="w-4 h-4 text-white/20" />
                                </div>
                              )}
                              <div>
                                <p className="truncate max-w-[180px]">{a.title}</p>
                                <p className="text-[9px] text-white/30 font-normal">{(a as any).fileCount || 0} sheets</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-white/40">{a.userId}</TableCell>
                          <TableCell className="text-white/60">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {(a as any).password ? (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                                  <Eye className="w-3 h-3" /> LOCKED
                                </span>
                                <span className="text-[10px] font-mono text-white/30" title="Album Password">{(a as any).password}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-white/20 uppercase tracking-widest">Open</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              className={`h-7 px-3 text-[10px] font-bold uppercase rounded-full ${a.isPublicDemo === 'true' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/20'}`}
                              onClick={() => demoMutation.mutate({ albumId: a.id, isPublicDemo: a.isPublicDemo !== 'true' })}
                            >
                              {a.isPublicDemo === 'true' ? 'PUBLIC DEMO' : 'PRIVATE'}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-2">
                            <Link href={`/album/${a.id}`}>
                              <Button variant="ghost" size="icon" className="hover:text-primary"><Eye className="w-4 h-4" /></Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-white/20 hover:text-red-500"
                              onClick={() => confirm("Delete this album permanently?") && deleteAlbumMutation.mutate(a.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cloud">
            <div className="space-y-8">
              {/* Refresh Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <Cloud className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Cloudinary Infrastructure</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                      {cloudUsage?.cloudinary?.plan ? `Plan: ${cloudUsage.cloudinary.plan}` : 'Real-time cloud storage monitoring'}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={fetchCloudUsage}
                  disabled={cloudLoading}
                  variant="outline" 
                  className="rounded-xl border-white/10 hover:bg-white/5 gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${cloudLoading ? 'animate-spin' : ''}`} />
                  {cloudLoading ? 'Scanning...' : 'Refresh'}
                </Button>
              </div>

              {cloudError && (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                  <div>
                    <p className="font-bold text-red-400">Cloud Diagnostics Failed</p>
                    <p className="text-sm text-red-400/60 mt-1">{cloudError}</p>
                  </div>
                </div>
              )}

              {cloudLoading && !cloudUsage && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-4" />
                  <p className="text-white/40 text-sm">Scanning Cloudinary infrastructure...</p>
                </div>
              )}

              {cloudUsage && (() => {
                const c = cloudUsage.cloudinary;
                const formatBytes = (bytes: number) => {
                  if (bytes === 0) return '0 B';
                  const k = 1024;
                  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
                };
                const getBarColor = (percent: number) => {
                  if (percent >= 90) return 'bg-red-500';
                  if (percent >= 70) return 'bg-amber-500';
                  if (percent >= 50) return 'bg-yellow-500';
                  return 'bg-cyan-500';
                };
                const getStatusColor = (percent: number) => {
                  if (percent >= 90) return 'text-red-400';
                  if (percent >= 70) return 'text-amber-400';
                  return 'text-cyan-400';
                };

                const storageUsedGB = c.storage.used_bytes / (1024 * 1024 * 1024);
                const estimatedAlbumsRemaining = Math.max(0, Math.floor((25 - storageUsedGB) / 0.3)); // ~300MB per album average

                return (
                  <>
                    {/* Main Usage Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Storage */}
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <HardDrive className="w-5 h-5 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Storage Used</p>
                                <p className="text-xl font-black">{formatBytes(c.storage.used_bytes)}</p>
                              </div>
                            </div>
                            <span className={`text-2xl font-black ${getStatusColor(c.storage.used_percent)}`}>
                              {c.storage.used_percent?.toFixed(1) || '0'}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(c.storage.used_percent || 0)}`} style={{ width: `${Math.min(c.storage.used_percent || 0, 100)}%` }} />
                          </div>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">Free tier: 25 GB total</p>
                        </CardContent>
                      </Card>

                      {/* Bandwidth */}
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Wifi className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Bandwidth (Monthly)</p>
                                <p className="text-xl font-black">{formatBytes(c.bandwidth.used_bytes)}</p>
                              </div>
                            </div>
                            <span className={`text-2xl font-black ${getStatusColor(c.bandwidth.used_percent)}`}>
                              {c.bandwidth.used_percent?.toFixed(1) || '0'}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(c.bandwidth.used_percent || 0)}`} style={{ width: `${Math.min(c.bandwidth.used_percent || 0, 100)}%` }} />
                          </div>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">Free tier: 25 GB/month · Resets monthly</p>
                        </CardContent>
                      </Card>

                      {/* Transformations */}
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <Zap className="w-5 h-5 text-amber-400" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Transformations</p>
                                <p className="text-xl font-black">{(c.transformations.used || 0).toLocaleString()}</p>
                              </div>
                            </div>
                            <span className={`text-2xl font-black ${getStatusColor(c.transformations.used_percent)}`}>
                              {c.transformations.used_percent?.toFixed(1) || '0'}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(c.transformations.used_percent || 0)}`} style={{ width: `${Math.min(c.transformations.used_percent || 0, 100)}%` }} />
                          </div>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">Free tier: 25,000/month · Image splits & optimizations</p>
                        </CardContent>
                      </Card>

                      {/* Objects */}
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <Database className="w-5 h-5 text-green-400" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Stored Objects</p>
                                <p className="text-xl font-black">{(c.resources || 0).toLocaleString()} <span className="text-sm text-white/30 font-normal">files</span></p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-6 mt-2">
                            <div>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Platform Albums</p>
                              <p className="text-lg font-bold text-primary">{cloudUsage.platform.total_albums}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Database Files</p>
                              <p className="text-lg font-bold text-primary">{cloudUsage.platform.total_files}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Derived Assets</p>
                              <p className="text-lg font-bold text-white/60">{(c.derived_resources || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Capacity Planning */}
                    <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-primary" /> Capacity Planning
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Est. Albums Remaining</p>
                            <p className={`text-4xl font-black ${estimatedAlbumsRemaining < 10 ? 'text-red-400' : estimatedAlbumsRemaining < 30 ? 'text-amber-400' : 'text-cyan-400'}`}>
                              ~{estimatedAlbumsRemaining}
                            </p>
                            <p className="text-[9px] text-white/20 mt-2">Based on ~300MB avg per album</p>
                          </div>
                          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Storage Headroom</p>
                            <p className="text-4xl font-black text-white">
                              {formatBytes(Math.max(0, 25 * 1024 * 1024 * 1024 - c.storage.used_bytes))}
                            </p>
                            <p className="text-[9px] text-white/20 mt-2">Free space remaining on Cloudinary</p>
                          </div>
                          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Last Report</p>
                            <p className="text-lg font-bold text-white/60">
                              {c.last_updated ? new Date(c.last_updated).toLocaleString() : 'N/A'}
                            </p>
                            <p className="text-[9px] text-white/20 mt-2">Cloudinary API refresh timestamp</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Migration Advisory */}
                    {(c.storage.used_percent > 70 || c.bandwidth.used_percent > 70) && (
                      <div className="p-8 rounded-[2rem] bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
                          <div className="space-y-3">
                            <h3 className="text-xl font-bold text-amber-300">⚡ Capacity Advisory</h3>
                            <p className="text-sm text-amber-200/60 leading-relaxed">
                              Your Cloudinary usage is above 70%. Consider upgrading your Cloudinary plan ($89/mo for 225GB) or migrating to <strong>Cloudflare R2</strong> for unlimited scalability with zero bandwidth fees ($0.015/GB storage only).
                            </p>
                            <div className="flex gap-3 pt-2">
                              <a href="https://cloudinary.com/pricing" target="_blank" rel="noopener">
                                <Button variant="outline" className="rounded-xl border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                                  Cloudinary Pricing →
                                </Button>
                              </a>
                              <a href="https://developers.cloudflare.com/r2/pricing/" target="_blank" rel="noopener">
                                <Button variant="outline" className="rounded-xl border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                                  Cloudflare R2 Pricing →
                                </Button>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(c.storage.used_percent <= 70 && c.bandwidth.used_percent <= 70) && (
                      <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center gap-4">
                        <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                        <div>
                          <p className="font-bold text-green-400">Cloud Infrastructure Healthy</p>
                          <p className="text-sm text-green-400/50">Storage and bandwidth within safe limits. No action needed.</p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="revenue">
            {(() => {
              const proUsers = users?.filter(u => u.plan === 'pro' && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) > new Date()) || [];
              const eliteUsers = users?.filter(u => u.plan === 'elite' && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) > new Date()) || [];
              const freeUsers = users?.filter(u => u.plan === 'free') || [];
              const totalUsers = users?.length || 0;
              
              const mrr = (proUsers.length * 199) + Math.round((eliteUsers.length * 899) / 12);
              const arr = mrr * 12;
              const creditsSpent = users ? users.reduce((acc, u) => acc + Math.max(0, 1 - u.credits), 0) : 0;
              const estCreditRevenue = creditsSpent * 49;
              const estSubRevenue = (proUsers.length * 199) + (eliteUsers.length * 899);
              const totalEstRevenue = estCreditRevenue + estSubRevenue;
              const conversionRate = totalUsers > 0 ? ((proUsers.length + eliteUsers.length) / totalUsers * 100) : 0;
              const avgEngagement = albums && albums.length > 0 ? Math.round(albums.reduce((acc, a) => acc + (a.totalEngagementTime || 0), 0) / albums.length) : 0;
              
              const topAlbums = [...(albums || [])].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
              const recentUsers = [...(users || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

              const planBarMax = Math.max(freeUsers.length, proUsers.length, eliteUsers.length, 1);

              return (
                <div className="space-y-8">
                  {/* Revenue Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 rounded-2xl overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                            <IndianRupee className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-green-400/60">Est. Total Revenue</p>
                            <p className="text-3xl font-black text-green-400">₹{totalEstRevenue.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 rounded-2xl overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/60">Monthly MRR</p>
                            <p className="text-3xl font-black text-blue-400">₹{mrr.toLocaleString()}</p>
                            <p className="text-[9px] text-white/30 uppercase">ARR: ₹{arr.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-2xl overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                            <Crown className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Active Subscribers</p>
                            <p className="text-3xl font-black text-primary">{proUsers.length + eliteUsers.length}</p>
                            <p className="text-[9px] text-white/30 uppercase">{proUsers.length} Pro · {eliteUsers.length} Elite</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 rounded-2xl overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <BarChart3 className="w-6 h-6 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60">Conversion Rate</p>
                            <p className="text-3xl font-black text-amber-400">{conversionRate.toFixed(1)}%</p>
                            <p className="text-[9px] text-white/30 uppercase">Free → Paid</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Plan Distribution + Revenue Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-primary" /> Plan Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-white/20" /> Free</span>
                              <span className="font-bold">{freeUsers.length} <span className="text-white/30 font-normal">users</span></span>
                            </div>
                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-white/20 transition-all duration-700" style={{ width: `${(freeUsers.length / planBarMax) * 100}%` }} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary" /> Pro (₹199/mo)</span>
                              <span className="font-bold">{proUsers.length} <span className="text-white/30 font-normal">users</span></span>
                            </div>
                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(proUsers.length / planBarMax) * 100}%` }} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> Elite (₹899/yr)</span>
                              <span className="font-bold">{eliteUsers.length} <span className="text-white/30 font-normal">users</span></span>
                            </div>
                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${(eliteUsers.length / planBarMax) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-primary" /> Revenue Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold">Subscription Revenue</p>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Pro + Elite plans</p>
                            </div>
                            <p className="text-2xl font-black text-green-400">₹{estSubRevenue.toLocaleString()}</p>
                          </div>
                          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold">Credit Revenue</p>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">One-time ₹49 purchases</p>
                            </div>
                            <p className="text-2xl font-black text-blue-400">₹{estCreditRevenue.toLocaleString()}</p>
                          </div>
                          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold">Avg. Engagement</p>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Per album viewer time</p>
                            </div>
                            <p className="text-2xl font-black text-white/60">{avgEngagement > 60 ? `${Math.round(avgEngagement / 60)}m` : `${avgEngagement}s`}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Albums + Recent Signups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="w-5 h-5 text-primary" /> Top Albums by Views
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {topAlbums.length === 0 ? (
                          <p className="p-6 text-white/30 text-sm">No album data yet</p>
                        ) : (
                          <div className="divide-y divide-white/5">
                            {topAlbums.map((a, i) => (
                              <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-white/10 text-white/40' : 'bg-white/5 text-white/20'}`}>
                                    #{i + 1}
                                  </span>
                                  <div>
                                    <p className="font-bold text-sm truncate max-w-[200px]">{a.title}</p>
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest">{a.category || 'Uncategorized'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-primary">{(a.views || 0).toLocaleString()}</p>
                                  <p className="text-[9px] text-white/30 uppercase">Views</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" /> Recent Signups
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {recentUsers.length === 0 ? (
                          <p className="p-6 text-white/30 text-sm">No users yet</p>
                        ) : (
                          <div className="divide-y divide-white/5">
                            {recentUsers.map((u) => (
                              <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                    {(u.name || u.email || '?')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm">{u.name || 'Anonymous'}</p>
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest">{u.email || 'Google User'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge className={`text-[8px] font-black uppercase ${u.plan === 'pro' ? 'bg-primary/20 text-primary border-primary/30' : u.plan === 'elite' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-white/30 border-white/10'}`}>
                                    {u.plan}
                                  </Badge>
                                  <p className="text-[9px] text-white/30 mt-1">{new Date(u.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="funnel">
            {(() => {
              const totalUsers = users?.length || 0;
              const usersWithAlbums = users?.filter(u => albums?.some(a => a.userId === u.id)).length || 0;
              const paidUsers = users?.filter(u => u.plan !== 'free' || u.credits < 1).length || 0;
              const activeSubscribers = users?.filter(u => u.plan !== 'free' && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) > new Date()).length || 0;

              const steps = [
                { label: 'Signed Up', count: totalUsers, color: 'bg-blue-500', icon: <Users className="w-5 h-5" /> },
                { label: 'Created Album', count: usersWithAlbums, color: 'bg-purple-500', icon: <BookCopy className="w-5 h-5" /> },
                { label: 'Made Payment', count: paidUsers, color: 'bg-green-500', icon: <CreditCard className="w-5 h-5" /> },
                { label: 'Active Subscriber', count: activeSubscribers, color: 'bg-amber-500', icon: <Crown className="w-5 h-5" /> },
              ];

              const maxCount = Math.max(totalUsers, 1);

              // Rated albums
              const ratedAlbums = albums?.filter(a => (a.totalRatings || 0) > 0).sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0)) || [];

              return (
                <div className="space-y-8">
                  <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" /> Conversion Funnel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        {steps.map((step, i) => {
                          const pct = totalUsers > 0 ? (step.count / maxCount * 100) : 0;
                          const dropoff = i > 0 && steps[i-1].count > 0 ? Math.round((1 - step.count / steps[i-1].count) * 100) : 0;

                          return (
                            <div key={i} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl ${step.color}/20 flex items-center justify-center border ${step.color}/30`}>
                                    <span className={step.color.replace('bg-', 'text-')}>{step.icon}</span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm">{step.label}</p>
                                    {i > 0 && dropoff > 0 && (
                                      <p className="text-[9px] text-red-400/60 uppercase tracking-widest">↓ {dropoff}% dropoff</p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-2xl font-black">{step.count}</span>
                              </div>
                              <div className="w-full h-6 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${step.color} transition-all duration-1000`} style={{ width: `${Math.max(pct, 2)}%` }}>
                                  <span className="text-[9px] font-black text-white/80 px-3 leading-6 inline-block">{pct.toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Album Ratings from Feedback Collector */}
                  <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" /> Client Ratings (Feedback Collector)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {ratedAlbums.length === 0 ? (
                        <div className="p-8 text-center">
                          <Star className="w-12 h-12 text-white/10 mx-auto mb-4" />
                          <p className="text-white/30 text-sm">No ratings yet</p>
                          <p className="text-white/15 text-xs mt-1">Ratings appear automatically after clients view shared albums for 45+ seconds</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {ratedAlbums.map((a) => (
                            <div key={a.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                              <div className="flex items-center gap-4">
                                {(a as any).coverUrl ? (
                                  <img src={(a as any).coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><BookCopy className="w-4 h-4 text-white/20" /></div>
                                )}
                                <div>
                                  <p className="font-bold text-sm">{a.title}</p>
                                  <p className="text-[9px] text-white/30 uppercase tracking-widest">{a.totalRatings} rating{a.totalRatings !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={`w-4 h-4 ${s <= Math.round((a.avgRating || 0) / 10) ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
                                  ))}
                                </div>
                                <span className="text-lg font-black text-amber-400 ml-2">{((a.avgRating || 0) / 10).toFixed(1)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="cleanup">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Storage Cleanup</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Find orphan files in Cloudinary not linked to any album</p>
                  </div>
                </div>
                <Button
                  onClick={fetchCleanup}
                  disabled={cleanupLoading}
                  variant="outline"
                  className="rounded-xl border-white/10 hover:bg-white/5 gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${cleanupLoading ? 'animate-spin' : ''}`} />
                  {cleanupLoading ? 'Scanning...' : 'Scan Now'}
                </Button>
              </div>

              {cleanupLoading && !cleanupData && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-red-400 mb-4" />
                  <p className="text-white/40 text-sm">Scanning Cloudinary for orphaned assets...</p>
                  <p className="text-white/20 text-xs mt-1">This may take a few seconds</p>
                </div>
              )}

              {cleanupData?.error && (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                  <div>
                    <p className="font-bold text-red-400">Scan Failed</p>
                    <p className="text-sm text-red-400/60 mt-1">{cleanupData.error}</p>
                  </div>
                </div>
              )}

              {cleanupData && !cleanupData.error && (() => {
                const formatBytes = (bytes: number) => {
                  if (bytes === 0) return '0 B';
                  const k = 1024;
                  const sizes = ['B', 'KB', 'MB', 'GB'];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
                };

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl">
                        <CardContent className="p-6 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Cloud Assets</p>
                          <p className="text-3xl font-black text-cyan-400">{cleanupData.total_cloud_resources}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl">
                        <CardContent className="p-6 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">DB Linked Files</p>
                          <p className="text-3xl font-black text-green-400">{cleanupData.total_db_files}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl">
                        <CardContent className="p-6 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Orphan Files</p>
                          <p className={`text-3xl font-black ${cleanupData.orphan_count > 0 ? 'text-red-400' : 'text-green-400'}`}>{cleanupData.orphan_count}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl">
                        <CardContent className="p-6 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Recoverable Space</p>
                          <p className="text-3xl font-black text-amber-400">{formatBytes(cleanupData.orphan_size_bytes)}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {cleanupData.orphan_count === 0 ? (
                      <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center gap-4">
                        <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                        <div>
                          <p className="font-bold text-green-400">Storage Clean</p>
                          <p className="text-sm text-green-400/50">No orphaned files found. All Cloudinary assets are linked to albums.</p>
                        </div>
                      </div>
                    ) : (
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-400" /> Orphaned Files ({cleanupData.orphan_count})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                            {cleanupData.orphans.map((o: any, i: number) => (
                              <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                  <img src={o.url} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                                  <div>
                                    <p className="font-mono text-xs text-white/50 truncate max-w-[300px]">{o.public_id}</p>
                                    <p className="text-[9px] text-white/20 uppercase">{o.format} · {formatBytes(o.bytes)} · {new Date(o.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:bg-red-500/20 text-xs"
                                  onClick={async () => {
                                    if (!confirm(`Delete "${o.public_id}" from Cloudinary?`)) return;
                                    try {
                                      await fetch(`/api/admin/storage-cleanup/${encodeURIComponent(o.public_id)}`, { method: 'DELETE' });
                                      toast({ title: `Deleted: ${o.public_id}` });
                                      fetchCleanup();
                                    } catch (e) {
                                      toast({ title: 'Delete failed', variant: 'destructive' });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
