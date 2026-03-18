import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send } from 'lucide-react';

export function ContactModal({ children }: { children: React.ReactNode }) {
  // Use window object safely
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-[#0a0a0b] border-white/10 text-white rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <Send className="w-[400px] h-[400px] absolute -right-20 -top-20 -rotate-12" />
        </div>
        
        <DialogHeader className="mb-6 relative z-10">
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Contact Support</DialogTitle>
        </DialogHeader>

        <form action="https://formsubmit.co/dilpreetsinghverma@gmail.com" method="POST" className="flex flex-col gap-6 relative z-10">
          {/* Prevent captcha for smoother UX */}
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_next" value={currentUrl} />
          
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-bold text-white/90">Your Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="John Doe" 
                required 
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all font-medium" 
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-bold text-white/90">Your Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="john@example.com" 
                required 
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all font-medium" 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-sm font-bold text-white/90">Message</label>
            <textarea 
              id="message" 
              name="message" 
              placeholder="Your message here..." 
              required 
              rows={5} 
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all font-medium resize-none"
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            className="mt-2 w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] active:scale-[0.98]"
          >
            <Send className="w-5 h-5 -ml-2" /> Send Message
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
