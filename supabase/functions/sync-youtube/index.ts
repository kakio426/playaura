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

        // 지역별 검색어 최적화 (PlayAura Intelligence에 최적화) - 랜덤 로테이션 적용
        const getQuery = (ourId: string, region: string) => {
            const queries: Record<string, Record<string, string[]>> = {
                KR: {
                    entertainment: ['예능 인기 급상승', '재미있는 영상 추천', '화제의 예능', '웃긴 동영상 모음', '최신 예능 레전드', '유튜브 인기 예능'],
                    gaming: ['게임 하이라이트', '최신 모바일 게임', '인기 게임 유튜버', '게임 공략 실황', '롤 하이라이트', '마인크래프트 건축'],
                    education: ['자기계발', '지식 채널', '역사 다큐멘터리', '과학 상식', '영어 공부', '동기부여 영상'],
                    tech: ['IT 기기 리뷰', '최신 스마트폰 언박싱', '테크 유튜버', '컴퓨터 조립 추천', '가전제품 추천', '신기한 전자기기'],
                    music: ['최신 인기가요', '노래방 인기곡', '플레이리스트 추천', '라이브 영상', '뮤직비디오 해석', '아이돌 직캠'],
                    lifestyle: ['브이로그 일상', '여행 유튜버 추천', '맛집 탐방', '자취 요리', '다이어트 식단', '룸투어'],
                    economy: ['주식 투자 전망', '재테크 꿀팁', '부동산 시황', '경제 뉴스 해설', '비트코인 전망', '부자되는 법']
                },
                JP: {
                    entertainment: ['バラエティ 人気', '面白い動画', '話題の動画'],
                    gaming: ['ゲーム実況', '新作ゲーム', 'マイクラ 実況'],
                    education: ['教養', '学び', '歴史解説', '英語学習'],
                    tech: ['ガジェット レビュー', 'スマホ 比較', 'PC 自作'],
                    music: ['人気曲', '作業用BGM', '歌ってみた'],
                    lifestyle: ['日常Vlog', '一人暮らし', 'ルーティン'],
                    economy: ['投資 初心者', '株主優待', '節約術']
                },
                IN: {
                    entertainment: ['trending entertainment', 'funny videos hindi', 'latest comedy'],
                    gaming: ['gaming highlights india', 'bgmi gameplay', 'minecraft hindi'],
                    education: ['upsc preparation', 'science facts hindi', 'gk questions'],
                    tech: ['tech review hindi', 'best smartphone under', 'gadget unboxing'],
                    music: ['new hindi songs', 'bollywood hits', 'punjabi songs'],
                    lifestyle: ['lifestyle vlog hindi', 'indian family vlog', 'street food india'],
                    economy: ['stock market hindi', 'investment tips', 'business ideas']
                },
                // Fallback for others (Simplified)
                US: {
                    entertainment: ['trending entertainment', 'viral videos', 'must watch funny'],
                    gaming: ['gaming highlights', 'let\'s play', 'esports moments'],
                    education: ['educational documentary', 'science explained', 'history facts'],
                    tech: ['tech review', 'latest gadgets', 'smartphone comparison'],
                    music: ['new music video', 'live performance', 'top hits'],
                    lifestyle: ['daily vlog', 'travel vlog', 'morning routine'],
                    economy: ['stock market analysis', 'personal finance tips', 'crypto news']
                }
            };

            const regionQueries = queries[region] || queries['US'];
            const categoryQueries = regionQueries[ourId] || queries['US'][ourId] || ['trending'];

            // 배열에서 랜덤하게 하나 선택
            const randomIndex = Math.floor(Math.random() * categoryQueries.length);
            return categoryQueries[randomIndex];
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

            // 7일 전 날짜 계산 (새로운 콘텐츠 발굴용)
            const d = new Date();
            d.setDate(d.getDate() - 7);
            const publishedAfter = d.toISOString();

            for (const cat of categories) {
                try {
                    // 1. 통합 검색 (100점) - maxResults를 늘려 검색 효율 극대화
                    const searchQuery = getQuery(cat.id, region);
                    const lang = region === 'KR' ? 'ko' : region === 'JP' ? 'ja' : region === 'IN' ? 'hi' : region === 'BR' ? 'pt' : region === 'ID' ? 'id' : region === 'MX' ? 'es' : 'en';

                    // publishedAfter 파라미터 추가하여 최신 영상 위주로 검색
                    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=${cat.ytId}&regionCode=${region}&relevanceLanguage=${lang}&publishedAfter=${publishedAfter}&maxResults=25&key=${YOUTUBE_API_KEY}`;
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
