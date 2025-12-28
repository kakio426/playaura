import { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Youtube, Zap, TrendingUp, Users } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import type { Creator } from '../types';

interface ShareModalProps {
    creator: Creator;
    isOpen: boolean;
    onClose: () => void;
}

export function ShareModal({ creator, isOpen, onClose }: ShareModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const onDownload = useCallback(async () => {
        if (cardRef.current === null) return;

        try {
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 2,
            });

            const link = document.createElement('a');
            link.download = `MoTube-Insight-${creator.name.replace(/\s+/g, '-')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        }
    }, [creator.name]);

    const formatNumber = (n?: number) => {
        if (!n) return "-";
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toLocaleString();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
                            <div>
                                <h3 className="text-xl font-black italic">Insight <span className="gradient-text">Card</span></h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Instantly Shareable Intelligence</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Preview Area */}
                        <div className="p-8 flex flex-col items-center">
                            <div className="relative group mb-8">
                                {/* The Actual 9:16 Card for Export (Usually hidden or scaled) */}
                                <div
                                    ref={cardRef}
                                    className="w-[320px] h-[568px] bg-[#050505] relative overflow-hidden flex flex-col items-center p-8 rounded-[2rem] shadow-2xl border border-white/10"
                                    style={{
                                        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
                                    }}
                                >
                                    {/* Noise Texture Overlay */}
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                                    {/* Brand Logo */}
                                    <div className="flex items-center gap-2 mb-10 z-10">
                                        <div className="p-1.5 bg-red-600 rounded-lg">
                                            <Youtube size={14} fill="white" color="white" />
                                        </div>
                                        <span className="text-lg font-black tracking-tighter text-white">MoTube</span>
                                    </div>

                                    {/* Creator Image */}
                                    <div className="relative mb-6 z-10">
                                        <div className="w-24 h-24 rounded-full border-2 border-white/20 p-1 bg-black/50 backdrop-blur-md">
                                            <img
                                                src={creator.thumbnail_url}
                                                alt=""
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-lg">
                                            Verified
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-black text-center mb-1 z-10">{creator.name}</h2>
                                    <p className="text-xs text-white/40 font-mono mb-12 z-10">{creator.handle}</p>

                                    {/* Major Metric: Hot Score */}
                                    <div className="flex flex-col items-center mb-10 z-10">
                                        <div className="flex items-center gap-2 mb-2 text-orange-400/80">
                                            <Zap size={14} fill="currentColor" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hot Score</span>
                                        </div>
                                        <div className="text-8xl font-black hot-score-text tracking-tighter">
                                            {creator.hotScore}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 w-full z-10">
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center backdrop-blur-sm">
                                            <Users size={16} className="text-blue-400/80 mb-1" />
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Subscribers</span>
                                            <span className="text-base font-black text-white">{formatNumber(creator.stats.subscribers)}</span>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center backdrop-blur-sm">
                                            <TrendingUp size={16} className="text-green-400/80 mb-1" />
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Growth</span>
                                            <span className="text-base font-black text-green-400">+{creator.breakdown.growthRate.toFixed(1)}x</span>
                                        </div>
                                    </div>

                                    {/* Footer Message */}
                                    <div className="mt-auto pt-8 z-10 flex flex-col items-center gap-1">
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Scanned by MoTube AI Engine</p>
                                        <p className="text-[7px] font-mono text-white/10 uppercase">v2.4.1 Global Analytics Deployment</p>
                                    </div>

                                    {/* Corner Accents */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button
                                    onClick={onDownload}
                                    className="flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 shadow-xl shadow-white/10"
                                >
                                    <Download size={16} /> Export PNG
                                </button>
                                <button
                                    className="flex items-center justify-center gap-2 bg-white/5 text-white/60 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 border border-white/5"
                                >
                                    <Share2 size={16} /> Story Share
                                </button>
                            </div>
                            <p className="mt-6 text-[10px] text-white/30 text-center font-bold uppercase tracking-wider">Perfectly optimized for Instagram & YouTube Shorts</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
