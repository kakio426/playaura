import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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

        // 수집할 국가 정의 (유튜브 인구 대국 추가)
        const regions = ['US', 'KR', 'JP', 'IN', 'BR', 'ID', 'MX'];

        // 지역별 검색어 최적화
        const getQuery = (ourId: string, region: string) => {
            const queries: Record<string, Record<string, string>> = {
                KR: { entertainment: '예능 인기', gaming: '게임 하이라이트', education: '자기계발 지식', tech: '언박싱 리뷰', music: '뮤직비디오 인기', lifestyle: '브이로그', economy: '주식 경제 전망' },
                JP: { entertainment: 'バラエティ 人気', gaming: 'ゲーム実況', education: '教養 知識', tech: 'ガジェット レビュー', music: 'ミュージックビデオ', lifestyle: '日常 VLOG', economy: '経済 ニュース 投資' },
                IN: { entertainment: 'bollywood entertainment', gaming: 'gaming highlights india', education: 'upsc preparation science', tech: 'mobile review hindi', music: 'new hindi songs', lifestyle: 'family vlogs india', economy: 'indian stock market news' },
                BR: { entertainment: 'entretenimento brasil', gaming: 'lives de games', education: 'ciência e curiosidades', tech: 'tech review brasil', music: 'musica brasileira', lifestyle: 'vlogs brasileiros', economy: 'economia brasil investimento' },
                ID: { entertainment: 'hiburan populer', gaming: 'game seru', education: 'belajar teknologi', tech: 'review gadget indonesia', music: 'lagu hits indonesia', lifestyle: 'vlog harian', economy: 'ekonomi bisnis indonesia' },
                MX: { entertainment: 'entretenimiento popular', gaming: 'partidas de juegos', education: 'educación y ciencia', tech: 'reseña de tecnología', music: 'musica mexicana', lifestyle: 'vlogs de vida', economy: 'economía méxico finanzas' },
                US: { entertainment: 'entertainment trending', gaming: 'gaming highlights', education: 'educational documentaries', tech: 'tech gadgets review', music: 'trending music videos', lifestyle: 'lifestyle vlogs', economy: 'global economy market news' }
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
        const formats = ['long', 'shorts'];

        for (const region of regions) {
            console.log(`[Global Sync] Starting Sync for Region: ${region}...`);

            for (const format of formats) {
                const allCreators = [];
                const allStats = [];

                for (const cat of categories) {
                    let searchQuery = getQuery(cat.id, region);
                    if (format === 'shorts') {
                        searchQuery += ' shorts'; // Force shorts context
                    }

                    const lang = region === 'KR' ? 'ko' : region === 'JP' ? 'ja' : region === 'IN' ? 'hi' : region === 'BR' ? 'pt' : region === 'ID' ? 'id' : region === 'MX' ? 'es' : 'en';

                    try {
                        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=${cat.ytId}&regionCode=${region}&relevanceLanguage=${lang}&maxResults=10&key=${YOUTUBE_API_KEY}`;
                        const ytRes = await fetch(ytUrl);
                        const ytData = await ytRes.json();

                        if (ytData.error) {
                            report.push({ region, cat: cat.id, format, status: 'error', message: ytData.error.message });
                            continue;
                        }

                        const items = ytData.items || [];
                        if (items.length === 0) {
                            report.push({ region, cat: cat.id, format, status: 'no_results' });
                            continue;
                        }

                        const channelIds = items.map((i: { snippet: { channelId: string } }) => i.snippet.channelId);
                        const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds.join(',')}&key=${YOUTUBE_API_KEY}`;
                        const chRes = await fetch(chUrl);
                        const chData = await chRes.json();

                        if (chData.items) {
                            for (const channel of chData.items) {
                                allCreators.push({
                                    id: channel.id,
                                    category_id: cat.id,
                                    region_code: region,
                                    format_type: format, // 'long' or 'shorts'
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
                            report.push({ region, cat: cat.id, format, status: 'success', count: chData.items.length });
                        }
                    } catch (e) {
                        const message = e instanceof Error ? e.message : String(e);
                        report.push({ region, cat: cat.id, format, status: 'fatal', message });
                    }
                }

                if (allCreators.length > 0) {
                    const { error: err1 } = await supabase.from('creators').upsert(allCreators, { onConflict: 'id' });
                    const { error: err2 } = await supabase.from('stats_snapshots').upsert(allStats, { onConflict: 'creator_id,snapshot_date' });
                    if (err1 || err2) {
                        report.push({ region, format, status: 'db_error', message: err1?.message || err2?.message });
                    } else {
                        totalCreated += allCreators.length;
                    }
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            totalCreated,
            report
        }), { headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), { status: 500 })
    }
})
