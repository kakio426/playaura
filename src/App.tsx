import { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { CreatorCard } from './components/CreatorCard';
import { SkeletonCard } from './components/SkeletonCard';
import { Terms } from './components/Terms';
import { NetworkMap } from './components/NetworkMap';
import type { Creator, SortKey } from './types';
import { CATEGORIES } from './constants';
import { recordVisit, fetchVisitStats } from './services/visits';
import { fetchCreatorsFromDB } from './services/db';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'terms' | 'network'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [activeRegion, setActiveRegion] = useState("KR");

  const [activeFormat, setActiveFormat] = useState<'all' | 'long' | 'shorts'>('all');
  const [sortKey, setSortKey] = useState<SortKey>("hot");

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('playaura_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [stats, setStats] = useState({ today: 0, weekly: 0, total: 0 });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('playaura_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        const [statsData, creatorsData] = await Promise.all([
          fetchVisitStats(),
          fetchCreatorsFromDB()
        ]);
        if (mounted) {
          setStats(statsData);
          setCreators(creatorsData);
          recordVisit(); // Non-blocking
        }
      } catch (err) {
        console.error("Init Error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const filteredCreators = useMemo(() => {
    let res = creators.filter(c => c.region_code === activeRegion);

    if (activeCategoryId === 'favorites') {
      const favs = JSON.parse(localStorage.getItem('motube_favorites') || '[]');
      res = res.filter(c => favs.includes(c.id));
    } else if (activeCategoryId !== 'all') {
      res = res.filter(c => c.categoryId === activeCategoryId);
    }

    if (activeFormat !== 'all') res = res.filter(c => c.format_type === activeFormat);


    if (query) {
      const q = query.toLowerCase();
      res = res.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.handle?.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    res.sort((a, b) => {
      if (sortKey === 'hot') return b.hotScore - a.hotScore;
      if (sortKey === 'subs') return (b.stats.subscribers || 0) - (a.stats.subscribers || 0);
      if (sortKey === 'growth') return b.breakdown.growthRate - a.breakdown.growthRate;
      return 0;
    });

    return res;
  }, [creators, query, activeCategoryId, activeRegion, activeFormat, sortKey]);

  const topCreators = useMemo(() => {
    return creators
      .filter(c => c.region_code === activeRegion)
      .sort((a, b) => b.hotScore - a.hotScore)
      .slice(0, 8);
  }, [creators, activeRegion]);

  const toggleFavorite = useCallback((id: string) => {
    const current = JSON.parse(localStorage.getItem('motube_favorites') || '[]');
    const next = current.includes(id) ? current.filter((f: string) => f !== id) : [...current, id];
    localStorage.setItem('motube_favorites', JSON.stringify(next));
    setCreators(prev => [...prev]);
  }, []);

  if (view === 'terms') return <Terms onBack={() => setView('dashboard')} />;
  if (view === 'network') return <NetworkMap creators={creators} onClose={() => setView('dashboard')} />;

  return (
    <div className="min-h-screen bg-[var(--bg-color)] c-text-main transition-colors duration-200">
      <div className="aura-container"><div className="aura-blob" /></div>
      <Header stats={stats} theme={theme} onToggleTheme={toggleTheme} />

      <Helmet><title>PlayAura</title></Helmet>

      <main className="mx-auto max-w-7xl px-6 pt-32 pb-20 fade-in relative z-10">
        <div className="flex flex-col lg:flex-row gap-12">

          <div className="flex-1 min-w-0">
            <div className="mb-12">
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter italic mb-4">
                Discover <span className="gradient-text">Intelligence.</span>
              </h2>
              <p className="text-[10px] c-text-muted font-bold uppercase tracking-[0.2em]">Real-time Creator Analytics in {activeRegion}</p>
            </div>

            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl mb-12 w-fit">
              {(['all', 'long', 'shorts'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFormat(f)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeFormat === f
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                    : 'c-text-dim hover:c-text-main'
                    }`}
                >
                  {f === 'all' ? '✨ All' : f === 'long' ? '🎬 Long' : '⚡ Shorts'}
                </button>
              ))}
            </div>

            <div className="flex flex-col xl:flex-row gap-4 mb-12">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 c-text-dim" size={16} />
                <input
                  type="text"
                  placeholder="Search sector..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-3.5 pl-10 pr-4 outline-none c-text-main placeholder:c-text-dim focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                {(['hot', 'subs', 'growth'] as SortKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setSortKey(key)}
                    className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${sortKey === key
                      ? 'bg-black/10 dark:bg-white/10 c-text-main'
                      : 'c-text-dim hover:c-text-muted'
                      }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8 mb-16">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategoryId('favorites')}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeCategoryId === 'favorites'
                    ? 'bg-red-500 text-white'
                    : 'bg-black/5 dark:bg-white/5 c-text-muted'
                    }`}
                >
                  ❤️ Watchlist
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeCategoryId === cat.id
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'bg-black/5 dark:bg-white/5 c-text-muted'
                      }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {['US', 'KR', 'JP', 'IN', 'BR', 'ID', 'MX'].map(region => (
                  <button
                    key={region}
                    onClick={() => setActiveRegion(region)}
                    className={`px-4 py-2 rounded-lg font-black text-[10px] transition-all border ${activeRegion === region
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : "bg-black/5 dark:bg-white/5 c-text-dim border-transparent"
                      }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredCreators.map(c => (
                    <CreatorCard
                      key={c.id}
                      creator={c}
                      isFavorite={JSON.parse(localStorage.getItem('motube_favorites') || '[]').includes(c.id)}
                      onToggleFavorite={() => toggleFavorite(c.id)}
                      relatedCreators={c.relatedIds?.map(id => creators.find(all => all.id === id)).filter((rel): rel is Creator => !!rel)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <aside className="lg:w-[360px] space-y-12">
            <div className="glass rounded-[2.5rem] p-8">
              <span className="text-xs font-black uppercase tracking-widest c-text-main mb-8 block">Top Velocity</span>
              <div className="space-y-6">
                {topCreators.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-4">
                    <span className="text-lg font-black c-text-dim w-6">{(i + 1).toString().padStart(2, '0')}</span>
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex-shrink-0">
                      {c.thumbnail_url ? <img src={c.thumbnail_url} className="w-full h-full object-cover grayscale" alt="" /> : <div className="w-full h-full flex items-center justify-center c-text-dim">👤</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold truncate c-text-main">{c.name}</h4>
                      <p className="text-[10px] font-mono c-text-muted">🔥 {c.hotScore} • <span className="text-green-600">+{c.breakdown.growthRate.toFixed(1)}x</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 italic">
              <span className="text-xs font-black uppercase tracking-widest text-red-600 block mb-4">Brief</span>
              <p className="text-[12px] c-text-muted">"Volatility detected in {activeRegion} market. Strategic focus advised."</p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-40 border-t border-black/5 dark:border-white/10 py-20 px-6 bg-white dark:bg-black/50">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-600 rounded-xl"><Youtube size={16} fill="white" color="white" /></div>
              <span className="text-xl font-black gradient-text">PlayAura</span>
            </div>
            <p className="text-[10px] c-text-muted uppercase font-black">YouTube Creator Intelligence</p>
          </div>
          <div className="text-xs font-bold uppercase c-text-dim">© 2025 PlayAura Systems</div>
        </div>
      </footer>
    </div>
  );
}
