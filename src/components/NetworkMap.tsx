import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Award, TrendingUp, Users, Target, Share2, MousePointer2, ZoomIn, ZoomOut } from 'lucide-react';
import type { Creator } from '../types';

interface NetworkGraphProps {
    creators: Creator[];
    onClose: () => void;
}

interface GraphNode extends Creator {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
}

interface GraphLink {
    source: string;
    target: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    entertainment: '#3b82f6', // blue
    gaming: '#8b5cf6',        // violet
    education: '#10b981',     // emerald
    tech: '#ef4444',          // red
    music: '#f59e0b',         // amber
    lifestyle: '#ec4899',     // pink
    economy: '#06b6d4'        // cyan
};

export function NetworkMap({ creators, onClose }: NetworkGraphProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [scale, setScale] = useState(0.7);
    const [simNodes, setSimNodes] = useState<GraphNode[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const requestRef = useRef<number>(0);

    // 1. Initialize Nodes and Links based on strict Filtered Context
    const { nodes, links } = useMemo(() => {
        // Limit to top 50 for performance and clarity
        const topCreators = [...creators].sort((a, b) => b.hotScore - a.hotScore).slice(0, 50);
        const activeIds = new Set(topCreators.map(c => c.id));

        // Find min/max scores to create a relative scale
        const scores = topCreators.map(c => c.hotScore);
        const minS = Math.min(...scores);
        const maxS = Math.max(...scores);
        const scoreRange = maxS - minS || 1;

        const gNodes = topCreators.map((c, i) => {
            const angle = (i / topCreators.length) * Math.PI * 2;
            const radius = 350 + (i * 20); // Spread out more

            // Relative scaling: map current min-max to 60px - 180px
            const relativeScore = (c.hotScore - minS) / scoreRange;
            const size = 60 + (relativeScore * 120);

            return {
                ...c,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                size
            };
        });

        const gLinks: GraphLink[] = [];
        topCreators.forEach(c => {
            c.relatedIds?.forEach(relId => {
                if (activeIds.has(relId)) {
                    gLinks.push({ source: c.id, target: relId });
                }
            });
        });

        return { nodes: gNodes, links: gLinks };
    }, [creators]);

    // 2. Simple Force-Directed Simulation
    useEffect(() => {
        const currentNodes = nodes.map(n => ({ ...n }));

        const tick = () => {
            const centerX = 0;
            const centerY = 0;

            currentNodes.forEach((node, i) => {
                // Centering force
                node.vx += (centerX - node.x) * 0.005;
                node.vy += (centerY - node.y) * 0.005;

                // Repulsion between nodes
                currentNodes.forEach((other, j) => {
                    if (i === j) return;
                    const dx = other.x - node.x;
                    const dy = other.y - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    const minDist = (node.size + other.size) * 0.7 + 60;

                    if (distance < minDist) {
                        const force = (minDist - distance) * 0.04;
                        const angle = Math.atan2(dy, dx);
                        node.vx -= Math.cos(angle) * force;
                        node.vy -= Math.sin(angle) * force;
                    }
                });

                // Link attraction
                links.forEach(link => {
                    if (link.source === node.id || link.target === node.id) {
                        const otherId = link.source === node.id ? link.target : link.source;
                        const other = currentNodes.find(n => n.id === otherId);
                        if (other) {
                            const dx = other.x - node.x;
                            const dy = other.y - node.y;
                            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                            if (distance > 200) {
                                const strength = 0.01;
                                node.vx += dx * strength;
                                node.vy += dy * strength;
                            }
                        }
                    }
                });

                // Limit movement
                const maxStep = 10;
                node.vx = Math.min(Math.max(node.vx, -maxStep), maxStep);
                node.vy = Math.min(Math.max(node.vy, -maxStep), maxStep);

                // Velocity damping & integration
                node.x += node.vx;
                node.y += node.vy;
                node.vx *= 0.9;
                node.vy *= 0.9;
            });

            setSimNodes([...currentNodes]);
            requestRef.current = requestAnimationFrame(tick);
        };

        requestRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(requestRef.current);
    }, [nodes, links]);

    const selectedCreator = simNodes.find(n => n.id === selectedId);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        setScale(prev => Math.min(Math.max(0.2, prev + delta), 2.5));
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-[#050508] text-white flex flex-col font-sans overflow-hidden select-none"
            onWheel={handleWheel}
        >
            {/* 1. PROFESSIONAL HEADER (Context Aware) */}
            <header className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-3xl z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-600/10 rounded-xl border border-red-500/20">
                            <Share2 size={20} className="text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight uppercase leading-none mb-1">Market Correlation Spider</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
                                    {creators[0]?.region_code || 'Global'} • {creators[0]?.categoryId || 'Top Performers'} Network
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex px-4 py-2 bg-white/5 rounded-xl border border-white/10 items-center gap-4">
                        <div className="flex items-center gap-2">
                            <ZoomIn size={14} className="text-white/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{Math.round(scale * 100)}%</span>
                            <ZoomOut size={14} className="text-white/20" />
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <span className="text-[9px] font-bold text-white/20">DRAG BACKGROUND TO PAN • WHEEL TO ZOOM</span>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                        <X size={20} className="text-white/40" />
                    </button>
                </div>
            </header>

            <div
                className={`flex-1 relative overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''} bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.02)_0%,_transparent_80%)]`}
            >
                {/* INTERACTIVE SPIDER WEB VIEWPORT */}
                <motion.div
                    drag
                    dragMomentum={false}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ scale }}
                >
                    {/* SVG WEB LINES */}
                    <svg className="absolute inset-0 w-[4000px] h-[3000px] -left-[2000px] -top-[1500px] overflow-visible pointer-events-none z-10">
                        {links.map((link, i) => {
                            const source = simNodes.find(n => n.id === link.source);
                            const target = simNodes.find(n => n.id === link.target);
                            if (!source || !target) return null;
                            const color = CATEGORY_COLORS[source.categoryId] || '#fff';
                            return (
                                <line
                                    key={i}
                                    x1={2000 + source.x}
                                    y1={1500 + source.y}
                                    x2={2000 + target.x}
                                    y2={1500 + target.y}
                                    stroke={color}
                                    strokeWidth="2"
                                    strokeDasharray="6 4"
                                    opacity="0.5"
                                />
                            );
                        })}
                    </svg>

                    {/* THUMBNAIL NODES (DOM-Based for visual clarity) */}
                    <div className="relative pointer-events-auto">
                        {simNodes.map((node) => {
                            const isSelected = selectedId === node.id;
                            return (
                                <motion.div
                                    key={node.id}
                                    animate={{
                                        x: node.x,
                                        y: node.y,
                                    }}
                                    transition={{ type: "spring", stiffness: 350, damping: 40 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedId(isSelected ? null : node.id);
                                    }}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                                    style={{ width: node.size, height: node.size }}
                                >
                                    <div className={`relative w-full h-full rounded-full transition-all duration-500 ${isSelected
                                        ? 'ring-4 ring-offset-4 ring-offset-black scale-110 z-50'
                                        : 'hover:ring-4'
                                        }`}
                                        style={{
                                            boxShadow: isSelected ? `0 0 50px ${CATEGORY_COLORS[node.categoryId]}66` : 'none',
                                        }}
                                    >
                                        <div
                                            className="w-full h-full rounded-full overflow-hidden border-2 bg-[#111]"
                                            style={{ borderColor: CATEGORY_COLORS[node.categoryId] || 'rgba(255,255,255,0.1)' }}
                                        >
                                            <img
                                                src={node.thumbnail_url}
                                                className={`w-full h-full object-cover transition-all duration-700 ${isSelected ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'
                                                    }`}
                                                alt=""
                                            />
                                        </div>
                                        <div
                                            className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-lg border text-[8px] font-black text-white"
                                            style={{
                                                backgroundColor: CATEGORY_COLORS[node.categoryId] || '#333',
                                                borderColor: 'rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            {node.hotScore} IQ
                                        </div>
                                    </div>

                                    <div className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 text-center transition-opacity duration-300 ${(isSelected || node.hotScore > 90) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        }`}>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap leading-none mb-1">{node.name}</p>
                                        <p className="text-[8px] font-bold text-white/30 uppercase">{node.categoryId}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* INTERFACE GUIDES */}
                <div className="absolute bottom-10 left-10 p-6 glass rounded-[2.5rem] border border-white/5 max-w-xs pointer-events-none">
                    <div className="flex items-center gap-2 mb-4 opacity-40">
                        <Target size={14} className="text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Network Logic</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full border border-white/40" />
                            <p className="text-[9px] font-bold text-white/40 uppercase">Thumb Size = Market Power</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-4 h-[1px] bg-white/20 border-t border-dashed" />
                            <p className="text-[9px] font-bold text-white/40 uppercase">Dashed Line = Related Audience</p>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[8px] text-white/20 italic leading-relaxed">
                                "Physics-based node repulsion ensures clarity. Connections visualize audience overlap and strategic correlation."
                            </p>
                        </div>
                    </div>
                </div>

                {/* ANALYTICS PANEL */}
                <AnimatePresence>
                    {selectedCreator && (
                        <motion.div
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="absolute top-10 right-10 bottom-10 w-96 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 z-[100] shadow-2xl flex flex-col"
                        >
                            <button onClick={() => setSelectedId(null)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
                                <X size={24} />
                            </button>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <img src={selectedCreator.thumbnail_url} className="w-32 h-32 rounded-[2.5rem] object-cover mb-8 shadow-2xl border border-white/10" alt="" />

                                <div className="space-y-6 mb-10">
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter uppercase mb-1 leading-none">{selectedCreator.name}</h2>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-red-600/10 border border-red-500/20 text-[8px] font-black text-red-500 uppercase rounded">{selectedCreator.categoryId}</span>
                                            <span className="text-[10px] font-mono text-white/30">{selectedCreator.handle}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                            <Award size={14} className="text-red-500 mx-auto mb-1" />
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-30 block mb-1">Impact Score</span>
                                            <p className="text-2xl font-black">{selectedCreator.hotScore}</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                            <TrendingUp size={14} className="text-green-500 mx-auto mb-1" />
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-30 block mb-1">Growth Index</span>
                                            <p className="text-2xl font-black text-green-500">{selectedCreator.breakdown.growthRate.toFixed(1)}x</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Users size={14} className="text-white/20" />
                                                <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Subscribers</span>
                                            </div>
                                            <span className="text-xs font-bold font-mono">{(selectedCreator.stats.subscribers || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-white/40 leading-relaxed italic border-l-2 border-red-500/30 pl-4">
                                        "{selectedCreator.description || 'Detecting significant market movement within the analyzed sector. High potential for audience expansion identified.'}"
                                    </p>
                                </div>
                            </div>

                            <a
                                href={selectedCreator.channelUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-5 rounded-[2.5rem] bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/90 transition-all shadow-xl shadow-white/5 group mt-auto"
                            >
                                <Youtube size={16} fill="black" className="group-hover:scale-110 transition-all" />
                                Open Intelligence
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ZOOM GUIDE INDICATOR */}
                {!selectedCreator && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-24 pointer-events-none opacity-20 flex flex-col items-center gap-2">
                        <MousePointer2 size={16} className="animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Interactive Web Explorer</span>
                    </div>
                )}
            </div>
        </div>
    );
}
