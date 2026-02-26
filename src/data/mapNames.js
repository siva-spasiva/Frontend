/**
 * 프론트엔드 층/방 ID → 한글 이름 매핑
 * 백엔드 맵 API가 로드되기 전(세이브 화면 등)에서 사용
 */

export const FLOOR_NAMES = {
    '2F': '자재 창고',
    '1F': '우미 갤러리 & 카페',
    'B1': 'B1: 식장 / 조리실',
    'B2': '거주층 & 세탁실',
    'B3': 'B3: 예배당 / 진리 학습실',
    'B4': 'B4',
    'B5': 'B5: 심해',
    'DEBUG': '디버그 구역',
};

export const ROOM_NAMES = {
    // 2F
    storage_main: '메인 창고',
    terrace: '테라스',
    // 1F
    outside01: '갤러리 외부',
    main_hall: '메인 홀',
    umi_class: '원데이 클래스 룸',
    stairs_up: '계단',
    stairs_revealed: '드러난 계단',
    // B1
    cafeteria: '중앙 식당',
    kitchen: '조리실',
    B1_machineroom: '자판기',
    // B2
    hallway: '복도',
    room001: '001호',
    room002: '002호',
    room003: '003호',
    room004: '004호',
    room005: '005호',
    laundry_room: '세탁실',
    // B3
    b3_hall: '복도',
    chapel: '대예배당',
    truth_room001: '진리 학습실',
    // B4
    b4_entrance: '입구',
    real_leader_room: '교주의 방',
    // B5
    b5_entrance: '입구',
    solphi_room: '솔피의 방',
    freezer: '냉동창고',
    dock: '선착장',
    B5_hallway: '최심부 갈림길',
    room_mlytzlxl: '수조로 가는 길',
    // DEBUG
    test01: 'UNKNOWN MAP',
};

/**
 * floor_id + room_id → 한글 표시명 변환
 * @param {string|null} floorId
 * @param {string|null} roomId
 * @returns {string}
 */
export const resolveLocationLabel = (floorId, roomId) => {
    const floor = floorId || '-';
    if (!roomId) return floor;
    const roomName = ROOM_NAMES[roomId] || roomId;
    return `${floor} ${roomName}`;
};
