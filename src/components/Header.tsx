import { Youtube, Activity, Globe, Sun, Moon } from 'lucide-react';

interface HeaderProps {
    stats: {
        today: number;
        weekly: number;
        total: number;
    };
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    stats,
    theme,
    onToggleTheme
}) => {
    const formatNum = (num: number) => new Intl.NumberFormat().format(num);

    return (
        <div className="fixed top-4 sm:top-6 left-0 right-0 z-[100] px-3 sm:px-6 pointer-events-none">
            <header className="mx-auto max-w-7xl glass rounded-2xl sm:rounded-3xl px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between pointer-events-auto border border-black/5 dark:border-white/10 shadow-xl">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 bg-red-600 rounded-lg sm:rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                        <Youtube size={16} color="white" fill="white" className="sm:w-[20px] sm:h-[20px]" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-black tracking-tighter gradient-text leading-tight">PlayAura</h1>
                        <p className="hidden xs:block text-[7px] sm:text-[8px] c-text-muted uppercase tracking-[0.2em] font-black leading-tight">Intelligence for YouTube Creators</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-8">
                    {/* Visitor Stats */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-2 sm:gap-2.5">
                            <Activity size={12} className="text-green-500 sm:w-[14px] sm:h-[14px]" />
                            <div className="flex flex-col">
                                <span className="hidden xs:block text-[7px] sm:text-[8px] c-text-dim uppercase font-black tracking-widest leading-none mb-0.5 sm:mb-1">Today</span>
                                <span className="text-[10px] sm:text-xs font-mono font-bold text-green-500 leading-none">{formatNum(stats.today)}</span>
                            </div>
                        </div>

                        <div className="hidden xs:flex items-center gap-2 sm:gap-2.5">
                            <Globe size={12} className="text-blue-500 sm:w-[14px] sm:h-[14px]" />
                            <div className="flex flex-col">
                                <span className="hidden sm:block text-[8px] c-text-dim uppercase font-black tracking-widest leading-none mb-1">Total Visits</span>
                                <span className="text-[10px] sm:text-xs font-mono font-bold c-text-main leading-none">{formatNum(stats.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-6 sm:h-8 w-px bg-black/5 dark:bg-white/10" />

                    {/* Theme Toggle */}
                    <button
                        onClick={onToggleTheme}
                        className="p-2 sm:p-2.5 bg-black/5 dark:bg-white/5 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 group"
                    >
                        {theme === 'light' ? (
                            <Moon size={16} className="text-black/60 group-hover:text-black transition-colors sm:w-[18px] sm:h-[18px]" />
                        ) : (
                            <Sun size={16} className="text-white/60 group-hover:text-white transition-colors sm:w-[18px] sm:h-[18px]" />
                        )}
                    </button>
                </div>
            </header>
        </div>
    );
};
