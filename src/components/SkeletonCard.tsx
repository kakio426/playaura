

export function SkeletonCard() {
    return (
        <div className="glass-card flex flex-col p-5 rounded-[2rem] h-full overflow-hidden relative">
            <div className="absolute inset-0 bg-black/5 dark:bg-white/5 animate-pulse" />

            {/* Thumbnail Skeleton */}
            <div className="w-full aspect-video rounded-2xl bg-black/5 dark:bg-white/10 mb-4 animate-pulse" />

            {/* Header Skeleton */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-black/5 dark:bg-white/10 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-black/5 dark:bg-white/10 rounded w-1/2 animate-pulse" />
                </div>
                <div className="w-8 h-8 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2 mb-6">
                <div className="h-3 bg-black/5 dark:bg-white/10 rounded w-full animate-pulse" />
                <div className="h-3 bg-black/5 dark:bg-white/10 rounded w-5/6 animate-pulse" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-black/5 dark:bg-white/10 rounded-2xl animate-pulse" />
                ))}
            </div>

            {/* Bottom Skeleton */}
            <div className="mt-auto space-y-3">
                <div className="h-3 bg-black/5 dark:bg-white/10 rounded w-1/3 animate-pulse" />
                <div className="flex gap-2">
                    <div className="h-6 w-16 bg-black/5 dark:bg-white/10 rounded-full animate-pulse" />
                    <div className="h-6 w-16 bg-black/5 dark:bg-white/10 rounded-full animate-pulse" />
                </div>
            </div>
        </div>
    );
}
