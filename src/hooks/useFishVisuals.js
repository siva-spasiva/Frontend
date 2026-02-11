import { useMemo } from 'react';
import { useGame } from '../context/GameContext';

/**
 * useFishVisuals — Fish Level에 따른 시각 효과 파라미터 제공
 *
 * Tier 0 (정상):       효과 없음
 * Tier 1 (미세 변이):   미세한 색조 변화, 약한 비네팅
 * Tier 2 (중간 변이):   어안렌즈 시작, 수중 물결, 청록 틴트
 * Tier 3 (심각 변이):   강한 어안렌즈, 물방울 파티클, 비늘 패턴
 * Tier 4 (거의 물고기): 극심한 왜곡, 완전한 수중 느낌, UI 변형
 * Tier 5 (만렙):       게임오버 (별도 처리)
 */
const useFishVisuals = () => {
    const { fishLevel = 0, fishTier = 0 } = useGame();

    return useMemo(() => {
        // === 고정 SVG 필터 ID (React useId 대신, scene에서 참조할 수 있도록) ===
        const waveFilterId = 'fish-wave-distortion';

        // === 맵 어안렌즈 효과 ===
        const mapEffects = {
            // CSS perspective (낮을수록 왜곡 심함)
            perspective: fishTier === 0 ? 'none' : `${Math.max(400, 1200 - fishTier * 200)}px`,
            // 스케일 (어안렌즈 볼록감)
            scale: 1 + fishTier * 0.03,
            // border-radius for fisheye curvature (%)
            borderRadius: fishTier >= 3 ? `${10 + (fishTier - 2) * 8}%` : '0%',
            // 비네팅 강도 (0~1)
            vignetteOpacity: Math.min(fishTier * 0.15, 0.6),
            // 수중 물결 (feTurbulence scale)
            waveIntensity: fishTier >= 2 ? fishTier * 3 : 0,
            // 색조 회전 (청록색 방향)
            hueRotate: fishTier * 15, // deg
            // 채도 증가 (수중 느낌)
            saturate: 1 + fishTier * 0.08,
            // 청록 오버레이 투명도
            tintOpacity: Math.min(fishTier * 0.06, 0.25),
            // 블러 (가장자리 용)
            edgeBlur: fishTier >= 3 ? (fishTier - 2) * 0.5 : 0,
        };

        // 맵 컨테이너에 적용할 CSS filter 문자열
        // 색조 필터 + SVG 물결 왜곡 필터를 합쳐서 하나의 filter string으로 만듦
        const mapFilter = fishTier === 0
            ? 'none'
            : [
                `hue-rotate(${mapEffects.hueRotate}deg)`,
                `saturate(${mapEffects.saturate})`,
                fishTier >= 3 ? `contrast(${1 + (fishTier - 2) * 0.05})` : '',
                fishTier >= 2 ? `url(#${waveFilterId})` : '', // SVG 물결 왜곡 — 배경에 직접 적용!
            ].filter(Boolean).join(' ');

        // 맵 컨테이너에 적용할 CSS transform 문자열
        const mapTransform = fishTier === 0
            ? 'none'
            : `scale(${mapEffects.scale})`;

        // === 스마트폰 물고기화 효과 ===
        const phoneEffects = {
            // 배경색 변화 (흰색 → 수중 블루)
            bgTint: fishTier === 0 ? 'transparent'
                : fishTier === 1 ? 'rgba(0, 180, 216, 0.03)'
                    : fishTier === 2 ? 'rgba(0, 180, 216, 0.08)'
                        : fishTier === 3 ? 'rgba(0, 150, 199, 0.15)'
                            : 'rgba(0, 119, 182, 0.22)',

            // 폰 테두리 색상
            borderColor: fishTier === 0 ? 'border-gray-300'
                : fishTier === 1 ? 'border-cyan-200'
                    : fishTier === 2 ? 'border-cyan-400/50'
                        : fishTier === 3 ? 'border-teal-500/60'
                            : 'border-blue-600/70',

            // CSS filter for phone container
            filter: fishTier === 0 ? 'none'
                : [
                    fishTier >= 1 ? `hue-rotate(${fishTier * 8}deg)` : '',
                    fishTier >= 2 ? `saturate(${1 + fishTier * 0.1})` : '',
                    fishTier >= 3 ? 'brightness(0.95)' : '',
                ].filter(Boolean).join(' ') || 'none',

            // 물방울 파티클 수
            bubbleCount: fishTier >= 2 ? Math.min(fishTier * 3, 12) : 0,

            // 비늘 패턴 투명도
            scalePatternOpacity: fishTier >= 3 ? Math.min((fishTier - 2) * 0.12, 0.3) : 0,

            // 물결 애니메이션 (border wave)
            waveAnimation: fishTier >= 2,

            // 아이콘 변형 정도
            iconMorphLevel: fishTier,

            // 텍스트 글리치
            textGlitch: fishTier >= 3,

            // 상단 상태바 텍스트 변화
            statusBarText: fishTier === 0 ? '5G'
                : fishTier === 1 ? '5G 🫧'
                    : fishTier === 2 ? '~5G~'
                        : fishTier === 3 ? '🐟G'
                            : '🐟🐟🐟',

            // 배터리 텍스트
            batteryText: fishTier === 0 ? '100%'
                : fishTier === 1 ? '98%'
                    : fishTier === 2 ? '87%'
                        : fishTier === 3 ? '🫧%'
                            : '🐟',

            // 시계 왜곡
            clockDistort: fishTier >= 3,
        };

        // === 채팅 UI 효과 ===
        const chatEffects = {
            // 말풍선 스타일 변형
            bubbleStyle: fishTier === 0 ? 'normal'
                : fishTier <= 2 ? 'slightly-fishy'
                    : 'very-fishy',

            // 타이핑 인디케이터 변형
            thinkingEmoji: fishTier === 0 ? '...'
                : fishTier <= 2 ? '🫧...'
                    : '🐟💭...',
        };

        return {
            fishLevel,
            fishTier,
            waveFilterId,
            mapEffects,
            mapFilter,
            mapTransform,
            phoneEffects,
            chatEffects,
            // 편의 boolean
            hasFishEffect: fishTier > 0,
            isHeavilyFishy: fishTier >= 3,
            isAlmostFish: fishTier >= 4,
        };
    }, [fishLevel, fishTier]);
};

export default useFishVisuals;
