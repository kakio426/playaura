# MoTube Advanced Implementation Plan (Phase 2: Intelligence & Reality)

이 문서는 기초적인 데이터 수집 단계를 넘어, 서비스의 **신뢰성(Authenticity)**과 **지능(Intelligence)**을 고도화하기 위한 2차 구현 계획입니다.

---

## 🛠️ Phase 1: 가짜 데이터 제거 및 데이터 진실성 (Data Fidelity)
시각적 요소에 연결된 가상(Mock) 로직을 실제 DB 시계열 데이터와 완벽히 연결합니다.

1.  **진짜 시계열 차트 구현 (`GrowthChart.tsx`)**
    *   **현황**: `stats_snapshots` 테이블은 존재하지만 프론트엔드에서 랜덤 데이터로 시뮬레이션 중.
    *   **수정**: `fetchCreatorsFromDB` 함수를 고도화하여 각 크리에이터의 최근 7일간 스냅샷 데이터를 배열로 함께 가져오도록 변경 (PostgreSQL JSON Aggregation 활용).
    *   **결과**: 사용자가 보는 차트가 실제 해당 채널의 일별 구독자 변화를 정확히 반영.

2.  **동적 AI 인사이트 생성 (`CreatorCard.tsx`)**
    *   **현황**: "Exceptional velocity..." 등 고정된 문구만 반복 노출.
    *   **수정**: DB에 `ai_insight` 컬럼 추가. 수집 엔진(Edge Function) 실행 시 OpenAI/Gemini API를 호출하여 해당 채널의 설명과 통계를 바탕으로 "왜 이 채널이 뜨고 있는지" 1문장 인사이트 자동 생성.
    *   **Fallback**: API 비용 절감을 위해, 수치 기반의 'Rule-based Insight Generator' 우선 구현 (예: "조회수 증가폭이 구독자 증가폭을 상회하여 잠재력이 높음").

---

## 🚀 Phase 2: 새로운 핵심 기능 구축 (New Features)
단순 리스트를 넘어 분석 도구로서의 가치를 부여합니다.

1.  **Full Network Analysis 상세 모달/페이지**
    *   **기능**: 사이드바의 빈 버튼을 활성화.
    *   **내용**: 카테고리별 전체 시장 점유율, 급성장 중인 태그 클라우드, 지역별 트래픽 분포를 한눈에 보는 'Market Dashboard' 구현.

2.  **업데이트 카운트다운 타이머 (`Header.tsx`)**
    *   **기능**: 다음 데이터 수집(Cron Job)까지 남은 시간을 노출하여 시스템의 생동감 부여.
    *   **내용**: `last_sync_time`을 기준으로 다음 새벽 03:00까지 남은 시간을 계산하는 훅 구현.

3.  **크리에이터 '마일스톤' 예측 시스템**
    *   **기능**: "내일 100만 달성 예상", "최단기간 10만 달성 기록" 등 데이터 기반의 지능형 뱃지 부여.

---

## 🧠 Phase 3: 알고리즘 고도화 (Advanced Engine)
랭킹 알고리즘을 실제 비즈니스 로직에 맞게 정밀 튜닝합니다.

1.  **참여율(Engagement Rate) 반영**
    *   **내용**: 단순히 구독자가 느는 것보다, '구독자 대비 조회수' 비율을 계산하여 '거품 없는 채널'에 더 높은 Hot Score 부여.
2.  **카테고리별 가중치 자동 보정**
    *   **내용**: 특정 카테고리(예: 게임)의 데이터 수가 너무 많을 경우, 희소성이 높은 카테고리(예: 경제/기술)에 자동으로 보정 점수 부여.

---

## 📅 즉시 실행 가능한 마일스톤
1.  **[High Priority]** `fetchCreatorsFromDB`를 수정하여 실제 `stats_snapshots` 데이터 조인.
2.  **[High Priority]** `GrowthChart`에 실제 데이터 주입.
3.  **[Medium Priority]** 사이드바 'Market Alert' 문구를 현재 선택된 카테고리의 실제 최고 수치와 연동.

---

이 계획대로 진행하면 MoTube는 단순한 유튜브 카탈로그가 아닌, **데이터 기반의 크리에이터 투자 지표 서비스**로 거듭나게 됩니다.

가장 먼저 어떤 부분부터 시작할까요? (추천: **진짜 차트 데이터 연동**)
