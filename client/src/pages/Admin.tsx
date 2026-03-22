import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Album } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Minus, Trash2, Eye, LayoutDashboard, Users, BookCopy, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: albums, isLoading: albumsLoading } = useQuery<Album[]>({
    queryKey: ["/api/admin/albums"],
  });

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

  if (!user || (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You do not have permission to access the Command Center.</p>
        <Link href="/dashboard">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <LayoutDashboard className="text-primary w-10 h-10" /> Admin Command Center
            </h1>
            <p className="text-white/40">Manage all users, credits, and global albums from one place.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/10 hover:bg-white/5">Back to Personal Dashboard</Button>
          </Link>
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
                      {users?.map((u) => (
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
                            <Badge variant={u.plan === 'pro' ? 'default' : 'outline'} className={u.plan === 'pro' ? 'bg-indigo-600' : 'border-white/20'}>
                              {u.plan.toUpperCase()}
                            </Badge>
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
                      {albums?.map((a) => (
                        <TableRow key={a.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                          <TableCell className="font-bold">{a.title}</TableCell>
                          <TableCell className="font-mono text-[10px] text-white/40">{a.userId}</TableCell>
                          <TableCell className="text-white/60">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {a.isPublicDemo === 'true' ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">PUBLIC DEMO</Badge>
                            ) : (
                              <Badge variant="outline" className="text-white/30 border-white/5">USER PROJECT</Badge>
                            )}
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
