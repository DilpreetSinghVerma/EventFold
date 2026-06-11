import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import CreateAlbum from "@/pages/CreateAlbum";
import Viewer from "@/pages/Viewer";
import DemoViewer from "@/pages/DemoViewer";
import Demos from "@/pages/Demos";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import AuthVerify from "@/pages/AuthVerify";
import Admin from "@/pages/Admin";
import About from "@/pages/About";
import FAQ from "@/pages/FAQ";
import AlbumEdit from "@/pages/AlbumEdit";
import ScrollToTop from "@/components/ScrollToTop";
import Kiosk from "@/pages/Kiosk";

import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { Loader2, AlertTriangle, Megaphone, X } from "lucide-react";
import { apiRequest } from "./lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

function ImpersonationBanner() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  if (!user || !(user as any).isImpersonating) return null;

  const revert = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/admin/impersonate/revert");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/admin";
    } catch (e: any) {
      alert("Failed to return to admin: " + e.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="sticky top-0 left-0 w-full z-[999] bg-red-600 text-white px-4 py-2 flex items-center justify-between shadow-lg font-medium text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 animate-pulse" />
        <span>You are currently impersonating <strong>{user.name || user.email}</strong>. Any actions you take will be on their behalf.</span>
      </div>
      <Button variant="outline" size="sm" onClick={revert} disabled={isLoading} className="h-7 bg-white text-red-600 hover:bg-white/90 border-transparent text-xs font-bold px-4 disabled:opacity-50">
        {isLoading ? "Returning..." : "Return to Admin"}
      </Button>
    </div>
  );
}

function GlobalBroadcastBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data } = useQuery({
    queryKey: ["/api/broadcasts/active"],
    refetchInterval: 60000, // Poll every minute
  });

  if (dismissed || !data?.broadcast) return null;

  const b = data.broadcast;
  const colors = {
    info: "bg-blue-600 text-white",
    warning: "bg-red-600 text-white",
    success: "bg-green-600 text-white",
  };

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[55] ${colors[b.type as keyof typeof colors] || colors.info} px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl shadow-black/50 font-medium text-sm border border-white/20 max-w-[90vw] animate-in slide-in-from-bottom-5`}>
      <Megaphone className="w-4 h-4" />
      <span>{b.message}</span>
      <button onClick={() => setDismissed(true)} className="ml-2 hover:bg-black/20 p-1 rounded-full transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login">
        {user ? (user.isVerified === 1 ? <Redirect to="/dashboard" /> : <Redirect to="/verify" />) : <Login />}
      </Route>
      <Route path="/verify" component={AuthVerify} />


      {/* Protected Routes */}
      <Route path="/dashboard">
        {user ? (user.isVerified === 1 ? <Dashboard /> : <Redirect to="/verify" />) : <Redirect to="/login" />}
      </Route>
      <Route path="/create">
        {user ? (user.isVerified === 1 ? <CreateAlbum /> : <Redirect to="/verify" />) : <Redirect to="/login" />}
      </Route>
      <Route path="/settings">
        {user ? (user.isVerified === 1 ? <Settings /> : <Redirect to="/verify" />) : <Redirect to="/login" />}
      </Route>
      <Route path="/admin">
        {user ? (user.role === 'admin' || user.email === 'dilpreetsinghverma@gmail.com' ? <Admin /> : <Redirect to="/dashboard" />) : <Redirect to="/login" />}
      </Route>
      <Route path="/kiosk/:id">
        {user ? (user.role === 'admin' || user.email === 'dilpreetsinghverma@gmail.com' ? <Kiosk /> : <Redirect to="/dashboard" />) : <Redirect to="/login" />}
      </Route>


      <Route path="/album/:id" component={Viewer} />
      <Route path="/album/:id/edit">
        {user ? (user.isVerified === 1 ? <AlbumEdit /> : <Redirect to="/verify" />) : <Redirect to="/login" />}
      </Route>
      <Route path="/demo" component={DemoViewer} />
      <Route path="/demos" component={Demos} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
          <AuthProvider>
            <Toaster />
            <ScrollToTop />
            <ImpersonationBanner />
            <GlobalBroadcastBanner />
            <Router />
          </AuthProvider>
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
