import { useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-10 py-8 border-b border-white/5">
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter italic">Insight <span className="text-red-500">Aura</span></h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Creator Intelligence Deployment</p>
                            </div>
                            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/40 hover:text-white border border-white/5">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Preview Area */}
                        <div className="p-10 flex flex-col items-center">
                            <div className="relative group mb-10">
                                {/* The Actual 9:16 Card for Export */}
                                <div
                                    ref={cardRef}
                                    className="w-[340px] h-[600px] bg-[#030303] relative overflow-hidden flex flex-col items-center p-10 rounded-[2.5rem] shadow-2xl border border-white/10"
                                >
                                    {/* Animated Background Gradients */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(239,68,68,0.2)_0%,_transparent_70%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,_rgba(59,130,246,0.1)_0%,_transparent_50%)]" />

                                    {/* Grainy Noise Overlay */}
                                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                                    {/* Brand Logo */}
                                    <div className="flex items-center gap-3 mb-12 z-10">
                                        <div className="p-2 bg-red-600 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                                            <Youtube size={16} fill="white" color="white" />
                                        </div>
                                        <span className="text-2xl font-black tracking-tighter text-white italic">PlayAura</span>
                                    </div>

                                    {/* Creator Image */}
                                    <div className="relative mb-8 z-10">
                                        <div className="w-28 h-28 rounded-full border-[3px] border-white/10 p-1.5 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-md shadow-2xl">
                                            <img
                                                src={creator.thumbnail_url}
                                                alt=""
                                                className="w-full h-full rounded-full object-cover grayscale-[0.2]"
                                            />
                                        </div>
                                        <motion.div
                                            initial={{ y: 5 }}
                                            animate={{ y: 0 }}
                                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] whitespace-nowrap shadow-[0_8px_16px_rgba(220,38,38,0.4)] border border-red-400/30"
                                        >
                                            Verified Aura
                                        </motion.div>
                                    </div>

                                    <div className="text-center mb-14 z-10">
                                        <h2 className="text-3xl font-black text-white tracking-tighter mb-2">{creator.name}</h2>
                                        <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">{creator.handle || '@unknown'}</p>
                                    </div>

                                    {/* Major Metric: Hot Score */}
                                    <div className="flex flex-col items-center mb-12 z-10 w-full">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-[1px] bg-white/10" />
                                            <div className="flex items-center gap-2 text-orange-500">
                                                <Zap size={14} fill="currentColor" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Hot Score</span>
                                            </div>
                                            <div className="w-8 h-[1px] bg-white/10" />
                                        </div>
                                        <div className="text-9xl font-black text-white tracking-tighter leading-none opacity-90">
                                            {creator.hotScore}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 w-full z-10">
                                        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col items-center backdrop-blur-xl shadow-inner">
                                            <Users size={18} className="text-blue-400 mb-2" />
                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Global Subs</span>
                                            <span className="text-lg font-black text-white tracking-tight">{formatNumber(creator.stats.subscribers)}</span>
                                        </div>
                                        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col items-center backdrop-blur-xl shadow-inner">
                                            <TrendingUp size={18} className="text-green-400 mb-2" />
                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Volatility</span>
                                            <span className="text-lg font-black text-green-400 tracking-tight">+{creator.breakdown.growthRate.toFixed(1)}x</span>
                                        </div>
                                    </div>

                                    {/* Footer Message */}
                                    <div className="mt-auto pt-10 z-10 flex flex-col items-center gap-2">
                                        <div className="w-12 h-[2px] bg-red-600/30 rounded-full mb-2" />
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Engineered by PlayAura</p>
                                    </div>

                                    {/* Aesthetic Accents */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-5 w-full">
                                <button
                                    onClick={onDownload}
                                    className="flex items-center justify-center gap-3 bg-white text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 shadow-[0_20px_40px_-12px_rgba(255,255,255,0.2)]"
                                >
                                    <Download size={18} /> Download HD
                                </button>
                                <button
                                    className="flex items-center justify-center gap-3 bg-white/5 text-white/70 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 border border-white/10 backdrop-blur-md"
                                >
                                    <Share2 size={18} /> Story Ready
                                </button>
                            </div>
                            <p className="mt-8 text-[9px] text-white/20 text-center font-bold uppercase tracking-[0.2em]">Optimized for High-Fidelity Social Deployment</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

