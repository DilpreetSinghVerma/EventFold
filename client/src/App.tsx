import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
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

import { AuthProvider, useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

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
        <AuthProvider>
          <Toaster />
          <ScrollToTop />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
