export const FILTER_KEYWORDS = {
    // Tier 1: Critical (Score: +30) - Almost certainly corporate/institutional
    CRITICAL: {
        KR: [
            '뉴스', 'news', '방송', '일보', '경제', '데일리', '미디어', '협회',
            '공식', '오피셜', 'official', '재배포', '무단전재', '기자', '앵커',
            '신문', '저널', '타임즈', '헤럴드', '트리뷴', '포스트', '통신', '브리핑',
            'assembly', 'ministry', 'police', 'government', 'archive',
            '증권', '은행', '보험', '카드', 'bank', 'invest'
        ],
        GLOBAL: [
            'news', 'daily', 'tribune', 'times', 'media', 'broadcast', 'network',
            'official', 'corp', 'inc', 'ltd', 'press', 'gazette', 'chronicle',
            'journal', 'report', 'wire', 'nbc', 'abc', 'cbs', 'bbc', 'cnn', 'fox',
            'entertainment tonight', 'mojo', 'watchmojo', // Content farms
            'bank', 'insurance', 'securities'
        ]
    },

    // Tier 2: Contextual (Score: +10) - Suspicious if combined with other signals
    CONTEXTUAL: {
        KR: [
            'tv', '채널', '연구소', '포럼', '부동산', '주식', '투자', '증권',
            '법률', '세무', '병원', '의원', '클리닉', '센터', '재단'
        ],
        GLOBAL: [
            'channel', 'institute', 'foundation', 'global', 'invest',
            'finance', 'law', 'clinic', 'center', 'foundation', 'digest'
        ]
    },

    // Shield: Negative Score (Score: -20 to -30) - Clear signals of individual creators
    SHIELD: {
        KEYWORDS: [
            'vlog', '브이로그', '일상', '부부', '커플', '여행', '먹방', 'mukbang',
            'reaction', 'review', 'gameplay', 'let\'s play', 'sketch', 'comedy',
            'prank', 'challenge', 'asmr', 'drawing', 'cover', 'dance',
            'study with me', 'grwm', 'ootd', 'what i eat', 'haul', 'unboxing',
            '침착맨', '슈카', '워크맨', '피식대학', '빠니보틀' // Famous whitelists
        ],
        PLATFORMS: [
            'instagram.com', 'tiktok.com', 'twitch.tv', 'patreon.com',
            'discord.gg', 'discord.com', 'smartstore.naver.com'
        ]
    }
};
