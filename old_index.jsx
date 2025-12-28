// ================================
// YouTube Creator Directory (V2)
// ✅ 목표: "유튜브 채널(유튜버)"을 카테고리별로 추천 + "Hot(급상승)"를 점수화
// ✅ Hot 점수(추천): (A) 7일 구독자 증가량 + (B) 7일 조회수 증가량을 가중합하고
//                 (C) 평균 조회수 대비 성장률로 보정, (D) 업로드 빈도로 보조
// ✅ 글로벌 대상 + "공식 출처" 우선(YouTube Blog / YouTube Trends / YouTube Charts / 채널 URL)
//
// 실행: 이 파일을 src/App.tsx 로 사용
// 주의: 블록 주석(/* */) 없이 // 라인 주석만 사용 (파싱 에러 방지)
// ================================

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

// ================================
// Types
// ================================

type Evidence = {
  label: string;
  value: string;
  sourceName?: string;
  sourceUrl?: string;
  asOf?: string;
};

type Category = {
  id: string;
  name: string;
  icon?: string;
  whatToLookFor: string[];
};

type ChannelStats = {
  subscribers?: number;
  totalViews?: number;
  totalVideos?: number;

  // A, B: 7일 변화량 (백엔드에서 계산 권장)
  subsDelta7d?: number;
  viewsDelta7d?: number;

  // C: 평균 조회수 대비 성장률 계산을 위한 기준값
  // - avgViewsPerVideo28d: 최근 28일 영상당 평균 조회수(또는 대표 평균)
  avgViewsPerVideo28d?: number;

  // D: 업로드 빈도
  uploads7d?: number;
};

type Creator = {
  id: string;
  categoryId: string;
  name: string;
  handle?: string;
  description: string;
  channelUrl: string;
  tags: string[];
  why: string[];
  evidence: Evidence[];
  stats: ChannelStats;

  // 계산된 값
  hotScore: number; // 0~100
  breakdown: {
    aSubs: number;
    bViews: number;
    cGrowth: number;
    dUpload: number;
    growthRate: number;
  };

  lastUpdatedAt: number;
};

type SortKey = "hot" | "subs" | "growth";

type HotWeights = {
  wA: number; // subs delta weight
  wB: number; // views delta weight
  wC: number; // growth rate weight
  wD: number; // upload frequency weight
};

type OfficialSource = {
  id: string;
  name: string;
  url: string;
  desc: string;
};

// ================================
// Official Sources (글로벌/공식 위주)
// ================================

const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    id: "yt-blog-eoy-2025",
    name: "YouTube Blog: End of Year Summary 2025",
    url: "https://blog.youtube/culture-and-trends/end-of-year-summary-2025/",
    desc: "연말 Top creators/topics/songs 정리(공식)",
  },
  {
    id: "yt-trends",
    name: "YouTube Trends",
    url: "https://www.youtube.com/trends/",
    desc: "글로벌 문화/트렌드 리포트 허브(공식)",
  },
  {
    id: "yt-trends-report-2025",
    name: "YouTube Trends: 2025 Global Year-End Report",
    url: "https://www.youtube.com/trends/report/tr25-global-trends-report/",
    desc: "2025 글로벌 트렌드/크리에이터 리포트(공식)",
  },
  {
    id: "yt-charts-help",
    name: "YouTube Help: Trending Charts",
    url: "https://support.google.com/youtube/answer/7239739?hl=en",
    desc: "Trending 페이지 대신 Charts 기반으로 트렌드 제공(공식 안내)",
  },
  {
    id: "yt-api-channels",
    name: "YouTube Data API: Channels",
    url: "https://developers.google.com/youtube/v3/docs/channels",
    desc: "실시간 통계 수집을 위한 공식 API 문서",
  },
];

// ================================
// Categories
// ================================

const CATEGORIES: Category[] = [
  { id: "all", name: "전체", icon: "✨", whatToLookFor: ["완성도", "업로드 리듬", "댓글/공유 반응"] },
  { id: "entertainment", name: "예능", icon: "🎬", whatToLookFor: ["훅", "편집 템포", "콘셉트 시리즈화"] },
  { id: "gaming", name: "게임", icon: "🎮", whatToLookFor: ["라이브", "클립화", "커뮤니티 밈"] },
  { id: "education", name: "교육", icon: "📚", whatToLookFor: ["구조", "예시", "검색 유입"] },
  { id: "tech", name: "🧠 기술/리뷰", icon: "🧠", whatToLookFor: ["최신성", "레퍼런스", "깊이"] },
  { id: "music", name: "음악", icon: "🎵", whatToLookFor: ["사운드", "저작권", "플레이리스트"] },
  { id: "lifestyle", name: "라이프", icon: "🌿", whatToLookFor: ["비주얼", "스토리", "루틴/정보"] },
];

// ================================
// Hot score model
// ================================

const DEFAULT_WEIGHTS: HotWeights = {
  wA: 0.38,
  wB: 0.32,
  wC: 0.20,
  wD: 0.10,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function formatNumber(n?: number) {
  if (!n || n <= 0) return "-";
  return Intl.NumberFormat("en-US").format(n);
}

function toPct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function safeSumWeights(w: HotWeights) {
  return Math.max(0.00001, w.wA + w.wB + w.wC + w.wD);
}

function normalizeWeights(w: HotWeights): HotWeights {
  const s = safeSumWeights(w);
  return { wA: w.wA / s, wB: w.wB / s, wC: w.wC / s, wD: w.wD / s };
}

// A: 구독자 증가량 점수 (로그 스케일)
function scoreSubsDelta(subsDelta7d?: number) {
  if (!subsDelta7d || subsDelta7d <= 0) return 0;
  const v = Math.log10(Math.max(10, subsDelta7d)); // 10 ~
  return clamp(v * 18, 0, 100); // 대략 0~100
}

// B: 조회수 증가량 점수 (로그 스케일)
function scoreViewsDelta(viewsDelta7d?: number) {
  if (!viewsDelta7d || viewsDelta7d <= 0) return 0;
  const v = Math.log10(Math.max(1000, viewsDelta7d)); // 1k ~
  return clamp(v * 16, 0, 100);
}

// C: 평균 조회수 대비 성장률
// - 해석: (7일 추가 조회수) / (최근 28일 평균 조회수 * 7일 업로드 수)
// - uploads7d가 없으면 1로 간주(보수적)
function growthRate(stats: ChannelStats) {
  const viewsDelta7d = stats.viewsDelta7d ?? 0;
  const avg = stats.avgViewsPerVideo28d ?? 0;
  const uploads7d = Math.max(1, stats.uploads7d ?? 1);
  const baseline = Math.max(1, avg * uploads7d);
  return viewsDelta7d / baseline;
}

function scoreGrowth(rate: number) {
  // rate=1 => baseline 수준, 2 => 2배 성장
  // 너무 튀지 않게 log2로 완만하게
  const v = Math.log2(Math.max(0.25, rate)); // -2 ~
  // -2 -> 0, 0 -> 50, 2 -> 100 정도의 느낌
  return clamp(50 + v * 25, 0, 100);
}

// D: 업로드 빈도
function scoreUploads(uploads7d?: number) {
  const u = Math.max(0, uploads7d ?? 0);
  // 0 => 0, 1 => 35, 3 => 70, 7 => 100
  return clamp((u / 7) * 100, 0, 100);
}

function computeHot(stats: ChannelStats, weights: HotWeights) {
  const w = normalizeWeights(weights);

  const aSubs = scoreSubsDelta(stats.subsDelta7d);
  const bViews = scoreViewsDelta(stats.viewsDelta7d);
  const rate = growthRate(stats);
  const cGrowth = scoreGrowth(rate);
  const dUpload = scoreUploads(stats.uploads7d);

  const hot = w.wA * aSubs + w.wB * bViews + w.wC * cGrowth + w.wD * dUpload;

  return {
    hotScore: clamp(Math.round(hot), 0, 100),
    breakdown: {
      aSubs: Math.round(aSubs),
      bViews: Math.round(bViews),
      cGrowth: Math.round(cGrowth),
      dUpload: Math.round(dUpload),
      growthRate: rate,
    },
  };
}

// ================================
// Creators (샘플)
// - 통계는 데모입니다. 실제 서비스에서는 YouTube Data API로 주기 수집 + delta 계산 권장
// ================================

function withHot(c: Omit<Creator, "hotScore" | "breakdown" | "lastUpdatedAt">, weights: HotWeights): Creator {
  const computed = computeHot(c.stats, weights);
  return {
    ...c,
    hotScore: computed.hotScore,
    breakdown: computed.breakdown,
    lastUpdatedAt: Date.now(),
  };
}

const BASE_CREATORS: Array<Omit<Creator, "hotScore" | "breakdown" | "lastUpdatedAt">> = [
  {
    id: "mrbeast",
    categoryId: "entertainment",
    name: "MrBeast",
    handle: "@MrBeast",
    description: "대형 챌린지/기부/게임형 포맷. 시리즈 설계와 훅이 강한 대표 채널",
    channelUrl: "https://www.youtube.com/@MrBeast",
    tags: ["대형제작", "챌린지", "스토리텔링"],
    why: ["시리즈화로 회수력/재시청을 만든다", "썸네일/타이틀 훅이 명확하다"],
    evidence: [
      {
        label: "End-of-year summary",
        value: "Featured as top creator (US list)",
        sourceName: "YouTube Blog",
        sourceUrl: "https://blog.youtube/culture-and-trends/end-of-year-summary-2025/",
        asOf: "2025-12-02",
      },
      {
        label: "Official channel",
        value: "youtube.com/@MrBeast",
        sourceName: "YouTube",
        sourceUrl: "https://www.youtube.com/@MrBeast",
      },
    ],
    stats: {
      subscribers: 0,
      totalViews: 0,
      totalVideos: 0,
      subsDelta7d: 1_000_000,
      viewsDelta7d: 650_000_000,
      avgViewsPerVideo28d: 55_000_000,
      uploads7d: 1,
    },
  },
  {
    id: "ishowspeed",
    categoryId: "gaming",
    name: "IShowSpeed",
    handle: "@IShowSpeed",
    description: "라이브/리액션 기반의 폭발적 바이럴. 클립 확산이 빠른 스트리머",
    channelUrl: "https://www.youtube.com/@IShowSpeed",
    tags: ["라이브", "리액션", "바이럴"],
    why: ["라이브 순간성이 클립으로 재확산된다", "트렌드 흡수 속도가 빠르다"],
    evidence: [
      {
        label: "End-of-year summary",
        value: "Featured (US list)",
        sourceName: "YouTube Blog",
        sourceUrl: "https://blog.youtube/culture-and-trends/end-of-year-summary-2025/",
        asOf: "2025-12-02",
      },
      {
        label: "Official channel",
        value: "youtube.com/@IShowSpeed",
        sourceName: "YouTube",
        sourceUrl: "https://www.youtube.com/@IShowSpeed",
      },
    ],
    stats: {
      subsDelta7d: 260_000,
      viewsDelta7d: 220_000_000,
      avgViewsPerVideo28d: 8_000_000,
      uploads7d: 4,
    },
  },
  {
    id: "zackdfilms",
    categoryId: "education",
    name: "Zack D. Films",
    handle: "@zackdfilms",
    description: "쇼츠형 트리비아/짧은 다큐 포맷. 반복 생산 가능한 구조",
    channelUrl: "https://www.youtube.com/@zackdfilms",
    tags: ["쇼츠", "트리비아", "다큐"],
    why: ["짧은 포맷에서 정보 밀도를 유지한다", "포맷 반복으로 생산성이 좋다"],
    evidence: [
      {
        label: "End-of-year summary",
        value: "Featured (US list)",
        sourceName: "YouTube Blog",
        sourceUrl: "https://blog.youtube/culture-and-trends/end-of-year-summary-2025/",
        asOf: "2025-12-02",
      },
      {
        label: "Official channel",
        value: "youtube.com/@zackdfilms",
        sourceName: "YouTube",
        sourceUrl: "https://www.youtube.com/@zackdfilms",
      },
    ],
    stats: {
      subsDelta7d: 95_000,
      viewsDelta7d: 180_000_000,
      avgViewsPerVideo28d: 2_200_000,
      uploads7d: 7,
    },
  },
  {
    id: "veritasium",
    categoryId: "education",
    name: "Veritasium",
    handle: "@veritasium",
    description: "과학/교육 대표 채널. 설명 구조와 실험/스토리텔링이 강점",
    channelUrl: "https://www.youtube.com/@veritasium",
    tags: ["과학", "설명", "실험"],
    why: ["긴 영상에서도 구조가 탄탄하다", "주제 선택과 스토리텔링이 안정적"],
    evidence: [
      {
        label: "Official channel",
        value: "youtube.com/@veritasium",
        sourceName: "YouTube",
        sourceUrl: "https://www.youtube.com/@veritasium",
      },
    ],
    stats: {
      subsDelta7d: 35_000,
      viewsDelta7d: 25_000_000,
      avgViewsPerVideo28d: 2_800_000,
      uploads7d: 1,
    },
  },
  {
    id: "mkbhd",
    categoryId: "tech",
    name: "Marques Brownlee",
    handle: "@mkbhd",
    description: "글로벌 테크 리뷰 강자. 리뷰 포맷과 촬영 퀄리티로 신뢰를 만든다",
    channelUrl: "https://www.youtube.com/@mkbhd",
    tags: ["리뷰", "테크", "프로덕션"],
    why: ["리뷰 구조가 명확하고 정보 신뢰가 높다", "프로덕션 퀄리티가 브랜드가 된다"],
    evidence: [
      {
        label: "Official channel",
        value: "youtube.com/@mkbhd",
        sourceName: "YouTube",
        sourceUrl: "https://www.youtube.com/@mkbhd",
      },
    ],
    stats: {
      subsDelta7d: 18_000,
      viewsDelta7d: 28_000_000,
      avgViewsPerVideo28d: 4_500_000,
      uploads7d: 1,
    },
  },
];

const CANDIDATE_POOL: Array<Omit<Creator, "hotScore" | "breakdown" | "lastUpdatedAt">> = [
  {
    id: "caylus",
    categoryId: "gaming",
    name: "Caylus",
    handle: "@Caylus",
    description: "게임/버라이어티 포맷. 빠른 편집과 과장 리액션으로 쇼츠/클립 확산",
    channelUrl: "https://www.youtube.com/@Caylus",
    tags: ["게임", "클립", "빠른편집"],
    why: ["클립이 숏폼으로 전환되기 쉽다", "리액션이 공유/댓글을 유도"],
    evidence: [
      {
        label: "Official channel",
        value: "youtube.com/@Caylus",
        sourceName: "YouTube",
        sourceUrl: "https://www.youtube.com/@Caylus",
      },
      {
        label: "Trends hub",
        value: "Check global report",
        sourceName: "YouTube Trends",
        sourceUrl: "https://www.youtube.com/trends/",
      },
    ],
    stats: {
      subsDelta7d: 140_000,
      viewsDelta7d: 120_000_000,
      avgViewsPerVideo28d: 3_200_000,
      uploads7d: 3,
    },
  },
  {
    id: "outdoorboys",
    categoryId: "lifestyle",
    name: "Outdoor Boys",
    handle: "@OutdoorBoys",
    description: "아웃도어/캠핑/생존형 라이프 콘텐츠. 스토리 흐름이 명확",
    channelUrl: "https://www.youtube.com/@OutdoorBoys",
    tags: ["아웃도어", "캠핑", "스토리"],
    why: ["완주율을 끌어올리는 흐름이 있다", "루틴/정보성이 재방문을 만든다"],
    evidence: [
      {
        label: "Official channel",
        value: "youtube.com/@OutdoorBoys",
        sourceName: "YouTube",
        sourceUrl: "https://www.youtube.com/@OutdoorBoys",
      },
      {
        label: "Charts 참고",
        value: "Trending charts",
        sourceName: "YouTube Help",
        sourceUrl: "https://support.google.com/youtube/answer/7239739?hl=en",
      },
    ],
    stats: {
      subsDelta7d: 55_000,
      viewsDelta7d: 60_000_000,
      avgViewsPerVideo28d: 5_000_000,
      uploads7d: 1,
    },
  },
];

// ================================
// UI primitives
// ================================

function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-lg">▶️</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Creator Recs (Global)</h1>
            <p className="text-xs text-white/60">공식 출처 기반 · Hot 점수 모델</p>
          </div>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-2xl border border-white/10 bg-white/5 px-2 py-1 text-xs">{children}</span>;
}

function CategoryTabs({
  categories,
  activeId,
  onChange,
}: {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            aria-pressed={active}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
              active ? "border-white/25 bg-white/20" : "border-white/10 bg-white/5 hover:bg-white/10"
            )}
          >
            <span className="text-base">{c.icon ?? "•"}</span>
            <span className="font-medium">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function SearchBar({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-2 md:w-auto">
      <div className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
        <span className="text-white/60">⌕</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="채널명/핸들/태그 검색"
          className="w-full bg-transparent text-sm outline-none placeholder:text-white/40 md:w-72"
        />
      </div>
      {value.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          초기화
        </button>
      )}
    </div>
  );
}

function WeightsPanel({
  weights,
  onChange,
}: {
  weights: HotWeights;
  onChange: (next: HotWeights) => void;
}) {
  const w = normalizeWeights(weights);
  const inputClass =
    "w-20 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-sm outline-none";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Hot 점수 가중치</div>
          <div className="mt-1 text-xs text-white/60">
            A(구독↑7d) + B(조회↑7d) 가중합, C(평균 대비 성장률) 보정, D(업로드) 보조
          </div>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          onClick={() => onChange(DEFAULT_WEIGHTS)}
        >
          기본값
        </button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <label className="flex items-center justify-between gap-2">
          <span className="text-sm text-white/70">A</span>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            value={weights.wA}
            onChange={(e) => onChange({ ...weights, wA: Number(e.target.value) })}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span className="text-sm text-white/70">B</span>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            value={weights.wB}
            onChange={(e) => onChange({ ...weights, wB: Number(e.target.value) })}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span className="text-sm text-white/70">C</span>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            value={weights.wC}
            onChange={(e) => onChange({ ...weights, wC: Number(e.target.value) })}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span className="text-sm text-white/70">D</span>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            value={weights.wD}
            onChange={(e) => onChange({ ...weights, wD: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="mt-3 text-xs text-white/60">
        정규화된 값: A {toPct(w.wA)}, B {toPct(w.wB)}, C {toPct(w.wC)}, D {toPct(w.wD)}
      </div>
    </div>
  );
}

function CreatorCard({ creator, onTagClick }: { creator: Creator; onTagClick?: (tag: string) => void }) {
  const hotTone = creator.hotScore >= 85 ? "bg-white/15" : creator.hotScore >= 70 ? "bg-white/10" : "bg-white/5";

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-tight">{creator.name}</h3>
          <p className="mt-1 text-xs text-white/60">{creator.handle ?? ""}</p>
        </div>
        <a
          href={creator.channelUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium hover:bg-white/10"
        >
          채널 ↗
        </a>
      </div>

      <p className="mt-2 text-sm text-white/70">{creator.description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={cx("rounded-2xl border border-white/10 px-2 py-1 text-xs", hotTone)}>
          🔥 Hot {creator.hotScore}
        </span>
        <Pill>7d +subs {formatNumber(creator.stats.subsDelta7d)}</Pill>
        <Pill>7d +views {formatNumber(creator.stats.viewsDelta7d)}</Pill>
        <Pill>7d uploads {formatNumber(creator.stats.uploads7d)}</Pill>
      </div>

      <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs font-semibold text-white/80">점수 분해</div>
        <div className="text-xs text-white/60">
          A {creator.breakdown.aSubs}, B {creator.breakdown.bViews}, C {creator.breakdown.cGrowth} (rate {creator.breakdown.growthRate.toFixed(
            2
          )}), D {creator.breakdown.dUpload}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold text-white/80">추천 이유</p>
        <ul className="mt-1 list-disc pl-5 text-sm text-white/70">
          {creator.why.slice(0, 3).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold text-white/80">공식 근거</p>
        <div className="mt-1 flex flex-col gap-1">
          {creator.evidence.slice(0, 2).map((e, i) => (
            <div key={i} className="text-xs text-white/60">
              <span className="text-white/75">{e.label}</span>
              <span className="text-white/60">: {e.value}</span>
              {e.asOf ? <span className="text-white/40"> (as of {e.asOf})</span> : null}
              {e.sourceUrl ? (
                <a
                  href={e.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 underline decoration-white/20 underline-offset-4 hover:decoration-white/50"
                >
                  출처
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {creator.tags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTagClick?.(t)}
            className="rounded-2xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
            title="태그로 필터"
          >
            #{t}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4" />
    </article>
  );
}

function CreatorGrid({ items, onTagClick }: { items: Creator[]; onTagClick: (tag: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/70">
        조건에 맞는 결과가 없어요. 카테고리를 바꾸거나 검색어를 지워보세요.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <CreatorCard key={c.id} creator={c} onTagClick={onTagClick} />
      ))}
    </div>
  );
}

function OfficialSources() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold">공식 출처</div>
      <div className="mt-1 text-xs text-white/60">핫/신규 크리에이터 탐지는 공식 리포트·Charts·API를 우선 사용</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {OFFICIAL_SOURCES.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
          >
            <div className="text-sm font-semibold">{s.name}</div>
            <div className="mt-1 text-xs text-white/60">{s.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ================================
// App
// ================================

export default function App() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("hot");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const [weights, setWeights] = useState<HotWeights>(DEFAULT_WEIGHTS);

  const [creators, setCreators] = useState<Creator[]>(() => {
    return BASE_CREATORS.map((c) => withHot(c, DEFAULT_WEIGHTS));
  });

  // weights 바뀌면 전체 재계산
  useEffect(() => {
    setCreators((prev) =>
      prev.map((c) => {
        const computed = computeHot(c.stats, weights);
        return { ...c, hotScore: computed.hotScore, breakdown: computed.breakdown, lastUpdatedAt: Date.now() };
      })
    );
  }, [weights]);

  const lastUpdated = useMemo(() => {
    const maxTs = creators.reduce((acc, cur) => Math.max(acc, cur.lastUpdatedAt), 0);
    return maxTs ? new Date(maxTs) : new Date();
  }, [creators]);

  const hotNow = useMemo(() => {
    return [...creators].sort((a, b) => b.hotScore - a.hotScore).slice(0, 5);
  }, [creators]);

  const activeCategory = useMemo(() => CATEGORIES.find((c) => c.id === activeCategoryId), [activeCategoryId]);

  const filtered = useMemo(() => {
    const q = normalize(query);

    let list = creators
      .filter((c) => (activeCategoryId === "all" ? true : c.categoryId === activeCategoryId))
      .filter((c) => (activeTag ? c.tags.includes(activeTag) : true))
      .filter((c) => {
        if (!q) return true;
        const hay = normalize([c.name, c.handle ?? "", c.description, c.tags.join(" ")].join(" "));
        return hay.includes(q);
      });

    if (sortKey === "hot") {
      list = list.sort((a, b) => b.hotScore - a.hotScore);
    } else if (sortKey === "subs") {
      list = list.sort((a, b) => (b.stats.subsDelta7d ?? 0) - (a.stats.subsDelta7d ?? 0));
    } else if (sortKey === "growth") {
      list = list.sort((a, b) => b.breakdown.growthRate - a.breakdown.growthRate);
    }

    return list;
  }, [creators, activeCategoryId, activeTag, query, sortKey]);

  const subtitle = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === activeCategoryId)?.name ?? "전체";
    const tag = activeTag ? `, 태그: #${activeTag}` : "";
    const q = query ? `, 검색: \"${query}\"` : "";
    const s = sortKey === "hot" ? ", 정렬: Hot" : sortKey === "subs" ? ", 정렬: 7d +subs" : ", 정렬: 성장률";
    return `${cat}${tag}${q}${s}`;
  }, [activeCategoryId, activeTag, query, sortKey]);

  function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function refreshTrendingDemo() {
    setCreators((prev) =>
      prev.map((c) => {
        // 데모: 주간 변화량이 조금씩 변한다고 가정
        const subsDelta7d = Math.max(0, (c.stats.subsDelta7d ?? 0) + randInt(-20_000, 30_000));
        const viewsDelta7d = Math.max(0, (c.stats.viewsDelta7d ?? 0) + randInt(-20_000_000, 35_000_000));
        const uploads7d = Math.max(0, (c.stats.uploads7d ?? 0) + randInt(-1, 1));
        const nextStats: ChannelStats = { ...c.stats, subsDelta7d, viewsDelta7d, uploads7d };
        const computed = computeHot(nextStats, weights);
        return {
          ...c,
          stats: nextStats,
          hotScore: computed.hotScore,
          breakdown: computed.breakdown,
          lastUpdatedAt: Date.now(),
        };
      })
    );
  }

  function addNewHotCreatorFromOfficialMock() {
    // 데모: "공식 출처 기반으로 탐지"했다는 상황을 시뮬레이션
    // 실제 서비스에서는 백엔드에서 OFFICIAL_SOURCES를 기반으로 트렌드/리스트를 가져와 신규 채널을 반환
    setCreators((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      const candidate = CANDIDATE_POOL.find((c) => !existing.has(c.id));
      if (!candidate) return prev;
      const next = withHot(candidate, weights);
      return [next, ...prev];
    });
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => refreshTrendingDemo(), 60_000);
    return () => window.clearInterval(id);
  }, [autoRefresh]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header
        right={
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-white/60 md:inline">업데이트: {lastUpdated.toLocaleString()}</span>
            <button
              type="button"
              onClick={refreshTrendingDemo}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              title="데모: Hot 점수 갱신"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={addNewHotCreatorFromOfficialMock}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              title="데모: 신규 크리에이터(공식 출처 기반) 추가"
            >
              새 유튜버 추가
            </button>
            <label className="hidden select-none items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 md:flex">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4"
              />
              자동갱신
            </label>
          </div>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">오늘 핫한 채널</h2>
            <p className="mt-1 text-sm text-white/60">Hot 점수 상위 5 (글로벌 · 데모 데이터)</p>
          </div>
          <SearchBar value={query} onChange={setQuery} onClear={() => setQuery("")} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {hotNow.map((c) => (
            <a
              key={c.id}
              href={c.channelUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-3xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              title={c.name}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-semibold">{c.name}</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-2 py-1 text-xs">🔥 {c.hotScore}</div>
              </div>
              <div className="mt-1 truncate text-xs text-white/60">{c.handle ?? ""}</div>
              <div className="mt-2 text-xs text-white/60">7d +subs {formatNumber(c.stats.subsDelta7d)}</div>
              <div className="mt-1 text-xs text-white/60">growth {c.breakdown.growthRate.toFixed(2)}x</div>
            </a>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <WeightsPanel weights={weights} onChange={setWeights} />
          <OfficialSources />
        </div>

        <section className="mt-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">카테고리별 추천</h3>
              <p className="mt-1 text-sm text-white/60">{subtitle}</p>
              {activeCategory && activeCategory.id !== "all" && (
                <p className="mt-2 text-xs text-white/60">이 카테고리에서 볼 것: {activeCategory.whatToLookFor.join(", ")}</p>
              )}
              {activeTag && (
                <p className="mt-1 text-xs text-white/60">태그 필터: #{activeTag}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                title="정렬"
              >
                <option value="hot">정렬: Hot</option>
                <option value="subs">정렬: 7d +subs</option>
                <option value="growth">정렬: 성장률</option>
              </select>
              {activeTag && (
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                >
                  태그 해제
                </button>
              )}
            </div>
          </div>

          <div className="mt-5">
            <CategoryTabs
              categories={CATEGORIES}
              activeId={activeCategoryId}
              onChange={(id) => {
                setActiveCategoryId(id);
                setActiveTag(null);
              }}
            />
          </div>

          <div className="mt-6">
            <CreatorGrid items={filtered} onTagClick={(t) => setActiveTag(t)} />
          </div>
        </section>

        <footer className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
          <p>현재는 데모(하드코딩 + Hot 모델)입니다. 실서비스는 백엔드에서 공식 데이터로 갱신하는 구조를 권장합니다.</p>
          <p className="mt-1">핫 탐지: Trending 페이지 대신 YouTube Charts/Trends 리포트를 우선 참고하는 흐름이 안전합니다.</p>
        </footer>
      </main>
    </div>
  );
}
