import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, DoorOpen, Package } from 'lucide-react';

const MapInteractiveLayer = ({ mapInfo, onInteract }) => {
    const [hoveredZone, setHoveredZone] = useState(null);

    if (!mapInfo || !mapInfo.activeZones) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'move': return <DoorOpen className="w-6 h-6 text-white" />;
            case 'item': return <Package className="w-6 h-6 text-yellow-400" />;
            case 'npc': return <MapPin className="w-6 h-6 text-blue-400" />;
            default: return <Search className="w-6 h-6 text-gray-200" />;
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            {mapInfo.activeZones.map((zone) => (
                <motion.div
                    key={zone.id}
                    className="absolute cursor-pointer pointer-events-auto group"
                    style={{
                        left: zone.x,
                        top: zone.y,
                        width: zone.width,
                        height: zone.height,
                    }}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                    onClick={() => onInteract(zone)}
                >
                    {/* Visual Debug / Highlight */}
                    {zone.type === 'item_dot' ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <motion.div
                                animate={{
                                    boxShadow: ['0 0 5px #fbbf24', '0 0 15px #fbbf24', '0 0 5px #fbbf24'],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-4 h-4 bg-yellow-400 rounded-full"
                            />
                        </div>
                    ) : (
                        <div className={`w-full h-full border-2 border-dashed rounded-lg transition-colors duration-300 flex items-center justify-center
                            ${hoveredZone === zone.id ? 'border-white/50 bg-white/10' : 'border-transparent'}
                        `}>
                            {/* Icon Indicator (Shows on hover or always if critical) */}
                            <AnimatePresence>
                                {hoveredZone === zone.id && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="bg-black/60 backdrop-blur-md p-2 rounded-full shadow-lg"
                                    >
                                        {getIcon(zone.type)}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Label Tooltip */}
                    <AnimatePresence>
                        {hoveredZone === zone.id && (
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 10, opacity: 0 }}
                                className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none"
                            >
                                {zone.label}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
};

export default MapInteractiveLayer;
