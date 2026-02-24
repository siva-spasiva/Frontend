import React, { useState } from 'react';
import {
    Bell,
    CalendarDays,
    Clock3,
    Heart,
    Map,
    MessageCircle,
    Mic,
    Package,
    Settings,
    Zap,
    X,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAudio } from '../context/AudioContext';
import MapApp from './apps/MapApp';
import InventoryApp from './apps/InventoryApp';
import RecorderApp from './apps/RecorderApp';
import MessengerApp from './apps/MessengerApp';

const SidebarSettingsPanel = ({ onBack }) => {
    const { isMusicEnabled, setMusicEnabled, bgmVolume, setBgmVolume, currentBgm } = useAudio();

    return (
        <div className="w-full h-full bg-white/95 backdrop-blur-md flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Settings</h3>
                <button
                    onClick={onBack}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">Music</span>
                        <button
                            type="button"
                            onClick={() => setMusicEnabled(!isMusicEnabled)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isMusicEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}
                        >
                            {isMusicEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-800">Volume</span>
                        <span className="text-xs font-mono text-slate-600">{Math.round((bgmVolume || 0) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round((bgmVolume || 0) * 100)}
                        onChange={(event) => setBgmVolume(Number(event.target.value) / 100)}
                        className="w-full accent-blue-600"
                    />
                </div>

                <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
                    Current BGM: {currentBgm || 'None'}
                </div>
            </div>
        </div>
    );
};

const MenuButton = ({ icon, label, colorClass, active, disabled = false, onClick }) => (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${active ? 'ring-2 ring-blue-300' : ''} ${colorClass}`}>
            {React.createElement(icon, { className: 'w-5 h-5' })}
        </div>
        <span className="text-[11px] font-medium text-slate-100">{label}</span>
    </button>
);

const IngameSidebarMenu = ({ currentFloorId, currentRoomId, onNavigate, disabledPanels = [], inventoryUseDisabled = false }) => {
    const [activePanel, setActivePanel] = useState(null);
    const {
        currentDay,
        currentPeriod,
        PERIOD_LABELS,
        PERIOD_CLOCK,
        hp,
        maxHp,
        plusHp,
    } = useGame();

    const dayLabel = currentDay === 0 ? 'Tutorial' : `Day ${currentDay}`;
    const periodLabel = PERIOD_LABELS?.[currentPeriod] || currentPeriod;
    const clockLabel = PERIOD_CLOCK?.[currentPeriod] || '08:00';
    const baseHpPercent = Math.max(0, Math.min(100, ((hp || 0) / (maxHp || 100)) * 100));
    const plusHpPercent = Math.max(0, Math.min(100 - baseHpPercent, (((plusHp || 0) / (maxHp || 100)) * 100)));
    const hpText = (plusHp || 0) > 0 ? `${hp}+${plusHp} / ${maxHp}` : `${hp} / ${maxHp}`;

    const isPanelDisabled = (panelId) => disabledPanels.includes(panelId);
    const closePanel = () => setActivePanel(null);
    const togglePanel = (panelId) => {
        if (isPanelDisabled(panelId)) return;
        setActivePanel((prev) => (prev === panelId ? null : panelId));
    };

    const renderPanel = () => {
        if (!activePanel) return null;
        if (isPanelDisabled(activePanel)) return null;

        if (activePanel === 'map') {
            return (
                <MapApp
                    currentFloorId={currentFloorId}
                    currentRoomId={currentRoomId}
                    onNavigate={(roomId) => {
                        onNavigate && onNavigate(roomId);
                        closePanel();
                    }}
                    onBack={closePanel}
                />
            );
        }

        if (activePanel === 'inventory') {
            return <InventoryApp onBack={closePanel} disableConsumableUse={inventoryUseDisabled} />;
        }

        if (activePanel === 'recorder') {
            return <RecorderApp onBack={closePanel} />;
        }

        if (activePanel === 'messenger') {
            return <MessengerApp onBack={closePanel} />;
        }

        return <SidebarSettingsPanel onBack={closePanel} />;
    };

    return (
        <div className="absolute inset-y-0 left-0 z-40 flex pointer-events-none">
            <aside className="pointer-events-auto w-[270px] md:w-[300px] h-full p-4 md:p-5 bg-slate-900/45 backdrop-blur-xl border-r border-white/20 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between text-xs text-slate-100 mb-5">
                    <span className="font-semibold">{clockLabel}</span>
                    <span className="font-semibold">5G</span>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-black text-white leading-none">{dayLabel}</h2>
                    <p className="text-xs text-slate-200 mt-1 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {periodLabel}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                        <Clock3 className="w-3 h-3" />
                        {clockLabel}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    <MenuButton
                        icon={Map}
                        label="Map"
                        active={activePanel === 'map'}
                        disabled={isPanelDisabled('map')}
                        onClick={() => togglePanel('map')}
                        colorClass="bg-blue-100 text-blue-600"
                    />
                    <MenuButton
                        icon={Package}
                        label="Inventory"
                        active={activePanel === 'inventory'}
                        disabled={isPanelDisabled('inventory')}
                        onClick={() => togglePanel('inventory')}
                        colorClass="bg-amber-100 text-amber-700"
                    />
                    <MenuButton
                        icon={Mic}
                        label="Recorder"
                        active={activePanel === 'recorder'}
                        disabled={isPanelDisabled('recorder')}
                        onClick={() => togglePanel('recorder')}
                        colorClass="bg-rose-100 text-rose-700"
                    />
                    <MenuButton
                        icon={MessageCircle}
                        label="Messenger"
                        active={activePanel === 'messenger'}
                        disabled={isPanelDisabled('messenger')}
                        onClick={() => togglePanel('messenger')}
                        colorClass="bg-emerald-100 text-emerald-700"
                    />
                    <MenuButton
                        icon={Settings}
                        label="Settings"
                        active={activePanel === 'settings'}
                        disabled={isPanelDisabled('settings')}
                        onClick={() => togglePanel('settings')}
                        colorClass="bg-slate-200 text-slate-700"
                    />
                </div>

                <button
                    onClick={() => togglePanel('messenger')}
                    disabled={isPanelDisabled('messenger')}
                    className="text-left mb-auto bg-blue-500/15 border border-blue-200/20 rounded-xl p-3 hover:bg-blue-500/20 transition-colors"
                >
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-200/20 text-blue-200 flex items-center justify-center">
                            <Bell className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-100">New Notification</p>
                            <p className="text-[11px] text-blue-200/90 mt-0.5">Check messenger updates.</p>
                        </div>
                    </div>
                </button>

                <div className="mt-4 rounded-2xl bg-slate-950/80 border border-white/15 px-3 py-3 text-white">
                    <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-wide text-slate-300">
                        <Heart className="w-3.5 h-3.5 text-red-400 fill-current animate-pulse" />
                        HP
                        {(plusHp || 0) > 0 && (
                            <span className="ml-1 text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                                <Zap className="w-3 h-3" />+{plusHp}
                            </span>
                        )}
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden relative border border-white/10 shadow-inner">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${baseHpPercent}%` }} />
                        {(plusHp || 0) > 0 && (
                            <div
                                className="h-full absolute top-0 bg-gradient-to-r from-emerald-500 to-emerald-400"
                                style={{ left: `${baseHpPercent}%`, width: `${plusHpPercent}%` }}
                            />
                        )}
                        {[10, 40, 70].map((boundary) => (
                            <div
                                key={boundary}
                                className="absolute inset-y-0 w-px bg-white/35 z-10"
                                style={{ left: `${boundary}%` }}
                            />
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-300 text-right mt-1 font-mono">{hpText}</p>
                </div>
            </aside>

            {activePanel && (
                <div className="pointer-events-auto absolute top-2 bottom-2 left-[278px] md:left-[308px] right-2 md:right-auto md:w-[390px] rounded-2xl overflow-hidden border border-white/30 shadow-2xl bg-white/95 transition-all duration-200 ease-out">
                    {renderPanel()}
                </div>
            )}
        </div>
    );
};

export default IngameSidebarMenu;
