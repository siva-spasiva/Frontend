import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Map, Navigation, MapPin } from 'lucide-react';
import { useGame } from '../../context/GameContext';

const FloorItem = ({ floor, onSelect, isCurrent }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(floor)}
        className={`rounded-2xl p-4 shadow-sm border mb-3 cursor-pointer relative overflow-hidden ${isCurrent
            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
            : 'bg-white/90 backdrop-blur-sm border-gray-100'
            }`}
    >
        {isCurrent && (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl shadow-sm z-10 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                Current
            </div>
        )}
        <div className="flex items-center justify-between relative z-0">
            <div>
                <h3 className={`text-lg font-bold ${isCurrent ? 'text-blue-900' : 'text-gray-900'}`}>{floor.id}</h3>
                <p className="text-xs text-blue-600 font-semibold">{floor.name.split(': ')[1]}</p>
            </div>
            <div className="text-right">
                <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>{floor.description}</p>
            </div>
        </div>
    </motion.div>
);

const RoomItem = ({ room, onSelect, isCurrentFloor }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(room)}
        className={`rounded-xl p-4 mb-3 border cursor-pointer flex items-center justify-between ${room.linkedScene
            ? 'bg-blue-50 border-blue-200 shadow-sm'
            : 'bg-gray-50/80 border-gray-200 opacity-80'
            }`}
    >
        <div>
            <h4 className={`text-base font-bold ${room.linkedScene ? 'text-blue-900' : 'text-gray-700'}`}>
                {room.name}
            </h4>
            <p className="text-xs text-gray-500 mt-1">{room.description}</p>
        </div>
        {room.linkedScene && (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md">
                <Navigation className="w-4 h-4" />
            </div>
        )}
    </motion.div>
);

const MapApp = ({ onNavigate, onBack, currentFloorId }) => {
    const { floorData } = useGame();

    // Auto-select current floor on mount or when data loads
    const [selectedFloor, setSelectedFloor] = useState(null);

    useEffect(() => {
        if (floorData && floorData.length > 0) {
            const current = floorData.find(f => f.id === currentFloorId);
            // Only set if we don't have a selection yet
            if (current && selectedFloor === null) {
                setSelectedFloor(current);
            }
        }
    }, [floorData, currentFloorId]);

    const handleRoomSelect = (room) => {
        if (room.linkedScene) {
            onNavigate(room.linkedScene);
        } else {
            // Placeholder feedback
            alert(`${room.name}: 접근 권한이 없거나 구현되지 않은 구역입니다.`);
        }
    };

    return (
        <div className="w-full h-full bg-gray-50 flex flex-col relative overflow-hidden font-sans">
            {/* Dynamic Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Header */}
            <div className="pt-12 px-6 pb-4 bg-white/80 backdrop-blur-md z-10 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {selectedFloor ? (
                        <button
                            onClick={() => setSelectedFloor(null)}
                            className="p-1 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                    ) : (
                        <button
                            onClick={onBack}
                            className="p-1 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                    )}
                    <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center">
                        <Map className="w-5 h-5 mr-2 text-blue-600" />
                        {selectedFloor ? selectedFloor.name : 'MAIN MAP'}
                    </h1>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide z-0">
                <AnimatePresence mode="wait">
                    {!selectedFloor ? (
                        // Floor List View
                        <motion.div
                            key="floor-list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Floor</h2>
                                {floorData && floorData.map(floor => (
                                    <FloorItem
                                        key={floor.id}
                                        floor={floor}
                                        onSelect={setSelectedFloor}
                                        isCurrent={floor.id === currentFloorId}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        // Room List View
                        <motion.div
                            key="room-list"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className={`mb-4 text-sm font-medium p-4 rounded-xl border ${selectedFloor.id === currentFloorId ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                <div className="flex justify-between items-start">
                                    <span>{selectedFloor.description}</span>
                                    {selectedFloor.id === currentFloorId && (
                                        <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 whitespace-nowrap">Current Floor</span>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Sector List</h2>
                            {selectedFloor.rooms.map(room => (
                                <RoomItem
                                    key={room.id}
                                    room={room}
                                    onSelect={handleRoomSelect}
                                    isCurrentFloor={selectedFloor.id === currentFloorId}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Decoration */}
            <div className="h-6 bg-gradient-to-t from-gray-200 to-transparent pointer-events-none sticky bottom-0" />
        </div>
    );
};

export default MapApp;
