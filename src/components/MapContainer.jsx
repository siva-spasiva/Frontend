import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * 고정 Aspect Ratio 맵 컨테이너
 * 
 * 에디터(Debug03Scene)와 게임(Test04Scene 등)에서 동일하게 사용.
 * 부모 요소 안에서 지정된 aspect ratio를 유지하며 최대 크기로 렌더링합니다.
 * 자식 요소들은 이 컨테이너 안에서 퍼센트 기반 좌표로 정확히 배치됩니다.
 * 
 * @param {number} aspectRatio - 가로/세로 비율 (기본 16/9)
 * @param {React.ReactNode} children
 * @param {string} className - 추가 CSS 클래스
 * @param {object} style - 추가 인라인 스타일
 * @param {Function} onDimensionsChange - 크기 변경 시 콜백 ({ width, height })
 */
const MapContainer = ({
    aspectRatio = 16 / 9,
    children,
    className = '',
    style = {},
    onDimensionsChange,
}) => {
    const wrapperRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const updateDimensions = useCallback(() => {
        if (!wrapperRef.current) return;

        const parent = wrapperRef.current;
        const parentWidth = parent.clientWidth;
        const parentHeight = parent.clientHeight;

        if (parentWidth === 0 || parentHeight === 0) return;

        // contain 방식: aspect ratio를 유지하며 부모 안에 최대 크기로
        let width = parentWidth;
        let height = width / aspectRatio;

        if (height > parentHeight) {
            height = parentHeight;
            width = height * aspectRatio;
        }

        const newDimensions = {
            width: Math.floor(width),
            height: Math.floor(height)
        };

        setDimensions(newDimensions);
        onDimensionsChange?.(newDimensions);
    }, [aspectRatio, onDimensionsChange]);

    useEffect(() => {
        if (!wrapperRef.current) return;

        updateDimensions();

        const observer = new ResizeObserver(() => {
            updateDimensions();
        });

        observer.observe(wrapperRef.current);

        return () => observer.disconnect();
    }, [updateDimensions]);

    return (
        <div
            ref={wrapperRef}
            className={`w-full h-full flex items-center justify-center ${className}`}
        >
            <div
                className="relative overflow-hidden"
                style={{
                    width: dimensions.width || '100%',
                    height: dimensions.height || '100%',
                    ...style,
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default MapContainer;
