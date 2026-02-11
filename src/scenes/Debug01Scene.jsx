import React from 'react';
import { useGame } from '../context/GameContext';
import { ChevronRight, MapPin, Clock, User, Calendar } from 'lucide-react';

const PERIOD_COLORS = {
    morning: 'bg-amber-500',
    afternoon: 'bg-orange-500',
    evening: 'bg-indigo-600',
};

const Debug01Scene = ({ onBack }) => {
    const {
        npcData,
        scheduleData,
        currentDay,
        currentPeriod,
        PERIOD_LABELS,
        PERIOD_ORDER,
        PERIOD_CLOCK,
        setDay,
        setPeriod,
        advancePeriod,
        getNpcsForRoom,
        floorData,
    } = useGame();

    // Build flat room list from floorData
    const allRooms = (floorData || []).flatMap(floor =>
        (floor.rooms || []).map(room => ({
            ...room,
            floorId: floor.id,
            floorName: floor.name,
        }))
    );

    // Get NPC location for a given day+period
    const getNpcLocationFromSchedule = (npcId, day, period) => {
        if (!scheduleData?.[npcId]) return null;
        const npcSchedule = scheduleData[npcId];
        const daySchedule = npcSchedule[day] ?? npcSchedule.default;
        if (!daySchedule) return null;
        return daySchedule[period] ?? null;
    };

    // Current location for all NPCs
    const npcEntries = npcData ? Object.entries(npcData) : [];

    const dayLabel = currentDay === 0 ? 'Tutorial' : `Day ${currentDay}`;

    return (
        <div className="relative w-full h-screen bg-gray-950 text-white overflow-hidden font-mono">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onBack}
                            className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded shadow-lg transition-all text-sm"
                        >
                            EXIT
                        </button>
                        <h1 className="text-lg font-bold text-yellow-400">DEBUG 01 — NPC Schedule Viewer</h1>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-yellow-300 font-bold">{dayLabel}</span>
                        <span className="text-gray-600">|</span>
                        <Clock className="w-4 h-4" />
                        <span className="text-yellow-300 font-bold">{PERIOD_LABELS?.[currentPeriod]} ({PERIOD_CLOCK?.[currentPeriod]})</span>
                    </div>
                </div>
            </div>

            {/* Controls + Content */}
            <div className="h-[calc(100vh-73px)] overflow-y-auto">
                {/* Day / Period Control Bar */}
                <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-3">
                    <div className="flex items-center space-x-6">
                        {/* Day */}
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 font-bold w-8">DAY</span>
                            <div className="flex gap-1">
                                {[0, 1, 2, 3, 4, 5, 6, 7].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDay(d)}
                                        className={`w-8 h-8 text-xs rounded font-mono transition-all ${currentDay === d
                                            ? 'bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/30'
                                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                            }`}
                                    >
                                        {d === 0 ? 'T' : d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Period */}
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 font-bold w-12">TIME</span>
                            <div className="flex gap-1">
                                {PERIOD_ORDER.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-3 h-8 text-xs rounded transition-all ${currentPeriod === p
                                            ? `${PERIOD_COLORS[p]} text-white font-bold shadow-lg`
                                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                            }`}
                                    >
                                        {PERIOD_LABELS?.[p]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advance */}
                        <button
                            onClick={advancePeriod}
                            className="px-4 h-8 bg-yellow-600/80 hover:bg-yellow-500 text-white text-xs font-bold rounded flex items-center space-x-1 transition-all"
                        >
                            <span>다음</span>
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* ═══ Section 1: NPC Overview ═══ */}
                    <section>
                        <h2 className="text-sm font-bold text-green-400 mb-4 flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>NPC 현재 위치 — {dayLabel} / {PERIOD_LABELS?.[currentPeriod]}</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {npcEntries.map(([npcId, npc]) => {
                                const currentRoom = getNpcLocationFromSchedule(npcId, currentDay, currentPeriod);
                                const roomInfo = currentRoom ? allRooms.find(r => r.id === currentRoom) : null;

                                return (
                                    <div
                                        key={npcId}
                                        className={`p-4 rounded-xl border transition-all ${currentRoom
                                            ? 'bg-white/5 border-white/15 hover:bg-white/10'
                                            : 'bg-black/30 border-white/5 opacity-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${currentRoom ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                                                <span className="font-bold text-sm">{npc.name}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-mono">{npcId}</span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {currentRoom ? (
                                                <div className="flex items-center space-x-1">
                                                    <MapPin className="w-3 h-3 text-blue-400" />
                                                    <span className="text-blue-300">{roomInfo?.floorId || ''} {roomInfo?.name || currentRoom}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 italic">부재 (맵에 없음)</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ═══ Section 2: Full Schedule Table ═══ */}
                    <section>
                        <h2 className="text-sm font-bold text-purple-400 mb-4 flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>전체 스케줄 테이블</span>
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-2 px-3 text-gray-500 font-bold w-28">NPC</th>
                                        {[0, 1, 2, 3, 4, 5, 6, 7].map(d => (
                                            <th key={d} colSpan={3} className={`text-center py-2 px-1 font-bold ${currentDay === d ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-500'}`}>
                                                {d === 0 ? 'Tut' : `D${d}`}
                                            </th>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-white/10">
                                        <th className="py-1 px-3"></th>
                                        {[0, 1, 2, 3, 4, 5, 6, 7].map(d => (
                                            PERIOD_ORDER.map(p => (
                                                <th
                                                    key={`${d}-${p}`}
                                                    className={`text-center py-1 px-1 text-[9px] ${currentDay === d && currentPeriod === p
                                                        ? 'text-yellow-300 bg-yellow-500/20 font-bold'
                                                        : 'text-gray-600'
                                                        }`}
                                                >
                                                    {p === 'morning' ? '朝' : p === 'afternoon' ? '午' : '夕'}
                                                </th>
                                            ))
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {npcEntries.map(([npcId, npc]) => (
                                        <tr key={npcId} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-2 px-3 font-bold text-gray-300 whitespace-nowrap">{npc.name}</td>
                                            {[0, 1, 2, 3, 4, 5, 6, 7].map(d =>
                                                PERIOD_ORDER.map(p => {
                                                    const loc = getNpcLocationFromSchedule(npcId, d, p);
                                                    const isCurrent = currentDay === d && currentPeriod === p;
                                                    const room = loc ? allRooms.find(r => r.id === loc) : null;
                                                    const displayName = room ? (room.name.length > 4 ? room.name.substring(0, 4) : room.name) : null;

                                                    return (
                                                        <td
                                                            key={`${d}-${p}`}
                                                            className={`text-center py-2 px-0.5 text-[9px] font-mono ${isCurrent ? 'bg-yellow-500/20' : ''}`}
                                                            title={loc ? `${room?.floorId || ''} ${room?.name || loc}` : '부재'}
                                                        >
                                                            {loc ? (
                                                                <span className={`inline-block px-1 py-0.5 rounded ${isCurrent ? 'bg-green-600/50 text-green-200' : 'bg-white/10 text-gray-400'}`}>
                                                                    {displayName || loc.substring(0, 5)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-700">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ═══ Section 3: Room Occupancy ═══ */}
                    <section>
                        <h2 className="text-sm font-bold text-cyan-400 mb-4 flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>방별 NPC 현황 — {dayLabel} / {PERIOD_LABELS?.[currentPeriod]}</span>
                        </h2>
                        <div className="space-y-3">
                            {(floorData || []).map(floor => {
                                const roomsWithNpcs = floor.rooms.filter(room => {
                                    const npcs = getNpcsForRoom(room.id);
                                    return npcs.length > 0;
                                });

                                if (roomsWithNpcs.length === 0) return null;

                                return (
                                    <div key={floor.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                        <div className="px-4 py-2 bg-white/5 border-b border-white/10">
                                            <span className="text-xs font-bold text-gray-300">{floor.id} — {floor.name}</span>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {roomsWithNpcs.map(room => {
                                                const npcs = getNpcsForRoom(room.id);
                                                return (
                                                    <div key={room.id} className="flex items-center justify-between px-3 py-2 bg-black/30 rounded-lg">
                                                        <div className="flex items-center space-x-2">
                                                            <MapPin className="w-3 h-3 text-cyan-400" />
                                                            <span className="text-xs text-gray-300">{room.name}</span>
                                                            <span className="text-[10px] text-gray-600 font-mono">({room.id})</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            {npcs.map(npcId => (
                                                                <span key={npcId} className="px-2 py-0.5 bg-green-600/30 text-green-300 text-[10px] rounded-full border border-green-500/30">
                                                                    {npcData?.[npcId]?.name || npcId}
                                                                </span>
                                                            ))}
                                                            {npcs.length > 1 && (
                                                                <span className="px-1.5 py-0.5 bg-red-600/30 text-red-300 text-[9px] rounded-full border border-red-500/30">
                                                                    ×{npcs.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Debug01Scene;
