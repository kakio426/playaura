import { supabase } from '../lib/supabase';

/**
 * 접속 시 방문 기록을 남깁니다.
 */
// Session Key for duplicate prevention
const VISIT_SESSION_KEY = 'playaura_has_visited_v1';

export async function recordVisit() {
    // 1. Check Session Storage (Prevent counting on refresh)
    if (sessionStorage.getItem(VISIT_SESSION_KEY)) {
        return;
    }

    try {
        // 2. Mark session as visited
        sessionStorage.setItem(VISIT_SESSION_KEY, 'true');

        // 3. Record to DB (Fire and Forget)
        supabase.from('site_visits').insert({}).then(() => { });
    } catch (e) {
        console.error('Visit recording failed:', e);
    }
}

/**
 * 오늘, 이번 주, 전체 방문자 수를 가져옵니다. 
 * 병렬 처리를 통해 로딩 속도를 개선합니다.
 */
export async function fetchVisitStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
        const [totalRes, todayRes, weeklyRes] = await Promise.all([
            supabase.from('site_visits').select('*', { count: 'exact', head: true }),
            supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('visited_at', todayStart),
            supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('visited_at', weekStart)
        ]);

        return {
            today: todayRes.count || 0,
            weekly: weeklyRes.count || 0,
            total: totalRes.count || 0
        };
    } catch (err) {
        console.error("Stats fetch failed", err);
        return { today: 0, weekly: 0, total: 0 };
    }
}
