import React from 'react';
import { Send } from 'lucide-react';

export function ContactForm() {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';

  return (
    <div className="relative overflow-hidden bg-[#0a0a0b] border border-white/10 p-8 rounded-[2rem] shadow-2xl w-full max-w-xl mx-auto text-left">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <Send className="w-[400px] h-[400px] absolute -right-20 -top-20 -rotate-12" />
      </div>
      
      <div className="mb-6 relative z-10 text-center">
        <h3 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Get in Touch</h3>
        <p className="text-white/40 text-sm">We'd love to hear from you. Send us a message!</p>
      </div>

      <form action="https://formsubmit.co/dilpreetsinghverma@gmail.com" method="POST" className="flex flex-col gap-6 relative z-10">
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
            rows={4} 
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
    </div>
  );
}
