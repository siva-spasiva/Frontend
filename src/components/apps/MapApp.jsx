import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Map, Navigation, MapPin, Lock } from 'lucide-react';
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

const RoomItem = ({ room, onSelect, isCurrentRoom }) => {
    // Legacy lock logic removed. All rooms displayed are potentially interactive.
    // Logic for "can I go there?" should be handled by the onSelect callback or separate state.

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(room)}
            className={`rounded-xl p-4 mb-3 border flex items-center justify-between relative overflow-hidden transition-all duration-300 ${isCurrentRoom
                ? 'bg-blue-100 border-blue-400 shadow-md ring-2 ring-blue-200'
                : 'bg-blue-50 border-blue-200 shadow-sm cursor-pointer'}`}
        >
            <div className="z-0">
                <h4 className={`text-base font-bold flex items-center text-blue-900`}>
                    {room.name}
                    {isCurrentRoom && <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">HERE</span>}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{room.description}</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md z-0 ${isCurrentRoom ? 'bg-blue-600' : 'bg-blue-500'}`}>
                {isCurrentRoom ? <MapPin className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
            </div>
        </motion.div>
    );
};

const MapApp = ({ onNavigate, onBack, currentFloorId, currentRoomId }) => {
    const { floorData } = useGame();

    // Directly find the current floor data
    const currentFloor = floorData ? floorData.find(f => f.id === currentFloorId) : null;

    const handleRoomSelect = (room) => {
        // Just bubble up the room ID. The parent should handle logic.
        // We can check if it's "interactive" if we had that data, 
        // but for now we assume all rooms are clickable, and parent decides if it goes somewhere.
        onNavigate(room.id);
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
                    <button
                        onClick={onBack}
                        className="p-1 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center">
                        <Map className="w-5 h-5 mr-2 text-blue-600" />
                        {currentFloor ? currentFloor.name : 'UNKNOWN SECTOR'}
                    </h1>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide z-0">
                <AnimatePresence mode="wait">
                    {currentFloor ? (
                        // Room List View (Always Visible)
                        <motion.div
                            key="room-list"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className={`mb-4 text-sm font-medium p-4 rounded-xl border bg-blue-100 border-blue-300 text-blue-900`}>
                                <div className="flex justify-between items-start">
                                    <span>{currentFloor.description}</span>
                                    <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 whitespace-nowrap">Current Floor</span>
                                </div>
                            </div>

                            {/* Map Image Display */}
                            {currentFloor.mapImage && (
                                <div className="mb-6 rounded-xl overflow-hidden shadow-lg border-2 border-white/50 ring-1 ring-gray-200 bg-black/5">
                                    <img
                                        src={currentFloor.mapImage}
                                        alt={`${currentFloor.name} Map`}
                                        className="w-full h-auto object-contain bg-gray-100/50"
                                    />
                                </div>
                            )}

                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Sector List</h2>
                            {currentFloor.rooms.map(room => (
                                <RoomItem
                                    key={room.id}
                                    room={room}
                                    onSelect={handleRoomSelect}
                                    isCurrentRoom={room.id === currentRoomId}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No map data available.
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Decoration */}
            <div className="h-6 bg-gradient-to-t from-gray-200 to-transparent pointer-events-none sticky bottom-0" />
        </div>
    );
};

export default MapApp;
