# 작업 현황 메모 (2026-02-25)

## 1) 지금 어디까지 작업했는지

### 완료/반영된 항목
- 실서버 OpenAPI 확인 및 런타임 응답 검증 수행
  - `/api/v1/map/{floor_id}/room/{room_id}`
  - `/api/v1/chat`
  - `/api/v1/conversation/start`, `/api/v1/conversation/reply`
  - `/api/v1/eavesdrop`
  - `/api/v1/stats/hp/spend`
- API 인증/호출 기반 정비(초기 버전)
  - `src/api/auth.js` 신규 추가 (login/refresh/token 저장)
  - `src/api/client.js` 교체 (auth 옵션, ngrok 헤더, 401 refresh 재시도)
  - `src/api/chat.js` 교체 (`/api/v1/chat`, `conversation/start/reply`, `eavesdrop` 반영 + 기존 호출 호환)
  - `src/api/map.js` 신규 추가 (`fetchRoom`, `fetchAllMaps`)
  - `src/api/stats.js` 교체 (`/api/v1` 우선 + 기존 경로 fallback)
- 채팅 응답 스탯 매핑 보강
  - `src/utils/aiService.js`: `chat` 응답의 `hp` 객체를 `updatedStats`로 매핑
- 상호작용 훅 보강
  - `src/hooks/useInteraction.js`
    - 이동 pending 데이터에 `zone` 포함
    - `confirmMove`를 async 처리(이동 실패 `false` 반환 지원)
    - 외부에서 요구조건 모달을 띄울 수 있게 `setPendingRequirement` 노출
- 메인씬 리팩토링 진행 중
  - `src/scenes/MainGameScene.jsx`
    - 백엔드 room payload 상태(`roomApiNpcIds`, `roomApiNpcMap`, `roomTopic` 등) 추가
    - 이동 시 백엔드 room 조회 + 잠금 요구조건 검사 + 위치 동기화 + 다중 NPC 자동 엿듣기 진입 골격 반영
    - 엿듣기/끼어들기 로직을 `conversation/reply/eavesdrop` 기반으로 교체하는 작업 진행 중

### 현재 미완료/정리 필요한 항목
- `MainGameScene.jsx` 리팩토링 마무리(구 UI/구 상태 분기 일부 잔존 가능성)
- UI 텍스트/버튼 조건 정리(1인 대화, 2인 이상 엿듣기 우선 규칙 최종 적용)
- lint/build 미검증
- 임시 분석 파일 `openapi_live.json` 정리 여부 결정 필요

---

## 2) 이제 뭘 작업할건지
- `MainGameScene.jsx` 최종 정리
  - 이동 잠금 체크 로직 확정 (요구 아이템 미보유 시 진입 차단)
  - 2인 이상 NPC 자동 엿듣기 프리뷰 -> 선택(끼어들기/계속 엿듣기) 흐름 완성
  - 엿듣기/끼어들기에서 프론트 HP 차감 완전 제거(백엔드 처리만 사용)
- 상태머신/모달 정리
  - eavesdrop 관련 구 HP warning 분기 제거 또는 비활성화
  - 1인/2인 버튼 렌더링 조건 정리
- 검증
  - `npm run lint`
  - `npm run build`
  - 에러 발생 시 즉시 수정

---

## 3) 내가 추가로 요청했었던 내용 정리

### 이전 요청들(요약)
- docs API 명세 확인 요청
- debug 씬 에러 해결 요청(특히 Debug03 핵심 기능 테스트)
- `gamestartsequence` 제거 관련 정리 요청
- EndingScene 에러 수정 요청
- `implementation_plan.md` 확인 요청
- `mock-backend/src/data` 데이터 확인 요청
- 인벤토리 조회 요청
- NPC 스케줄 프론트 관리 필요성/인게임 필요성 검토 요청
- 액티브 NPC 판정 로직 변경 요청
  - 게임 시작 시 `current_day`로 튜토리얼/본편 분기
  - `current_day >= 1`이면 백엔드 위치 데이터 기반 진행
  - 이동 시 맵 위치 업데이트 후 NPC 판정/버튼 활성화

### 이번 최신 요청(현재 작업 대상)
- NPC 대화 로직 업데이트
  1. 이동 시 목적지 잠금/필요 아이템 검사 (아이템은 소모가 아니라 재사용 개념)
  2. 이동 시 백엔드 NPC 리스트 확인, 2인 이상이면 엿듣기 프리뷰 UI 진입
  3. 계속 엿듣기/끼어들기 분기 처리
  - 엿듣기 관련 HP(미리듣기 1, 엿듣기 5, 끼어들기 10)는 백엔드 처리이므로 프론트 차감 금지

---

## 참고: 현재 수정된 파일 목록
- `src/api/auth.js` (new)
- `src/api/map.js` (new)
- `src/api/client.js`
- `src/api/chat.js`
- `src/api/stats.js`
- `src/utils/aiService.js`
- `src/hooks/useInteraction.js`
- `src/scenes/MainGameScene.jsx`
- `openapi_live.json` (임시 분석 파일)
