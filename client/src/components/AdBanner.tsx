import { useEffect, useRef } from 'react';

// Real Publisher ID from Google AdSense
export const GOOGLE_ADSENSE_PUB_ID = 'ca-pub-4232514641711356';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
  isPlaceholder?: boolean;
}

export function AdBanner({ 
  slot, 
  format = 'auto', 
  responsive = true, 
  className = '',
  isPlaceholder = false // Ads are now live
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  
  useEffect(() => {
    // Only try to push ads if we're not in placeholder mode and the adsbygoogle script is loaded
    if (!isPlaceholder && typeof window !== 'undefined') {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, [isPlaceholder]);

  if (isPlaceholder) {
    return (
      <div className={`w-full bg-white/5 border border-white/10 rounded-xl flex items-center justify-center p-4 text-center overflow-hidden relative ${className}`}>
        {/* Subtle animated background for the placeholder */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
            Advertisement
          </div>
          <div className="text-white/50 text-xs font-semibold">
            Support the platform by viewing ads. 
            <br/>
            <span className="text-purple-400 font-bold">Upgrade to Pro to remove all ads.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden flex justify-center ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={GOOGLE_ADSENSE_PUB_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
