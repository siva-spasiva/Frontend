import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, User, FileText, Save, RefreshCw, Edit3, Shield, Heart, Fish,
    Zap, AlertCircle, Check, Search, ChevronDown, ChevronRight, Eye, EyeOff,
    Plus, Trash2, Package, X
} from 'lucide-react';

const API = 'http://localhost:3000/api';
const TIERS = ['DEFAULT', 'BAD', 'NORMAL', 'GOOD', 'PERFECT'];
const TIER_RANGES = { DEFAULT: '단일', BAD: '0-19', NORMAL: '20-45', GOOD: '46-75', PERFECT: '76-100' };
const TIER_COLORS = {
    DEFAULT: 'bg-gray-600/30 text-gray-300 border-gray-500/30',
    BAD: 'bg-red-600/30 text-red-300 border-red-500/30',
    NORMAL: 'bg-yellow-600/30 text-yellow-300 border-yellow-500/30',
    GOOD: 'bg-green-600/30 text-green-300 border-green-500/30',
    PERFECT: 'bg-blue-600/30 text-blue-300 border-blue-500/30',
};
const STAT_ICONS = { friendly: Heart, faith: Shield, fishLevel: Fish };
const STAT_COLORS = { friendly: 'text-pink-400', faith: 'text-blue-400', fishLevel: 'text-cyan-400' };
const Motion = motion;

const Debug02Scene = ({ onBack }) => {
    const [npcs, setNpcs] = useState({});
    const [prompts, setPrompts] = useState({});
    const [items, setItems] = useState({});
    const [selectedNpc, setSelectedNpc] = useState(null);
    const [editingPrompt, setEditingPrompt] = useState(null); // { key, tier, text }
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [searchText, setSearchText] = useState('');
    const [expandedNpcs, setExpandedNpcs] = useState({});
    const [previewMode, setPreviewMode] = useState(false);
    const [showAddNpc, setShowAddNpc] = useState(false);
    const [newNpcId, setNewNpcId] = useState('');
    const [newNpcName, setNewNpcName] = useState('');
    const [newNpcPromptType, setNewNpcPromptType] = useState('single'); // 'single' | 'tiered'

    const npcList = useMemo(() => Object.entries(npcs), [npcs]);
    const npcObj = selectedNpc ? npcs[selectedNpc] : null;

    // Load data
    const loadData = useCallback(async () => {
        try {
            const res = await fetch(`${API}/editor/npcs`);
            const data = await res.json();
            setNpcs(data.npcs || {});
            setPrompts(data.prompts || {});
            setItems(data.items || {});
        } catch (err) { console.error('Load NPC data failed:', err); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 0);
        return () => clearTimeout(timer);
    }, [loadData]);

    const showMsg = useCallback((msg) => {
        setSaveMsg(msg);
        setTimeout(() => setSaveMsg(''), 3000);
    }, []);

    // Get prompt keys for an NPC (new structure: prompts.friendly)
    const getNpcPromptKeys = useCallback((npc) => {
        if (!npc) return [];
        const result = [];

        // New unified structure: prompts.friendly
        if (npc.prompts?.friendly) {
            const friendly = npc.prompts.friendly;
            TIERS.forEach(tier => {
                if (friendly[tier]) {
                    result.push({ stat: 'friendly', tier, key: friendly[tier] });
                }
            });
        }

        // Legacy: promptTiers
        if (result.length === 0 && npc.promptTiers) {
            Object.entries(npc.promptTiers).forEach(([tier, key]) => {
                result.push({ stat: 'friendly', tier, key });
            });
        }

        // Legacy: single promptKey
        if (result.length === 0 && npc.promptKey) {
            result.push({ stat: 'friendly', tier: 'DEFAULT', key: npc.promptKey });
        }

        return result;
    }, []);

    // Save prompt
    const savePrompt = useCallback(async () => {
        if (!editingPrompt) return;
        setSaving(true);
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
            } else {
                setSaveMsg('저장 실패: ' + (data.error || ''));
            }
        } catch (err) {
            setSaveMsg('오류: ' + err.message);
        }
        setSaving(false);
    }, [editingPrompt]);

    // Update NPC (name, inventory)
    const updateNpc = useCallback(async (npcId, updates) => {
        setSaving(true);
        try {
            const res = await fetch(`${API}/editor/npc/update`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ npcId, updates }),
            });
            const data = await res.json();
            if (data.success) {
                // Update local state
                setNpcs(prev => ({
                    ...prev,
                    [npcId]: { ...prev[npcId], ...updates }
                }));
                showMsg('저장 완료');
            } else {
                showMsg('실패: ' + (data.error || ''));
            }
        } catch (err) { showMsg('오류: ' + err.message); }
        setSaving(false);
    }, [showMsg]);

    // Create new NPC
    const createNpc = useCallback(async () => {
        if (!newNpcId || !newNpcName) return;
        setSaving(true);
        try {
            const res = await fetch(`${API}/editor/npc/create`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ npcId: newNpcId, name: newNpcName, promptType: newNpcPromptType }),
            });
            const data = await res.json();
            if (data.success) {
                showMsg(`NPC '${newNpcName}' 생성 완료`);
                setShowAddNpc(false);
                setNewNpcId('');
                setNewNpcName('');
                setNewNpcPromptType('single');
                await loadData(); // reload
                setSelectedNpc(newNpcId);
            } else {
                showMsg('실패: ' + (data.error || ''));
            }
        } catch (err) { showMsg('오류: ' + err.message); }
        setSaving(false);
    }, [newNpcId, newNpcName, newNpcPromptType, loadData, showMsg]);

    // Toggle NPC expand in list
    const toggleExpand = (npcId) => {
        setExpandedNpcs(prev => ({ ...prev, [npcId]: !prev[npcId] }));
    };

    // Count chars & lines
    const getPromptStats = (text) => {
        if (!text) return { chars: 0, lines: 0, tokens: 0 };
        return {
            chars: text.length,
            lines: text.split('\n').length,
            tokens: Math.round(text.length / 3.5), // rough estimate
        };
    };

    return (
        <div className="w-full h-screen bg-gray-950 flex flex-col text-white overflow-hidden font-sans">
            {/* Top Bar */}
            <div className="h-11 bg-gray-900/95 border-b border-gray-800 flex items-center px-3 shrink-0 gap-2">
                <button onClick={onBack} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-gray-300">NPC 프롬프트 관리</span>
                <span className="text-[10px] text-gray-600 ml-1">DEBUG 02</span>
                <div className="flex-1" />
                {saveMsg && <span className={`text-[10px] ml-1 ${saveMsg.includes('완료') ? 'text-green-300' : 'text-red-300'}`}>{saveMsg}</span>}
                <button onClick={loadData} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors" title="새로고침">
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: NPC List */}
                <div className="w-60 bg-gray-900/80 border-r border-gray-800 flex flex-col shrink-0">
                    <div className="p-2 border-b border-gray-800">
                        <div className="relative">
                            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
                            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="NPC 검색..."
                                className="w-full bg-gray-800/60 border border-gray-700 rounded pl-6 pr-2 py-1 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1">
                        {npcList
                            .filter(([id, n]) => !searchText || (n.name || id).toLowerCase().includes(searchText.toLowerCase()))
                            .map(([id, npc]) => {
                                const promptKeys = getNpcPromptKeys(npc);
                                const isExpanded = expandedNpcs[id];
                                const isSelected = selectedNpc === id;
                                const hasTiers = promptKeys.length > 1 || (promptKeys.length === 1 && promptKeys[0].tier !== 'DEFAULT');

                                return (
                                    <div key={id} className="mb-0.5">
                                        <button
                                            onClick={() => { setSelectedNpc(id); toggleExpand(id); }}
                                            className={`w-full text-left px-2 py-2 rounded-lg transition-all ${isSelected ? 'bg-emerald-600/20 border border-emerald-500/30' : 'hover:bg-gray-800/60 border border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {hasTiers ? (
                                                    isExpanded ? <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" /> : <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />
                                                ) : (
                                                    <FileText className="w-3 h-3 text-gray-600 shrink-0" />
                                                )}
                                                <span className="font-bold text-[12px] truncate">{npc.name || id}</span>
                                                <span className="text-[9px] text-gray-600 ml-auto">{promptKeys.length}개</span>
                                            </div>
                                            {npc.initialStats && (
                                                <div className="flex gap-2 mt-1 ml-5">
                                                    {Object.entries(npc.initialStats).map(([k, v]) => {
                                                        const Icon = STAT_ICONS[k] || Zap;
                                                        return <span key={k} className={`text-[9px] flex items-center gap-0.5 ${STAT_COLORS[k] || 'text-gray-500'}`}><Icon className="w-2.5 h-2.5" />{v}</span>;
                                                    })}
                                                </div>
                                            )}
                                        </button>

                                        {/* Expanded prompt list */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <Motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="ml-4 pl-2 border-l border-gray-800 space-y-0.5 py-1">
                                                        {promptKeys.map(({ stat, tier, key }) => (
                                                            <button
                                                                key={key}
                                                                onClick={() => setEditingPrompt({ key, tier, stat, text: prompts[key] || '' })}
                                                                className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-mono transition-colors flex items-center gap-1.5
                                                                    ${editingPrompt?.key === key ? 'bg-emerald-600/30 text-emerald-200' : 'text-gray-400 hover:bg-gray-800/60'}`}
                                                            >
                                                                <span className={`inline-block text-[8px] font-bold rounded px-1 py-0.5 border ${TIER_COLORS[tier] || TIER_COLORS.DEFAULT}`}>
                                                                    {tier}
                                                                </span>
                                                                <span className="truncate">{key}</span>
                                                                <span className="text-[8px] text-gray-700 ml-auto">{(prompts[key] || '').length}자</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </Motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                    </div>

                    {/* All prompts footer */}
                    <div className="p-2 border-t border-gray-800 space-y-2">
                        <div className="text-[10px] text-gray-600">
                            전체 NPC: {npcList.length}개 · 프롬프트: {Object.keys(prompts).length}개
                        </div>
                        <button
                            onClick={() => setShowAddNpc(true)}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300 font-bold transition-colors"
                        >
                            <Plus className="w-3 h-3" /> NPC 추가
                        </button>
                    </div>
                </div>

                {/* Main Content: Prompt Editor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {editingPrompt ? (
                        <>
                            {/* Editor Header */}
                            <div className="h-10 bg-gray-900/60 border-b border-gray-800 flex items-center px-4 gap-2 shrink-0">
                                <button onClick={() => setEditingPrompt(null)} className="p-1 hover:bg-gray-800 rounded">
                                    <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                {npcObj && <span className="text-[11px] text-gray-400">{npcObj.name}</span>}
                                <span className="text-[11px] text-gray-600">›</span>
                                <span className={`text-[9px] font-bold rounded px-1.5 py-0.5 border ${TIER_COLORS[editingPrompt.tier] || TIER_COLORS.DEFAULT}`}>
                                    {editingPrompt.tier}
                                </span>
                                <span className="text-[11px] font-mono text-emerald-300">{editingPrompt.key}</span>

                                <div className="flex-1" />

                                {/* Prompt stats */}
                                {(() => {
                                    const stats = getPromptStats(editingPrompt.text);
                                    return (
                                        <div className="flex items-center gap-3 text-[9px] text-gray-600 mr-3">
                                            <span>{stats.chars}자</span>
                                            <span>{stats.lines}줄</span>
                                            <span>~{stats.tokens}토큰</span>
                                        </div>
                                    );
                                })()}

                                <button
                                    onClick={() => setPreviewMode(!previewMode)}
                                    className={`p-1.5 rounded transition-colors ${previewMode ? 'bg-emerald-600/20 text-emerald-400' : 'hover:bg-gray-800 text-gray-500'}`}
                                    title={previewMode ? '편집 모드' : '미리보기'}
                                >
                                    {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>

                                <button onClick={savePrompt} disabled={saving}
                                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 rounded-lg text-[11px] font-bold transition-colors">
                                    {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    {saving ? '저장중...' : '저장'}
                                </button>
                            </div>

                            {/* Tier Range Info */}
                            <div className="px-4 py-1.5 bg-gray-900/30 border-b border-gray-800/50 flex items-center gap-2">
                                <Heart className="w-3 h-3 text-pink-400" />
                                <span className="text-[10px] text-gray-500">Friendly 기반</span>
                                <span className="text-[10px] text-gray-600">|</span>
                                <span className="text-[10px] text-gray-400">구간: <strong className="text-gray-300">{TIER_RANGES[editingPrompt.tier] || '?'}</strong></span>

                                {/* Quick tier switch */}
                                {npcObj && getNpcPromptKeys(npcObj).length > 1 && (
                                    <div className="flex items-center gap-1 ml-4">
                                        {getNpcPromptKeys(npcObj).map(({ tier, key }) => (
                                            <button
                                                key={key}
                                                onClick={() => setEditingPrompt({ key, tier, stat: 'friendly', text: prompts[key] || '' })}
                                                className={`text-[8px] font-bold rounded px-1.5 py-0.5 border transition-colors
                                                    ${editingPrompt.key === key ? TIER_COLORS[tier] : 'border-gray-700 text-gray-600 hover:text-gray-400'}`}
                                            >
                                                {tier}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Editor Body */}
                            <div className="flex-1 overflow-hidden">
                                {previewMode ? (
                                    <div className="h-full overflow-y-auto p-4">
                                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                                            {editingPrompt.text || '(빈 프롬프트)'}
                                        </pre>
                                    </div>
                                ) : (
                                    <textarea
                                        value={editingPrompt.text}
                                        onChange={e => setEditingPrompt(prev => ({ ...prev, text: e.target.value }))}
                                        className="w-full h-full bg-gray-950 border-none p-4 text-xs text-gray-300 font-mono resize-none focus:outline-none leading-relaxed"
                                        spellCheck={false}
                                        placeholder="프롬프트를 입력하세요..."
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <NpcPromptOverview
                            key={selectedNpc || 'none'}
                            npc={npcs[selectedNpc]}
                            npcId={selectedNpc}
                            prompts={prompts}
                            items={items}
                            getNpcPromptKeys={getNpcPromptKeys}
                            onEditPrompt={(key, tier) => setEditingPrompt({ key, tier, stat: 'friendly', text: prompts[key] || '' })}
                            onUpdateNpc={updateNpc}
                            saving={saving}
                        />
                    )}
                </div>
            </div>

            {/* Add NPC Modal */}
            <AnimatePresence>
                {showAddNpc && (
                    <Motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center"
                        onClick={() => setShowAddNpc(false)}
                    >
                        <Motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-96 space-y-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-200">새 NPC 추가</h3>
                                <button onClick={() => setShowAddNpc(false)} className="p-1 hover:bg-gray-800 rounded"><X className="w-4 h-4 text-gray-400" /></button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold block mb-1">NPC ID</label>
                                    <input
                                        value={newNpcId} onChange={e => setNewNpcId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        placeholder="예: new_npc_01"
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-[12px] text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <p className="text-[9px] text-gray-600 mt-0.5">소문자 영문, 숫자, 밑줄만 사용</p>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold block mb-1">이름</label>
                                    <input
                                        value={newNpcName} onChange={e => setNewNpcName(e.target.value)}
                                        placeholder="예: 홍길동"
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold block mb-1">프롬프트 타입</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setNewNpcPromptType('single')}
                                            className={`flex-1 py-1.5 text-[11px] rounded border transition-colors ${newNpcPromptType === 'single' ? 'bg-gray-700 border-emerald-500/50 text-emerald-300 font-bold' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
                                        >
                                            단일 (DEFAULT)
                                        </button>
                                        <button
                                            onClick={() => setNewNpcPromptType('tiered')}
                                            className={`flex-1 py-1.5 text-[11px] rounded border transition-colors ${newNpcPromptType === 'tiered' ? 'bg-gray-700 border-emerald-500/50 text-emerald-300 font-bold' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
                                        >
                                            티어별 (BAD~PERFECT)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={createNpc}
                                disabled={!newNpcId || !newNpcName || saving}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1"
                            >
                                {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                NPC 생성
                            </button>
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── NPC Prompt Overview (with name editing & inventory management) ───
const NpcPromptOverview = ({ npc, npcId, prompts, items, getNpcPromptKeys, onEditPrompt, onUpdateNpc, saving }) => {
    const promptKeys = npc ? getNpcPromptKeys(npc) : [];
    const hasTiers = promptKeys.some(p => p.tier !== 'DEFAULT');

    const [editName, setEditName] = useState(false);
    const [nameValue, setNameValue] = useState(npc?.name || '');
    const [editInventory, setEditInventory] = useState(false);
    const [inventoryItems, setInventoryItems] = useState(npc?.initialInventory || []);
    const [newItemId, setNewItemId] = useState('');

    if (!npc) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm p-8">
                <div className="text-center space-y-2">
                    <User className="w-10 h-10 mx-auto text-gray-700" />
                    <p>왼쪽 목록에서 NPC를 선택하세요.</p>
                </div>
            </div>
        );
    }

    const saveName = () => {
        if (nameValue.trim() && nameValue !== npc.name) {
            onUpdateNpc(npcId, { name: nameValue.trim() });
        }
        setEditName(false);
    };

    const saveInventory = () => {
        onUpdateNpc(npcId, { initialInventory: inventoryItems });
        setEditInventory(false);
    };

    const addItem = () => {
        if (newItemId && !inventoryItems.includes(newItemId)) {
            setInventoryItems(prev => [...prev, newItemId]);
            setNewItemId('');
        }
    };

    const removeItem = (itemId) => {
        setInventoryItems(prev => prev.filter(i => i !== itemId));
    };

    // All available item IDs for dropdown
    const allItemIds = Object.keys(items);

    return (
        <div className="space-y-4 max-w-3xl overflow-y-auto h-full p-4">
            {/* NPC Header — with editable name */}
            <div className="bg-gradient-to-r from-emerald-900/30 to-gray-900/30 rounded-xl border border-emerald-500/20 p-4">
                <div className="flex items-center gap-3">
                    {npc.initialPortrait && (
                        <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                            <img src={`/src/assets/portrait/${npc.initialPortrait}`} alt={npc.name} className="w-full h-full object-cover"
                                onError={e => { e.target.style.display = 'none'; }} />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        {editName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={nameValue}
                                    onChange={e => setNameValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditName(false); setNameValue(npc.name || ''); } }}
                                    autoFocus
                                    className="bg-gray-800 border border-emerald-500/50 rounded px-2 py-1 text-base font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48"
                                />
                                <button onClick={saveName} className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded" disabled={saving}>
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setEditName(false); setNameValue(npc.name || ''); }} className="p-1 hover:bg-gray-700 rounded">
                                    <X className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <h2 className="text-base font-bold">{npc.name || npcId}</h2>
                                <button onClick={() => setEditName(true)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-800 rounded transition-all">
                                    <Edit3 className="w-3 h-3 text-gray-500" />
                                </button>
                            </div>
                        )}
                        <span className="text-[11px] font-mono text-gray-500">{npcId}</span>
                        {npc.apiModel && <span className="text-[10px] text-blue-400 ml-2">⚡ {npc.apiModel}</span>}
                    </div>
                    <div className="ml-auto">
                        {hasTiers ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Friendly 티어 시스템</span>
                        ) : (
                            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-1 rounded">단일 프롬프트</span>
                        )}
                    </div>
                </div>
                {npc.initialStats && (
                    <div className="flex gap-4 mt-3">
                        {Object.entries(npc.initialStats).map(([key, val]) => {
                            const Icon = STAT_ICONS[key] || Zap;
                            return (
                                <div key={key} className={`flex items-center gap-1.5 ${STAT_COLORS[key] || 'text-gray-400'}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="text-[11px] capitalize">{key}</span>
                                    <span className="text-[11px] font-bold">{val}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Inventory Section */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-yellow-400" />
                        소지 아이템 ({inventoryItems.length}개)
                    </h3>
                    {editInventory ? (
                        <div className="flex items-center gap-1">
                            <button onClick={saveInventory} disabled={saving} className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                                <Save className="w-3 h-3" /> 저장
                            </button>
                            <button onClick={() => { setEditInventory(false); setInventoryItems(npc.initialInventory || []); }} className="px-2 py-0.5 hover:bg-gray-800 rounded text-[10px] text-gray-400">
                                취소
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setEditInventory(true)} className="px-2 py-0.5 hover:bg-gray-800 rounded text-[10px] text-gray-400 flex items-center gap-1 transition-colors">
                            <Edit3 className="w-3 h-3" /> 편집
                        </button>
                    )}
                </div>

                {inventoryItems.length > 0 ? (
                    <div className="space-y-1">
                        {inventoryItems.map(itemId => {
                            const item = items[itemId];
                            return (
                                <div key={itemId} className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg">
                                    <span className="text-base">{item?.icon || '📦'}</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[11px] font-bold text-gray-200">{item?.name || itemId}</span>
                                        {item?.description && <p className="text-[9px] text-gray-500 truncate">{item.description}</p>}
                                    </div>
                                    <span className="text-[9px] font-mono text-gray-600">{itemId}</span>
                                    {editInventory && (
                                        <button onClick={() => removeItem(itemId)} className="p-0.5 hover:bg-red-600/20 rounded transition-colors">
                                            <Trash2 className="w-3 h-3 text-red-400" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-[11px] text-gray-600 italic py-2">소지 아이템 없음</div>
                )}

                {editInventory && (
                    <div className="mt-2 flex items-center gap-2">
                        <select
                            value={newItemId}
                            onChange={e => setNewItemId(e.target.value)}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="">아이템 선택...</option>
                            {allItemIds.filter(id => !inventoryItems.includes(id)).map(id => (
                                <option key={id} value={id}>{items[id]?.icon || '📦'} {items[id]?.name || id} ({id})</option>
                            ))}
                        </select>
                        <button
                            onClick={addItem}
                            disabled={!newItemId}
                            className="px-2 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-30 border border-emerald-500/20 rounded text-[11px] text-emerald-300 font-bold transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Prompt Cards */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-pink-400" />
                    Friendly 프롬프트 ({promptKeys.length}개)
                </h3>

                {promptKeys.map(({ tier, key }) => {
                    const text = prompts[key] || '';
                    const stats = { chars: text.length, lines: text.split('\n').length };
                    const preview = text.substring(0, 200).replace(/\n/g, ' ');

                    return (
                        <button
                            key={key}
                            onClick={() => onEditPrompt(key, tier)}
                            className="w-full text-left p-3 bg-gray-900/50 hover:bg-gray-900/80 rounded-xl border border-gray-800 hover:border-emerald-500/30 transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[9px] font-bold rounded px-1.5 py-0.5 border ${TIER_COLORS[tier] || TIER_COLORS.DEFAULT}`}>
                                    {tier}
                                </span>
                                <span className="text-[10px] text-gray-500">Friendly {TIER_RANGES[tier] || ''}</span>
                                <span className="text-[10px] font-mono text-gray-600 ml-auto">{key}</span>
                                <Edit3 className="w-3 h-3 text-gray-700 group-hover:text-emerald-400 transition-colors" />
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                                {preview || '(빈 프롬프트)'}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-[9px] text-gray-700">
                                <span>{stats.chars}자</span>
                                <span>{stats.lines}줄</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Prompt not found warning */}
            {promptKeys.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-[11px] text-yellow-300">이 NPC에 연결된 프롬프트가 없습니다.</span>
                </div>
            )}
        </div>
    );
};

export default Debug02Scene;
