import type { Category } from "./types";

export const CATEGORIES: Category[] = [
    { id: "all", name: "전체", icon: "✨", whatToLookFor: ["완성도", "업로드 리듬", "댓글/공유 반응"] },
    { id: "entertainment", name: "예능", icon: "🎬", whatToLookFor: ["훅", "편집 템포", "콘셉트 시리즈화"] },
    { id: "gaming", name: "게임", icon: "🎮", whatToLookFor: ["라이브", "클립화", "커뮤니티 밈"] },
    { id: "education", name: "교육", icon: "📚", whatToLookFor: ["구조", "예시", "검색 유입"] },
    { id: "tech", name: "🧠 기술/리뷰", icon: "🧠", whatToLookFor: ["최신성", "레퍼런스", "깊이"] },
    { id: "music", name: "음악", icon: "🎵", whatToLookFor: ["사운드", "저작권", "플레이리스트"] },
    { id: "lifestyle", name: "라이프", icon: "🌿", whatToLookFor: ["비주얼", "스토리", "루틴/정보"] },
    { id: "economy", name: "경제", icon: "💰", whatToLookFor: ["전문성", "시장 분석", "정보 전달"] },
];

export const CATEGORY_WEIGHTS: Record<string, number> = {
    all: 1.0,
    entertainment: 1.0,
    gaming: 0.9,      // Slightly lower due to high volume
    education: 1.1,   // Higher value for platform reputation
    tech: 1.2,        // High revenue potential
    music: 1.0,
    lifestyle: 1.0,
    economy: 1.3,     // High value niche
};
