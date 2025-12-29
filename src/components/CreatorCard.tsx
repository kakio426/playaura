import React, { useState } from 'react';
import type { Creator } from '../types';
import { TrendingUp, Users, Video, Heart, Youtube, Zap, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GrowthChart } from './GrowthChart';
import { ShareModal } from './ShareModal';
import { VideoModal } from './VideoModal';

interface CreatorCardProps {
    creator: Creator;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    relatedCreators?: Creator[];
}

const formatNumber = (n?: number) => {
    if (!n) return "-";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
};

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator, isFavorite, onToggleFavorite, relatedCreators }) => {
    const [expanded, setExpanded] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const isHot = creator.hotScore >= 80;

    return (
        <motion.div
            id={`creator-${creator.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
            className={`glass-card flex flex-col p-5 rounded-[2rem] h-full overflow-hidden transition-all duration-300 ${expanded ? 'ring-2 ring-red-500/30' : ''}`}
        >
            {/* Thumbnail */}
            <div
                className="relative w-full aspect-video rounded-2xl overflow-hidden mb-5 bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/5 group cursor-pointer"
                onClick={() => setIsVideoOpen(true)}
            >
                <div className="block w-full h-full">
                    {creator.thumbnail_url ? (
                        <img
                            src={creator.thumbnail_url}
                            alt={creator.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center c-text-dim">
                            <Video size={32} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Youtube className="text-white transform scale-50 group-hover:scale-100 transition-transform" size={48} fill="currentColor" />
                    </div>
                </div>

                {onToggleFavorite && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
                        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:bg-red-500 transition-all active:scale-95 shadow-lg"
                    >
                        <Heart size={16} className={`transition-colors ${isFavorite ? 'fill-white text-white' : 'text-white/70'}`} />
                    </button>
                )}
            </div>

            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-xl font-black truncate c-text-main leading-none">{creator.name}</h3>
                        {isHot && (
                            <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-orange-500/20">
                                HOT
                            </span>
                        )}
                    </div>
                    <p className="text-xs c-text-muted font-mono italic">{creator.handle}</p>
                </div>
                <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 c-text-dim hover:c-text-main border border-black/5 dark:border-white/5"
                >
                    <Share2 size={16} />
                </button>
            </div>

            <p className="text-sm c-text-muted line-clamp-2 mb-6 min-h-[2.5rem] font-medium">
                {creator.description}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-8">
                <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-black/5 dark:border-white/5">
                    <Users size={14} className="text-blue-500 mb-1" />
                    <span className="text-[10px] font-black c-text-dim uppercase">Subs</span>
                    <span className="text-xs font-black c-text-main">{formatNumber(creator.stats.subscribers)}</span>
                </div>
                <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-black/5 dark:border-white/5">
                    <TrendingUp size={14} className="text-green-500 mb-1" />
                    <span className="text-[10px] font-black c-text-dim uppercase">7D Velocity</span>
                    <span className="text-xs font-black text-green-600 dark:text-green-400">
                        {creator.stats.subsDelta7d && creator.stats.subsDelta7d > 0 ? `+${formatNumber(creator.stats.subsDelta7d)}` : "Stable"}
                    </span>
                </div>
                <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-black/5 dark:border-white/5">
                    <Zap size={14} className="text-orange-500 mb-1" />
                    <span className="text-[10px] font-black c-text-dim uppercase">Score</span>
                    <span className="text-xs font-black text-orange-500">{creator.hotScore}</span>
                </div>
            </div>

            <div className="mt-auto">
                <AnimatePresence>
                    {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mb-6 pt-6 border-t border-black/5 dark:border-white/10">
                                <GrowthChart stats={creator.stats} />
                                {relatedCreators && relatedCreators.length > 0 && (
                                    <div className="mt-6 space-y-2">
                                        <p className="text-[10px] font-black c-text-dim uppercase mb-3">Segment Peers</p>
                                        {relatedCreators.map((rel: Creator) => (
                                            <div key={rel.id} className="flex items-center gap-3 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                                <img src={rel.thumbnail_url} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                <span className="text-[11px] font-bold c-text-main truncate flex-1">{rel.name}</span>
                                                <span className="text-[10px] font-mono c-text-dim">{rel.hotScore}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!expanded && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {creator.tags.slice(0, 3).map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[9px] font-black c-text-dim uppercase border border-black/5 dark:border-white/5">
                                #{t}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${expanded
                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                            : 'bg-black/5 dark:bg-white/5 c-text-muted hover:c-text-main border border-black/5 dark:border-white/5'
                            }`}
                    >
                        {expanded ? 'Close Analytics' : 'Deep Analytics'}
                    </button>
                    <a
                        href={creator.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 rounded-xl bg-red-600/10 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center justify-center shadow-sm"
                        title="Visit Channel"
                    >
                        <Youtube size={18} />
                    </a>
                </div>
            </div>
            <ShareModal creator={creator} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
            {isVideoOpen && <VideoModal channelId={creator.id} channelName={creator.name} onClose={() => setIsVideoOpen(false)} />}
        </motion.div>
    );
};
