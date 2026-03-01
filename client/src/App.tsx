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
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isLoading } = useAuth();
  const isStudio = !!(window as any).electron;

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>

      {/* Protected Routes */}
      <Route path="/dashboard">
        {user ? <Dashboard /> : <Redirect to="/login" />}
      </Route>
      <Route path="/create">
        {user ? <CreateAlbum /> : <Redirect to="/login" />}
      </Route>
      <Route path="/settings">
        {user ? <Settings /> : <Redirect to="/login" />}
      </Route>

      <Route path="/album/:id" component={Viewer} />
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
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
