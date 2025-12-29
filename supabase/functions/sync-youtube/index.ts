import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// 유튜브 시간 포맷(ISO 8601)을 초 단위로 변환
function parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match?.[1]?.replace('H', '') || '0') || 0;
    const minutes = parseInt(match?.[2]?.replace('M', '') || '0') || 0;
    const seconds = parseInt(match?.[3]?.replace('S', '') || '0') || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

interface SyncReport {
    region: string;
    cat?: string;
    format?: string;
    status: string;
    message?: string;
    count?: number;
}

Deno.serve(async () => {
    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 수집할 국가 정의
        const regions = ['US', 'KR', 'JP', 'IN', 'BR', 'ID', 'MX'];

        // 지역별 검색어 최적화 (PlayAura Intelligence에 최적화)
        const getQuery = (ourId: string, region: string) => {
            const queries: Record<string, Record<string, string>> = {
                KR: { entertainment: '예능 인기 급상승', gaming: '게임 하이라이트 트랜드', education: '자기계발 지식', tech: '언박싱 IT 리뷰', music: '뮤직비디오 인기', lifestyle: '브이로그 추천', economy: '주식 경제 전망' },
                JP: { entertainment: 'バラエティ 人気', gaming: 'ゲーム実況 トレンド', education: '教養 知識', tech: 'ガジェット レビュー', music: 'ミュージックビデオ', lifestyle: '日常 VLOG', economy: '経済 ニュース 投資' },
                IN: { entertainment: 'trending entertainment india', gaming: 'gaming highlights india', education: 'upsc science knowledge', tech: 'gadget review hindi', music: 'new hindi songs', lifestyle: 'family vlogs india', economy: 'indian stock market' },
                BR: { entertainment: 'entretenimento brasil trending', gaming: 'lives de games brasil', education: 'ciência e curiosidades', tech: 'tech review brasil', music: 'musica brasileira', lifestyle: 'vlogs brasileiros', economy: 'economia brasil' },
                ID: { entertainment: 'hiburan populer indonesia', gaming: 'game seru indonesia', education: 'belajar teknologi', tech: 'review gadget indonesia', music: 'lagu hits indonesia', lifestyle: 'vlog harian', economy: 'ekonomi bisnis indonesia' },
                MX: { entertainment: 'entretenimiento popular', gaming: 'partidas de juegos', education: 'educación y ciencia', tech: 'reseña de tecnología', music: 'musica mexicana', lifestyle: 'vlogs de vida', economy: 'economía méxico' },
                US: { entertainment: 'entertainment trending', gaming: 'gaming highlights', education: 'documentary deep dive', tech: 'tech gadgets review', music: 'trending music videos', lifestyle: 'lifestyle vlogs', economy: 'global economy market' }
            };
            return queries[region]?.[ourId] || queries['US'][ourId];
        };

        const categories = [
            { id: 'entertainment', ytId: '24' },
            { id: 'gaming', ytId: '20' },
            { id: 'education', ytId: '27' },
            { id: 'tech', ytId: '28' },
            { id: 'music', ytId: '10' },
            { id: 'lifestyle', ytId: '22' },
            { id: 'economy', ytId: '25' },
        ];

        const report: SyncReport[] = [];
        let totalCreated = 0;

        for (const region of regions) {
            console.log(`[Quota Saver Sync] Starting Region: ${region}...`);

            for (const cat of categories) {
                try {
                    // 1. 통합 검색 (100점) - maxResults를 늘려 검색 효율 극대화
                    const searchQuery = getQuery(cat.id, region);
                    const lang = region === 'KR' ? 'ko' : region === 'JP' ? 'ja' : region === 'IN' ? 'hi' : region === 'BR' ? 'pt' : region === 'ID' ? 'id' : region === 'MX' ? 'es' : 'en';

                    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=${cat.ytId}&regionCode=${region}&relevanceLanguage=${lang}&maxResults=25&key=${YOUTUBE_API_KEY}`;
                    const searchRes = await fetch(searchUrl);
                    const searchData = await searchRes.json();

                    if (searchData.error) {
                        report.push({ region, cat: cat.id, status: 'error', message: searchData.error.message });
                        continue;
                    }

                    const videoItems = searchData.items || [];
                    if (videoItems.length === 0) continue;

                    // 2. 비디오 상세 정보 확인 (1점) - 영상 길이(Shorts 여부) 확인용
                    const videoIds = videoItems.map((v: any) => v.id.videoId).join(',');
                    const vidUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
                    const vidRes = await fetch(vidUrl);
                    const vidData = await vidRes.json();

                    const durationMap = new Map();
                    vidData.items?.forEach((v: any) => {
                        const seconds = parseDuration(v.contentDetails.duration);
                        durationMap.set(v.id, seconds < 60 ? 'shorts' : 'long');
                    });

                    // 3. 채널 상세 정보 수집 (1점)
                    const channelIds = [...new Set(videoItems.map((v: any) => v.snippet.channelId))];
                    const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds.join(',')}&key=${YOUTUBE_API_KEY}`;
                    const chRes = await fetch(chUrl);
                    const chData = await chRes.json();

                    if (chData.items) {
                        const allCreators = [];
                        const allStats = [];

                        for (const channel of chData.items) {
                            // 해당 채널이 발견된 대표적 포맷 확인
                            const repVideo = videoItems.find((v: any) => v.snippet.channelId === channel.id);
                            const format = durationMap.get(repVideo?.id.videoId) || 'long';

                            allCreators.push({
                                id: channel.id,
                                category_id: cat.id,
                                region_code: region,
                                format_type: format,
                                name: channel.snippet.title,
                                handle: channel.snippet.customUrl,
                                description: channel.snippet.description,
                                thumbnail_url: channel.snippet.thumbnails.medium.url,
                                channel_url: `https://www.youtube.com/channel/${channel.id}`,
                                last_updated_at: new Date().toISOString()
                            });

                            allStats.push({
                                creator_id: channel.id,
                                snapshot_date: new Date().toISOString().split('T')[0],
                                subscribers: parseInt(channel.statistics.subscriberCount) || 0,
                                total_views: parseInt(channel.statistics.viewCount) || 0,
                                total_videos: parseInt(channel.statistics.videoCount) || 0
                            });
                        }

                        // DB 저장 (Upsert)
                        const { error: err1 } = await supabase.from('creators').upsert(allCreators, { onConflict: 'id' });
                        const { error: err2 } = await supabase.from('stats_snapshots').upsert(allStats, { onConflict: 'creator_id,snapshot_date' });

                        if (!err1 && !err2) {
                            totalCreated += allCreators.length;
                            report.push({ region, cat: cat.id, status: 'success', count: allCreators.length });
                        } else {
                            report.push({ region, cat: cat.id, status: 'db_error', message: err1?.message || err2?.message });
                        }
                    }
                } catch (e) {
                    report.push({ region, cat: cat.id, status: 'fatal', message: String(e) });
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            totalCreated,
            report
        }), { headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
    }
})
