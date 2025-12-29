import type { Creator } from '../types';
import { FILTER_KEYWORDS } from './keywords';

/**
 * Smart Filter 2.0: "The Soul Test"
 * 
 * A weighted scoring system to determine if a channel is "Corporate/Institutional" (Noise)
 * or a "Creator" (Signal).
 * 
 * Score Range: 0 - 100+
 * Threshold: >= 60 (Filtered out)
 */
export function isCorporateChannel(creator: Creator): boolean {
    let score = 0;
    const lowerName = creator.name.toLowerCase();

    // Safety check for empty descriptions
    const lowerDesc = (creator.description || '').toLowerCase();

    // --- Layer 1: The "Institutional" Fingerprint (Linguistic) ---

    // 1.1 Critical Keywords (+30 points)
    // "Official", "News", "Press" -> Strongest indicators
    const criticalMatches = [...FILTER_KEYWORDS.CRITICAL.KR, ...FILTER_KEYWORDS.CRITICAL.GLOBAL];
    if (criticalMatches.some(k => lowerName.includes(k))) score += 30;
    if (criticalMatches.some(k => lowerDesc.includes(k))) score += 15; // Increased from 10

    // 1.2 Contextual Keywords (+10 points)
    // "TV", "Channel" -> Only suspicious if combined (Logic handled by accumulative score)
    const contextualMatches = [...FILTER_KEYWORDS.CONTEXTUAL.KR, ...FILTER_KEYWORDS.CONTEXTUAL.GLOBAL];
    if (contextualMatches.some(k => lowerName.includes(k))) score += 10;

    // 1.3 Structural Patterns (+15 points)
    // E.g., "Seoul Real Estate", "Korea Economy" -> [Region] [Topic] pattern often indicates inst.
    // Simplifying regex for performance: Check if it starts with a region code-like string
    if (/^(kr|us|jp|uk|seoul|korea|world|global)\s/i.test(lowerName)) score += 15;


    // --- Layer 2: The "Factory" Metrics (Behavioral) ---

    // 2.1 Mass Production Penalty (+20 ~ +40 points)
    // Creators rarely have > 5,000 videos. News agencies have 50,000+.
    const totalVideos = creator.stats.totalVideos || 0;
    if (totalVideos > 8000) score += 40;
    else if (totalVideos > 3000) score += 20; // Stricter threshold (was 5000)

    // 2.2 The "Zombie" Effect (+15 points)
    // High subs but low view/sub ratio = clear sign of dead/corporate channel
    // e.g. 1M subs but 2k views per video
    const currentSubs = creator.stats.subscribers || 0;
    const avgViews = creator.stats.avgViewsPerVideo28d || 0;

    if (currentSubs > 100000) {
        const engagementRatio = avgViews / currentSubs;
        if (engagementRatio < 0.005) score += 20; // Increased penalty (was 15)
    }


    // --- Layer 3: Category Context (The "Genre" Bias) ---

    // News & Politics (25) -> High base score
    if (creator.categoryId === '25') score += 25;

    // Education (27), Nonprofits (29) -> Moderate base score
    if (creator.categoryId === '27' || creator.categoryId === '29') score += 10;

    // Gaming (20), Entertainment (24), People (22) -> Negative base score (likely creator)
    if (['20', '22', '24'].includes(creator.categoryId)) score -= 10;


    // --- Layer 4: The "Creator Shield" (Redemption) ---

    // 4.1 Vlog / Personality Keywords (-20 points)
    if (FILTER_KEYWORDS.SHIELD.KEYWORDS.some(k => lowerName.includes(k) || lowerDesc.includes(k))) {
        score -= 20;
    }

    // 4.2 Social Proof (-15 points)
    // Personal SNS links usually mean human. Corporate usually links to .com or facebook page.
    if (FILTER_KEYWORDS.SHIELD.PLATFORMS.some(p => lowerDesc.includes(p))) {
        score -= 20; // Boosted shield for having Instagram/Twitch
    }

    // 4.3 High Engagement Shield (-20 points)
    // If > 20% of subs are watching, it's alive and relevant, regardless of category.
    if (currentSubs > 10000 && (avgViews / currentSubs) > 0.2) {
        score -= 20;
    }

    // --- Final Verdict ---
    // Upper bound cap to prevent overflow, though boolean return doesn't need it.
    // Threshold: 60
    return score >= 60;
}
