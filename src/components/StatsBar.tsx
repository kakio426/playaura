import { useEffect, useState } from 'react';
import { Users, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsBarProps {
    compact?: boolean;
}

export function StatsBar({ compact = false }: StatsBarProps) {
    const [stats, setStats] = useState({
        realtime: 12,
        daily: 842,
        total: 15420
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                realtime: Math.max(5, prev.realtime + Math.floor(Math.random() * 3) - 1)
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const formatNum = (num: number) => new Intl.NumberFormat().format(num);

    const baseClass = "glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border border-white/5 transition-all duration-500 hover:bg-white/[0.02]";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${compact ? 'flex-col' : 'flex-wrap justify-center'} gap-4`}
        >
            {/* Real-time Stat */}
            <div className={`${baseClass} group hover:border-green-500/30`}>
                <div className="relative">
                    <Activity size={compact ? 20 : 16} className="text-green-400" />
                    <div className="absolute inset-0 bg-green-400 blur-sm opacity-50 animate-pulse" />
                </div>
                <div>
                    <span className="text-[10px] block text-white/30 uppercase font-black tracking-widest leading-none mb-1.5">Live Active</span>
                    <span className={`${compact ? 'text-lg' : 'text-sm'} font-mono font-bold text-green-400`}>
                        {formatNum(stats.realtime)} <span className="text-[10px] text-white/20 ml-1 font-sans">Analyzing</span>
                    </span>
                </div>
            </div>

            {/* Daily Stat */}
            <div className={`${baseClass} group hover:border-red-500/30`}>
                <Users size={compact ? 20 : 16} className="text-red-400" />
                <div>
                    <span className="text-[10px] block text-white/30 uppercase font-black tracking-widest leading-none mb-1.5">Today's Pulse</span>
                    <span className={`${compact ? 'text-lg' : 'text-sm'} font-mono font-bold text-white`}>
                        {formatNum(stats.daily)} <span className="text-[10px] text-white/20 ml-1 font-sans">Visits</span>
                    </span>
                </div>
            </div>

            {/* Total Stat */}
            <div className={`${baseClass} group hover:border-purple-500/30`}>
                <Globe size={compact ? 20 : 16} className="text-purple-400" />
                <div>
                    <span className="text-[10px] block text-white/30 uppercase font-black tracking-widest leading-none mb-1.5">Global Reach</span>
                    <span className={`${compact ? 'text-lg' : 'text-sm'} font-mono font-bold text-white`}>
                        {formatNum(stats.total)} <span className="text-[10px] text-white/20 ml-1 font-sans">Total Assets</span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
