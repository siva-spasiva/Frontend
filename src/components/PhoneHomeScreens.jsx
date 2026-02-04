import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Map, FileText, Mic, Settings, Camera, MessageCircle, Info, Package } from 'lucide-react';
import StatusWidget from './StatusWidget';

const AppIcon = ({ icon: Icon, label, color, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center space-y-2 p-4"
    >
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-md text-white`}>
            <Icon className="w-8 h-8" />
        </div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
    </motion.button>
);

export const IngameHomeScreen = ({ onAppOpen, onBack }) => {
    return (
        <div className="w-full h-full flex flex-col pt-12 px-6 relative">
            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-12 left-4 z-20 p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
            )}

            {/* Status Bar Placeholder */}
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-8 px-2 pl-8">
                <span>10:24</span>
                <div className='flex space-x-1'>
                    <span>5G</span>
                    <span>98%</span>
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-10 px-2">Test01 Menu</h1>

            <div className="grid grid-cols-4 gap-4">
                <AppIcon icon={Map} label="Map" color="bg-green-600" onClick={() => onAppOpen('map_app')} />
                <AppIcon icon={FileText} label="Memo" color="bg-yellow-500" onClick={() => { }} />
                <AppIcon icon={Mic} label="Rec" color="bg-red-500" onClick={() => { }} />
                <AppIcon icon={Package} label="Inventory" color="bg-orange-500" onClick={() => onAppOpen('inventory')} />
                <AppIcon icon={Settings} label="Settings" color="bg-gray-500" onClick={() => { }} />
            </div>

            <StatusWidget className="absolute bottom-6 left-6 right-6" />
        </div>
    );
};

export const Ingame02HomeScreen = ({ onAppOpen, onBack }) => {
    return (
        <div className="w-full h-full flex flex-col pt-12 px-6 relative">
            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-12 left-4 z-20 p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
            )}

            {/* Status Bar Placeholder */}
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-8 px-2 pl-8">
                <span>12:00</span>
                <div className='flex space-x-1'>
                    <span className="text-red-600 animate-pulse">!</span>
                    <span>No Signal</span>
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-10 px-2 flex items-center">
                Test02 Menu
                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">OFFLINE</span>
            </h1>

            <div className="grid grid-cols-4 gap-4 opacity-80">
                {/* Different apps for Test02 context */}
                <AppIcon icon={Map} label="Minimap" color="bg-gray-700" onClick={() => { }} />
                <AppIcon icon={Mic} label="Voice" color="bg-red-900" onClick={() => { }} />
                <AppIcon icon={FileText} label="Log" color="bg-orange-700" onClick={() => { }} />

                {/* Glitched Icon */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center space-y-2 p-4 relative overflow-hidden"
                >
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-md text-white animate-pulse">
                        <span className="font-mono text-xs">ERR</span>
                    </div>
                    <span className="text-xs font-medium text-gray-400">System</span>
                </motion.button>
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 font-mono">
                    &gt; CONNECTION LOST<br />
                    &gt; LOCAL MODE ACTIVE<br />
                    &gt; SYNC FAILED
                </p>
            </div>

            <StatusWidget className="absolute bottom-6 left-6 right-6" />
        </div>
    );
};

export const Ingame03HomeScreen = ({ onAppOpen, onBack }) => {
    return (
        <div className="w-full h-full flex flex-col pt-12 px-6 relative">
            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-12 left-4 z-20 p-2 -ml-2 rounded-full hover:bg-blue-50 active:bg-blue-100 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-blue-900" />
                </button>
            )}

            {/* Status Bar Placeholder */}
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-8 px-2 pl-8">
                <span>14:00</span>
                <div className='flex space-x-1'>
                    <span>5G</span>
                    <span>100%</span>
                </div>
            </div>

            <h1 className="text-3xl font-bold text-blue-900 mb-2 px-2">Umi Class</h1>
            <p className="text-sm text-gray-500 mb-8 px-2">Welcome to One-Day Class</p>

            <div className="grid grid-cols-4 gap-4">
                <AppIcon icon={Map} label="Map" color="bg-blue-400" onClick={() => onAppOpen('map_app')} />
                <AppIcon icon={FileText} label="Guide" color="bg-teal-500" onClick={() => { }} />
                <AppIcon icon={Camera} label="Photo" color="bg-pink-400" onClick={() => { }} />
                <AppIcon icon={Settings} label="Settings" color="bg-gray-400" onClick={() => { }} />
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-900">New Notification</p>
                        <p className="text-xs text-blue-600">Class starts in 10 mins.</p>
                    </div>
                </div>
            </div>

            <StatusWidget className="absolute bottom-6 left-6 right-6" />
        </div>
    );
};
