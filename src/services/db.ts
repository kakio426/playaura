import { supabase } from '../lib/supabase';
import type { Creator, HotWeights } from '../types';
import { DEFAULT_WEIGHTS, computeHot } from '../utils/score';
import { CATEGORY_WEIGHTS } from '../constants';

/**
 * DB의 creator_analytics 뷰에서 계산된 데이터를 가져옵니다.
 */
export async function fetchCreatorsFromDB(weights: HotWeights = DEFAULT_WEIGHTS): Promise<Creator[]> {
    const { data: rawData, error } = await supabase
        .from('creator_analytics')
        .select('*');

    let data = rawData;

    if (error || !data || data.length === 0) {
        console.warn('Analytics view failed or empty, falling back to basic creators table');
        const { data: basicData, error: basicError } = await supabase
            .from('creators')
            .select('*');

        if (basicError) {
            console.error('Basic fetch error:', basicError);
            return [];
        }

        data = basicData.map(item => ({
            ...item,
            current_subs: item.subscribers || 0,
            current_views: item.total_views || 0,
            current_videos: item.total_videos || 0,
            subs_delta_7d: 0,
            views_delta_7d: 0
        }));
    }

    const creators: Creator[] = data.map((item: any) => {
        const statsForScore = {
            subscribers: item.current_subs,
            totalViews: item.current_views,
            totalVideos: item.current_videos,
            subsDelta7d: item.subs_delta_7d || 0,
            viewsDelta7d: item.views_delta_7d || 0,
            avgViewsPerVideo28d: item.current_views / (item.current_videos || 1),
            uploads7d: 1
        };

        const { hotScore, breakdown } = computeHot(statsForScore, weights, {
            lastUpdatedAt: new Date(item.last_updated_at).getTime(),
            adminBoost: item.admin_boost || 1.0,
            categoryWeight: CATEGORY_WEIGHTS[item.category_id as keyof typeof CATEGORY_WEIGHTS] || 1.0,
            formatType: item.format_type
        });

        return {
            id: item.id,
            categoryId: item.category_id,
            region_code: item.region_code,
            format_type: item.format_type,
            name: item.name,
            handle: item.handle,
            description: item.description || '유튜브 인기 급상승 크리에이터',
            channelUrl: item.channel_url,
            thumbnail_url: item.thumbnail_url,
            tags: item.tags || [item.category_id, 'Trending'],
            why: item.why && item.why.length > 0 ? item.why : ['최근 트래픽 유입이 활발함', '카테고리 인기 비디오 배출'],
            evidence: [],
            stats: statsForScore,
            hotScore,
            breakdown,
            lastUpdatedAt: new Date(item.last_updated_at).getTime()
        };
    });

    // --- Optimized Correlation Engine ---
    // Instead of N^2 full regex matching, we use a lighter category + keyword approach
    // We only process if N is reasonable to avoid blocking the main thread too long
    if (creators.length > 500) return creators;

    // Pre-calculate word sets for all creators to avoid repetitive regex work
    const creatorWordSets = creators.map(c => ({
        id: c.id,
        words: new Set((c.description + ' ' + c.name).toLowerCase().match(/\w{3,}/g) || [])
    }));

    return creators.map((current, idx) => {
        const currentWords = creatorWordSets[idx].words;

        const relatedIds = creators
            .map((other, oIdx) => {
                if (current.id === other.id) return { id: other.id, score: -1 };

                let score = 0;
                // 1. Same category (Base similarity)
                if (other.categoryId === current.categoryId) score += 5;

                // 2. Keyword check using indexed Sets (Much faster than regex inside loops)
                const otherWords = creatorWordSets[oIdx].words;
                let overlap = 0;
                for (const word of currentWords) {
                    if (otherWords.has(word)) overlap++;
                }
                score += overlap * 2;

                return { id: other.id, score };
            })
            .sort((a, b) => b.score - a.score)
            .filter(o => o.score > 3)
            .slice(0, 3)
            .map(o => o.id);

        return { ...current, relatedIds };
    });
}
