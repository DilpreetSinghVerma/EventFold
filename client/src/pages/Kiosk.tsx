import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Kiosk() {
  const { user } = useAuth();
  const [match, params] = useRoute("/kiosk/:id");
  const exhibitionId = params?.id;
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const { data: exhibitionData } = useQuery({
    queryKey: [`/api/admin/exhibitions/${exhibitionId}`],
    enabled: !!exhibitionId,
  });
  const exhibition = (exhibitionData as any)?.exhibition;

  const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
  const isAdmin = user?.role === 'admin' || (user?.email && adminEmails.includes(user.email));

  if (!user || !isAdmin || !match) {
    return <Redirect to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    try {
      await apiRequest("POST", "/api/admin/leads", { exhibitionId, name, email });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setEmail("");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Error capturing lead",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <img src="/branding material/without bg version.png" alt="EventFold Logo" className="h-10 opacity-50" />
      </div>

      <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 p-10 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-center mb-2">
            {exhibition ? exhibition.name : "EventFold Studio"}
          </h1>
          <p className="text-white/50 text-center">Exclusive Special Offer</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
            <h2 className="text-2xl font-bold text-center">Got it, {name.split(' ')[0]}!</h2>
            <p className="text-white/50 text-center mt-2 mb-8">Check your email soon for your free promo code.</p>
            <Button 
              onClick={() => {
                setSuccess(false);
                setName("");
                setEmail("");
              }}
              variant="outline"
              className="border-white/10 text-white/50 hover:text-white"
            >
              Add Next Person
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-white/70">Photographer Name</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe Photography" 
                className="bg-white/5 border-white/10 h-14 text-lg placeholder:text-white/20"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white/70">Email Address</Label>
              <Input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@studio.com" 
                className="bg-white/5 border-white/10 h-14 text-lg placeholder:text-white/20"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 mt-4"
              disabled={loading}
            >
              {loading ? "Saving..." : "Claim Free Credit"}
            </Button>
          </form>
        )}
      </div>

      <div className="absolute bottom-8 text-white/20 text-sm font-medium tracking-widest uppercase">
        Admin Kiosk Mode Active
      </div>
    </div>
  );
}
