import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Album } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Minus, Trash2, Eye, LayoutDashboard, Users, BookCopy, ShieldAlert, TrendingUp, Activity, Database, Globe, Search, ArrowUpCircle, CheckCircle2, XCircle } from "lucide-react";
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
          <Button variant="secondary" className="h-12 rounded-xl bg-green-500/10 text-green-400 border border-green-400/20 flex gap-2">
            <CheckCircle2 className="w-4 h-4" /> System Health: Cinematic Engine Active
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
                        <TableHead className="text-white/50">Status</TableHead>
                        <TableHead className="text-white/50 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlbums?.map((a) => (
                        <TableRow key={a.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                          <TableCell className="font-bold">{a.title}</TableCell>
                          <TableCell className="font-mono text-[10px] text-white/40">{a.userId}</TableCell>
                          <TableCell className="text-white/60">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
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
                            <Link href={`/viewer/${a.id}`}>
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
        </Tabs>
      </div>
    </div>
  );
}
