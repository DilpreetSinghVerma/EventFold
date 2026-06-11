import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Album } from "@shared/schema";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Minus, Trash2, Eye, LayoutDashboard, Users, BookCopy, ShieldAlert, TrendingUp, Activity, Database, Globe, Search, ArrowUpCircle, CheckCircle2, XCircle, Sparkles, Cloud, HardDrive, Wifi, Zap, AlertTriangle, RefreshCw, IndianRupee, PieChart, BarChart3, Clock, Crown, CreditCard, Star, Download, Megaphone, Mail, Gift } from "lucide-react";
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

  // Form states for Email Broadcast
  const [emailSubject, setEmailSubject] = useState("");
  const [emailTarget, setEmailTarget] = useState("all");
  const [emailCustomList, setEmailCustomList] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

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

  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  const { data: albums, isLoading: albumsLoading } = useQuery<Album[]>({
    queryKey: ["/api/admin/albums"],
  });

  const { data: activeBroadcastData } = useQuery({
    queryKey: ["/api/broadcasts/active"],
  });
  const activeBroadcast = activeBroadcastData?.broadcast;

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/admin/leads"],
  });
  const leads = (leadsData as any)?.leads || [];

  const sendPromosMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/promo/send");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
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

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/impersonate/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Impersonation active. Redirecting..." });
      window.location.href = "/dashboard";
    },
    onError: (err: any) => {
      toast({ title: "Impersonation failed", description: err.message, variant: "destructive" });
    }
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

  const broadcastMutation = useMutation({
    mutationFn: async ({ message, type, isActive }: { message: string, type: string, isActive: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/broadcasts`, { message, type, isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/active"] });
      toast({ title: "Broadcast updated successfully" });
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
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary rounded-lg flex gap-2">
              <TrendingUp className="w-4 h-4" /> Analytics
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
            <TabsTrigger value="broadcast" className="data-[state=active]:bg-primary rounded-lg flex gap-2">
              <Megaphone className="w-4 h-4" /> Broadcasts
            </TabsTrigger>
            <TabsTrigger value="email-broadcast" className="data-[state=active]:bg-primary rounded-lg flex gap-2">
              <Mail className="w-4 h-4" /> Email Broadcast
            </TabsTrigger>
            <TabsTrigger value="exhibition-leads" className="data-[state=active]:bg-primary rounded-lg flex gap-2">
              <Gift className="w-4 h-4" /> Exhibition Leads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/[0.02] border-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Users className="text-primary w-5 h-5" />
                      30-Day User Growth
                    </CardTitle>
                    <p className="text-sm text-white/40">Daily new signups over the past 30 days.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {analytics?.chartData ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="signups" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSignups)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white/20" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.02] border-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BookCopy className="text-blue-500 w-5 h-5" />
                      30-Day Album Creations
                    </CardTitle>
                    <p className="text-sm text-white/40">Daily newly created albums over the past 30 days.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {analytics?.chartData ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorAlbums" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', borderRadius: '8px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="albums" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAlbums)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white/20" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-white/5 border-white/10 overflow-hidden">
               <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                   <div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Active Platform Users</div>
                   <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="h-8 gap-2 border-white/10 text-xs" onClick={() => window.location.href = '/api/admin/export-users?filter=studio'}>
                        <Download className="w-3 h-3"/> Studio Emails
                      </Button>
                      <Button variant="outline" className="h-8 gap-2 border-white/10 text-xs" onClick={() => window.location.href = '/api/admin/export-users?filter=labs'}>
                        <Download className="w-3 h-3"/> Labs Emails
                      </Button>
                      <Button variant="outline" className="h-8 gap-2 border-white/10 text-xs" onClick={() => window.location.href = '/api/admin/export-users?filter=free'}>
                        <Download className="w-3 h-3"/> Free Emails
                      </Button>
                      <Button variant="outline" className="h-8 gap-2 border-white/10 text-xs" onClick={() => window.location.href = '/api/admin/export-users'}>
                        <Download className="w-3 h-3"/> Export All
                      </Button>
                    </div>
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
                        <TableHead className="text-white/50">Last Active</TableHead>
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
                                <SelectItem value="pro">STUDIO MONTHLY</SelectItem>
                                <SelectItem value="elite">STUDIO YEARLY</SelectItem>
                                <SelectItem value="lab_monthly">LAB MONTHLY</SelectItem>
                                <SelectItem value="lab_half_yearly">LAB 6-MONTH</SelectItem>
                                <SelectItem value="lab_yearly">LAB YEARLY</SelectItem>
                                <SelectItem value="lab_unlimited">LAB UNLIMITED</SelectItem>
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
                          <TableCell className="text-[10px] text-white/50">
                            {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : 'Never'}
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
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-primary hover:text-white hover:bg-primary/20 transition-colors"
                                title="Login As User"
                                onClick={() => confirm(`Login as ${u.name || u.email}?`) && impersonateMutation.mutate(u.id)}
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Delete User"
                                onClick={() => confirm("Delete user? All their albums will be lost.") && deleteUserMutation.mutate(u.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Cloud className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Cloudflare R2 Storage</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                      {cloudUsage?.bucket ? `Bucket: ${cloudUsage.bucket}` : 'Real-time object storage monitoring'}
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
                  <Loader2 className="w-8 h-8 animate-spin text-orange-400 mb-4" />
                  <p className="text-white/40 text-sm">Scanning Cloudflare R2 bucket...</p>
                </div>
              )}

              {cloudUsage && (() => {
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
                  return 'bg-orange-500';
                };
                const getStatusColor = (percent: number) => {
                  if (percent >= 90) return 'text-red-400';
                  if (percent >= 70) return 'text-amber-400';
                  return 'text-orange-400';
                };

                const s = cloudUsage.storage || {};
                const p = cloudUsage.platform || {};
                const o = cloudUsage.objects || {};
                const folders = o.folders || {};

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
                                <p className="text-xl font-black">{formatBytes(s.used_bytes || 0)}</p>
                              </div>
                            </div>
                            <span className={`text-2xl font-black ${getStatusColor(s.used_percent || 0)}`}>
                              {(s.used_percent || 0).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(s.used_percent || 0)}`} style={{ width: `${Math.min(s.used_percent || 0, 100)}%` }} />
                          </div>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">Free tier: 10 GB · Then $0.015/GB/month</p>
                        </CardContent>
                      </Card>

                      {/* Bandwidth — Always Free */}
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <Wifi className="w-5 h-5 text-green-400" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Bandwidth (Egress)</p>
                                <p className="text-xl font-black text-green-400">$0 FOREVER</p>
                              </div>
                            </div>
                            <span className="text-2xl font-black text-green-400">∞</span>
                          </div>
                          <div className="w-full h-3 bg-green-500/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-green-500/50 w-full" />
                          </div>
                          <p className="text-[10px] text-green-400/50 uppercase tracking-widest">Cloudflare R2 has ZERO egress fees — unlimited downloads</p>
                        </CardContent>
                      </Card>

                      {/* Objects Count */}
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Database className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">R2 Objects</p>
                                <p className="text-xl font-black">{(o.total || 0).toLocaleString()} <span className="text-sm text-white/30 font-normal">files</span></p>
                              </div>
                            </div>
                          </div>
                          {Object.keys(folders).length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-2">
                              {Object.entries(folders).map(([folder, stats]: [string, any]) => (
                                <div key={folder} className="px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                                  <p className="text-[9px] text-white/30 uppercase tracking-widest">{folder}/</p>
                                  <p className="text-sm font-bold">{stats.count} <span className="text-white/30 font-normal text-[10px]">({formatBytes(stats.size)})</span></p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Migration Status */}
                      <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                              <Zap className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">File Migration Status</p>
                              <p className="text-xl font-black">{p.total_files || 0} <span className="text-sm text-white/30 font-normal">total files in DB</span></p>
                            </div>
                          </div>
                          <div className="flex gap-6 mt-2">
                            <div>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">On R2</p>
                              <p className="text-lg font-bold text-orange-400">{p.r2_files || 0}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Legacy Cloudinary</p>
                              <p className="text-lg font-bold text-white/40">{p.cloudinary_legacy_files || 0}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Albums</p>
                              <p className="text-lg font-bold text-primary">{p.total_albums || 0}</p>
                            </div>
                          </div>
                          {(p.r2_files > 0 || p.cloudinary_legacy_files > 0) && p.total_files > 0 && (
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
                              <div className="h-full bg-orange-500 transition-all duration-700" style={{ width: `${(p.r2_files / p.total_files) * 100}%` }} />
                              <div className="h-full bg-white/20 transition-all duration-700" style={{ width: `${(p.cloudinary_legacy_files / p.total_files) * 100}%` }} />
                            </div>
                          )}
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
                            <p className={`text-4xl font-black ${(p.estimated_albums_remaining || 0) < 10 ? 'text-red-400' : (p.estimated_albums_remaining || 0) < 30 ? 'text-amber-400' : 'text-orange-400'}`}>
                              ~{p.estimated_albums_remaining || 0}
                            </p>
                            <p className="text-[9px] text-white/20 mt-2">Based on your average album size</p>
                          </div>
                          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Storage Headroom</p>
                            <p className="text-4xl font-black text-white">
                              {formatBytes(Math.max(0, (s.free_tier_bytes || 10737418240) - (s.used_bytes || 0)))}
                            </p>
                            <p className="text-[9px] text-white/20 mt-2">Free space remaining on R2 free tier</p>
                          </div>
                          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Last Scan</p>
                            <p className="text-lg font-bold text-white/60">
                              {cloudUsage.timestamp ? new Date(cloudUsage.timestamp).toLocaleString() : 'N/A'}
                            </p>
                            <p className="text-[9px] text-white/20 mt-2">R2 bucket scan timestamp</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Status Banner */}
                    {(s.used_percent || 0) > 70 ? (
                      <div className="p-8 rounded-[2rem] bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
                          <div className="space-y-3">
                            <h3 className="text-xl font-bold text-amber-300">⚡ Storage Advisory</h3>
                            <p className="text-sm text-amber-200/60 leading-relaxed">
                              Your R2 free tier usage is above 70%. After 10GB, Cloudflare charges only <strong>$0.015/GB/month</strong> with zero bandwidth fees. No action needed — your app will keep working seamlessly.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center gap-4">
                        <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                        <div>
                          <p className="font-bold text-green-400">Cloud Infrastructure Healthy</p>
                          <p className="text-sm text-green-400/50">Cloudflare R2 storage within free tier limits. Zero bandwidth costs.</p>
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
              const estCreditRevenue = creditsSpent * 99;
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
                            <p className="text-[9px] text-white/30 uppercase">{proUsers.length} Studio Monthly · {eliteUsers.length} Studio Yearly</p>
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
                              <span className="text-white/60 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary" /> Studio Monthly (₹199/mo)</span>
                              <span className="font-bold">{proUsers.length} <span className="text-white/30 font-normal">users</span></span>
                            </div>
                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(proUsers.length / planBarMax) * 100}%` }} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> Studio Yearly (₹899/yr)</span>
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
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">Studio Monthly + Studio Yearly plans</p>
                            </div>
                            <p className="text-2xl font-black text-green-400">₹{estSubRevenue.toLocaleString()}</p>
                          </div>
                          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold">Credit Revenue</p>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest">One-time ₹99 purchases</p>
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
                                  <Badge className={`text-[8px] font-black uppercase ${
                                    u.plan === 'pro' ? 'bg-primary/20 text-primary border-primary/30' :
                                    u.plan === 'elite' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                    ['lab_monthly', 'lab_half_yearly', 'lab_yearly', 'lab_unlimited'].includes(u.plan) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                    'bg-white/5 text-white/30 border-white/10'
                                  }`}>
                                    {u.plan === 'pro' ? 'Studio Monthly' : 
                                     u.plan === 'elite' ? 'Studio Yearly' : 
                                     u.plan === 'free' ? 'Free' : 
                                     u.plan === 'lab_monthly' ? 'Lab Monthly' : 
                                     u.plan === 'lab_half_yearly' ? 'Lab 6-Month' : 
                                     u.plan === 'lab_yearly' ? 'Lab Yearly' : 
                                     u.plan === 'lab_unlimited' ? 'Lab Unlimited' : 
                                     u.plan}
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

                  {/* Referral Invite Funnel */}
                  <Card className="bg-white/[0.03] border-white/5 rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                      <CardTitle className="text-lg flex items-center gap-2 text-amber-400 font-display font-bold">
                        <Gift className="w-5 h-5 text-amber-500" /> Referral Invite Funnel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      {(() => {
                        const refStats = (analytics as any)?.stats?.referralStats || { total: 0, joined: 0, verified: 0, completed: 0, rewarded: 0 };
                        const refTotal = refStats.total;
                        const refVerified = refStats.verified + refStats.completed + refStats.rewarded;
                        const refCompleted = refStats.completed + refStats.rewarded;
                        const refRewarded = refStats.rewarded;

                        const steps = [
                          { label: 'Referred Signups', count: refTotal, pct: 100, color: 'bg-blue-500' },
                          { label: 'Verified Accounts', count: refVerified, pct: refTotal > 0 ? (refVerified / refTotal * 100) : 0, color: 'bg-purple-500' },
                          { label: 'First Album Published', count: refCompleted, pct: refTotal > 0 ? (refCompleted / refTotal * 100) : 0, color: 'bg-emerald-500' },
                          { label: 'Rewarded Referrals (Paid out)', count: refRewarded, pct: refTotal > 0 ? (refRewarded / refTotal * 100) : 0, color: 'bg-amber-500' },
                        ];

                        return (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                <p className="text-xs text-white/40 uppercase tracking-wider">Total Signups</p>
                                <p className="text-2xl font-black mt-1 text-blue-400">{refTotal}</p>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                <p className="text-xs text-white/40 uppercase tracking-wider">Verified Accounts</p>
                                <p className="text-2xl font-black mt-1 text-purple-400">{refVerified}</p>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                <p className="text-xs text-white/40 uppercase tracking-wider">Album Published</p>
                                <p className="text-2xl font-black mt-1 text-emerald-400">{refCompleted}</p>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                <p className="text-xs text-white/40 uppercase tracking-wider">Paid / Rewarded</p>
                                <p className="text-2xl font-black mt-1 text-amber-500">{refRewarded}</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {steps.map((step, idx) => (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-bold text-white/70">{step.label}</span>
                                    <span className="font-black text-white">{step.count} ({step.pct.toFixed(0)}%)</span>
                                  </div>
                                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${step.color}`} style={{ width: `${Math.max(step.pct, 2)}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
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

          <TabsContent value="broadcast">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-white/[0.02] border-white/5 rounded-2xl overflow-hidden glass mt-6">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Megaphone className="text-primary w-5 h-5" /> 
                    Global Broadcast System
                  </CardTitle>
                  <p className="text-white/40 text-sm">Send a live banner notification to all active users on the platform.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Broadcast Message</label>
                    <Input id="bMessage" placeholder="e.g. ⚠️ Scheduled maintenance in 15 minutes..." className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Type</label>
                    <select id="bType" className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="info" className="bg-[#1a1a1a]">Info (Blue)</option>
                      <option value="success" className="bg-[#1a1a1a]">Success (Green)</option>
                      <option value="warning" className="bg-[#1a1a1a]">Warning (Red)</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button 
                      className="flex-1"
                      disabled={broadcastMutation.isPending}
                      onClick={() => {
                        const message = (document.getElementById('bMessage') as HTMLInputElement).value;
                        const type = (document.getElementById('bType') as HTMLSelectElement).value;
                        if (!message) return toast({title: "Message required", variant: "destructive"});
                        broadcastMutation.mutate({ message, type, isActive: true });
                        (document.getElementById('bMessage') as HTMLInputElement).value = '';
                      }}
                    >
                      Publish Broadcast
                    </Button>
                  </div>
                  
                  {activeBroadcast && (
                    <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Currently Active Broadcast</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={activeBroadcast.type === 'warning' ? 'text-red-400 border-red-400/30 bg-red-400/10' : activeBroadcast.type === 'success' ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-blue-400 border-blue-400/30 bg-blue-400/10'}>
                            {activeBroadcast.type}
                          </Badge>
                          <span className="text-white text-sm font-medium">{activeBroadcast.message}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Deactivate Broadcast"
                        disabled={broadcastMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                        onClick={() => broadcastMutation.mutate({ message: '', type: 'info', isActive: false })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="email-broadcast">
            <div className="grid lg:grid-cols-12 gap-8 mt-6">
              {/* Left Column: Form */}
              <div className="lg:col-span-6 space-y-6">
                <Card className="bg-white/[0.02] border-white/5 rounded-2xl overflow-hidden glass">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Mail className="text-primary w-5 h-5" /> 
                      Email Broadcast System
                    </CardTitle>
                    <p className="text-white/40 text-sm">Send promotional or update emails to targeted cohorts or a custom lead list.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/77">Target Group</label>
                      <Select 
                        value={emailTarget} 
                        onValueChange={(val) => {
                          setEmailTarget(val);
                          if (val === "custom") {
                            if (!emailSubject) setEmailSubject("Deliver 3D Cinematic Albums to Your Clients — Try EventFold Studio");
                            if (!emailMessage) setEmailMessage(`<h3>Transform How You Deliver Albums to Your Clients</h3>\n<p>Are you still sharing photos via Google Drive links or USB pen drives? Traditional file-sharing is boring and does not showcase the true emotion of your work.</p>\n\n<p>With <strong>EventFold Studio</strong>, you can instantly turn your client photos into a premium, interactive virtual 3D flipbook that feels like holding a real physical album, complete with:</p>\n\n<ul>\n  <li><strong>Realistic 3D Page Turning</strong> with fluid layouts</li>\n  <li><strong>Embedded Video Highlights</strong> playing directly inside the pages</li>\n  <li><strong>One-Click Client WhatsApp Booking</strong> inside the album viewer</li>\n  <li><strong>Instant Sharing</strong> via custom links & scan-ready QR codes</li>\n</ul>\n\n<p>Make your photography studio stand out and give your clients a cinematic experience they will share with their family and friends.</p>\n\n<p>Click the button below to sign up and publish your first album for free in under 60 seconds!</p>`);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0b] border-white/10 text-white">
                          <SelectItem value="all">All Registered Users</SelectItem>
                          <SelectItem value="free">Free Tier Users Only</SelectItem>
                          <SelectItem value="photographers">Paid Photographers (Studio plans)</SelectItem>
                          <SelectItem value="labs">Print Labs Only</SelectItem>
                          <SelectItem value="custom">Custom Email List (Cold Leads)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {emailTarget === "custom" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70 flex justify-between">
                          <span>Recipient Email Addresses</span>
                          <span className="text-[10px] text-white/30 lowercase font-bold tracking-wider">comma or line separated</span>
                        </label>
                        <textarea
                          placeholder="photographer1@gmail.com, studio2@yahoo.com, printlab3@gmail.com..."
                          value={emailCustomList}
                          onChange={(e) => setEmailCustomList(e.target.value)}
                          rows={4}
                          className="w-full rounded-md bg-white/5 border border-white/10 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Subject Line</label>
                      <Input 
                        placeholder="e.g. Transform your gallery sharing experience..." 
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="bg-white/5 border-white/10" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Message (HTML Supported)</label>
                      <textarea
                        placeholder="Write your announcement or marketing pitch here..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        rows={12}
                        className="w-full rounded-md bg-white/5 border border-white/10 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                      />
                    </div>

                    <div className="pt-4">
                      <Button 
                        className="w-full"
                        disabled={sendingBroadcast}
                        onClick={async () => {
                          if (!emailSubject.trim()) return toast({title: "Subject required", variant: "destructive"});
                          if (!emailMessage.trim()) return toast({title: "Message required", variant: "destructive"});
                          
                          let customEmailsArr: string[] = [];
                          if (emailTarget === "custom") {
                            if (!emailCustomList.trim()) return toast({title: "Email list required", variant: "destructive"});
                            customEmailsArr = emailCustomList.split(/[,\n]/).map(e => e.trim()).filter(e => e.length > 0);
                            if (customEmailsArr.length === 0) return toast({title: "No valid emails", variant: "destructive"});
                          }

                          try {
                            setSendingBroadcast(true);
                            await apiRequest("POST", "/api/admin/broadcast-email", {
                              subject: emailSubject,
                              message: emailMessage,
                              target: emailTarget,
                              customEmails: customEmailsArr
                            });
                            toast({
                              title: "Broadcast Started",
                              description: "The email broadcast was successfully started in the background.",
                            });
                            if (emailTarget === "custom") {
                              setEmailCustomList("");
                            }
                          } catch (err: any) {
                            toast({
                              title: "Broadcast Failed",
                              description: err.message || "Failed to trigger email broadcast.",
                              variant: "destructive"
                            });
                          } finally {
                            setSendingBroadcast(false);
                          }
                        }}
                      >
                        {sendingBroadcast ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Dispatching Broadcast...
                          </>
                        ) : (
                          "Send Email Broadcast"
                        )}
                      </Button>
                      <p className="text-[10px] text-white/30 text-center mt-2">
                        * Runs in the background with a 500ms delay per recipient to prevent SMTP limits.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Real-time Live Preview */}
              <div className="lg:col-span-6 space-y-6">
                <Card className="bg-white/[0.02] border-white/5 rounded-2xl overflow-hidden glass h-full flex flex-col">
                  <CardHeader className="border-b border-white/5 bg-white/[0.01]">
                    <CardTitle className="text-sm uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Real-time Email Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 flex flex-col justify-start overflow-y-auto">
                    <div className="border border-white/10 rounded-2xl overflow-hidden bg-black p-4 scale-95 origin-top min-h-[500px] w-full">
                      <div className="text-xs text-white/40 mb-4 border-b border-white/5 pb-2">
                        <div><strong>From:</strong> EventFold Studio &lt;eventfoldstudio@gmail.com&gt;</div>
                        <div className="mt-1"><strong>Subject:</strong> {emailSubject || <span className="text-white/20 italic">No subject specified</span>}</div>
                      </div>
                      <div 
                        className="email-preview-body"
                        dangerouslySetInnerHTML={{
                          __html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #1e1e2e; border-radius: 20px; background: #030303; color: white; text-align: left;">
                              <div style="text-align: center; margin-bottom: 20px;">
                                <img src="https://eventfoldstudio.com/branding%20material/without%20bg%20version.png" alt="EventFold Logo" style="height: 50px; margin-bottom: 5px; display: inline-block;" />
                                <p style="text-transform: uppercase; letter-spacing: 4px; font-size: 8px; color: rgba(255,255,255,0.4); margin: 0;">Official Announcement</p>
                              </div>
                              
                              <div style="line-height: 1.6; color: rgba(255,255,255,0.85); font-size: 13px;">
                                ${emailMessage || '<p style="color: rgba(255,255,255,0.2); text-align: center; padding: 40px 0;">Write your message content in the editor to see a live preview of the client email...</p>'}
                              </div>

                              <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;" />
                              
                              <p style="line-height: 1.5; color: rgba(255,255,255,0.5); text-align: center; font-size: 11px; margin-bottom: 0;">
                                Have questions or want to see it in action? Visit our studio homepage to discover how we help creators succeed.
                              </p>

                              <div style="text-align: center; margin-top: 15px;">
                                <a href="#" style="background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 12px; display: inline-block;">VISIT EVENTFOLD STUDIO</a>
                              </div>

                              <p style="color: rgba(255,255,255,0.2); font-size: 8px; text-align: center; margin-top: 35px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0;">
                                Sent to select photographers and print labs.
                              </p>
                            </div>
                          `
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="exhibition-leads">
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> Exhibition Leads</div>
                  <div className="flex gap-2">
                    <Link href="/kiosk" target="_blank">
                      <Button variant="outline" className="border-white/10 bg-white/5 gap-2">
                        <Plus className="w-4 h-4" /> Open Kiosk View
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => {
                        if (window.confirm(`Send unique promo codes to ${leads.length} leads? This will take ~${(leads.length * 1.5).toFixed(1)} seconds.`)) {
                          sendPromosMutation.mutate();
                        }
                      }}
                      disabled={leads.length === 0 || sendPromosMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                    >
                      {sendPromosMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Send Promos to All Leads
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {leadsLoading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : leads.length === 0 ? (
                  <div className="p-8 text-center text-white/40">No leads captured yet. Open the Kiosk View to start.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-white/[0.01]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-white/50">Name</TableHead>
                        <TableHead className="text-white/50">Email</TableHead>
                        <TableHead className="text-white/50">Captured At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead: any) => (
                        <TableRow key={lead.id} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell className="text-white/60">{lead.email}</TableCell>
                          <TableCell className="text-white/40">{new Date(lead.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
