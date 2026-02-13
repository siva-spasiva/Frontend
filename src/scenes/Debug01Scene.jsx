import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, User, Calendar, Clock, MapPin, ChevronRight, ChevronDown, Save, RefreshCw,
    Plus, Trash2, Package, FileText, Edit3, Eye, Shield, Heart, Fish, Star, Zap, AlertCircle,
    Check, Search
} from 'lucide-react';
import { useGame } from '../context/GameContext';

const API = 'http://localhost:3000/api';
const PERIODS = ['morning', 'afternoon', 'evening'];
const PERIOD_LBL = { morning: '아침', afternoon: '오후', evening: '저녁' };
const PERIOD_CLR = { morning: 'bg-amber-500', afternoon: 'bg-orange-500', evening: 'bg-indigo-600' };
const TABS = [
    { key: 'overview', icon: User, label: 'NPC 목록' },
    { key: 'schedule', icon: Calendar, label: '일정 관리' },
    { key: 'prompt', icon: FileText, label: '프롬프트' },
    { key: 'items', icon: Package, label: '아이템' },
];
const STAT_ICONS = { friendly: Heart, faith: Shield, fishLevel: Fish };
const STAT_COLORS = { friendly: 'text-pink-400', faith: 'text-blue-400', fishLevel: 'text-cyan-400' };

const Debug01Scene = ({ onBack }) => {
    const { currentDay, currentPeriod, PERIOD_LABELS, PERIOD_ORDER, PERIOD_CLOCK, setDay, setPeriod, advancePeriod, floorData } = useGame();

    const [tab, setTab] = useState('overview');
    const [npcs, setNpcs] = useState({});
    const [prompts, setPrompts] = useState({});
    const [schedule, setSchedule] = useState({});
    const [items, setItems] = useState({});
    const [selectedNpc, setSelectedNpc] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [dirty, setDirty] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null); // { key, text }
    const [promptSaving, setPromptSaving] = useState(false);
    const [searchText, setSearchText] = useState('');

    const allRooms = useMemo(() => (floorData || []).flatMap(f => (f.rooms || []).map(r => ({ ...r, floorId: f.id }))), [floorData]);
    const npcList = useMemo(() => Object.entries(npcs), [npcs]);
    const npcObj = selectedNpc ? npcs[selectedNpc] : null;

    // Load data
    const loadData = useCallback(async () => {
        try {
            const res = await fetch(`${API}/editor/npcs`);
            const data = await res.json();
            setNpcs(data.npcs || {});
            setPrompts(data.prompts || {});
            setSchedule(data.schedule || {});
            setItems(data.items || {});
            setDirty(false);
        } catch (err) { console.error('Load NPC data failed:', err); }
    }, []);

    useEffect(() => { loadData(); }, []);

    // Save schedule
    const saveSchedule = useCallback(async () => {
        setSaving(true); setSaveMsg('');
        try {
            const res = await fetch(`${API}/editor/npc/schedule`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule }),
            });
            const data = await res.json();
            setSaveMsg(data.success ? '스케줄 저장 완료' : '실패: ' + data.error);
            if (data.success) setDirty(false);
        } catch (err) { setSaveMsg('오류: ' + err.message); }
        setSaving(false);
        setTimeout(() => setSaveMsg(''), 3000);
    }, [schedule]);

    // Save prompt
    const savePrompt = useCallback(async () => {
        if (!editingPrompt) return;
        setPromptSaving(true);
        try {
            const res = await fetch(`${API}/editor/npc/prompt`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promptKey: editingPrompt.key, promptText: editingPrompt.text }),
            });
            const data = await res.json();
            if (data.success) {
                setPrompts(prev => ({ ...prev, [editingPrompt.key]: editingPrompt.text }));
                setSaveMsg('프롬프트 저장 완료');
                setTimeout(() => setSaveMsg(''), 3000);
            }
        } catch (err) { console.error(err); }
        setPromptSaving(false);
    }, [editingPrompt]);

    // Schedule update helper
    const updateScheduleCell = (npcId, day, period, roomId) => {
        setSchedule(prev => {
            const npcSch = { ...(prev[npcId] || {}) };
            const dayKey = day === 'default' ? 'default' : parseInt(day);
            npcSch[dayKey] = { ...(npcSch[dayKey] || {}), [period]: roomId || null };
            return { ...prev, [npcId]: npcSch };
        });
        setDirty(true);
    };

    // Add new NPC schedule slot
    const addNpcToSchedule = (npcId) => {
        if (schedule[npcId]) return;
        setSchedule(prev => ({
            ...prev, [npcId]: { default: { morning: null, afternoon: null, evening: null } }
        }));
        setDirty(true);
    };

    // Get NPC location
    const getNpcLoc = (npcId, day, period) => {
        const sch = schedule[npcId];
        if (!sch) return null;
        const daySch = sch[day] ?? sch.default;
        return daySch?.[period] ?? null;
    };

    const dayLabel = currentDay === 0 ? 'Tutorial' : `Day ${currentDay}`;

    // ─── RENDER ───
    return (
        <div className="w-full h-screen bg-gray-950 flex flex-col text-white overflow-hidden font-sans">
            {/* Top Bar */}
            <div className="h-11 bg-gray-900/95 border-b border-gray-800 flex items-center px-3 shrink-0 gap-2">
                <button onClick={onBack} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <User className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-gray-300">NPC 관리</span>
                {dirty && <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">수정됨</span>}
                <div className="flex-1" />
                {/* Time display */}
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mr-2">
                    <Calendar className="w-3 h-3" /><span className="text-yellow-300 font-bold">{dayLabel}</span>
                    <span className="text-gray-600">|</span>
                    <Clock className="w-3 h-3" /><span className="text-yellow-300 font-bold">{PERIOD_LABELS?.[currentPeriod]}</span>
                </div>
                <button onClick={saveSchedule} disabled={saving}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 disabled:bg-green-800 rounded-lg text-[11px] font-bold transition-colors">
                    {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {saving ? '저장중...' : '저장'}
                </button>
                {saveMsg && <span className="text-[10px] text-green-300 ml-1">{saveMsg}</span>}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Tab Bar + NPC List */}
                <div className="w-56 bg-gray-900/80 border-r border-gray-800 flex flex-col shrink-0">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-800">
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} title={t.label}
                                className={`flex-1 py-2.5 flex justify-center transition-colors ${tab === t.key ? 'text-purple-400 bg-gray-800/60 border-b-2 border-purple-400' : 'text-gray-600 hover:text-gray-400'}`}>
                                <t.icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>

                    {/* NPC List */}
                    <div className="p-2 border-b border-gray-800">
                        <div className="relative">
                            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
                            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="NPC 검색..."
                                className="w-full bg-gray-800/60 border border-gray-700 rounded pl-6 pr-2 py-1 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1">
                        {npcList.filter(([id, n]) => !searchText || (n.name || id).toLowerCase().includes(searchText.toLowerCase())).map(([id, npc]) => {
                            const loc = getNpcLoc(id, currentDay, currentPeriod);
                            const room = loc ? allRooms.find(r => r.id === loc) : null;
                            return (
                                <button key={id} onClick={() => { setSelectedNpc(id); }}
                                    className={`w-full text-left px-2 py-2 rounded-lg mb-0.5 transition-all ${selectedNpc === id ? 'bg-purple-600/20 border border-purple-500/30' : 'hover:bg-gray-800/60 border border-transparent'}`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${loc ? 'bg-green-400' : 'bg-gray-700'}`} />
                                        <span className="font-bold text-[12px] truncate">{npc.name || id}</span>
                                        <span className="text-[9px] text-gray-600 font-mono ml-auto">{id}</span>
                                    </div>
                                    {loc && room && <div className="text-[10px] text-gray-500 ml-4 mt-0.5 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{room.floorId} {room.name}</div>}
                                    {npc.initialStats && (
                                        <div className="flex gap-2 mt-1 ml-4">
                                            {Object.entries(npc.initialStats).map(([k, v]) => {
                                                const Icon = STAT_ICONS[k] || Zap;
                                                return <span key={k} className={`text-[9px] flex items-center gap-0.5 ${STAT_COLORS[k] || 'text-gray-500'}`}><Icon className="w-2.5 h-2.5" />{v}</span>;
                                            })}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* ═══ TAB: Overview ═══ */}
                    {tab === 'overview' && (
                        <div className="p-4">
                            {npcObj ? (
                                <NpcDetailPanel npc={npcObj} npcId={selectedNpc} items={items} prompts={prompts}
                                    schedule={schedule[selectedNpc]} allRooms={allRooms}
                                    currentDay={currentDay} currentPeriod={currentPeriod}
                                    onEditPrompt={(key) => { setEditingPrompt({ key, text: prompts[key] || '' }); setTab('prompt'); }} />
                            ) : (
                                <div className="flex items-center justify-center h-64 text-gray-600"><User className="w-8 h-8 mr-2" /><span>왼쪽에서 NPC를 선택하세요</span></div>
                            )}
                        </div>
                    )}

                    {/* ═══ TAB: Schedule ═══ */}
                    {tab === 'schedule' && (
                        <div className="p-4">
                            {/* Time Controls */}
                            <div className="flex items-center gap-4 mb-4 bg-gray-900/60 rounded-xl p-3 border border-gray-800">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gray-500 font-bold w-8">DAY</span>
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map(d => (
                                        <button key={d} onClick={() => setDay(d)}
                                            className={`w-7 h-7 text-[11px] rounded font-mono transition-all ${currentDay === d ? 'bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/30' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                                            {d === 0 ? 'T' : d}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gray-500 font-bold w-10">TIME</span>
                                    {PERIODS.map(p => (
                                        <button key={p} onClick={() => setPeriod(p)}
                                            className={`px-2.5 h-7 text-[11px] rounded transition-all ${currentPeriod === p ? `${PERIOD_CLR[p]} text-white font-bold` : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
                                            {PERIOD_LBL[p]}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={advancePeriod} className="ml-auto px-3 h-7 bg-yellow-600/80 hover:bg-yellow-500 text-white text-[11px] font-bold rounded flex items-center gap-1 transition-all">
                                    다음<ChevronRight className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Schedule Table */}
                            <div className="overflow-x-auto rounded-xl border border-gray-800">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/80">
                                            <th className="text-left py-2 px-3 text-gray-500 font-bold w-28 sticky left-0 bg-gray-900/95 z-10">NPC</th>
                                            <th colSpan={3} className="text-center py-2 px-1 text-gray-500 font-bold border-l border-gray-800">Default</th>
                                            {[0, 1, 2, 3, 4, 5, 6, 7].map(d => (
                                                <th key={d} colSpan={3} className={`text-center py-2 px-1 font-bold border-l border-gray-800 ${currentDay === d ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-500'}`}>
                                                    {d === 0 ? 'Tut' : `D${d}`}
                                                </th>
                                            ))}
                                        </tr>
                                        <tr className="bg-gray-900/60 border-b border-gray-800">
                                            <th className="sticky left-0 bg-gray-900/95 z-10"></th>
                                            {['default', 0, 1, 2, 3, 4, 5, 6, 7].map(d => PERIODS.map(p => (
                                                <th key={`${d}-${p}`} className={`text-center py-1 px-0.5 text-[9px] ${typeof d === 'number' && currentDay === d && currentPeriod === p ? 'text-yellow-300 bg-yellow-500/20 font-bold' : 'text-gray-600'}`}>
                                                    {p === 'morning' ? '朝' : p === 'afternoon' ? '午' : '夕'}
                                                </th>
                                            )))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(schedule).map(([npcId, sch]) => (
                                            <tr key={npcId} className={`border-b border-gray-800/50 hover:bg-white/[0.02] ${selectedNpc === npcId ? 'bg-purple-500/10' : ''}`}
                                                onClick={() => setSelectedNpc(npcId)}>
                                                <td className="py-1.5 px-3 font-bold text-gray-300 whitespace-nowrap sticky left-0 bg-gray-950/95 z-10 text-[11px]">
                                                    {npcs[npcId]?.name || npcId}
                                                </td>
                                                {['default', 0, 1, 2, 3, 4, 5, 6, 7].map(d => PERIODS.map(p => {
                                                    const daySch = sch[d];
                                                    const loc = daySch?.[p] ?? null;
                                                    const isCurrent = typeof d === 'number' && currentDay === d && currentPeriod === p;
                                                    const room = loc ? allRooms.find(r => r.id === loc) : null;
                                                    const display = room ? (room.name.length > 3 ? room.name.substring(0, 3) : room.name) : loc ? loc.substring(0, 5) : null;
                                                    return (
                                                        <td key={`${d}-${p}`} className={`text-center py-1 px-0.5 ${isCurrent ? 'bg-yellow-500/15' : ''}`}>
                                                            <select value={loc || ''} onChange={e => updateScheduleCell(npcId, d, p, e.target.value || null)}
                                                                className={`w-full bg-transparent text-[9px] font-mono border-none focus:outline-none cursor-pointer appearance-none text-center ${loc ? (isCurrent ? 'text-green-300' : 'text-gray-400') : 'text-gray-700'}`}
                                                                title={loc ? `${room?.floorId || ''} ${room?.name || loc}` : '부재'}>
                                                                <option value="">—</option>
                                                                {allRooms.map(r => <option key={r.id} value={r.id}>{r.floorId}/{r.name}</option>)}
                                                            </select>
                                                        </td>
                                                    );
                                                }))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Add NPC to schedule */}
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-[11px] text-gray-500">스케줄에 NPC 추가:</span>
                                <select onChange={e => { if (e.target.value) { addNpcToSchedule(e.target.value); e.target.value = ''; } }}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[11px] text-white" defaultValue="">
                                    <option value="" disabled>선택...</option>
                                    {npcList.filter(([id]) => !schedule[id]).map(([id, n]) => <option key={id} value={id}>{n.name || id}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ═══ TAB: Prompt ═══ */}
                    {tab === 'prompt' && (
                        <div className="p-4">
                            {editingPrompt ? (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditingPrompt(null)} className="p-1 hover:bg-gray-800 rounded"><ArrowLeft className="w-4 h-4 text-gray-400" /></button>
                                            <h3 className="text-sm font-bold text-purple-300 font-mono">{editingPrompt.key}</h3>
                                        </div>
                                        <button onClick={savePrompt} disabled={promptSaving}
                                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg text-[11px] font-bold transition-colors">
                                            {promptSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} 프롬프트 저장
                                        </button>
                                    </div>
                                    <textarea value={editingPrompt.text} onChange={e => setEditingPrompt(prev => ({ ...prev, text: e.target.value }))}
                                        className="w-full h-[calc(100vh-12rem)] bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs text-gray-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
                                        spellCheck={false} />
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-300 mb-3">프롬프트 목록</h3>
                                    {npcObj && (npcObj.promptTiers || npcObj.promptKey) && (
                                        <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/20 rounded-xl">
                                            <h4 className="text-[11px] font-bold text-purple-300 mb-2">{npcObj.name} 관련 프롬프트</h4>
                                            <div className="space-y-1">
                                                {npcObj.promptKey && (
                                                    <button onClick={() => setEditingPrompt({ key: npcObj.promptKey, text: prompts[npcObj.promptKey] || '' })}
                                                        className="w-full text-left px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-[11px] font-mono text-gray-300 flex items-center gap-2 transition-colors">
                                                        <FileText className="w-3 h-3 text-purple-400" />{npcObj.promptKey}
                                                    </button>
                                                )}
                                                {npcObj.promptTiers && Object.entries(npcObj.promptTiers).map(([tier, key]) => (
                                                    <button key={tier} onClick={() => setEditingPrompt({ key, text: prompts[key] || '' })}
                                                        className="w-full text-left px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-[11px] font-mono text-gray-300 flex items-center gap-2 transition-colors">
                                                        <span className={`w-14 text-center text-[9px] font-bold rounded px-1 py-0.5 ${tier === 'BAD' ? 'bg-red-600/30 text-red-300' : tier === 'NORMAL' ? 'bg-yellow-600/30 text-yellow-300' : tier === 'GOOD' ? 'bg-green-600/30 text-green-300' : 'bg-blue-600/30 text-blue-300'}`}>{tier}</span>
                                                        {key}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
                                        {Object.keys(prompts).sort().map(key => (
                                            <button key={key} onClick={() => setEditingPrompt({ key, text: prompts[key] || '' })}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-800/60 rounded-lg text-[11px] font-mono text-gray-400 flex items-center gap-2 transition-colors">
                                                <FileText className="w-3 h-3 text-gray-600" />{key}
                                                <span className="text-[9px] text-gray-700 ml-auto">{(prompts[key] || '').length}자</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ TAB: Items ═══ */}
                    {tab === 'items' && (
                        <div className="p-4">
                            <h3 className="text-sm font-bold text-gray-300 mb-3">아이템 목록</h3>
                            {npcObj && npcObj.initialInventory && (
                                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-xl">
                                    <h4 className="text-[11px] font-bold text-yellow-300 mb-2">{npcObj.name} 초기 인벤토리</h4>
                                    <div className="space-y-1">
                                        {npcObj.initialInventory.map(itemId => {
                                            const item = items[itemId];
                                            return (
                                                <div key={itemId} className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg">
                                                    <span className="text-base">{item?.icon || '📦'}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[11px] font-bold text-gray-200">{item?.name || itemId}</span>
                                                        <p className="text-[10px] text-gray-500 truncate">{item?.description}</p>
                                                    </div>
                                                    <span className="text-[9px] font-mono text-gray-600">{itemId}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(items).filter(([id, item]) => !searchText || item.name?.includes(searchText) || id.includes(searchText)).map(([id, item]) => (
                                    <div key={id} className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border transition-colors ${item.npcOrigin ? 'bg-purple-900/10 border-purple-500/15' : 'bg-gray-900/50 border-gray-800'}`}>
                                        <span className="text-lg mt-0.5">{item.icon || '📦'}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-bold text-gray-200">{item.name}</span>
                                                {item.type === 'key_item' && <Star className="w-2.5 h-2.5 text-yellow-400" />}
                                                {item.consumable && <Zap className="w-2.5 h-2.5 text-green-400" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500 line-clamp-2">{item.description}</p>
                                            {item.flavorText && <p className="text-[9px] text-gray-600 italic mt-0.5">"{item.flavorText}"</p>}
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-mono text-gray-700">{id}</span>
                                                {item.npcOrigin && <span className="text-[9px] text-purple-400">← {item.npcOrigin}</span>}
                                                {item.effect && <span className="text-[9px] text-cyan-400">🐟 +{item.effect.fishLevel}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── NPC Detail Panel ───
const NpcDetailPanel = ({ npc, npcId, items, prompts, schedule, allRooms, currentDay, currentPeriod, onEditPrompt }) => {
    const loc = (() => {
        if (!schedule) return null;
        const daySch = schedule[currentDay] ?? schedule.default;
        return daySch?.[currentPeriod] ?? null;
    })();
    const room = loc ? allRooms.find(r => r.id === loc) : null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/20 p-4">
                <div className="flex items-center gap-3">
                    {npc.initialPortrait && (
                        <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                            <img src={`/src/assets/portrait/${npc.initialPortrait}`} alt={npc.name} className="w-full h-full object-cover"
                                onError={e => { e.target.style.display = 'none'; }} />
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-bold">{npc.name || npcId}</h2>
                        <span className="text-[11px] font-mono text-gray-500">{npcId}</span>
                        {npc.apiModel && <span className="text-[10px] text-blue-400 ml-2">⚡ {npc.apiModel}</span>}
                    </div>
                    <div className="ml-auto text-right">
                        {loc ? (
                            <div className="flex items-center gap-1 text-[11px] text-green-300"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><MapPin className="w-3 h-3" />{room?.floorId} {room?.name || loc}</div>
                        ) : <span className="text-[11px] text-gray-600 italic">부재</span>}
                    </div>
                </div>
            </div>

            {/* Stats */}
            {npc.initialStats && (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                    <h3 className="text-xs font-bold text-gray-400 mb-3">초기 스탯</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.entries(npc.initialStats).map(([key, val]) => {
                            const Icon = STAT_ICONS[key] || Zap;
                            const color = STAT_COLORS[key] || 'text-gray-400';
                            return (
                                <div key={key} className="bg-gray-800/50 rounded-lg p-3 text-center">
                                    <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                                    <div className="text-lg font-bold">{val}</div>
                                    <div className="text-[10px] text-gray-500 capitalize">{key}</div>
                                    <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${key === 'friendly' ? 'bg-pink-500' : key === 'faith' ? 'bg-blue-500' : 'bg-cyan-500'}`}
                                            style={{ width: `${val}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Portraits */}
            {npc.portraits && (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                    <h3 className="text-xs font-bold text-gray-400 mb-3">초상화</h3>
                    <div className="flex gap-2 flex-wrap">
                        {Object.entries(npc.portraits).map(([key, filename]) => (
                            <div key={key} className="text-center">
                                <div className="w-16 h-16 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden">
                                    <img src={`/src/assets/portrait/${filename}`} alt={key} className="w-full h-full object-cover"
                                        onError={e => { e.target.parentElement.innerHTML = '<span class="text-gray-600 text-[10px]">N/A</span>'; }} />
                                </div>
                                <span className="text-[9px] text-gray-500 mt-1 block">{key}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Prompt Tiers */}
            {(npc.promptTiers || npc.promptKey) && (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                    <h3 className="text-xs font-bold text-gray-400 mb-3">프롬프트</h3>
                    {npc.promptKey && (
                        <button onClick={() => onEditPrompt(npc.promptKey)}
                            className="w-full text-left px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-[11px] font-mono text-gray-300 flex items-center gap-2 mb-1 transition-colors">
                            <Edit3 className="w-3 h-3 text-purple-400" />{npc.promptKey}
                            <span className="text-[9px] text-gray-600 ml-auto">{(prompts[npc.promptKey] || '').length}자</span>
                        </button>
                    )}
                    {npc.promptTiers && Object.entries(npc.promptTiers).map(([tier, key]) => (
                        <button key={tier} onClick={() => onEditPrompt(key)}
                            className="w-full text-left px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-[11px] font-mono text-gray-300 flex items-center gap-2 mb-1 transition-colors">
                            <span className={`w-16 text-center text-[9px] font-bold rounded px-1 py-0.5 ${tier === 'BAD' ? 'bg-red-600/30 text-red-300' : tier === 'NORMAL' ? 'bg-yellow-600/30 text-yellow-300' : tier === 'GOOD' ? 'bg-green-600/30 text-green-300' : 'bg-blue-600/30 text-blue-300'}`}>{tier}</span>
                            <Edit3 className="w-3 h-3 text-purple-400" />{key}
                            <span className="text-[9px] text-gray-600 ml-auto">{(prompts[key] || '').length}자</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Inventory */}
            {npc.initialInventory && npc.initialInventory.length > 0 && (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                    <h3 className="text-xs font-bold text-gray-400 mb-3">초기 인벤토리</h3>
                    <div className="space-y-1.5">
                        {npc.initialInventory.map(itemId => {
                            const item = items[itemId];
                            return (
                                <div key={itemId} className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg">
                                    <span>{item?.icon || '📦'}</span>
                                    <span className="text-[11px] font-medium text-gray-200">{item?.name || itemId}</span>
                                    <span className="text-[9px] font-mono text-gray-600 ml-auto">{itemId}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Today's Schedule */}
            {schedule && (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                    <h3 className="text-xs font-bold text-gray-400 mb-3">오늘 일정 (Day {currentDay})</h3>
                    <div className="flex gap-2">
                        {PERIODS.map(p => {
                            const daySch = schedule[currentDay] ?? schedule.default;
                            const roomId = daySch?.[p];
                            const r = roomId ? allRooms.find(rm => rm.id === roomId) : null;
                            const isNow = currentPeriod === p;
                            return (
                                <div key={p} className={`flex-1 rounded-lg p-3 text-center border ${isNow ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-800/30 border-gray-800'}`}>
                                    <div className={`text-[10px] font-bold mb-1 ${isNow ? 'text-yellow-300' : 'text-gray-500'}`}>{PERIOD_LBL[p]}</div>
                                    {roomId ? (
                                        <div className="text-[11px] text-gray-300">{r?.name || roomId}</div>
                                    ) : (
                                        <div className="text-[11px] text-gray-700 italic">부재</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Debug01Scene;
