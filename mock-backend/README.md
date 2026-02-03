# Mock Backend Service

이 서비스는 프론트엔드 개발 및 테스트를 위한 **Mock Backend**입니다.
실제 백엔드 API와 동일한 인터페이스를 제공하지만, 복잡한 로직이나 외부 AI 호출 대신 시뮬레이션된 응답을 반환합니다.

## 기능 (Features)

1.  **Mock AI Chat**:
    *   `/api/chat` 엔드포인트는 실제 LLM을 호출하지 않습니다.
    *   사용자의 메시지를 echo하고, 사전 정의된 규칙에 따라 `UPDATED_STATS`를 반환합니다.
    *   네트워크 지연 시간을 시뮬레이션합니다 (500ms).

2.  **In-Memory State Management**:
    *   `/api/stats` 등은 메모리에 저장된 임시 상태를 읽고 씁니다.
    *   서버를 재시작하면 데이터가 초기화됩니다.

3.  **API Endpoints**:
    *   `POST /api/chat`: 채팅 메시지 전송
    *   `GET /api/stats`: 현재 게임 통계 조회
    *   `POST /api/stats`: 게임 통계 업데이트 (Debug용)
    *   `GET /api/data/static`: 정적 게임 데이터 조회

## 실행 방법 (Usage)

```bash
# 의존성 설치
npm install

# 서버 실행 (포트 3000)
npm run dev
```

## 주의사항
*   이 서버는 **프로덕션 용도가 아닙니다**.
*   외부 LLM API Key가 필요하지 않습니다.
