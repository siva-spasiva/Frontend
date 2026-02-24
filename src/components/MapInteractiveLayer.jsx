import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, DoorOpen, Package, BedDouble } from 'lucide-react';

const MapInteractiveLayer = ({ mapInfo, onInteract, highlightCondition, isInteractionLocked = false }) => {
    const [hoveredZone, setHoveredZone] = useState(null);
    const effectiveHoveredZone = isInteractionLocked ? null : hoveredZone;

    if (!mapInfo || !mapInfo.activeZones) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'move': return <DoorOpen className="w-6 h-6 text-white" />;
            case 'item': return <Package className="w-6 h-6 text-yellow-400" />;
            case 'npc': return <MapPin className="w-6 h-6 text-blue-400" />;
            case 'rest': return <BedDouble className="w-6 h-6 text-emerald-400" />;
            default: return <Search className="w-6 h-6 text-gray-200" />;
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {mapInfo.activeZones.map((zone) => (
                <Motion.div
                    key={zone.id}
                    className={`absolute ${isInteractionLocked ? 'cursor-default pointer-events-none' : 'cursor-pointer pointer-events-auto group'}`}
                    style={{
                        left: `${zone.x}%`,
                        top: `${zone.y}%`,
                        width: `${zone.width}%`,
                        height: `${zone.height}%`,
                    }}
                    onMouseEnter={() => !isInteractionLocked && setHoveredZone(zone.id)}
                    onMouseLeave={() => !isInteractionLocked && setHoveredZone(null)}
                    onClick={() => !isInteractionLocked && onInteract(zone)}
                >
                    {/* Visual Debug / Highlight */}
                    {zone.type === 'item_dot' ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <Motion.div
                                animate={{
                                    opacity: [0.7, 1, 0.7],
                                    scale: [1, 1.15, 1]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                                style={{ willChange: 'transform, opacity' }}
                            />
                        </div>
                    ) : (
                        <Motion.div
                            animate={highlightCondition && highlightCondition(zone) ? {
                                boxShadow: ["0px 0px 0px rgba(251,191,36,0)", "0px 0px 15px rgba(251,191,36,0.6)", "0px 0px 0px rgba(251,191,36,0)"]
                            } : {}}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className={`w-full h-full border-2 rounded-lg transition-colors duration-300 flex items-center justify-center
                            ${highlightCondition && highlightCondition(zone) ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : (effectiveHoveredZone === zone.id ? 'border-white/50 bg-white/10 border-dashed' : 'border-dashed border-transparent')}
                        `}>
                            {/* Icon Indicator (Shows on hover or always if move type or highlighted) */}
                            <AnimatePresence>
                                {(effectiveHoveredZone === zone.id || zone.type === 'move' || (highlightCondition && highlightCondition(zone))) && (
                                    <Motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className={`${highlightCondition && highlightCondition(zone) ? 'bg-yellow-500' : 'bg-black/60'} backdrop-blur-md p-2 rounded-full shadow-lg`}
                                    >
                                        {getIcon(zone.type)}
                                    </Motion.div>
                                )}
                            </AnimatePresence>
                        </Motion.div>
                    )}

                    {/* Label Tooltip */}
                    <AnimatePresence>
                        {effectiveHoveredZone === zone.id && (
                            <Motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 10, opacity: 0 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+24px)] bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-20"
                            >
                                {zone.label}
                            </Motion.div>
                        )}
                    </AnimatePresence>
                </Motion.div>
            ))}
        </div>
    );
};

export default MapInteractiveLayer;
