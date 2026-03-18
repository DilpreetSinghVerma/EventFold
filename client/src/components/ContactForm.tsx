import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const response = await fetch("https://formsubmit.co/ajax/dilpreetsinghverma@gmail.com", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            name: data.name,
            email: data.email,
            message: data.message,
            _captcha: "false"
        })
      });
      
      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="relative overflow-hidden bg-[#0a0a0b] border border-white/10 p-8 rounded-[2rem] shadow-2xl w-full max-w-xl mx-auto text-left">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <Send className="w-[400px] h-[400px] absolute -right-20 -top-20 -rotate-12" />
      </div>
      
      <div className="mb-6 relative z-10 text-center">
        <h3 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Get in Touch</h3>
        <p className="text-white/40 text-sm">We'd love to hear from you. Send us a message!</p>
      </div>

      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-12 relative z-10 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h4 className="text-2xl font-bold text-white mb-2">Message Delivered!</h4>
          <p className="text-white/40 mb-8 max-w-sm">Thank you for reaching out. We have received your email and will respond shortly.</p>
          <button 
            onClick={() => setStatus('idle')}
            className="text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10 px-6 py-2 rounded-full text-sm font-bold transition-all"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-bold text-white/90">Your Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="John Doe" 
                required 
                disabled={status === 'loading'}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all font-medium disabled:opacity-50" 
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
                disabled={status === 'loading'}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all font-medium disabled:opacity-50" 
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
              disabled={status === 'loading'}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all font-medium resize-none disabled:opacity-50"
            ></textarea>
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-sm tracking-wide text-center font-bold bg-red-400/10 py-2 rounded-lg border border-red-400/20">
              Failed to send connection to server. Please try again.
            </p>
          )}
          
          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="mt-2 w-full bg-cyan-400 hover:bg-cyan-300 disabled:bg-cyan-400/50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] active:scale-[0.98]"
          >
            {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-2" />}
            {status === 'loading' ? 'Transmitting Message...' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  );
}
