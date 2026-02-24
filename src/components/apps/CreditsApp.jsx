import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Grid, Github } from 'lucide-react';
import logo from '../../assets/solphi_logo.png';

const AppIcon = ({ icon: Icon, label, color, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center space-y-2 p-2"
    >
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-sm text-white`}>
            <Icon className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">{label}</span>
    </motion.button>
);

const CreditsApp = ({ onBack, onAppOpen }) => {
    return (
        <div className="w-full h-full bg-gray-50 flex flex-col pt-12 relative overflow-hidden">
            {/* Header */}
            <div className="px-4 pb-4 flex items-center justify-between bg-white shadow-sm z-10 sticky top-0">
                <div className="flex items-center space-x-2">
                    <button onClick={onBack} className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Credits</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full p-6 space-y-8 pb-20 custom-scrollbar">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <img src={logo} alt="Solphi Logo" className="w-32 h-auto object-contain drop-shadow-sm" />
                    <h2 className="text-2xl font-black text-gray-900 tracking-wider">TEAM Спасибо</h2>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-400 text-sm tracking-widest uppercase mb-4">개발팀</h3>
                    <ul className="space-y-3 text-gray-800 font-medium">
                        <li className="flex justify-between items-center">
                            <span className="text-blue-600">팀장</span>
                            <a href="https://github.com/meteor-Ai7" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center space-x-1">
                                <span>김정묵</span>
                            </a>
                        </li>
                        <li className="flex justify-between items-center border-t border-gray-50 pt-2">
                            <span className="text-gray-500">팀원</span>
                            <a href="https://github.com/Kimbomyeong" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center space-x-1">
                                <span>김보명 (청갈치)</span>
                            </a>
                        </li>
                        <li className="flex justify-between items-center border-t border-gray-50 pt-2">
                            <span className="text-gray-500">팀원</span>
                            <a href="https://github.com/makeflower99" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center space-x-1">
                                <span>조서연</span>
                            </a>
                        </li>
                        <li className="flex justify-between items-center border-t border-gray-50 pt-2">
                            <span className="text-gray-500">팀원</span>
                            <a href="https://github.com/youngyoung-0" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center space-x-1">
                                <span>김태영</span>
                            </a>
                        </li>
                        <li className="flex justify-between items-center border-t border-gray-50 pt-2">
                            <span className="text-gray-500">팀원</span>
                            <a href="https://github.com/Mistyclawn" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center space-x-1">
                                <span>김시훈</span>
                            </a>
                        </li>
                    </ul>
                </div>

                <a
                    href="https://github.com/siva-spasiva"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex text-sm items-center justify-center space-x-2 bg-gray-900 text-white rounded-xl p-4 shadow-md hover:bg-gray-800 transition-colors"
                >
                    <Github className="w-5 h-5" />
                    <span className="font-semibold tracking-wide">GitHub Repository</span>
                </a>

                <div className="pt-8 border-t border-gray-200">
                    <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase mb-4 px-2">디버그 메뉴</h3>
                    <div className="grid grid-cols-4 gap-2 mb-6">
                        <AppIcon icon={Grid} label="DEBUG00" color="bg-orange-600" onClick={() => onAppOpen('debug00')} />
                        <AppIcon icon={Grid} label="DEBUG01" color="bg-red-600" onClick={() => onAppOpen('debug01')} />
                        <AppIcon icon={Grid} label="DEBUG02" color="bg-emerald-600" onClick={() => onAppOpen('debug02')} />
                        <AppIcon icon={Grid} label="DEBUG03" color="bg-pink-600" onClick={() => onAppOpen('debug03')} />
                    </div>

                    <div className="border-t border-gray-100 my-6"></div>

                    <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase mb-4 px-2">테스트 메뉴</h3>
                    <div className="grid grid-cols-4 gap-2">
                        <AppIcon icon={Grid} label="Test01" color="bg-indigo-600" onClick={() => onAppOpen('test01')} />
                        <AppIcon icon={Grid} label="Test02" color="bg-pink-600" onClick={() => onAppOpen('test02')} />
                        <AppIcon icon={Grid} label="Test03" color="bg-cyan-600" onClick={() => onAppOpen('test03')} />
                        <AppIcon icon={Grid} label="Test04" color="bg-teal-600" onClick={() => onAppOpen('test04')} />
                        <AppIcon icon={Grid} label="Test05" color="bg-orange-500" onClick={() => onAppOpen('test05')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditsApp;
