import type { ChannelStats, HotWeights } from "../types";

export const DEFAULT_WEIGHTS: HotWeights = {
    wA: 0.38,
    wB: 0.32,
    wC: 0.20,
    wD: 0.10,
};

export const SHORTS_WEIGHTS: HotWeights = {
    wA: 0.20,
    wB: 0.45,
    wC: 0.30,
    wD: 0.05,
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function scoreSubsDelta(subsDelta7d?: number) {
    if (!subsDelta7d || subsDelta7d <= 0) return 0;
    const v = Math.log10(Math.max(10, subsDelta7d));
    return clamp(v * 18, 0, 100);
}

function scoreViewsDelta(viewsDelta7d?: number) {
    if (!viewsDelta7d || viewsDelta7d <= 0) return 0;
    const v = Math.log10(Math.max(1000, viewsDelta7d));
    return clamp(v * 16, 0, 100);
}

function growthRate(stats: ChannelStats) {
    const viewsDelta7d = stats.viewsDelta7d ?? 0;
    const avg = stats.avgViewsPerVideo28d ?? 0;
    const uploads7d = Math.max(1, stats.uploads7d ?? 1);
    const baseline = Math.max(1, avg * uploads7d);
    return viewsDelta7d / baseline;
}

function scoreGrowth(rate: number) {
    const v = Math.log2(Math.max(0.25, rate));
    return clamp(50 + v * 25, 0, 100);
}

function scoreUploads(uploads7d?: number) {
    const u = Math.max(0, uploads7d ?? 0);
    return clamp((u / 7) * 100, 0, 100);
}

export interface ScoringOptions {
    lastUpdatedAt?: number;
    adminBoost?: number;
    categoryWeight?: number;
    formatType?: 'long' | 'shorts';
}

export function computeHot(stats: ChannelStats, weights: HotWeights, options: ScoringOptions = {}) {
    const activeWeights = options.formatType === 'shorts' ? SHORTS_WEIGHTS : weights;
    const s = Math.max(0.00001, activeWeights.wA + activeWeights.wB + activeWeights.wC + activeWeights.wD);
    const w = { wA: activeWeights.wA / s, wB: activeWeights.wB / s, wC: activeWeights.wC / s, wD: activeWeights.wD / s };

    // 1. Base Metrics
    const aSubs = scoreSubsDelta(stats.subsDelta7d);
    const bViews = scoreViewsDelta(stats.viewsDelta7d);
    const rate = growthRate(stats);
    const cGrowth = scoreGrowth(rate);
    const dUpload = scoreUploads(stats.uploads7d);

    let rawHot = w.wA * aSubs + w.wB * bViews + w.wC * cGrowth + w.wD * dUpload;

    // 2. Time Decay (Reddit-style Gravity)
    // Formula: Score = Base / (Hours + 2)^G
    const GRAVITY = 1.8;
    const now = Date.now();
    const updateTime = options.lastUpdatedAt || now;
    const hoursSinceUpdate = Math.max(0, (now - updateTime) / (1000 * 60 * 60));
    const decayMultiplier = 1 / Math.pow(hoursSinceUpdate + 2, GRAVITY);

    // Applying decay carefully to not kill the score completely, but affect ranking
    // For UI display, we might want the 'raw' hotness but for sorting we use decayed
    rawHot = rawHot * (decayMultiplier * 4); // Normalizing to keep it around 0-100 range for fresh content

    // 3. Strategic Boosts (Admin & Category)
    const adminBoost = options.adminBoost || 1.0;
    const categoryWeight = options.categoryWeight || 1.0;

    let finalHot = rawHot * adminBoost * categoryWeight;

    return {
        hotScore: clamp(Math.round(finalHot), 0, 100),
        breakdown: {
            aSubs: Math.round(aSubs),
            bViews: Math.round(bViews),
            cGrowth: Math.round(cGrowth),
            dUpload: Math.round(dUpload),
            growthRate: rate,
            decayMultiplier,
        },
    };
}
