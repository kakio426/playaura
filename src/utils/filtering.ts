import type { Creator } from '../types';

/**
 * Checks if a channel is likely a corporate/news channel based on scoring.
 * Higher score = Higher probability of being corporate.
 */
export function isCorporateChannel(creator: Creator): boolean {
    let score = 0;
    const lowerName = creator.name.toLowerCase();
    const lowerDesc = (creator.description || '').toLowerCase();

    // 1. Critical Keywords (Definite Corporate) - High Score
    const criticalKeywords = [
        '뉴스', 'news', '연합뉴스', 'ytn', 'kbs', 'mbc', 'sbs', 'jtbc', 'obs', 'arirang',
        'press', '경제tv', '방송국', 'media', 'company', 'corporation', 'official'
    ];

    if (criticalKeywords.some(k => lowerName.includes(k))) {
        score += 20;
    }

    // 2. Secondary Keywords (Contextual) - Medium Score
    const secondaryKeywords = [
        '경제', 'economy', '증권', '투자', 'stock', 'finance', 'daily', 'journal',
        'times', 'report', 'lab', 'research'
    ];

    if (secondaryKeywords.some(k => lowerName.includes(k))) {
        score += 5;
    }

    // 3. 'TV' handling (Low Score by itself)
    // Helps catch 'SomeNews TV' but ignores 'Gamer TV' if other cues are missing
    if (lowerName.endsWith('tv') || lowerName.includes('television')) {
        score += 2;
    }

    // 4. Description Analysis
    const descKeywords = ['제보', 'all rights reserved', 'copyright', '무단전재', '재배포 금지', '구독료', '후원문의'];
    if (descKeywords.some(k => lowerDesc.includes(k))) {
        score += 5;
    }

    // 5. Whitelist (Exceptions)
    // Famous individual creators who might trigger keywords
    const whitelist = ['슈카월드', '침착맨', '워크맨', '피식대학', '빠니보틀'];
    if (whitelist.some(w => lowerName.includes(w.toLowerCase()))) {
        return false;
    }

    // Threshold: 15 points
    // - "연합뉴스" -> 20 (Critical) = Filtered
    // - "한국경제TV" -> 5 (Secondary) + 2 (TV) + 20 (Critical "뉴스" or similar) = Filtered
    // - "슈카월드" -> Whitelisted = Passed
    // - "침착맨" -> Whitelisted = Passed
    // - "Gamer TV" -> 2 (TV) = Passed
    return score >= 15;
}
