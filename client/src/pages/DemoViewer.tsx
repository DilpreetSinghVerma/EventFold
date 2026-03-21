import { Link } from 'wouter';
import { Flipbook } from '@/components/Flipbook';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Play,
    Pause,
    Maximize2,
    Volume2,
    VolumeX,
    ArrowLeft,
    Smartphone,
    MessageCircle,
    Loader2
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// Local demo assets
import demoFront from '@assets/demo_album/cover_front.png';
import demoBack from '@assets/demo_album/cover_back.png';
import demoSheet1L from '@assets/demo_album/sheet1_l.png';
import demoSheet1R from '@assets/demo_album/sheet1_r.png';
import demoSheet2L from '@assets/demo_album/sheet2_l.png';
import demoSheet2R from '@assets/demo_album/sheet2_r.png';

export default function DemoViewer() {
    const [loadedSheets] = useState<string[]>([
        demoSheet1L,
        demoSheet1R,
        demoSheet2L,
        demoSheet2R,
    ]);
    const [loading, setLoading] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);
    const [scale, setScale] = useState(1);          // display only
    const scaleRef = useRef(1);                      // actual value, no re-renders
    const zoomContainerRef = useRef<HTMLDivElement>(null); // direct DOM zoom
    const flipbookRef = useRef<any>(null);
    const [isPortrait, setIsPortrait] = useState(false);
    const [isSmallHeight, setIsSmallHeight] = useState(false);
    const [isMobileLandscape, setIsMobileLandscape] = useState(false);
    const [uiVisible] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isSlideshowActive, setIsSlideshowActive] = useState(false);
    const [pageInfo, setPageInfo] = useState({ current: 0, total: 0 });
    // Computed once so it doesn't change between renders
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 1024;

    useEffect(() => {
        const checkOrientation = () => {
            const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 1024;
            const smallH = window.innerHeight < 500;
            const mobileL = window.innerWidth > window.innerHeight && window.innerWidth < 1024;
            setIsPortrait(portrait);
            setIsSmallHeight(smallH);
            setIsMobileLandscape(mobileL);
        };
        checkOrientation();
        window.addEventListener('resize', checkOrientation);

        const prewarm = async () => {
            const initialToPreload = [demoFront, ...loadedSheets.slice(0, 4)];
            await Promise.all(initialToPreload.map(url => new Promise(resolve => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve;
                img.src = url;
            })));
            setLoading(false);
        };
        prewarm();

        return () => {
            window.removeEventListener('resize', checkOrientation);
        };
    }, [loadedSheets]);

    const BrandingHeader = () => (
        <motion.div
            initial={false}
            animate={{
                y: (uiVisible && window.innerWidth < 1024) ? -120 : (uiVisible ? 0 : -120),
                opacity: (uiVisible && window.innerWidth < 1024) ? 0 : (uiVisible ? 1 : 0)
            }}
            className="absolute top-0 left-0 right-0 p-3 md:p-6 z-[60] flex items-center justify-between pointer-events-none transition-all duration-500"
        >
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button
                        variant="ghost"
                        className="rounded-xl bg-black/50 backdrop-blur-3xl border border-white/10 hover:bg-black/70 text-white pl-3 pr-5 gap-3 pointer-events-auto shadow-2xl transition-all h-11 md:h-12"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline font-bold">Close Demo</span>
                    </Button>
                </Link>

                <div className={`flex items-center gap-2 md:gap-4 bg-black/70 backdrop-blur-3xl border border-white/5 pointer-events-auto shadow-2xl transition-all duration-300 ${isSmallHeight || isMobileLandscape || window.innerWidth >= 1024 ? 'px-3 py-1.5 rounded-xl' : 'px-8 py-5 rounded-3xl'}`}>
                    <img src="/branding material/without bg version.png" alt="EventFold" className={`${isSmallHeight || isMobileLandscape || window.innerWidth >= 1024 ? 'h-5 md:h-7' : 'h-12'} w-auto object-contain`} />
                    {!(isSmallHeight || isMobileLandscape || window.innerWidth >= 1024) && <div className="w-px h-6 bg-white/10 mx-1" />}
                    <div className="flex flex-col">
                        {!(isSmallHeight || isMobileLandscape || window.innerWidth >= 1024) && <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mb-1">Demo Experience</span>}
                        <span className={`${isSmallHeight || isMobileLandscape || window.innerWidth >= 1024 ? 'text-[10px] md:text-sm' : 'text-base'} font-bold text-white tracking-tight leading-none`}>EventFold Studio</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
                {window.innerWidth >= 1024 && (
                    <Button
                        onClick={() => window.open('https://wa.me/919781175325', '_blank')}
                        className={`rounded-xl bg-green-500 hover:bg-green-600 text-white border-none shadow-lg shadow-green-500/20 px-5 font-bold ${isSmallHeight ? 'h-9 px-3 text-xs' : 'h-11'}`}
                    >
                        <MessageCircle className={`${isSmallHeight ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                        <span className="hidden sm:inline">Contact Studio</span>
                    </Button>
                )}
            </div>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white overflow-hidden relative">
                <div className="fixed inset-0 bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />
                <BrandingHeader />
                <div className="text-center relative pt-20">
                    <div className="w-20 h-20 mb-8 mx-auto relative flex items-center justify-center">
                        <Loader2 className="w-20 h-20 animate-spin text-primary opacity-20 absolute" />
                        <div className="w-4 h-4 bg-primary rounded-full animate-ping" />
                    </div>
                    <p className="font-display font-bold text-2xl mb-3 tracking-tight">Initializing Cinematic Feed</p>
                    <p className="text-white/40 text-sm font-mono uppercase tracking-[0.2em]">Loading Demo Experience...</p>
                </div>
            </div>
        );
    }

    if (window.innerWidth < 1024 && !hasStarted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#030303] text-white p-8 text-center relative overflow-hidden">
                <div className="fixed inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative max-w-sm">
                    <div className="w-24 h-24 mb-8 mx-auto bg-primary/20 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                        <Play className="w-10 h-10 text-primary fill-primary ml-1 relative z-10" />
                    </div>
                    <h2 className="text-4xl font-display font-bold mb-4 tracking-tight leading-tight">Ready for Cinema</h2>
                    <p className="text-white/40 text-sm font-mono uppercase tracking-[0.2em] mb-12">Tap below for the full immersive experience</p>
                    <Button
                        size="lg"
                        onClick={() => {
                            setHasStarted(true);
                            document.documentElement.requestFullscreen().catch(() => { });
                        }}
                        className="w-full rounded-2xl h-16 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-2xl shadow-primary/40 group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                        Start Immersive Demo
                    </Button>
                </motion.div>
            </div>
        );
    }

    // Shared Flipbook node
    const FlipbookNode = (
        <Flipbook
            ref={flipbookRef}
            sheets={loadedSheets}
            frontCover={demoFront}
            backCover={demoBack}
            title="Studio Demo Experience"
            businessName="EventFold Studio"
            uiVisible={uiVisible}
            isMuted={isMuted}
            isSlideshowActive={isSlideshowActive}
            onSlideshowEnd={() => setIsSlideshowActive(false)}
            onPageChange={(current, total) => setPageInfo({ current, total })}
        />
    );

    return (
        <div className="min-h-screen bg-[#030303] flex flex-col relative overflow-hidden selection:bg-primary/30">
            <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

            <BrandingHeader />

            <main className="relative w-full flex-1 flex flex-col items-center justify-center bg-transparent lg:overflow-visible" style={{ touchAction: 'none', minHeight: 0 }}>
                <TransformWrapper
                    initialScale={window.innerWidth < 1024 ? 1.3 : 1}
                    maxScale={window.innerWidth < 1024 ? 4 : 2}
                    centerOnInit={true}
                    centerZoomedOut={true}
                    limitToBounds={true}
                    smooth={true}
                    minScale={1}
                    onTransformed={(ref) => setScale(ref.state.scale)}
                    wheel={{ step: 0.1, disabled: window.innerWidth >= 1024 }}
                    doubleClick={{ disabled: false }}
                    pinch={{ disabled: false }}
                    panning={{ disabled: window.innerWidth >= 1024 }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                            <TransformComponent
                                wrapperStyle={{ width: "100%", height: "100%", backgroundColor: "transparent", overflow: "visible" }}
                                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}
                            >
                                <div className="w-full h-full flex items-center justify-center lg:overflow-visible">
                                    {FlipbookNode}
                                </div>
                            </TransformComponent>

                            <div className="absolute inset-y-0 left-0 w-16 md:w-24 flex items-center justify-center z-[100] pointer-events-none">
                                <Button variant="ghost" size="icon" onClick={() => flipbookRef.current?.prev()} className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-md text-white/60 hover:text-white hover:bg-black/60 border border-white/5 pointer-events-auto transition-all shadow-2xl">
                                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                                </Button>
                            </div>
                            <div className="absolute inset-y-0 right-0 w-16 md:w-24 flex items-center justify-center z-[100] pointer-events-none">
                                <Button variant="ghost" size="icon" onClick={() => flipbookRef.current?.next()} className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-md text-white/60 hover:text-white hover:bg-black/60 border border-white/5 pointer-events-auto transition-all shadow-2xl">
                                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                                </Button>
                            </div>

                            <motion.div
                                animate={{ y: uiVisible ? 0 : (window.innerWidth < 1024 ? -120 : 100), opacity: uiVisible ? 1 : 0 }}
                                className={`${window.innerWidth < 1024 ? 'fixed top-4 left-1/2 -translate-x-1/2' : 'absolute bottom-10'} z-[70] flex gap-1 md:gap-2 glass-dark px-3 py-1.5 md:px-4 md:py-2 rounded-2xl border-white/5 shadow-2xl scale-90 md:scale-100 transition-all duration-500`}
                            >
                                {window.innerWidth < 1024 && (
                                        <Link href="/">
                                            <Button variant="ghost" size="icon" title="Close" className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10">
                                                <ArrowLeft className="w-5 h-5" />
                                            </Button>
                                        </Link>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10"><ZoomOut className="w-4 h-4 md:w-5 h-5" /></Button>
                                <div className="flex items-center px-2 md:px-3 text-white/90 text-[10px] md:text-sm font-bold min-w-[2.5rem] md:min-w-[3.5rem] justify-center tracking-tighter">{Math.round((scale || 1) * 100)}%</div>
                                <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10"><ZoomIn className="w-4 h-4 md:w-5 h-5" /></Button>
                                <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 self-center" />
                                <Button variant="ghost" size="icon" onClick={() => resetTransform()} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10"><RotateCcw className="w-4 h-4 md:w-5 h-5" /></Button>
                                <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 self-center" />
                                <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className={`${isMuted ? 'text-white/30' : 'text-primary animate-pulse'} hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10`}>
                                    {isMuted ? <VolumeX className="w-4 h-4 md:w-5 h-5" /> : <Volume2 className="w-4 h-4 md:w-5 h-5" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsSlideshowActive(!isSlideshowActive)} className={`${isSlideshowActive ? 'text-primary' : 'text-white/60'} hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10`}>
                                    {isSlideshowActive ? <Pause className="w-4 h-4 md:w-5 h-5" /> : <Play className="w-4 h-4 md:w-5 h-5" />}
                                </Button>
                                <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 self-center" />
                                <Button variant="ghost" size="icon" onClick={() => {
                                    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
                                    else document.exitFullscreen();
                                }} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 md:w-10 md:h-10">
                                    <Maximize2 className="w-4 h-4 md:w-5 h-5" />
                                </Button>
                                <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 self-center" />
                                <div className="flex items-center px-2 md:px-3 text-white/40 text-[10px] md:text-xs font-mono select-none tracking-widest min-w-[3.5rem] md:min-w-[4.5rem] justify-center">
                                    {pageInfo.current + 1}<span className="mx-1 text-white/10">/</span>{pageInfo.total}
                                </div>
                            </motion.div>
                        </>
                    )}
                </TransformWrapper>

                <AnimatePresence>
                    {isPortrait && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                            <div className="relative mb-8">
                                <motion.div animate={{ rotate: 90 }} transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                    className="p-6 bg-primary/20 rounded-[2rem] text-primary">
                                    <Smartphone className="w-16 h-16" />
                                </motion.div>
                            </div>
                            <h2 className="text-3xl font-display font-bold mb-4">Cinematic View Ready</h2>
                            <p className="text-white/40 text-lg leading-relaxed max-w-sm">
                                Please <span className="text-white font-bold">rotate your device</span> to landscape for the full immersive experience.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
