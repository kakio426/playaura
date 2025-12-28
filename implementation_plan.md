# MoTube Implementation & Deployment Roadmap (Quota Optimized)

이 문서는 유튜브 API의 할당량(Quota)을 효율적으로 관리하면서 실시간에 가까운 추천 정보를 제공하기 위한 **DB 중심 아키텍처** 설계안입니다.

---

## 🏗️ Phase 1: 아키텍처 및 DB 스키마 설계 (Supabase 기반)
사용자 요청 시 API를 직접 부르지 않고, 미리 수집된 DB 데이터를 제공하는 구조를 구축합니다.

1. **Supabase 프로젝트 생성**
   - PostgreSQL 데이터베이스 및 Edge Functions 활성화.
2. **DB 테이블 설계**
   - `creators`: 채널 기본 정보 (ID, Handle, 이름, 썸네일, 카테고리).
   - `stats_snapshots`: 일일 통계 기록 (날짜, 구독자수, 조회수). -> **성장률 계산의 핵심**
   - `recommendations`: 최종 계산된 Hot Score 및 추천 사유.
3. **유튜브 카테고리 맵핑**
   - 게임(20), 교육(27), 엔터테인먼트(24) 등 주력 카테고리 ID 정리.

---

## ⚙️ Phase 2: 데이터 수집 엔진 (Quota Saver)
할당량을 최소화하는 방식으로 데이터를 수집합니다.

1. **인기 채널 탐색 (Batch Job)**
   - `videos.list` (chart='mostPopular')를 사용하여 할당량 1점으로 인기 영상 추출.
   - 영상에서 `channelId`를 추출하여 신규 유망 채널 발굴.
2. **채널 상세 데이터 수집**
   - `channels.list`를 사용하여 채널의 실시간 통계 획득.
   - `search.list` 대신 `videos.list`와 `channels.list`만 사용하여 할당량 100배 절약.
3. **Edge Functions (Cron) 구현**
   - 매일 새벽(KST 03:00) 자동 실행 로직 작성.
   - 데이터 수집 -> 점수 계산(Hot Score) -> DB 업데이트 프로세스 자동화.

---

## 🧠 Phase 3: Hot Score 점수 산출 로직 이전
프론트엔드에 있던 계산 로직을 백엔드(SQL 또는 Edge Function)로 이전합니다.

1. **성장률 계산 쿼리 작성**
   - 오늘 데이터 vs 7일 전 데이터를 비교하여 증가폭 산출.
2. **Hot Score 자동 갱신**
   - 수집된 변화량을 바탕으로 알고리즘 적용 및 `creators` 테이블의 `hot_score` 컬럼 업데이트.

---

## 🚀 Phase 4: 프론트엔드 데이터 연동
실제 DB 데이터를 화면에 뿌려줍니다.

1. **Supabase Client 연결**
   - Mock API(`services/api.ts`)를 Supabase 호출 코드로 교체.
2. **캐싱 전략**
   - React Query를 사용하여 불필요한 DB 호출 최소화.
3. **디테일 완성**
   - 실제 채널 썸네일 및 최신 통계 UI 반영.

---

## ✨ Phase 4.6: Extreme Polish & Social Proof
배포 전 플랫폼의 신뢰성과 생동감을 극대화하는 단계입니다.

1. **실시간 활성 지표 (Social Proof)**
   - 오늘 방문자 수(Today's Pulse) 및 실시간 분석 규모 상단 노출.
2. **크리에이터 마일스톤 (Milestone Tracking)**
   - "곧 100만!", "Rising Star" 등 지능형 뱃지 시스템 도입.
3. **데이터 동기화 타이머**
   - 다음 데이터 자동 업데이트까지의 카운트다운 타이머 구현.
4. **지역별 인사이트**
   - 금주의 최고 성장 지역(Region of the Week) 등 인사이트 텍스트 추가.

---

## 🧠 Phase 4.7: Advanced Intelligence Algorithms
고도화된 랭킹 및 비즈니스 부스팅 로직을 시스템에 내재화합니다.

1. **시간 감쇠형 랭킹 (Reddit Decay Logic)**
   - 최신 트래픽에 중력 계수(Gravity)를 적용하여 신선한 트렌드 우선 노출.
2. **참여도 심층 분석 (Engagement Depth)**
   - 외부 YouTube 데이터 + MoTube 내부 액션(클릭, 저장) 가중치 합산.
3. **전략적 부스팅 (Strategic Revenue Boost)**
   - 특정 카테고리나 파트너 크리에이터에게 전략적 가공 점수(Boost Factor) 부여.
4. **알고리즘 시각화**
   - 왜 이 크리에이터가 'HOT'한지 점수 상세 지표(Breakdown)를 사용자에게 투명하게 공개.

---

## 🌐 Phase 5: 배포 및 관리
1. **Vercel 배포**
   - GitHub 레파지토리 연동.
2. **환경 변수 관리**
   - `SUPABASE_KEY`, `YOUTUBE_API_KEY` 보안 설정.
3. **로그 모니터링**
   - 새벽 배치가 정상적으로 돌아갔는지 확인하는 알림 설정.

---

## 🛠️ 즉시 실행 가능한 다음 단계
1. **Supabase 가입 및 프로젝트 생성**
2. **DB 테이블(SQL) 생성 스크립트 작성** (제가 도와드릴 수 있습니다.)
3. **YouTube API 키 발급 및 Quota 설정 확인**
