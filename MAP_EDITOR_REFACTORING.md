# 맵 에디터 좌표 시스템 개선 방안

## 🔴 현재 문제점

### 1. **좌표 시스템 불일치**
**Debug03Scene (에디터)**:
- 이미지가 `max-h-[calc(100vh-7rem)]`로 제한됨 (373번 줄)
- 브라우저 크기에 따라 이미지 크기가 **동적으로 변경**
- 퍼센트 기반 좌표 (`%`)를 사용하지만, 이미지 자체 크기가 변함

**Test04Scene (실제 게임)**:
- 배경이 `backgroundSize: 'cover'`로 설정됨 (87번 줄)
- 화면 전체를 채우도록 **확대/축소**됨
- `MapInteractiveLayer`가 `absolute inset-0`로 전체 화면 기준

### 2. **Aspect Ratio 불일치**
- 에디터: 이미지 원본 비율 유지 (`w-auto`)
- 게임: `cover`로 인해 이미지가 잘리거나 늘어남
- **결과**: 같은 퍼센트 좌표가 다른 위치를 가리킴

### 3. **컨테이너 크기 차이**
```jsx
// 에디터 (Debug03Scene)
<img className="max-h-[calc(100vh-7rem)] w-auto" />  // 가변 크기

// 게임 (Test04Scene)
<div className="w-full h-full" style={{ backgroundSize: 'cover' }} />  // 고정 비율
```

---

## ✅ 해결 방안

### **방안 1: 고정 Aspect Ratio 컨테이너 (권장)**

에디터와 게임 모두에서 **고정된 aspect ratio 컨테이너**를 사용하여 일관성 확보.

#### 장점:
- ✅ 모든 화면 크기에서 동일한 좌표 매핑
- ✅ 에디터와 게임 간 1:1 대응
- ✅ 반응형 디자인 유지

#### 구현:

**1) 공통 맵 컨테이너 컴포넌트 생성**

```jsx
// src/components/MapContainer.jsx
import React, { useRef, useEffect, useState } from 'react';

/**
 * 고정 aspect ratio를 유지하는 맵 컨테이너
 * 에디터와 게임에서 동일하게 사용
 */
const MapContainer = ({ 
    aspectRatio = 16 / 9,  // 맵 이미지의 실제 비율
    children,
    className = ''
}) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (!containerRef.current) return;
            
            const parent = containerRef.current.parentElement;
            const parentWidth = parent.clientWidth;
            const parentHeight = parent.clientHeight;
            
            // aspect ratio에 맞춰 크기 계산
            let width = parentWidth;
            let height = width / aspectRatio;
            
            // 높이가 부모를 초과하면 높이 기준으로 재계산
            if (height > parentHeight) {
                height = parentHeight;
                width = height * aspectRatio;
            }
            
            setDimensions({ width, height });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [aspectRatio]);

    return (
        <div 
            ref={containerRef}
            className={`relative ${className}`}
            style={{
                width: dimensions.width,
                height: dimensions.height,
                margin: '0 auto',  // 중앙 정렬
            }}
        >
            {children}
        </div>
    );
};

export default MapContainer;
```

**2) Debug03Scene 수정**

```jsx
// Debug03Scene.jsx
import MapContainer from '../components/MapContainer';

// 373번 줄 근처 수정
<MapContainer aspectRatio={16/9} className="max-h-[calc(100vh-7rem)]">
    <img
        ref={imgRef}
        src={selectedMap.src}
        alt={selectedMap.label}
        className="w-full h-full object-contain"  // 변경
        draggable={false}
    />
    {/* zones 렌더링은 동일 */}
</MapContainer>
```

**3) Test04Scene 수정**

```jsx
// Test04Scene.jsx
import MapContainer from '../components/MapContainer';

return (
    <MapContainer aspectRatio={16/9} className="w-full h-full">
        <div
            className="w-full h-full relative"
            style={{
                backgroundImage: mapInfo.background,
                backgroundSize: 'contain',  // cover → contain
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <MapInteractiveLayer mapInfo={mapInfo} onInteract={handleInteraction} />
        </div>
    </MapContainer>
);
```

---

### **방안 2: 절대 픽셀 좌표 시스템**

퍼센트 대신 **고정 해상도 기준 픽셀 좌표** 사용.

#### 장점:
- ✅ 정확한 픽셀 단위 배치
- ✅ 디자이너가 이해하기 쉬움

#### 단점:
- ❌ 반응형 대응 복잡
- ❌ 다양한 화면 크기 지원 어려움

#### 구현:

```jsx
// mapdata.js
const REFERENCE_WIDTH = 1920;  // 기준 해상도
const REFERENCE_HEIGHT = 1080;

activeZones: [
    {
        id: 'zone_1',
        type: 'move',
        // 픽셀 좌표 (기준 해상도 기준)
        x: 960,   // px
        y: 540,   // px
        width: 200,
        height: 150,
    }
]

// MapInteractiveLayer.jsx
const MapInteractiveLayer = ({ mapInfo, onInteract, containerWidth, containerHeight }) => {
    const scaleX = containerWidth / REFERENCE_WIDTH;
    const scaleY = containerHeight / REFERENCE_HEIGHT;
    
    return (
        <div className="absolute inset-0">
            {mapInfo.activeZones.map((zone) => (
                <div
                    key={zone.id}
                    style={{
                        left: zone.x * scaleX,
                        top: zone.y * scaleY,
                        width: zone.width * scaleX,
                        height: zone.height * scaleY,
                    }}
                />
            ))}
        </div>
    );
};
```

---

### **방안 3: SVG 기반 좌표 시스템**

SVG viewBox를 활용한 벡터 기반 좌표.

#### 장점:
- ✅ 완벽한 스케일링
- ✅ 복잡한 도형 지원

#### 단점:
- ❌ 구현 복잡도 높음
- ❌ 기존 시스템 대폭 수정 필요

---

## 🎯 권장 솔루션: **방안 1 (고정 Aspect Ratio)**

### 구현 단계

1. **MapContainer 컴포넌트 생성** ✅
2. **각 맵 이미지의 실제 aspect ratio 확인**
   ```bash
   # PowerShell에서 이미지 크기 확인
   Get-ChildItem "d:\GitHub\Frontend_sv\src\assets\map\*.png" | 
   ForEach-Object {
       $img = [System.Drawing.Image]::FromFile($_.FullName)
       "$($_.Name): $($img.Width)x$($img.Height) (ratio: $($img.Width/$img.Height))"
       $img.Dispose()
   }
   ```

3. **mapdata.js에 aspect ratio 정보 추가**
   ```js
   export const MAP_METADATA = {
       '1F_outside01.png': { aspectRatio: 16/9 },
       '2F_storage01.png': { aspectRatio: 16/9 },
       // ...
   };
   ```

4. **Debug03Scene 리팩터링**
5. **Test04Scene 및 다른 씬 업데이트**
6. **테스트 및 검증**

---

## 📋 추가 개선 사항

### 1. **에디터 기능 강화**
```jsx
// 실시간 미리보기 모드
<button onClick={() => setPreviewMode(!previewMode)}>
    {previewMode ? '에디터 모드' : '미리보기 모드'}
</button>

{previewMode && (
    <div className="absolute inset-0 bg-black/80">
        {/* 실제 게임과 동일한 렌더링 */}
        <MapContainer aspectRatio={16/9}>
            <MapInteractiveLayer mapInfo={currentMapInfo} />
        </MapContainer>
    </div>
)}
```

### 2. **좌표 검증 시스템**
```jsx
// 에디터에서 export 시 경고
const validateZones = (zones) => {
    const warnings = [];
    zones.forEach(zone => {
        if (zone.x + zone.width > 100) {
            warnings.push(`${zone.id}: 가로 범위 초과`);
        }
        if (zone.y + zone.height > 100) {
            warnings.push(`${zone.id}: 세로 범위 초과`);
        }
    });
    return warnings;
};
```

### 3. **그리드 오버레이**
```jsx
// 에디터에 그리드 표시
<div className="absolute inset-0 pointer-events-none">
    {Array.from({ length: 10 }).map((_, i) => (
        <>
            <div style={{ 
                position: 'absolute', 
                left: `${i * 10}%`, 
                top: 0, 
                bottom: 0, 
                width: 1, 
                background: 'rgba(255,255,255,0.1)' 
            }} />
            <div style={{ 
                position: 'absolute', 
                top: `${i * 10}%`, 
                left: 0, 
                right: 0, 
                height: 1, 
                background: 'rgba(255,255,255,0.1)' 
            }} />
        </>
    ))}
</div>
```

---

## 🚀 마이그레이션 가이드

### 기존 데이터 변환 스크립트

```js
// scripts/convertCoordinates.js
const fs = require('fs');

// 기존 mapdata.js 읽기
const mapdata = require('../mock-backend/src/data/mapdata.js');

// aspect ratio 기준으로 좌표 재계산 (필요시)
const convertedData = mapdata.FLOOR_DATA.map(floor => ({
    ...floor,
    rooms: floor.rooms.map(room => ({
        ...room,
        activeZones: room.activeZones.map(zone => ({
            ...zone,
            // 퍼센트는 그대로 유지 (MapContainer가 처리)
        }))
    }))
}));

// 저장
fs.writeFileSync(
    '../mock-backend/src/data/mapdata_v2.js',
    `export const FLOOR_DATA = ${JSON.stringify(convertedData, null, 2)};`
);
```

---

**작성일**: 2026-02-13  
**우선순위**: 🔴 높음  
**예상 작업 시간**: 4-6시간
