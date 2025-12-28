import { supabase } from '../lib/supabase';
import { getPopularChannelIds, getChannelsDetails } from './youtube';

/**
 * 특정 카테고리의 인기 채널을 수집하여 DB에 저장합니다.
 * @param categoryId 우리 서비스의 카테고리 ID (예: 'gaming')
 * @param youtubeCatId 유튜브 API의 카테고리 ID (예: '20')
 */
export async function syncCategoryCreators(categoryId: string, youtubeCatId: string) {
    try {
        console.log(`[Sync] Starting sync for category: ${categoryId}...`);

        // 1. 유망 채널 ID 발굴
        const channelIds = await getPopularChannelIds(youtubeCatId);

        // 2. 채널 상세 정보 획득
        const details = await getChannelsDetails(channelIds);

        for (const channel of details) {
            // 3. creators 테이블 업서트 (기본 정보 저장)
            const { error: creatorError } = await supabase
                .from('creators')
                .upsert({
                    id: channel.id,
                    category_id: categoryId,
                    name: channel.name,
                    handle: channel.handle,
                    description: channel.description,
                    thumbnail_url: channel.thumbnail_url,
                    channel_url: `https://www.youtube.com/channel/${channel.id}`,
                    last_updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (creatorError) console.error('Creator Error:', creatorError);

            // 4. stats_snapshots 테이블에 오늘자 스냅샷 저장 (성장률 분석용)
            const { error: statsError } = await supabase
                .from('stats_snapshots')
                .upsert({
                    creator_id: channel.id,
                    snapshot_date: new Date().toISOString().split('T')[0],
                    subscribers: channel.subscribers,
                    total_views: channel.totalViews,
                    total_videos: channel.totalVideos,
                }, { onConflict: 'creator_id,snapshot_date' });

            if (statsError) console.error('Stats Error:', statsError);
        }

        console.log(`[Sync] Finished sync for ${categoryId}.`);
        return { success: true, count: details.length };
    } catch (err) {
        console.error('Sync failed:', err);
        return { success: false, error: err };
    }
}

/**
 * 모든 주력 카테고리를 한 번에 동기화합니다.
 */
export async function syncAll() {
    const mapping = [
        { ourId: 'entertainment', ytId: '24' },
        { ourId: 'gaming', ytId: '20' },
        { ourId: 'education', ytId: '27' },
        { ourId: 'tech', ytId: '28' },
        { ourId: 'music', ytId: '10' },
        { ourId: 'lifestyle', ytId: '22' },
        { ourId: 'economy', ytId: '25' },
    ];

    let totalCount = 0;
    try {
        for (const m of mapping) {
            const res = await syncCategoryCreators(m.ourId, m.ytId);
            if (res.success && typeof res.count === 'number') {
                totalCount += res.count;
            }
        }
        return { success: true, count: totalCount };
    } catch (err) {
        return { success: false, error: err };
    }
}
