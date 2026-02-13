import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Plus, Trash2, Copy, Check, Move, Maximize2, MousePointer, Eye, EyeOff,
    Download, Database, Save, FolderOpen, Link2, Unlink, Image, Grid3X3, ChevronDown,
    ChevronRight, Settings, AlertCircle, RefreshCw, Map
} from 'lucide-react';

// ─── Constants ───
const mapImages = import.meta.glob('../assets/map/*.png', { eager: true });
const MAP_LIST = Object.entries(mapImages).map(([path, mod]) => {
    const filename = path.split('/').pop();
    return { filename, src: mod.default, label: filename.replace('.png', '') };
});

const ZONE_TYPES = ['move', 'info', 'item', 'item_dot', 'npc', 'trigger', 'inspect'];
const ZONE_COLORS = {
    move: 'rgba(59,130,246,0.35)', info: 'rgba(234,179,8,0.35)', item: 'rgba(34,197,94,0.35)',
    item_dot: 'rgba(251,191,36,0.35)', npc: 'rgba(168,85,247,0.35)', trigger: 'rgba(239,68,68,0.35)',
    inspect: 'rgba(236,72,153,0.35)',
};
const ZONE_BORDER = {
    move: '#3b82f6', info: '#eab308', item: '#22c55e', item_dot: '#fbbf24',
    npc: '#a855f7', trigger: '#ef4444', inspect: '#ec4899',
};
const API_BASE = 'http://localhost:3000/api';

// ─── Aspect Ratio Container ───
const AspectContainer = ({ children, imgRef, className = '' }) => {
    const wrapperRef = useRef(null);
    const [dims, setDims] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const update = () => {
            if (!wrapperRef.current || !imgRef?.current) return;
            const img = imgRef.current;
            if (!img.naturalWidth) return;
            const ratio = img.naturalWidth / img.naturalHeight;
            const parent = wrapperRef.current;
            let w = parent.clientWidth, h = w / ratio;
            if (h > parent.clientHeight) { h = parent.clientHeight; w = h * ratio; }
            setDims({ width: Math.floor(w), height: Math.floor(h) });
        };
        update();
        const obs = new ResizeObserver(update);
        if (wrapperRef.current) obs.observe(wrapperRef.current);
        window.addEventListener('load', update);
        return () => { obs.disconnect(); window.removeEventListener('load', update); };
    }, [imgRef]);

    return (
        <div ref={wrapperRef} className={`w-full h-full flex items-center justify-center ${className}`}>
            <div className="relative" style={{ width: dims.width || '100%', height: dims.height || '100%' }}>
                {children}
            </div>
        </div>
    );
};

// ─── Main Component ───
const Debug03Scene = ({ onBack }) => {
    // === State ===
    const [floors, setFloors] = useState([]);
    const [selectedFloorId, setSelectedFloorId] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [zones, setZones] = useState([]);
    const [selectedZoneId, setSelectedZoneId] = useState(null);
    const [tool, setTool] = useState('select');
    const [drawingZone, setDrawingZone] = useState(null);
    const [dragging, setDragging] = useState(null);
    const [showLabels, setShowLabels] = useState(true);
    const [showGrid, setShowGrid] = useState(false);
    const [showConnections, setShowConnections] = useState(true);
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [dirty, setDirty] = useState(false);
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [activePanel, setActivePanel] = useState('room'); // 'room' | 'zone' | 'connections'
    const [expandedFloors, setExpandedFloors] = useState({});

    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const nextId = useRef(1);

    // === Data ===
    const selectedFloor = floors.find(f => f.id === selectedFloorId);
    const selectedRoom = selectedFloor?.rooms?.find(r => r.id === selectedRoomId);
    const selectedZone = zones.find(z => z.id === selectedZoneId);

    const currentMapSrc = useMemo(() => {
        if (!selectedRoom?.background) return null;
        const bg = selectedRoom.background;
        const match = MAP_LIST.find(m => m.filename === bg);
        return match?.src || null;
    }, [selectedRoom]);

    // All rooms flat list
    const allRooms = useMemo(() => {
        const list = [];
        floors.forEach(f => (f.rooms || []).forEach(r => list.push({ ...r, floorId: f.id, floorName: f.name })));
        return list;
    }, [floors]);

    // Connection graph: which rooms link to this room
    const connectionMap = useMemo(() => {
        const map = {};
        allRooms.forEach(room => {
            (room.activeZones || []).forEach(z => {
                if (z.type === 'move' && z.target) {
                    if (!map[room.id]) map[room.id] = [];
                    map[room.id].push({ zoneId: z.id, targetRoomId: z.target, label: z.label });
                }
            });
        });
        return map;
    }, [allRooms]);

    // === API ===
    const loadFloors = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/editor/floors`);
            const data = await res.json();
            if (data.floorData) {
                setFloors(data.floorData);
                setDirty(false);
                // Auto-expand all
                const exp = {};
                data.floorData.forEach(f => { exp[f.id] = true; });
                setExpandedFloors(exp);
            }
        } catch (err) { console.error('Load failed:', err); }
    }, []);

    const saveAll = useCallback(async () => {
        setSaving(true);
        setSaveMsg('');
        // Sync current zones back into floors before saving
        const updated = syncZonesToFloors();
        try {
            const res = await fetch(`${API_BASE}/editor/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ floorData: updated }),
            });
            const data = await res.json();
            if (data.success) {
                setSaveMsg(`저장 완료 (${data.roomCount}개 방)`);
                setDirty(false);
            } else {
                setSaveMsg('저장 실패: ' + (data.error || ''));
            }
        } catch (err) { setSaveMsg('저장 오류: ' + err.message); }
        setSaving(false);
        setTimeout(() => setSaveMsg(''), 3000);
    }, [floors, zones, selectedRoomId]);

    // Sync zones state back to floors
    const syncZonesToFloors = useCallback(() => {
        if (!selectedRoomId) return floors;
        return floors.map(f => ({
            ...f,
            rooms: (f.rooms || []).map(r => r.id === selectedRoomId ? { ...r, activeZones: zones } : r),
        }));
    }, [floors, zones, selectedRoomId]);

    useEffect(() => { loadFloors(); }, []);

    // When selecting a room, load its zones
    useEffect(() => {
        if (!selectedRoom) { setZones([]); return; }
        const imported = (selectedRoom.activeZones || []).map(z => ({
            id: z.id || 'zone_unknown', type: z.type || 'info', target: z.target || '',
            x: parseFloat(z.x) || 0, y: parseFloat(z.y) || 0,
            width: parseFloat(z.width) || 10, height: parseFloat(z.height) || 10,
            label: z.label || '', message: z.message || '', itemId: z.itemId || '',
        }));
        setZones(imported);
        nextId.current = imported.length + 1;
        setSelectedZoneId(null);
        setActivePanel('room');
    }, [selectedRoomId, selectedFloorId]);

    // Save zones back to current room in floors when zones change
    useEffect(() => {
        if (!selectedRoomId || zones.length === 0) return;
        setFloors(prev => prev.map(f => ({
            ...f,
            rooms: (f.rooms || []).map(r => r.id === selectedRoomId ? { ...r, activeZones: zones } : r),
        })));
        setDirty(true);
    }, [zones]);

    // === Mouse Handlers ===
    const getRelativePos = useCallback((e) => {
        if (!imgRef.current) return { px: 0, py: 0 };
        const rect = imgRef.current.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        return { px: Math.max(0, Math.min(100, px)), py: Math.max(0, Math.min(100, py)) };
    }, []);

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
            setDrawingZone(prev => ({ ...prev, w: px - prev.x, h: py - prev.y }));
            return;
        }
        if (dragging) {
            e.preventDefault();
            const { px, py } = getRelativePos(e);
            const dx = px - dragging.startPx, dy = py - dragging.startPy;
            const orig = dragging.origZone;
            if (dragging.type === 'move') {
                setZones(prev => prev.map(z => z.id === dragging.zoneId
                    ? { ...z, x: Math.max(0, Math.min(100 - z.width, orig.x + dx)), y: Math.max(0, Math.min(100 - z.height, orig.y + dy)) } : z));
            } else if (dragging.type === 'resize') {
                setZones(prev => prev.map(z => z.id === dragging.zoneId
                    ? { ...z, width: Math.min(100 - z.x, Math.max(1, orig.width + dx)), height: Math.min(100 - z.y, Math.max(1, orig.height + dy)) } : z));
            }
        }
    }, [drawingZone, dragging, getRelativePos]);

    const handleMouseUp = useCallback(() => {
        if (drawingZone) {
            let { x, y, w, h } = drawingZone;
            if (w < 0) { x += w; w = -w; }
            if (h < 0) { y += h; h = -h; }
            if (w > 1 && h > 1) {
                const newZone = {
                    id: `zone_${nextId.current++}`, type: 'move', target: '',
                    x: +x.toFixed(1), y: +y.toFixed(1), width: +w.toFixed(1), height: +h.toFixed(1),
                    label: '', message: '', itemId: '',
                };
                setZones(prev => [...prev, newZone]);
                setSelectedZoneId(newZone.id);
                setTool('select');
                setActivePanel('zone');
            }
            setDrawingZone(null);
        }
        if (dragging) setDragging(null);
    }, [drawingZone, dragging]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [handleMouseMove, handleMouseUp]);

    // === Zone Operations ===
    const handleZoneMouseDown = (e, zone, type) => {
        if (tool !== 'select') return;
        e.stopPropagation(); e.preventDefault();
        setSelectedZoneId(zone.id);
        setActivePanel('zone');
        const { px, py } = getRelativePos(e);
        setDragging({ zoneId: zone.id, type, startPx: px, startPy: py, origZone: { x: zone.x, y: zone.y, width: zone.width, height: zone.height } });
    };

    const updateZone = (id, updates) => { setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z)); };
    const deleteZone = (id) => { setZones(prev => prev.filter(z => z.id !== id)); if (selectedZoneId === id) setSelectedZoneId(null); };

    // === Room/Floor Operations ===
    const addFloor = () => {
        const id = `FLOOR_${floors.length + 1}`;
        setFloors(prev => [...prev, { id, name: '새 층', description: '', rooms: [] }]);
        setSelectedFloorId(id);
        setExpandedFloors(prev => ({ ...prev, [id]: true }));
        setDirty(true);
    };

    const addRoom = (floorId) => {
        const floor = floors.find(f => f.id === floorId);
        if (!floor) return;
        const roomId = `room_${Date.now().toString(36)}`;
        setFloors(prev => prev.map(f => f.id === floorId ? { ...f, rooms: [...(f.rooms || []), { id: roomId, name: '새 방', background: null, activeZones: [], description: '' }] } : f));
        setSelectedFloorId(floorId);
        setSelectedRoomId(roomId);
        setDirty(true);
    };

    const deleteRoom = (floorId, roomId) => {
        if (!confirm(`"${roomId}" 방을 삭제하시겠습니까?`)) return;
        setFloors(prev => prev.map(f => f.id === floorId ? { ...f, rooms: f.rooms.filter(r => r.id !== roomId) } : f));
        if (selectedRoomId === roomId) { setSelectedRoomId(null); setZones([]); }
        setDirty(true);
    };

    const deleteFloor = (floorId) => {
        if (!confirm(`"${floorId}" 층 전체를 삭제하시겠습니까?`)) return;
        setFloors(prev => prev.filter(f => f.id !== floorId));
        if (selectedFloorId === floorId) { setSelectedFloorId(null); setSelectedRoomId(null); }
        setDirty(true);
    };

    const updateRoom = (updates) => {
        if (!selectedRoomId || !selectedFloorId) return;
        setFloors(prev => prev.map(f => f.id === selectedFloorId
            ? { ...f, rooms: f.rooms.map(r => r.id === selectedRoomId ? { ...r, ...updates } : r) } : f
        ));
        setDirty(true);
    };

    const updateFloor = (floorId, updates) => {
        setFloors(prev => prev.map(f => f.id === floorId ? { ...f, ...updates } : f));
        setDirty(true);
    };

    // === Export ===
    const exportJSON = () => {
        const output = zones.map(z => ({
            id: z.id, type: z.type,
            ...(z.type === 'move' ? { target: z.target } : {}),
            ...(z.itemId ? { itemId: z.itemId } : {}),
            x: `${z.x}%`, y: `${z.y}%`, width: `${z.width}%`, height: `${z.height}%`,
            label: z.label, message: z.message,
        }));
        navigator.clipboard.writeText(JSON.stringify(output, null, 4));
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const handleImport = () => {
        try {
            const parsed = JSON.parse(importText);
            if (!Array.isArray(parsed)) throw new Error('Not array');
            const imported = parsed.map((z, i) => ({
                id: z.id || `imp_${i}`, type: z.type || 'info', target: z.target || '',
                x: parseFloat(z.x) || 0, y: parseFloat(z.y) || 0,
                width: parseFloat(z.width) || 10, height: parseFloat(z.height) || 10,
                label: z.label || '', message: z.message || '', itemId: z.itemId || '',
            }));
            setZones(imported);
            nextId.current = imported.length + 1;
            setShowImport(false); setImportText('');
        } catch (err) { alert('JSON 파싱 실패: ' + err.message); }
    };

    // Incoming connections to selected room
    const incomingConnections = useMemo(() => {
        if (!selectedRoomId) return [];
        const list = [];
        allRooms.forEach(room => {
            (room.activeZones || []).forEach(z => {
                if (z.type === 'move' && (z.target === selectedRoomId || z.target === selectedRoom?.id)) {
                    list.push({ fromRoom: room.id, fromFloor: room.floorId, zoneLabel: z.label || z.id });
                }
            });
        });
        return list;
    }, [selectedRoomId, allRooms]);

    // ─── RENDER ───
    return (
        <div className="w-full h-screen bg-gray-950 flex flex-col text-white overflow-hidden">
            {/* Top Bar */}
            <div className="h-11 bg-gray-900/95 border-b border-gray-800 flex items-center px-3 shrink-0 gap-2">
                <button onClick={onBack} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <Map className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm text-gray-300">맵 에디터</span>
                {dirty && <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">수정됨</span>}
                <div className="w-px h-5 bg-gray-700 mx-1" />

                {/* Tools */}
                <button onClick={() => setTool('select')} className={`p-1.5 rounded-lg transition-colors ${tool === 'select' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`} title="선택 (S)">
                    <MousePointer className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setTool('draw'); setSelectedZoneId(null); }} className={`p-1.5 rounded-lg transition-colors ${tool === 'draw' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`} title="그리기 (D)">
                    <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-5 bg-gray-700 mx-1" />
                <button onClick={() => setShowLabels(!showLabels)} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="라벨 토글">
                    {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg transition-colors ${showGrid ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-400'}`} title="그리드 토글">
                    <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowConnections(!showConnections)} className={`p-1.5 rounded-lg transition-colors ${showConnections ? 'bg-blue-600/50 text-blue-300' : 'hover:bg-gray-700 text-gray-400'}`} title="연결 표시">
                    <Link2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1" />

                {/* Import/Export/Save */}
                <button onClick={() => setShowImport(!showImport)} className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-[11px] font-medium transition-colors border border-gray-700">
                    <Download className="w-3 h-3" /> Import
                </button>
                <button onClick={exportJSON} className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-[11px] font-medium transition-colors border border-gray-700">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? '복사됨' : 'Export'}
                </button>
                <button onClick={saveAll} disabled={saving} className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 disabled:bg-green-800 rounded-lg text-[11px] font-bold transition-colors">
                    {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {saving ? '저장중...' : '전체 저장'}
                </button>
                {saveMsg && <span className="text-[10px] text-green-300 ml-1">{saveMsg}</span>}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Floor/Room Tree */}
                <div className="w-56 bg-gray-900/80 border-r border-gray-800 flex flex-col shrink-0 overflow-y-auto">
                    <div className="p-2 flex items-center justify-between border-b border-gray-800">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">층 / 방 목록</span>
                        <button onClick={addFloor} className="p-1 hover:bg-gray-700 rounded text-blue-400 transition-colors" title="새 층 추가"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1">
                        {floors.map(floor => (
                            <div key={floor.id} className="mb-0.5">
                                <div className={`flex items-center gap-1 px-1.5 py-1 rounded cursor-pointer text-[11px] group ${selectedFloorId === floor.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/60'}`}
                                    onClick={() => { setExpandedFloors(prev => ({ ...prev, [floor.id]: !prev[floor.id] })); setSelectedFloorId(floor.id); }}>
                                    {expandedFloors[floor.id] ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                                    <span className="font-bold truncate flex-1">{floor.id}</span>
                                    <span className="text-[9px] text-gray-600">{floor.rooms?.length || 0}</span>
                                    <button onClick={(e) => { e.stopPropagation(); addRoom(floor.id); }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded transition-all"><Plus className="w-2.5 h-2.5 text-green-400" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteFloor(floor.id); }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded transition-all"><Trash2 className="w-2.5 h-2.5 text-red-400" /></button>
                                </div>
                                {expandedFloors[floor.id] && (floor.rooms || []).map(room => (
                                    <div key={room.id} className={`flex items-center gap-1.5 pl-5 pr-1.5 py-1 rounded cursor-pointer text-[11px] group ${selectedRoomId === room.id ? 'bg-blue-600/30 text-blue-200' : 'text-gray-500 hover:bg-gray-800/40'}`}
                                        onClick={() => { setSelectedFloorId(floor.id); setSelectedRoomId(room.id); }}>
                                        {room.background ? <Image className="w-2.5 h-2.5 text-green-500 shrink-0" /> : <AlertCircle className="w-2.5 h-2.5 text-gray-700 shrink-0" />}
                                        <span className="truncate flex-1">{room.name || room.id}</span>
                                        <span className="text-[9px] text-gray-600">{room.activeZones?.length || 0}</span>
                                        <button onClick={(e) => { e.stopPropagation(); deleteRoom(floor.id, room.id); }} className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded transition-all"><Trash2 className="w-2.5 h-2.5 text-red-400" /></button>
                                    </div>
                                ))}
                            </div>
                        ))}
                        {floors.length === 0 && <p className="text-gray-700 text-xs text-center py-4">데이터 없음</p>}
                    </div>
                </div>

                {/* Canvas Area */}
                <div ref={containerRef} className="flex-1 bg-gray-950 p-2 overflow-hidden flex items-center justify-center">
                    {currentMapSrc ? (
                        <div className="relative select-none w-full h-full flex items-center justify-center" style={{ cursor: tool === 'draw' ? 'crosshair' : 'default' }} onMouseDown={handleMouseDown}>
                            <div className="relative" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
                                <img ref={imgRef} src={currentMapSrc} alt={selectedRoom?.name} className="max-h-[calc(100vh-5rem)] w-auto block" draggable={false}
                                    onLoad={() => { /* force re-render */ }} />

                                {/* Grid Overlay */}
                                {showGrid && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(v => (
                                            <React.Fragment key={v}>
                                                <div className="absolute" style={{ left: `${v}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.06)' }} />
                                                <div className="absolute" style={{ top: `${v}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                                            </React.Fragment>
                                        ))}
                                        {/* 25% / 50% / 75% stronger lines */}
                                        {[25, 50, 75].map(v => (
                                            <React.Fragment key={`strong-${v}`}>
                                                <div className="absolute" style={{ left: `${v}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.15)' }} />
                                                <div className="absolute" style={{ top: `${v}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.15)' }} />
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}

                                {/* Zones */}
                                {zones.map(zone => {
                                    const isSelected = zone.id === selectedZoneId;
                                    const isMoveZone = zone.type === 'move';
                                    return (
                                        <div key={zone.id} style={{
                                            position: 'absolute', left: `${zone.x}%`, top: `${zone.y}%`,
                                            width: `${zone.width}%`, height: `${zone.height}%`,
                                            backgroundColor: ZONE_COLORS[zone.type] || 'rgba(255,255,255,0.2)',
                                            border: `2px ${isSelected ? 'solid' : 'dashed'} ${ZONE_BORDER[zone.type] || '#fff'}`,
                                            boxShadow: isSelected ? `0 0 0 2px ${ZONE_BORDER[zone.type]}40, 0 0 12px ${ZONE_BORDER[zone.type]}30` : 'none',
                                            cursor: tool === 'select' ? 'move' : 'crosshair', zIndex: isSelected ? 20 : 10,
                                        }}
                                            onMouseDown={(e) => handleZoneMouseDown(e, zone, 'move')}
                                            onClick={(e) => { if (tool === 'select') { e.stopPropagation(); setSelectedZoneId(zone.id); setActivePanel('zone'); } }}>
                                            {showLabels && (
                                                <div className="absolute -top-5 left-0 text-[10px] font-mono font-bold px-1 rounded whitespace-nowrap flex items-center gap-0.5"
                                                    style={{ backgroundColor: ZONE_BORDER[zone.type], color: '#fff' }}>
                                                    {isMoveZone && showConnections && <Link2 className="w-2.5 h-2.5" />}
                                                    {zone.label || zone.id}
                                                    {isMoveZone && zone.target && <span className="opacity-70 ml-0.5">→{zone.target}</span>}
                                                </div>
                                            )}
                                            {isSelected && showLabels && (
                                                <div className="absolute bottom-0 right-0 text-[9px] font-mono bg-black/80 text-gray-300 px-1 rounded-tl">
                                                    {zone.x.toFixed(1)}%, {zone.y.toFixed(1)}% | {zone.width.toFixed(1)}×{zone.height.toFixed(1)}
                                                </div>
                                            )}
                                            {isSelected && tool === 'select' && (
                                                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm cursor-se-resize"
                                                    style={{ backgroundColor: ZONE_BORDER[zone.type], border: '1px solid white' }}
                                                    onMouseDown={(e) => handleZoneMouseDown(e, zone, 'resize')} />
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Drawing Zone */}
                                {drawingZone && (
                                    <div style={{
                                        position: 'absolute', left: `${Math.min(drawingZone.x, drawingZone.x + drawingZone.w)}%`,
                                        top: `${Math.min(drawingZone.y, drawingZone.y + drawingZone.h)}%`,
                                        width: `${Math.abs(drawingZone.w)}%`, height: `${Math.abs(drawingZone.h)}%`,
                                        backgroundColor: 'rgba(59,130,246,0.3)', border: '2px solid #3b82f6', zIndex: 30, pointerEvents: 'none',
                                    }} />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600">
                            <Map className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                            <p className="text-sm font-medium">방을 선택하거나</p>
                            <p className="text-sm">배경 이미지를 설정하세요</p>
                            {selectedRoom && !selectedRoom.background && (
                                <p className="text-xs text-yellow-500 mt-2">⚠ 선택된 방에 배경 이미지가 없습니다</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel */}
                <div className="w-72 bg-gray-900/80 border-l border-gray-800 flex flex-col shrink-0">
                    {/* Panel Tabs */}
                    <div className="flex border-b border-gray-800 text-[11px]">
                        {[['room', '방 설정'], ['zone', '존 속성'], ['connections', '연결']].map(([key, label]) => (
                            <button key={key} onClick={() => setActivePanel(key)}
                                className={`flex-1 py-2 font-medium transition-colors ${activePanel === key ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Room Settings Panel */}
                        {activePanel === 'room' && selectedRoom && (
                            <div className="p-3 space-y-3">
                                <h3 className="text-xs font-bold text-gray-300">방 설정</h3>
                                <div><label className="text-[10px] text-gray-500 uppercase">Room ID</label>
                                    <input value={selectedRoom.id} onChange={e => updateRoom({ id: e.target.value })}
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                <div><label className="text-[10px] text-gray-500 uppercase">이름</label>
                                    <input value={selectedRoom.name || ''} onChange={e => updateRoom({ name: e.target.value })}
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                <div><label className="text-[10px] text-gray-500 uppercase">이름 접두사</label>
                                    <input value={selectedRoom.namePrefix || ''} onChange={e => updateRoom({ namePrefix: e.target.value })}
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                <div><label className="text-[10px] text-gray-500 uppercase">설명</label>
                                    <textarea value={selectedRoom.description || ''} onChange={e => updateRoom({ description: e.target.value })} rows={2}
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                <div><label className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Image className="w-3 h-3" /> 배경 이미지</label>
                                    <select value={selectedRoom.background || ''} onChange={e => updateRoom({ background: e.target.value || null })}
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                                        <option value="">없음</option>
                                        {MAP_LIST.map(m => <option key={m.filename} value={m.filename}>{m.label}</option>)}
                                    </select></div>
                                <div><label className="text-[10px] text-gray-500 uppercase">오버레이 색상</label>
                                    <input value={selectedRoom.overlayColor || ''} onChange={e => updateRoom({ overlayColor: e.target.value })} placeholder="bg-black/20"
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[10px] text-gray-500 uppercase">하이라이트</label>
                                        <input value={selectedRoom.highlightText || ''} onChange={e => updateRoom({ highlightText: e.target.value })}
                                            className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                    <div><label className="text-[10px] text-gray-500 uppercase">색상</label>
                                        <input value={selectedRoom.highlightColor || ''} onChange={e => updateRoom({ highlightColor: e.target.value })} placeholder="text-blue-300"
                                            className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                </div>
                                <div><label className="text-[10px] text-gray-500 uppercase">NPC ID</label>
                                    <input value={selectedRoom.npcId || ''} onChange={e => updateRoom({ npcId: e.target.value || undefined })} placeholder="npc_a"
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                            </div>
                        )}

                        {/* Zone Properties Panel */}
                        {activePanel === 'zone' && selectedZone && (
                            <div className="p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-300">존 속성</h3>
                                    <button onClick={() => deleteZone(selectedZone.id)} className="p-1 hover:bg-red-600/20 text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                                <div><label className="text-[10px] text-gray-500 uppercase">ID</label>
                                    <input value={selectedZone.id} onChange={e => updateZone(selectedZone.id, { id: e.target.value })}
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                <div><label className="text-[10px] text-gray-500 uppercase">Type</label>
                                    <div className="flex gap-1 mt-0.5 flex-wrap">
                                        {ZONE_TYPES.map(t => (
                                            <button key={t} onClick={() => updateZone(selectedZone.id, { type: t })}
                                                className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${selectedZone.type === t ? 'text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                                style={selectedZone.type === t ? { backgroundColor: ZONE_BORDER[t] } : {}}>{t}</button>
                                        ))}
                                    </div></div>
                                {selectedZone.type === 'move' && (
                                    <div><label className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Link2 className="w-3 h-3" />Target Room</label>
                                        <select value={selectedZone.target} onChange={e => updateZone(selectedZone.id, { target: e.target.value })}
                                            className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                                            <option value="">선택...</option>
                                            {allRooms.map(r => <option key={r.id} value={r.id}>{r.floorId} / {r.name || r.id}</option>)}
                                        </select></div>
                                )}
                                {(selectedZone.type === 'item' || selectedZone.type === 'item_dot' || selectedZone.type === 'inspect') && (
                                    <div><label className="text-[10px] text-gray-500 uppercase">Item ID</label>
                                        <input value={selectedZone.itemId || ''} onChange={e => updateZone(selectedZone.id, { itemId: e.target.value })} placeholder="item010"
                                            className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                )}
                                <div><label className="text-[10px] text-gray-500 uppercase">Label</label>
                                    <input value={selectedZone.label} onChange={e => updateZone(selectedZone.id, { label: e.target.value })}
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                <div><label className="text-[10px] text-gray-500 uppercase">Message</label>
                                    <textarea value={selectedZone.message} onChange={e => updateZone(selectedZone.id, { message: e.target.value })} rows={2}
                                        className="w-full mt-0.5 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                <div><label className="text-[10px] text-gray-500 uppercase">Position & Size (%)</label>
                                    <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                                        {[['X', 'x'], ['Y', 'y'], ['W', 'width'], ['H', 'height']].map(([lbl, key]) => (
                                            <div key={key}><span className="text-[9px] text-gray-600">{lbl}</span>
                                                <input type="number" value={selectedZone[key]} step="0.5"
                                                    onChange={e => updateZone(selectedZone.id, { [key]: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[11px] text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
                                        ))}
                                    </div></div>
                            </div>
                        )}
                        {activePanel === 'zone' && !selectedZone && (
                            <div className="p-4 text-center text-gray-600 text-xs mt-6">
                                <MousePointer className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                                <p>존을 선택하거나 그리기 도구로 새로 만드세요</p>
                            </div>
                        )}

                        {/* Connections Panel */}
                        {activePanel === 'connections' && selectedRoom && (
                            <div className="p-3 space-y-3">
                                <h3 className="text-xs font-bold text-gray-300">연결 관리 — {selectedRoom.name || selectedRoom.id}</h3>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase mb-1 block">→ 나가는 연결 (이 방에서)</label>
                                    {zones.filter(z => z.type === 'move' && z.target).length === 0
                                        ? <p className="text-[11px] text-gray-600">연결 없음</p>
                                        : zones.filter(z => z.type === 'move' && z.target).map(z => (
                                            <div key={z.id} className="flex items-center gap-1.5 py-1 px-2 bg-gray-800/50 rounded mb-1 text-[11px] cursor-pointer hover:bg-gray-800"
                                                onClick={() => { setSelectedZoneId(z.id); setActivePanel('zone'); }}>
                                                <Link2 className="w-3 h-3 text-blue-400 shrink-0" />
                                                <span className="text-gray-300 truncate">{z.label || z.id}</span>
                                                <span className="text-blue-400">→</span>
                                                <span className="text-gray-400 truncate font-mono">{z.target}</span>
                                            </div>
                                        ))}
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase mb-1 block">← 들어오는 연결 (이 방으로)</label>
                                    {incomingConnections.length === 0
                                        ? <p className="text-[11px] text-gray-600">연결 없음</p>
                                        : incomingConnections.map((c, i) => (
                                            <div key={i} className="flex items-center gap-1.5 py-1 px-2 bg-gray-800/50 rounded mb-1 text-[11px] cursor-pointer hover:bg-gray-800"
                                                onClick={() => { const room = allRooms.find(r => r.id === c.fromRoom); if (room) { setSelectedFloorId(room.floorId); setSelectedRoomId(room.id); } }}>
                                                <span className="text-gray-400 truncate font-mono">{c.fromRoom}</span>
                                                <span className="text-green-400">→</span>
                                                <span className="text-gray-300 truncate">{c.zoneLabel}</span>
                                                <span className="text-[9px] text-gray-600">({c.fromFloor})</span>
                                            </div>
                                        ))}
                                </div>
                                <div className="border-t border-gray-800 pt-2 mt-2">
                                    <label className="text-[10px] text-gray-500 uppercase mb-1 block">빠른 추가: 되돌아가기 존</label>
                                    <select onChange={e => {
                                        if (!e.target.value) return;
                                        const targetRoom = allRooms.find(r => r.id === e.target.value);
                                        const newZone = {
                                            id: `back_to_${e.target.value}`, type: 'move', target: e.target.value,
                                            x: 5, y: 30, width: 10, height: 40,
                                            label: targetRoom?.name || e.target.value, message: `${targetRoom?.name || e.target.value}(으)로 돌아간다.`, itemId: '',
                                        };
                                        setZones(prev => [...prev, newZone]);
                                        e.target.value = '';
                                    }} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500" defaultValue="">
                                        <option value="" disabled>대상 방 선택...</option>
                                        {allRooms.filter(r => r.id !== selectedRoomId).map(r => (
                                            <option key={r.id} value={r.id}>{r.floorId} / {r.name || r.id}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        {activePanel === 'connections' && !selectedRoom && (
                            <div className="p-4 text-center text-gray-600 text-xs mt-6"><Link2 className="w-6 h-6 mx-auto mb-2 text-gray-700" /><p>방을 선택하면 연결을 관리할 수 있습니다</p></div>
                        )}
                        {activePanel === 'room' && !selectedRoom && (
                            <div className="p-4 text-center text-gray-600 text-xs mt-6"><Settings className="w-6 h-6 mx-auto mb-2 text-gray-700" /><p>왼쪽에서 방을 선택하세요</p></div>
                        )}
                    </div>

                    {/* Zone List (bottom) */}
                    <div className="border-t border-gray-800 p-2 shrink-0">
                        <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Zones ({zones.length})</h4>
                        <div className="space-y-0.5 max-h-32 overflow-y-auto">
                            {zones.map(z => (
                                <button key={z.id} onClick={() => { setSelectedZoneId(z.id); setActivePanel('zone'); }}
                                    className={`w-full text-left px-1.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-colors ${z.id === selectedZoneId ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: ZONE_BORDER[z.type] }} />
                                    <span className="truncate font-mono flex-1">{z.label || z.id}</span>
                                    {z.type === 'move' && z.target && <Link2 className="w-2.5 h-2.5 text-blue-400 shrink-0" />}
                                    <span className="text-gray-600 text-[9px]">{z.type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            <AnimatePresence>
                {showImport && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-[500px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-base mb-2">Import activeZones JSON</h3>
                            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder={'[\n    { "id": "zone_1", ... }\n]'} rows={8}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => setShowImport(false)} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">취소</button>
                                <button onClick={handleImport} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">Import</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard Shortcuts */}
            <KeyboardShortcuts onDraw={() => { setTool('draw'); setSelectedZoneId(null); }} onSelect={() => setTool('select')}
                onDelete={() => selectedZoneId && deleteZone(selectedZoneId)} onSave={() => saveAll()} />
        </div>
    );
};

// Keyboard shortcuts
const KeyboardShortcuts = ({ onDraw, onSelect, onDelete, onSave }) => {
    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === 'd' || e.key === 'D') onDraw();
            if (e.key === 's' || e.key === 'S') { if (e.ctrlKey) { e.preventDefault(); onSave(); } else { onSelect(); } }
            if (e.key === 'Delete' || e.key === 'Backspace') onDelete();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onDraw, onSelect, onDelete, onSave]);
    return null;
};

export default Debug03Scene;
