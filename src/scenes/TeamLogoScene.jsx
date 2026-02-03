import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TeamLogoScene = ({ onComplete }) => {
    const [mainText, setMainText] = useState('');
    const [subText, setSubText] = useState('');
    
    const fullMainText = "TEAM Спасибо";
    const fullSubText = "like lion project";

    useEffect(() => {
        // Sequence handling
        let currentIndex = 0;
        let subIndex = 0;
        
        // Typing Main Text
        const mainInterval = setInterval(() => {
            if (currentIndex <= fullMainText.length) {
                setMainText(fullMainText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(mainInterval);
                
                // Start Sub Text after Main ends
                const subInterval = setInterval(() => {
                    if (subIndex <= fullSubText.length) {
                        setSubText(fullSubText.slice(0, subIndex));
                        subIndex++;
                    } else {
                        clearInterval(subInterval);
                    }
                }, 50); // Sub text speed
            }
        }, 80); // Main text speed

        // Global Scene Timer
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 3500); // Extended slightly to 3.5s to ensure full reading time

        return () => {
             clearInterval(mainInterval);
             clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center text-black z-50 absolute top-0 left-0 cursor-default select-none">
            <div className="text-center">
                <h1 className="text-6xl font-bold mb-4 tracking-widest text-black h-20 flex items-center justify-center">
                    {mainText}
                    <span className="animate-pulse ml-1 opacity-50">|</span>
                </h1>
                <p className="text-2xl font-light opacity-80 tracking-widest text-black h-8">
                    {subText}
                </p>
            </div>
        </div>
    );
};

export default TeamLogoScene;
