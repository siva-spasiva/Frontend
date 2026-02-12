import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Copy, Check, Move, Maximize2, MousePointer, Eye, EyeOff, Download, Database } from 'lucide-react';

// Import all map backgrounds
const mapImages = import.meta.glob('../assets/map/*.png', { eager: true });

const MAP_LIST = Object.entries(mapImages).map(([path, mod]) => {
    const filename = path.split('/').pop();
    return { filename, src: mod.default, label: filename.replace('.png', '') };
});

const ZONE_TYPES = ['move', 'info', 'item', 'npc', 'trigger'];
const ZONE_COLORS = {
    move: 'rgba(59,130,246,0.4)',   // blue
    info: 'rgba(234,179,8,0.4)',    // yellow
    item: 'rgba(34,197,94,0.4)',    // green
    npc: 'rgba(168,85,247,0.4)',    // purple
    trigger: 'rgba(239,68,68,0.4)', // red
};
const ZONE_BORDER_COLORS = {
    move: '#3b82f6',
    info: '#eab308',
    item: '#22c55e',
    npc: '#a855f7',
    trigger: '#ef4444',
};

const Debug03Scene = ({ onBack }) => {
    const [selectedMap, setSelectedMap] = useState(MAP_LIST[0]);
    const [zones, setZones] = useState([]);
    const [selectedZoneId, setSelectedZoneId] = useState(null);
    const [tool, setTool] = useState('select'); // 'select' | 'draw'
    const [drawingZone, setDrawingZone] = useState(null);
    const [dragging, setDragging] = useState(null); // { zoneId, type: 'move' | 'resize', startX, startY, origZone }
    const [showLabels, setShowLabels] = useState(true);
    const [copied, setCopied] = useState(false);
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);
    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const nextId = useRef(1);

    // ---- Load existing room data from API ----
    const [floorData, setFloorData] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);

    useEffect(() => {
        setLoadingRooms(true);
        fetch('http://localhost:3000/api/data/static')
            .then(res => res.json())
            .then(data => {
                if (data.floorData) setFloorData(data.floorData);
            })
            .catch(err => console.warn('Failed to load floor data:', err))
            .finally(() => setLoadingRooms(false));
    }, []);

    // Build flat room list from floorData
    const roomList = React.useMemo(() => {
        const list = [];
        floorData.forEach(floor => {
            (floor.rooms || []).forEach(room => {
                list.push({
                    id: room.id,
                    label: `${floor.id} / ${room.name || room.id}`,
                    background: room.background, // already resolved (url(...))
                    activeZones: room.activeZones || [],
                });
            });
        });
        return list;
    }, [floorData]);

    const loadRoom = (roomId) => {
        const room = roomList.find(r => r.id === roomId);
        if (!room) return;

        // Match map image by filename in background
        // background is like 'url(/src/assets/map/2F_storage01.png)'
        const bgMatch = room.background?.match(/\/([^/]+\.png)\)?$/);
        if (bgMatch) {
            const matchedMap = MAP_LIST.find(m => m.filename === bgMatch[1]);
            if (matchedMap) setSelectedMap(matchedMap);
        }

        // Load activeZones
        const imported = room.activeZones.map(z => ({
            id: z.id || 'zone_unknown',
            type: z.type || 'info',
            target: z.target || '',
            x: parseFloat(z.x) || 0,
            y: parseFloat(z.y) || 0,
            width: parseFloat(z.width) || 10,
            height: parseFloat(z.height) || 10,
            label: z.label || '',
            message: z.message || '',
            itemId: z.itemId || '',
        }));
        setZones(imported);
        nextId.current = imported.length + 1;
        setSelectedZoneId(null);
    };

    const getRelativePos = useCallback((e) => {
        if (!imgRef.current) return { px: 0, py: 0 };
        const rect = imgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = (x / rect.width) * 100;
        const py = (y / rect.height) * 100;
        return { px: Math.max(0, Math.min(100, px)), py: Math.max(0, Math.min(100, py)) };
    }, []);

    // ---- Drawing ----
    const handleMouseDown = useCallback((e) => {
        if (tool !== 'draw') return;
        e.preventDefault();
        const { px, py } = getRelativePos(e);
        setDrawingZone({ x: px, y: py, w: 0, h: 0 });
        setSelectedZoneId(null);
    }, [tool, getRelativePos]);

    const handleMouseMove = useCallback((e) => {
        if (drawingZone) {
            const { px, py } = getRelativePos(e);
            setDrawingZone(prev => ({
                ...prev,
                w: px - prev.x,
                h: py - prev.y,
            }));
            return;
        }
        if (dragging) {
            e.preventDefault();
            const { px, py } = getRelativePos(e);
            const dx = px - dragging.startPx;
            const dy = py - dragging.startPy;
            const orig = dragging.origZone;

            if (dragging.type === 'move') {
                setZones(prev => prev.map(z =>
                    z.id === dragging.zoneId
                        ? { ...z, x: Math.max(0, Math.min(100 - parseFloat(z.width), orig.x + dx)), y: Math.max(0, Math.min(100 - parseFloat(z.height), orig.y + dy)) }
                        : z
                ));
            } else if (dragging.type === 'resize') {
                const newW = Math.max(1, orig.width + dx);
                const newH = Math.max(1, orig.height + dy);
                setZones(prev => prev.map(z =>
                    z.id === dragging.zoneId
                        ? { ...z, width: Math.min(100 - z.x, newW), height: Math.min(100 - z.y, newH) }
                        : z
                ));
            }
        }
    }, [drawingZone, dragging, getRelativePos]);

    const handleMouseUp = useCallback(() => {
        if (drawingZone) {
            // Normalize negative widths/heights
            let { x, y, w, h } = drawingZone;
            if (w < 0) { x += w; w = -w; }
            if (h < 0) { y += h; h = -h; }
            if (w > 1 && h > 1) {
                const newZone = {
                    id: `zone_${nextId.current++}`,
                    type: 'move',
                    target: '',
                    x: parseFloat(x.toFixed(1)),
                    y: parseFloat(y.toFixed(1)),
                    width: parseFloat(w.toFixed(1)),
                    height: parseFloat(h.toFixed(1)),
                    label: '',
                    message: '',
                };
                setZones(prev => [...prev, newZone]);
                setSelectedZoneId(newZone.id);
                setTool('select');
            }
            setDrawingZone(null);
        }
        if (dragging) {
            setDragging(null);
        }
    }, [drawingZone, dragging]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // ---- Zone interaction ----
    const handleZoneMouseDown = (e, zone, type) => {
        if (tool !== 'select') return;
        e.stopPropagation();
        e.preventDefault();
        setSelectedZoneId(zone.id);
        const { px, py } = getRelativePos(e);
        setDragging({
            zoneId: zone.id,
            type,
            startPx: px,
            startPy: py,
            origZone: { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
        });
    };

    const handleSelectZone = (e, zone) => {
        if (tool !== 'select') return;
        e.stopPropagation();
        setSelectedZoneId(zone.id);
    };

    const updateZone = (id, updates) => {
        setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
    };

    const deleteZone = (id) => {
        setZones(prev => prev.filter(z => z.id !== id));
        if (selectedZoneId === id) setSelectedZoneId(null);
    };

    const selectedZone = zones.find(z => z.id === selectedZoneId);

    // ---- Export ----
    const exportJSON = () => {
        const output = zones.map(z => ({
            id: z.id,
            type: z.type,
            ...(z.type === 'move' ? { target: z.target } : {}),
            x: `${z.x}%`,
            y: `${z.y}%`,
            width: `${z.width}%`,
            height: `${z.height}%`,
            label: z.label,
            message: z.message,
        }));
        const json = JSON.stringify(output, null, 4);
        navigator.clipboard.writeText(json);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ---- Import ----
    const handleImport = () => {
        try {
            const parsed = JSON.parse(importText);
            if (!Array.isArray(parsed)) throw new Error('Not an array');
            const imported = parsed.map((z, i) => ({
                id: z.id || `imported_${i}`,
                type: z.type || 'info',
                target: z.target || '',
                x: parseFloat(z.x) || 0,
                y: parseFloat(z.y) || 0,
                width: parseFloat(z.width) || 10,
                height: parseFloat(z.height) || 10,
                label: z.label || '',
                message: z.message || '',
            }));
            setZones(imported);
            nextId.current = imported.length + 1;
            setShowImport(false);
            setImportText('');
        } catch (err) {
            alert('JSON 파싱 실패: ' + err.message);
        }
    };

    return (
        <div className="w-full h-screen bg-gray-950 flex flex-col text-white overflow-hidden">
            {/* Top Bar */}
            <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 shrink-0 gap-3">
                <button onClick={onBack} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-sm text-gray-300">DEBUG03 — Map Zone Editor</span>
                <div className="w-px h-6 bg-gray-700 mx-1" />

                {/* Map Selector */}
                <select
                    value={selectedMap.filename}
                    onChange={(e) => {
                        const map = MAP_LIST.find(m => m.filename === e.target.value);
                        setSelectedMap(map);
                        setZones([]);
                        setSelectedZoneId(null);
                    }}
                    className="bg-gray-800 text-sm text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    {MAP_LIST.map(m => (
                        <option key={m.filename} value={m.filename}>{m.label}</option>
                    ))}
                </select>

                {/* Room Data Loader */}
                <select
                    onChange={(e) => { if (e.target.value) loadRoom(e.target.value); e.target.value = ''; }}
                    className="bg-gray-800 text-sm text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                    defaultValue=""
                >
                    <option value="" disabled>{loadingRooms ? '로딩중...' : `📂 Room (${roomList.length})`}</option>
                    {roomList.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                </select>
                <div className="w-px h-6 bg-gray-700 mx-1" />

                {/* Tools */}
                <button
                    onClick={() => setTool('select')}
                    className={`p-1.5 rounded-lg transition-colors ${tool === 'select' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                    title="선택 (S)"
                >
                    <MousePointer className="w-4 h-4" />
                </button>
                <button
                    onClick={() => { setTool('draw'); setSelectedZoneId(null); }}
                    className={`p-1.5 rounded-lg transition-colors ${tool === 'draw' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                    title="그리기 (D)"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-700 mx-1" />

                <button
                    onClick={() => setShowLabels(!showLabels)}
                    className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
                    title="라벨 표시 토글"
                >
                    {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <div className="flex-1" />

                {/* Import/Export */}
                <button
                    onClick={() => setShowImport(!showImport)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-700"
                >
                    <Download className="w-3.5 h-3.5" /> Import
                </button>
                <button
                    onClick={exportJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition-colors"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? '복사됨!' : 'Export JSON'}
                </button>
                <span className="text-xs text-gray-500 ml-2">{zones.length}개 존</span>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <div
                    ref={containerRef}
                    className="flex-1 flex items-center justify-center bg-gray-950 p-4 overflow-auto"
                >
                    <div
                        className="relative select-none"
                        style={{ cursor: tool === 'draw' ? 'crosshair' : 'default' }}
                        onMouseDown={handleMouseDown}
                    >
                        <img
                            ref={imgRef}
                            src={selectedMap.src}
                            alt={selectedMap.label}
                            className="max-h-[calc(100vh-7rem)] w-auto block"
                            draggable={false}
                        />

                        {/* Existing Zones */}
                        {zones.map(zone => {
                            const isSelected = zone.id === selectedZoneId;
                            return (
                                <div
                                    key={zone.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${zone.x}%`,
                                        top: `${zone.y}%`,
                                        width: `${zone.width}%`,
                                        height: `${zone.height}%`,
                                        backgroundColor: ZONE_COLORS[zone.type] || 'rgba(255,255,255,0.2)',
                                        border: `2px ${isSelected ? 'solid' : 'dashed'} ${ZONE_BORDER_COLORS[zone.type] || '#fff'}`,
                                        boxShadow: isSelected ? `0 0 0 2px ${ZONE_BORDER_COLORS[zone.type]}40, 0 0 12px ${ZONE_BORDER_COLORS[zone.type]}30` : 'none',
                                        cursor: tool === 'select' ? 'move' : 'crosshair',
                                        zIndex: isSelected ? 20 : 10,
                                    }}
                                    onMouseDown={(e) => handleZoneMouseDown(e, zone, 'move')}
                                    onClick={(e) => handleSelectZone(e, zone)}
                                >
                                    {/* Label */}
                                    {showLabels && (
                                        <div className="absolute -top-5 left-0 text-[10px] font-mono font-bold px-1 rounded whitespace-nowrap"
                                            style={{ backgroundColor: ZONE_BORDER_COLORS[zone.type], color: '#fff' }}
                                        >
                                            {zone.label || zone.id} ({zone.type})
                                        </div>
                                    )}
                                    {/* Coordinates */}
                                    {isSelected && showLabels && (
                                        <div className="absolute bottom-0 right-0 text-[9px] font-mono bg-black/80 text-gray-300 px-1 rounded-tl">
                                            {zone.x.toFixed(1)}%, {zone.y.toFixed(1)}% | {zone.width.toFixed(1)}×{zone.height.toFixed(1)}
                                        </div>
                                    )}
                                    {/* Resize Handle */}
                                    {isSelected && tool === 'select' && (
                                        <div
                                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm cursor-se-resize"
                                            style={{ backgroundColor: ZONE_BORDER_COLORS[zone.type], border: '1px solid white' }}
                                            onMouseDown={(e) => handleZoneMouseDown(e, zone, 'resize')}
                                        />
                                    )}
                                </div>
                            );
                        })}

                        {/* Currently Drawing Zone */}
                        {drawingZone && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${Math.min(drawingZone.x, drawingZone.x + drawingZone.w)}%`,
                                    top: `${Math.min(drawingZone.y, drawingZone.y + drawingZone.h)}%`,
                                    width: `${Math.abs(drawingZone.w)}%`,
                                    height: `${Math.abs(drawingZone.h)}%`,
                                    backgroundColor: 'rgba(59,130,246,0.3)',
                                    border: '2px solid #3b82f6',
                                    zIndex: 30,
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Properties Panel */}
                <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto">
                    {selectedZone ? (
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-200">Zone Properties</h3>
                                <button
                                    onClick={() => deleteZone(selectedZone.id)}
                                    className="p-1 hover:bg-red-600/20 text-red-400 rounded transition-colors"
                                    title="삭제"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* ID */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">ID</label>
                                <input
                                    value={selectedZone.id}
                                    onChange={(e) => updateZone(selectedZone.id, { id: e.target.value })}
                                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Type</label>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                    {ZONE_TYPES.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => updateZone(selectedZone.id, { type: t })}
                                            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${selectedZone.type === t
                                                ? 'text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                            style={selectedZone.type === t ? { backgroundColor: ZONE_BORDER_COLORS[t] } : {}}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target (for move type) */}
                            {selectedZone.type === 'move' && (
                                <div>
                                    <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Target Room</label>
                                    <input
                                        value={selectedZone.target}
                                        onChange={(e) => updateZone(selectedZone.id, { target: e.target.value })}
                                        placeholder="예: main_hall"
                                        className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            {/* Label */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Label</label>
                                <input
                                    value={selectedZone.label}
                                    onChange={(e) => updateZone(selectedZone.id, { label: e.target.value })}
                                    placeholder="표시 라벨"
                                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Message</label>
                                <textarea
                                    value={selectedZone.message}
                                    onChange={(e) => updateZone(selectedZone.id, { message: e.target.value })}
                                    placeholder="상호작용 메시지"
                                    rows={2}
                                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            {/* Position & Size */}
                            <div>
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Position & Size (%)</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div>
                                        <span className="text-[10px] text-gray-600">X</span>
                                        <input
                                            type="number"
                                            value={selectedZone.x}
                                            onChange={(e) => updateZone(selectedZone.id, { x: parseFloat(e.target.value) || 0 })}
                                            step="0.5"
                                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-600">Y</span>
                                        <input
                                            type="number"
                                            value={selectedZone.y}
                                            onChange={(e) => updateZone(selectedZone.id, { y: parseFloat(e.target.value) || 0 })}
                                            step="0.5"
                                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-600">Width</span>
                                        <input
                                            type="number"
                                            value={selectedZone.width}
                                            onChange={(e) => updateZone(selectedZone.id, { width: parseFloat(e.target.value) || 1 })}
                                            step="0.5"
                                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-600">Height</span>
                                        <input
                                            type="number"
                                            value={selectedZone.height}
                                            onChange={(e) => updateZone(selectedZone.id, { height: parseFloat(e.target.value) || 1 })}
                                            step="0.5"
                                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Preview */}
                            <div className="mt-2 p-2 bg-gray-800 rounded-lg">
                                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">JSON Preview</label>
                                <pre className="text-[10px] text-gray-400 font-mono mt-1 whitespace-pre-wrap break-all">
                                    {JSON.stringify({
                                        id: selectedZone.id,
                                        type: selectedZone.type,
                                        ...(selectedZone.type === 'move' ? { target: selectedZone.target } : {}),
                                        x: `${selectedZone.x}%`,
                                        y: `${selectedZone.y}%`,
                                        width: `${selectedZone.width}%`,
                                        height: `${selectedZone.height}%`,
                                        label: selectedZone.label,
                                        message: selectedZone.message,
                                    }, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-600 text-sm mt-8">
                            <MousePointer className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                            <p className="font-medium text-gray-500">존을 선택하거나</p>
                            <p className="font-medium text-gray-500">그리기 도구로 새로 만드세요</p>
                            <div className="mt-6 text-left space-y-2 text-xs text-gray-600">
                                <p><kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">D</kbd> 그리기 모드</p>
                                <p><kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">S</kbd> 선택 모드</p>
                                <p><kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">Del</kbd> 선택 존 삭제</p>
                            </div>
                        </div>
                    )}

                    {/* Zone List */}
                    <div className="border-t border-gray-800 p-3 mt-auto">
                        <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">All Zones ({zones.length})</h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {zones.map(z => (
                                <button
                                    key={z.id}
                                    onClick={() => setSelectedZoneId(z.id)}
                                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors ${z.id === selectedZoneId
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: ZONE_BORDER_COLORS[z.type] }} />
                                    <span className="truncate font-mono">{z.label || z.id}</span>
                                    <span className="text-gray-600 ml-auto text-[10px]">{z.type}</span>
                                </button>
                            ))}
                            {zones.length === 0 && (
                                <p className="text-gray-700 text-xs text-center py-2">존 없음</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            <AnimatePresence>
                {showImport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                        onClick={() => setShowImport(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[500px] max-w-[90vw]"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="font-bold text-lg mb-3">Import activeZones JSON</h3>
                            <textarea
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                                placeholder={'[\n    { "id": "zone_1", "type": "move", ... }\n]'}
                                rows={10}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => setShowImport(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">취소</button>
                                <button onClick={handleImport} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Import</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard Shortcuts */}
            <KeyboardShortcuts
                onDraw={() => { setTool('draw'); setSelectedZoneId(null); }}
                onSelect={() => setTool('select')}
                onDelete={() => selectedZoneId && deleteZone(selectedZoneId)}
            />
        </div>
    );
};

// Keyboard shortcuts handler
const KeyboardShortcuts = ({ onDraw, onSelect, onDelete }) => {
    useEffect(() => {
        const handler = (e) => {
            // Skip if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === 'd' || e.key === 'D') onDraw();
            if (e.key === 's' || e.key === 'S') onSelect();
            if (e.key === 'Delete' || e.key === 'Backspace') onDelete();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onDraw, onSelect, onDelete]);
    return null;
};

export default Debug03Scene;
