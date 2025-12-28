export type Evidence = {
    label: string;
    value: string;
    sourceName?: string;
    sourceUrl?: string;
    asOf?: string;
};

export type Category = {
    id: string;
    name: string;
    icon?: string;
    whatToLookFor: string[];
};

export type ChannelStats = {
    subscribers?: number;
    totalViews?: number;
    totalVideos?: number;
    subsDelta7d?: number;
    viewsDelta7d?: number;
    avgViewsPerVideo28d?: number;
    uploads7d?: number;
};

export type Creator = {
    id: string;
    categoryId: string;
    name: string;
    handle?: string;
    description: string;
    channelUrl: string;
    thumbnail_url?: string;
    region_code: string;
    tags: string[];
    why: string[];
    evidence: Evidence[];
    stats: ChannelStats;
    hotScore: number;
    breakdown: {
        aSubs: number;
        bViews: number;
        cGrowth: number;
        dUpload: number;
        growthRate: number;
        decayMultiplier?: number;
    };
    lastUpdatedAt: number;
    format_type?: 'long' | 'shorts';
    relatedIds?: string[];
};

export type SortKey = "hot" | "subs" | "growth";

export type HotWeights = {
    wA: number;
    wB: number;
    wC: number;
    wD: number;
};
