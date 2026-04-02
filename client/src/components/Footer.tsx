import { Link } from 'wouter';
import { Share2, Linkedin, Youtube, Heart, MapPin, Mail, Instagram } from "lucide-react";
import { LanguageToggle } from '@/lib/i18n';

export function Footer({ children }: { children?: React.ReactNode }) {
  return (
    <footer className="py-24 border-t border-white/5 bg-[#050505] relative overflow-hidden">
      {/* Decorative Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {children && (
          <div className="w-full mb-32 flex justify-center">
            {children}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          
          {/* Brand Story Column */}
          <div className="md:col-span-2 space-y-8">
            <Link href="/">
              <div className="h-14 cursor-pointer group">
                <img 
                  src="/branding material/without bg version.png" 
                  alt="EventFold Studio" 
                  className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105" 
                />
              </div>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">
              EventFold Studio transforms traditional albums into breathtaking cinematic 3D digital experiences. Designed for India's elite wedding creators to tell stories that live forever.
            </p>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                {[
                  { icon: <Instagram className="w-4 h-4" />, href: "https://www.instagram.com/eventfoldstudio/", color: "hover:text-pink-500", label: "Instagram" },
                  { icon: <Linkedin className="w-4 h-4" />, href: "https://www.linkedin.com/company/eventfoldstudio/", color: "hover:text-primary", label: "LinkedIn" },
                  { icon: <Youtube className="w-4 h-4" />, href: "https://www.youtube.com/@eventfold_studio", color: "hover:text-red-500", label: "YouTube" }
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 transition-all duration-300 hover:scale-110 hover:border-white/20 ${social.color}`}
                    title={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              
              <div className="space-y-3 pt-2">
                <a href="mailto:eventfoldstudio@gmail.com" className="flex items-center gap-4 text-white/40 hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Mail className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">eventfoldstudio@gmail.com</span>
                </a>
                <div className="flex items-center gap-4 text-white/40 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <MapPin className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">Punjab, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Explore</h4>
            <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
              <Link href="/" className="hover:text-white transition-colors w-fit">Home</Link>
              <Link href="/about" className="hover:text-white transition-colors w-fit">Our Story</Link>
              <Link href="/faq" className="hover:text-white transition-colors w-fit">FAQ</Link>
              <Link href="/demos" className="hover:text-white transition-colors w-fit">Demos</Link>
            </div>
            <div className="pt-2">
              <LanguageToggle />
            </div>
          </div>

          {/* Legal Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF9933]">Compliance</h4>
            <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
              <Link href="/terms" className="hover:text-white transition-colors w-fit">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors w-fit">Privacy Policy</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 text-white/20 text-[10px] uppercase font-bold tracking-[0.3em]">
            <span>© {new Date().getFullYear()} EventFold Studio</span>
            <span className="w-1 h-1 rounded-full bg-white/10 mx-2" />
            <span className="flex items-center gap-1">Made with <Heart className="w-3 h-3 text-red-500/50 fill-current" /> in Punjab, Bharat</span>
          </div>
          <p className="text-white/10 text-[9px] uppercase tracking-[0.5em] font-black">
            Designed for India's Elite Wedding Creators
          </p>
        </div>
      </div>
    </footer>
  );
}
