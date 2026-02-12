// Map & Floor Data - extracted from gameData.js

export const FLOOR_DATA = [
    {
        id: '2F',
        name: '자재 창고',
        description: '쓰지 않는 미술 도구와 카페 비품들이 쌓여있다. 1층의 활기찬 소리가 먹먹하게 들려온다.',
        rooms: [
            {
                id: 'storage_main',
                name: '메인 창고',
                namePrefix: '2F 자재 창고',
                highlightText: 'MAIN',
                highlightColor: 'text-gray-400',
                description: '쓰지 않는 미술 도구와 카페 비품들이 쌓여있다. 1층의 활기찬 소리가 먹먹하게 들려온다.',
                background: '2F_storage01.png',
                overlayColor: 'bg-black/20',
                activeZones: [
                    {
                        id: 'to_terrace',
                        type: 'move',
                        target: 'terrace',
                        x: '80%',
                        y: '30%',
                        width: '15%',
                        height: '40%',
                        label: '테라스',
                        message: '테라스로 나간다.'
                    },
                    {
                        id: 'item_box_01',
                        type: 'item',
                        itemId: 'item010', // Black Key
                        x: '50%',
                        y: '75%',
                        width: '10%',
                        height: '10%',
                        label: '작은 상자',
                        message: '구석에 놓인 낡은 상자.'
                    },
                    {
                        id: 'easel',
                        type: 'info',
                        x: '20%',
                        y: '50%',
                        width: '10%',
                        height: '10%',
                        label: '이젤',
                        message: '이젤이 놓여있다.'
                    }
                ]
            },
            {
                id: 'terrace',
                name: '테라스',
                namePrefix: '2F 테라스',
                highlightText: 'OPEN',
                highlightColor: 'text-blue-200',
                description: '테라스. 바닷바람이 시원하게 불어온다.',
                overlayColor: 'bg-black/0',
                background: '2F_terrace01.png',
                activeZones: [
                    {
                        "id": "back_to_storage",
                        "type": "move",
                        "target": "storage_main",
                        "x": "0%",
                        "y": "31.08068121210546%",
                        "width": "13.059880112363274%",
                        "height": "31.35137991342104%",
                        "label": "창고로",
                        "message": "창고 안으로 돌아간다."
                    },
                    {
                        "id": "terrace_to_stairs",
                        "type": "move",
                        "target": "stairs_up",
                        "x": "30.90663114440394%",
                        "y": "85%",
                        "width": "40%",
                        "height": "15%",
                        "label": "1층 계단",
                        "message": "계단을 통해 1층으로 내려간다."
                    },
                    {
                        "id": "item_solpi_tear",
                        "type": "item",
                        "x": "77.21246303789637%",
                        "y": "81.79100110391424%",
                        "width": "7.466844277980357%",
                        "height": "9.08771287878298%",
                        "label": "작은 상자",
                        "message": "미술도구 사이, 푸른빛의 액체가 담긴 병이 놓여 있다."
                    }
                ]
            }
        ]
    },

    {
        id: '1F',
        name: '우미 갤러리 & 카페',
        description: '아름다운 해안 절벽 위에 세워진 목조 건물.',
        mapImage: '1F_outside01.png',
        rooms: [
            {
                id: 'outside01',
                name: '갤러리 외부',
                namePrefix: '우미 갤러리',
                highlightText: 'OUTSIDE',
                highlightColor: 'text-cyan-300',
                description: '해안 절벽 위에 세워진 아름다운 목조 건물. 잔잔한 파도 소리가 들린다.',
                background: '1F_outside01.png',
                overlayColor: 'bg-black/0',
                activeZones: [
                    {
                        "id": "to_main_hall",
                        "type": "move",
                        "target": "main_hall",
                        "x": "67.47970694133244%",
                        "y": "38.15962244813367%",
                        "width": "9.68707073240526%",
                        "height": "31.300865223026996%",
                        "label": "건물 입구",
                        "message": "건물 안으로 들어간다."
                    },
                    {
                        "id": "info_ocean_view",
                        "type": "info",
                        "x": "10.326457973373106%",
                        "y": "59.238647105812326%",
                        "width": "25%",
                        "height": "30%",
                        "label": "바닷가 풍경",
                        "message": "아름다운 푸른 바다. 평화롭다."
                    },
                    {
                        "id": "info_stone_stairs",
                        "type": "info",
                        "x": "56.4140615397194%",
                        "y": "77.20989774636953%",
                        "width": "29.166111631311452%",
                        "height": "20.55895289659479%",
                        "label": "돌계단",
                        "message": "절벽을 따라 깔린 낡은 돌계단. 풍경에 어우러지는 회색 돌이 햇빛에 빛나고 있다."
                    },
                    {
                        "id": "umi_info",
                        "type": "info",
                        "x": "60.606697748646575%",
                        "y": "14.090023596991648%",
                        "width": "19.746617823555397%",
                        "height": "13.74988201504177%",
                        "label": "간판",
                        "message": "우미 카페의 간판. 멋들어지게 umi 라고 쓰여 있다."
                    }
                ]
            },
            {
                id: 'main_hall',
                name: '메인 홀',
                namePrefix: '1F 메인 홀',
                highlightText: 'CAFE',
                highlightColor: 'text-blue-300',
                description: '잔잔한 재즈 음악이 흐르는, 바닷가가 보이는 깔끔한 인테리어와 곳곳에 놓인 싱그러운 화분들이 돋보인다.',
                background: '1F_hall01.png',
                overlayColor: 'bg-black/5',
                activeZones: [
                    {
                        id: 'to_outside',
                        type: 'move',
                        target: 'outside01',
                        x: '5%',
                        y: '30%',
                        width: '10%',
                        height: '40%',
                        label: '외부',
                        message: '건물 밖으로 나간다.'
                    },
                    {
                        id: 'to_umi_class_from_hall',
                        type: 'move',
                        target: 'umi_class',
                        x: '80%',
                        y: '30%',
                        width: '15%',
                        height: '40%',
                        label: '원데이 클래스',
                        message: '원데이 클래스 룸으로 향한다.'
                    }
                ]
            },
            {
                id: 'umi_class',
                name: '원데이 클래스 룸',
                namePrefix: '원데이 클래스',
                highlightText: '우미',
                highlightColor: 'text-blue-400',
                description: '아치형 창문으로 바다가 내다보이는 아름다운 강의실. 나무 바닥 위로 햇살이 길게 드리워져 있고, 이젤과 책들이 여기저기 놓여있다.',
                background: '1F_class02.png',
                overlayColor: 'bg-black/5',
                activeZones: [
                    {
                        id: 'to_main_hall_from_class',
                        type: 'move',
                        target: 'main_hall',
                        x: '5%',
                        y: '30%',
                        width: '10%',
                        height: '40%',
                        label: '메인 홀',
                        message: '메인 홀로 돌아간다.'
                    },
                    {
                        id: 'to_stairs_from_class',
                        type: 'move',
                        target: 'stairs_up',
                        x: '85%',
                        y: '40%',
                        width: '12%',
                        height: '35%',
                        label: '계단',
                        message: '계단 쪽으로 향한다.'
                    }
                ]
            },
            {
                id: 'stairs_up',
                name: '계단',
                description: '2층으로 이어지는 목조 계단.',
                background: '1F_stair01.png',
                activeZones: [
                    {
                        id: 'to_storage',
                        type: 'move',
                        target: 'storage_main',
                        x: '45%',
                        y: '10%',
                        width: '15%',
                        height: '20%',
                        label: '2층 창고',
                        message: '2층 자재 창고로 올라간다.'
                    },
                    {
                        id: 'to_umi_class',
                        type: 'move',
                        target: 'umi_class',
                        x: '90%',
                        y: '40%',
                        width: '10%',
                        height: '40%',
                        label: '복도',
                        message: '복도로 나간다.'
                    }
                ]
            },
            {
                id: 'stairs_down',
                name: '계단',
                description: '2층으로 이어지는 목조 계단. 지하로 내려가는 계단이 보인다.',
                background: '1F_stair02.png',
                activeZones: [
                    {
                        id: 'to_storage',
                        type: 'move',
                        target: 'storage_main',
                        x: '5%',
                        y: '20%',
                        width: '25%',
                        height: '70%',
                        label: '2층 창고',
                        message: '2층 자재 창고로 올라간다.'
                    },
                    {
                        id: 'to_b1',
                        type: 'move',
                        target: 'cafeteria',
                        x: '35%',
                        y: '30%',
                        width: '30%',
                        height: '60%',
                        label: '지하 1층',
                        message: '지하 1층으로 내려간다.'
                    },
                    {
                        id: 'to_umi_class',
                        type: 'move',
                        target: 'umi_class',
                        x: '75%',
                        y: '40%',
                        width: '20%',
                        height: '50%',
                        label: '복도',
                        message: '복도로 나간다.'
                    }
                ]
            }
        ]
    },

    {
        id: 'B1',
        name: 'B1: 규율의 공간',
        description: '우미교 지하의 가장 위층. 묘한 활기와 감시가 공존한다.',
        rooms: [
            {
                id: 'cafeteria',
                name: '중앙 식당',
                namePrefix: 'B1 중앙 식당',
                highlightText: 'DINING',
                highlightColor: 'text-orange-300',
                description: '조금 소란스러운 식당. 신도들이 식사를 하고 있다.',
                mapImage: 'B1_restaurant01.png',
                overlayColor: 'bg-black/20',
            },
            {
                id: 'lounge',
                name: '휴게실 (자판기 구역)',
                description: '솔피의 눈물이 들어있는 자판기가 있다.',
                background: 'B1_machine01.png',
            },
            {
                id: 'kitchen',
                name: '조리실',
                description: '칼과 불이 있는 위험한 곳. B4로 직행하는 식재료용 덤웨이터(소형 승강기)가 있다.',
            },
            {
                id: 'master_room',
                name: '관리실 (구 교주의 방)',
                description: 'CCTV로 B2 복도를 감시하는 곳. 주교는 더 깊은 곳에 있다. 여기엔 장부만 있다.',
            }
        ]
    },

    {
        id: 'B2',
        name: '거주층',
        description: '신도들의 숙소. 기묘한 소리가 벽 너머로 들린다.',
        rooms: [
            {
                id: 'room001', // Renamed from player_room for consistency
                name: '001호',
                namePrefix: '001호',
                highlightText: '001',
                highlightColor: 'text-yellow-500',
                description: '어둡고 조용한 방. 왠지 모르게 춥다.',
                background: 'B2_room02.png',
                overlayColor: 'bg-black/40',
                activeZones: [
                    {
                        "id": "zone_bed",
                        "type": "info",
                        "x": "23.08589206005681%",
                        "y": "62.258311900865095%",
                        "width": "28.48505342891925%",
                        "height": "10.644972496708213%",
                        "label": "낡은 침대",
                        "message": "딱딱하고 차가운 침대다."
                    },
                    {
                        "id": "zone_table",
                        "type": "info",
                        "x": "54.20669774864656%",
                        "y": "56.520302402598666%",
                        "width": "8.52672439034361%",
                        "height": "11.114782748914521%",
                        "label": "작은 테이블",
                        "message": "먼지가 쌓인 테이블."
                    },
                    {
                        "id": "zone_box",
                        "type": "item",
                        "x": "86.67287598420063%",
                        "y": "75.54086900434196%",
                        "width": "7.066977486465589%",
                        "height": "12.736332965361925%",
                        "label": "옷장 서랍",
                        "message": "잠겨있다. 무언가 열쇠가 필요해 보인다..."
                    },
                    {
                        "id": "zone_door",
                        "type": "move",
                        "target": "hallway",
                        "x": "68.09336885559605%",
                        "y": "30.61504694805911%",
                        "width": "7.773342213898999%",
                        "height": "37.83758077921065%",
                        "label": "지하 복도",
                        "message": "복도로 나간다."
                    },
                    {
                        "id": "zone_5",
                        "type": "item",
                        "x": "27.691789530637088%",
                        "y": "80.76467888214809%",
                        "width": "3.5%",
                        "height": "5.3%",
                        "label": "침대 아래",
                        "message": "곽빙어의 작은 박스."
                    }
                ]
            },
            {
                id: 'hallway',
                name: '복도',
                namePrefix: 'B2 복도',
                highlightText: 'HALL',
                highlightColor: 'text-gray-600',
                description: '묘한 비린내와 곰팡이 냄새가 진동하는 복도.',
                overlayColor: 'bg-black/20',
                background: 'B2_hallway02.png',
                activeZones: [
                    {
                        "id": "door_001",
                        "type": "move",
                        "target": "room001",
                        "x": "5.3998667915147465%",
                        "y": "25.067674675328895%",
                        "width": "15.059880112363274%",
                        "height": "60.84461244588816%",
                        "label": "001호",
                        "message": "001호 문을 연다."
                    },
                    {
                        "id": "door_002",
                        "type": "move",
                        "target": "room002",
                        "x": "48.545352342945506%",
                        "y": "40.43962119049319%",
                        "width": "5.880239775273445%",
                        "height": "24.86412225105301%",
                        "label": "002호",
                        "message": "002호 문을 연다."
                    },
                    {
                        "id": "door_shower",
                        "type": "move",
                        "target": "shower_room",
                        "x": "31.739853470666226%",
                        "y": "31.486729264078846%",
                        "width": "8.073408818141644%",
                        "height": "42.76990610388178%",
                        "label": "샤워실",
                        "message": "샤워실에 들어간다."
                    },
                    {
                        "id": "door_003",
                        "type": "move",
                        "target": "room003",
                        "x": "58.379240711634054%",
                        "y": "42.80453603898003%",
                        "width": "3.0470174490111717%",
                        "height": "18.445067662303074%",
                        "label": "003호",
                        "message": "003호 문을 연다."
                    },
                    {
                        "id": "stair_002",
                        "type": "move",
                        "target": "B3",
                        "x": "71.94588517688653%",
                        "y": "42.263667034638075%",
                        "width": "4.486804315434753%",
                        "height": "14.121286017302815%",
                        "label": "지하 3층으로",
                        "message": "지하 3층으로 내려간다."
                    },
                    {
                        "id": "door_004",
                        "type": "move",
                        "target": "room004",
                        "x": "78.99933395757375%",
                        "y": "40.4396211904932%",
                        "width": "2.707030769859685%",
                        "height": "25.708734696941164%",
                        "label": "004호",
                        "message": "004호 문을 연다."
                    },
                    {
                        "id": "door_005",
                        "type": "move",
                        "target": "room005",
                        "x": "87.55954709115014%",
                        "y": "25.91228712121704%",
                        "width": "6.333555347475425%",
                        "height": "65.91228712121703%",
                        "label": "005호",
                        "message": "005호 문을 연다."
                    },
                    {
                        "id": "stair_002",
                        "type": "move",
                        "target": "B3",
                        "x": "65.93998667915145%",
                        "y": "53.67293012986844%",
                        "width": "3.9%",
                        "height": "7.4%",
                        "label": "지하 3층으로",
                        "message": "지하 3층으로 내려간다."
                    }
                ]
            },
            {
                id: 'room002',
                name: '002호',
                namePrefix: '002호',
                highlightText: 'LOCKED',
                highlightColor: 'text-red-500',
                description: '항상 잠겨있다. 문틈으로 비린내가 새어 나온다. 살인의 증거가 있을지 모른다.',
                background: null,
                overlayColor: 'bg-black/40',
                activeZones: [
                    {
                        id: 'zone_door_002',
                        type: 'move',
                        target: 'hallway',
                        x: '70%',
                        y: '25%',
                        width: '10%',
                        height: '50%',
                        label: '복도',
                        message: '복도로 나간다.'
                    }
                ]
            },
            {
                id: 'room003',
                name: '003호',
                namePrefix: '003호',
                highlightText: '003',
                highlightColor: 'text-amber-400',
                description: '낡은 수첩과 싸구려 볼편 뭉치, 오래된 MP3 플레이어 — 보쟘것없는 잡동사니로 가득한 방. 하지만 움쯄 파인 문구가 새겨진 머그컵이 묘하게 불안하다.',
                background: null,
                overlayColor: 'bg-black/40',
                npcId: 'bingeo',
                activeZones: [
                    {
                        id: 'zone_notebook_003',
                        type: 'info',
                        x: '15%',
                        y: '55%',
                        width: '15%',
                        height: '15%',
                        label: '낡은 수첩',
                        message: '해진 겉표지의 수첩. 글씨가 빽곡히 적혀 있지만, 바로 펀쳐볼 수는 없다.'
                    },
                    {
                        id: 'zone_photo_003',
                        type: 'info',
                        x: '40%',
                        y: '30%',
                        width: '10%',
                        height: '15%',
                        label: '빛바랜 사진',
                        message: '벽에 테이프로 붙여둔 사진. 어린 아이와 한 여성이 희미하게 웃고 있다.'
                    },
                    {
                        id: 'zone_usb_003',
                        type: 'item',
                        x: '60%',
                        y: '60%',
                        width: '10%',
                        height: '10%',
                        label: '오래된 USB',
                        message: '서랍 속에 숨겨져 있는 USB 메모리. 긍이 가 있고 라벨이 벗겨져 있다.'
                    },
                    {
                        id: 'zone_mug_003',
                        type: 'info',
                        x: '25%',
                        y: '45%',
                        width: '10%',
                        height: '12%',
                        label: '시설 로고 머그컵',
                        message: '"새 삶을 축하합니다"라고 적혀 있다. 안에 싸구려 볼편 두세개가 꼽혀 있다.'
                    },
                    {
                        id: 'zone_door_003',
                        type: 'move',
                        target: 'hallway',
                        x: '70%',
                        y: '25%',
                        width: '10%',
                        height: '50%',
                        label: '복도',
                        message: '복도로 나간다.'
                    }
                ]
            },
            {
                id: 'room004',
                name: '004호',
                namePrefix: '004호',
                highlightText: '004',
                highlightColor: 'text-red-400',
                description: '안쪽에서 묘한 냄새가 새어나온다. 창문 없이 컴컴하고, 벽에는 손톱으로 긁은 듯한 자국이 있다.',
                background: null,
                overlayColor: 'bg-black/50',
                npcId: 'bokeo',
                activeZones: [
                    {
                        id: 'zone_door_004',
                        type: 'move',
                        target: 'hallway',
                        x: '70%',
                        y: '25%',
                        width: '10%',
                        height: '50%',
                        label: '복도',
                        message: '복도로 나간다.'
                    }
                ]
            },
            {
                id: 'room005',
                name: '005호',
                namePrefix: '005호',
                highlightText: '005',
                highlightColor: 'text-cyan-400',
                description: '정돈된 듯 어지러운 방. 잡다한 물건들이 전략적으로 배치되어 있다. 거래의 흔적이 곳곳에.',
                background: null,
                overlayColor: 'bg-black/40',
                npcId: 'galchi',
                activeZones: [
                    {
                        id: 'zone_door_005',
                        type: 'move',
                        target: 'hallway',
                        x: '70%',
                        y: '25%',
                        width: '10%',
                        height: '50%',
                        label: '복도',
                        message: '복도로 나간다.'
                    },
                    {
                        id: 'zone_galchi_cards',
                        type: 'inspect',
                        x: '15%',
                        y: '30%',
                        width: '18%',
                        height: '20%',
                        label: '명함 뭉치',
                        message: '서로 다른 이름의 명함들과 신분증이 흩어져 있다. 투자 컨설턴트, 해외 무역, 재무설계사... 전부 같은 사람?',
                        itemId: 'npc_galchi_003'
                    },
                    {
                        id: 'zone_galchi_phones',
                        type: 'inspect',
                        x: '40%',
                        y: '55%',
                        width: '15%',
                        height: '18%',
                        label: '휴대폰들',
                        message: '침대 밑에 공기계 4대가 숨겨져 있다. 각각 다른 유심, 다른 카카오톡, 다른 삶.',
                        itemId: 'npc_galchi_004'
                    },
                    {
                        id: 'zone_galchi_receipts',
                        type: 'inspect',
                        x: '55%',
                        y: '15%',
                        width: '12%',
                        height: '15%',
                        label: '영수증 뭉치',
                        message: '선불폰 영수증이 뭉쳐 있다. 개통과 해지가 반복된 흔적. 추적을 피하려는 습관.',
                        itemId: 'npc_galchi_005'
                    },
                    {
                        id: 'zone_galchi_ledger',
                        type: 'inspect',
                        x: '20%',
                        y: '65%',
                        width: '15%',
                        height: '18%',
                        label: '장부 사본',
                        message: '헌금 흐름을 정리한 장부. 과거 투자사기 장부와 포맷이 똑같다. 범죄 기술의 전이.',
                        itemId: 'npc_galchi_006'
                    }
                ]
            },
            {
                id: 'shower_room',
                name: '공용 샤워실',
                namePrefix: 'B2 샤워실',
                highlightText: 'SHOWER',
                highlightColor: 'text-blue-200',
                description: '물때와 곰팡이로 얼룩진 샤워실. 비린내가 난다.',
                background: null,
                overlayColor: 'bg-black/30',
            }
        ]
    },

    {
        id: 'B3',
        name: 'B3: 심해의 예배당',
        description: '습도가 매우 높다. 바닥이 항상 축축하며, 벽화 속 솔피의 눈이 움직이는 것 같다.',
        mapImage: 'B3_hall.png',
        rooms: [
            {
                id: 'chapel',
                name: '대예배당',
                description: '거대한 솔피상이 있는 곳. 새벽 기도(04:00)가 강제 진행된다.',
            },
            {
                id: 'confession_room',
                name: '정화의 방 (독방)',
                description: '평판(Reputation)이 바닥난 NPC가 갇히는 곳. 그들은 여기서 강제 변이를 당한다.',
            },
            {
                id: 'secret_passage',
                name: '성물 안치소',
                description: '단상 뒤편의 비밀 공간. B4로 내려가는 나선형 계단이 숨겨져 있다.',
            }
        ]
    },

    {
        id: 'B4',
        name: 'B4: 어머니의 품',
        description: '건물최하층, 해저 동굴을 개조한 공간. 파도 소리가 귀를 때린다.',
        mapImage: 'B4_water01.png',
        rooms: [
            {
                id: 'ocean_gate',
                name: '배수구 (탈출구)',
                namePrefix: 'B4 배수구',
                highlightText: 'EXIT',
                highlightColor: 'text-blue-800',
                description: '바다로 연결되는 거대한 배수구.',
                overlayColor: 'bg-blue-900/40',
            },
            {
                id: 'jeonkwangeo_room',
                name: '전광어의 방',
                description: '전광어의 방. 수조에 물고기가 가득하다.',
                background: 'B4_master01.png',
            },
            {
                id: 'solpi_tank',
                name: '솔피의 수조',
                description: '집채만한 범고래 솔피가 갇혀있는 거대 수조.',
            }
        ]
    },

    // ----------------------------------------------------------------
    // DEBUG / ETC
    // ----------------------------------------------------------------
    {
        id: 'DEBUG',
        name: '디버그 구역',
        description: '개발자 및 테스트용 공간.',
        rooms: [
            {
                id: 'test01',
                name: 'UNKNOWN MAP',
                namePrefix: 'UNKNOWN MAP',
                highlightText: '01',
                highlightColor: 'text-yellow-500',
                description: '정체불명의 공간. 비릿한 냄새가 난다.',
                background: null,
                overlayColor: 'bg-black/40',
            }
        ]
    }
];
