# 실 백엔드 API 연동 리팩토링

mock-backend 엔드포인트(`/api/...`)에서 실서버 API(`/api/v1/...`)로 전환합니다.

## 실서버 API 직접 검증 결과

| 엔드포인트 | 결과 |
|---|---|
| `POST /api/v1/users/login` | ✅ body 없이 호출 → `{ access_token, token_type, refresh_token }` |
| `GET /api/v1/stats/static` | ✅ `{ fishLevel:0, total_hp:100, session_hp:30, plus_hp:0, current_session:"morning", current_day:0, floor_id:null, room_id:null }` |
| `GET /api/v1/stats` | ✅ `{ fishLevel, total_hp, session_hp, plus_hp, current_session, current_session_index, current_day, floor_id, room_id }` |
| `POST /api/v1/stats` | ✅ `{ updates }`로 `current_day/current_session/floor_id/room_id` 갱신 가능 |
| `GET /api/v1/inventory` | ✅ `{ user_id, items:[], record_files:[] }` |
| `GET /api/v1/map/` | ✅ 8개 층 전체 데이터 반환 (2F,1F,B1,B2,B3,B4,DEBUG,B5) — `background`는 파일명만 |
| `GET /api/v1/map/{floor_id}/room/{room_id}` | ✅ Auth 필요, 응답 형태 `{ room, eavesdrop }` |

---

## Proposed Changes

### Phase 1: 인증 인프라

#### [NEW] [.env](file:///d:/GitHub/Frontend_sv/.env)
```
VITE_API_BASE_URL=https://unrescinded-recreatively-joselyn.ngrok-free.dev
```

#### [MODIFY] [client.js](file:///d:/GitHub/Frontend_sv/src/api/client.js)
- Bearer 토큰 자동 주입 + `ngrok-skip-browser-warning` 헤더
- **401 시 자동 refresh + 재시도** (1회)
- 토큰: `auth.js`의 `getAccessToken()`에서 가져옴

#### [NEW] [auth.js](file:///d:/GitHub/Frontend_sv/src/api/auth.js)
- `login()` → `POST /api/v1/users/login` (body 없음)
- `refreshToken()` → `POST /api/v1/users/refresh`
- 토큰 저장: `sessionStorage`
- `getAccessToken()` / `getRefreshToken()` / `setTokens()` / `clearTokens()`

---

### Phase 2: API 어댑터 교체

#### [MODIFY] [stats.js](file:///d:/GitHub/Frontend_sv/src/api/stats.js)

```diff
- fetchGameStats()      → GET /api/stats
+ fetchGameStats()      → GET /api/v1/stats

- fetchStaticGameData() → GET /api/data/static
+ fetchStaticStats()    → GET /api/v1/stats/static

- spendHpBackend(amount)  → POST /action/spendHp  { userId, amount }
+ spendHpAPI(hp)          → POST /api/v1/stats/hp/spend  { hp }
  응답: { success, total_hp, session_hp, plus_hp, current_session, current_day, session_depleted }

- updateGameStats()     → POST /api/stats
+ updateStats(updates)  → POST /api/v1/stats  { updates }

  [DELETE] restBackend, fetchTutorialStatus, completeTutorialAPI, transferItem
```

#### [MODIFY] [chat.js](file:///d:/GitHub/Frontend_sv/src/api/chat.js)
```diff
- sendChatMessage(message, npcId, userId, presentedItem) → POST /api/chat
+ sendChatMessage(message, npcId, itemId?)               → POST /api/v1/chat  { message, npcId, item_id? }
```
신규 함수 추가:
- `startConversation(npcIds, topic?, numTurns?)` → `POST /api/v1/conversation/start` (엿듣기 프리뷰)
- `replyConversation(topic, npcIds, userMessage, history?)` → `POST /api/v1/conversation/reply` (끼어들기)
- `endSession(dayIndex, sessionIndex, npcId?)` → `POST /api/v1/end-session`

#### [NEW] [inventory.js](file:///d:/GitHub/Frontend_sv/src/api/inventory.js)
- `fetchInventory()` → `GET /api/v1/inventory`
- `addItemAPI(itemId)` → `POST /api/v1/inventory/add { item_id }`
- `useItemAPI(itemId)` → `POST /api/v1/inventory/use { item_id }`
- `exploreZone(floorId, roomId, activeZoneId)` → `POST /api/v1/inventory/explore`

---

### Phase 3: 정적 데이터 — 서버/로컬 혼합 전략

**서버에서 조회 (API 존재):**

#### [NEW] [api/map.js](file:///d:/GitHub/Frontend_sv/src/api/map.js)
- `fetchAllMaps()` → `GET /api/v1/map/` → 전체 층/방/activeZone 데이터
- 응답의 `background` 필드는 파일명만 → 프론트에서 `url(/src/assets/map/...)` resolve
- `fetchRoom(floorId, roomId)` → `GET /api/v1/map/{floor_id}/room/{room_id}` (방 방문 시 NPC 미리듣기)

**프론트 로컬 유지 (서버 엔드포인트 없음):**

#### [NEW] [data/npcData.js](file:///d:/GitHub/Frontend_sv/src/data/npcData.js)
- [mock-backend/src/data/gameData.js](file:///d:/GitHub/Frontend_sv/mock-backend/src/data/gameData.js)에서 NPC_DATA 추출 (prompts/apiConfig 제거, 포트레이트 정보만)
- 포트레이트 경로를 프론트 `src/assets/portrait/` 기준으로 resolve

#### [NEW] [data/npcSchedule.js](file:///d:/GitHub/Frontend_sv/src/data/npcSchedule.js)
- `mock-backend/src/data/npcSchedule.js`의 NPC_SCHEDULE 그대로 이전

#### [NEW] [data/items.js](file:///d:/GitHub/Frontend_sv/src/data/items.js)
- `mock-backend/src/data/items.js`의 `ITEM_DEFINITIONS` 그대로 이전
- 아이콘/consumable/effect 등 프론트 렌더링에 필요한 정보 보존
- 서버 inventory API가 `ItemDetail` 반환 시 서버 데이터 우선 사용으로 전환 가능

---

### Phase 4: GameContext & MainGameScene 리팩토링

#### [MODIFY] [GameContext.jsx](file:///d:/GitHub/Frontend_sv/src/context/GameContext.jsx)

**초기화 흐름:**
```
login() → fetchStaticStats() → fetchStats() → fetchInventory()
                                                + 로컬 정적 데이터 로드(npc/map/schedule/items)
```

**주요 변경:**
- `initGame()`에 `login()` 호출 추가
- `fetchStaticData()` → 로컬 `data/` 모듈에서 import (서버 미제공)
- `spendHp()` → `spendHpAPI()` 호출, 응답 매핑 변경
- `addItem()` / `useItem()` → 서버 inventory API 연동
- 튜토리얼 관련 API 함수 제거

**스탯 매핑:**

| 서버 필드 | 프론트 stats 필드 | 비고 |
|---|---|---|
| `total_hp` | `hp` | 기존 hp 대체 |
| `session_hp` | `sessionHp` | 신규 |
| `plus_hp` | `plusHp` | 동일 |
| `current_session` | `currentPeriod` | "morning" 등 |
| `current_day` | `currentDay` | 동일 |
| `fishLevel` | `fishLevel` | 동일 |

#### [MODIFY] [MainGameScene.jsx](file:///d:/GitHub/Frontend_sv/src/scenes/MainGameScene.jsx)
- `generateAIResponse()` → `sendChatMessage()` 직접 호출로 단순화
- 엿듣기 → `startConversation()` API 활용
- 끼어들기 → `replyConversation()` API 활용
- 대화/엿듣기 종료 → `endSession()` API 호출

---

### Phase 5: 액티브 NPC 판정 로직 변경 (신규)

요구사항(2026-02-25 반영):
1. 게임 시작 시 `current_day` 조회 후 `0`이면 튜토리얼 진입
2. `current_day >= 1`이면 본편 로직으로 진입하고, 백엔드가 주는 현재 위치(`floor_id`, `room_id`) 기준으로 진행
3. 플레이어 이동 시 위치를 백엔드에 즉시 반영하고, 해당 방 상세 조회로 NPC 상호작용 상태를 결정

#### [MODIFY] [GameContext.jsx](file:///d:/GitHub/Frontend_sv/src/context/GameContext.jsx)

초기 진입 분기:
```
login()
  -> fetchStaticStats()
  -> fetchStats()
      if current_day === 0:
        tutorial
      else:
        mainGame
```

- `stats` 응답의 `floor_id`, `room_id`를 `currentLocationInfo` 초기값으로 사용
- 튜토리얼 완료 시점에 `current_day`를 `1` 이상으로 확정 저장

#### [MODIFY] [MainGameScene.jsx](file:///d:/GitHub/Frontend_sv/src/scenes/MainGameScene.jsx)

이동/판정 흐름:
```
onMove(targetFloorId, targetRoomId)
  -> POST /api/v1/stats { updates: { floor_id, room_id } }
  -> GET  /api/v1/map/{floor_id}/room/{room_id}
  -> 응답 기반 버튼 활성화
```

버튼 활성화 규칙:
- `room.eavesdrop` 가능(2인 이상 대화 맥락 존재) → `미리듣기/끼어들기` 활성화
- `room.eavesdrop` 없음 + 단일 NPC 응답 필드 존재 시(백엔드 확장 필드) → `대화하기` 활성화
- 둘 다 없으면 NPC 상호작용 버튼 비활성화

#### API 확인 메모

- OpenAPI 상 `GET /api/v1/map/{floor_id}/room/{room_id}` 설명은 day/session 기반 NPC 판정을 암시
- 실제 응답은 현재 `{ room, eavesdrop }` 형태를 반환함
- 따라서 단일 NPC 직접 식별 필드(`single_npc` 등)가 없다면:
  - 단기: 기존 프론트 스케줄 fallback 유지 (feature flag)
  - 중기: 백엔드에 `single_npc` 또는 `npc_ids` 명시 필드 추가 요청

---

## Verification Plan

1. `GET /api/v1/health` 200 OK 확인
2. 앱 시작 → 콘솔에서 로그인 토큰 발급 확인
3. 앱 시작 분기 확인: `current_day=0`이면 Tutorial, `>=1`이면 MainGame
4. 초기 데이터(stats/inventory/맵) 로딩 + `floor_id/room_id` 초기 위치 반영 확인
5. 이동 시 `POST /api/v1/stats`로 위치 갱신되는지 확인
6. 이동 직후 `GET /api/v1/map/{floor_id}/room/{room_id}` 응답으로 버튼 상태(대화/미리듣기/끼어들기) 전환 확인
7. NPC 대화 `POST /api/v1/chat` 정상 응답
8. HP 소모 `POST /api/v1/stats/hp/spend` 정상 동작
