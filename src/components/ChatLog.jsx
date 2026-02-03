import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import LogEntry from './LogEntry';

const ChatLog = ({ logs, viewMode }) => {
    const logsEndRef = useRef(null);

    // Auto-scroll logic encapsulated here
    useEffect(() => {
        if (viewMode === 'full') {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, viewMode]);

    if (viewMode !== 'full') return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100%' }}
            exit={{ opacity: 0, height: 0 }}
            className="pointer-events-auto flex-1 overflow-y-auto mb-2 p-4 bg-gradient-to-t from-gray-900/90 to-gray-900/0 rounded-t-xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent backdrop-blur-sm"
        >
            <div className="min-h-full flex flex-col justify-end">
                {logs.length === 0 && (
                    <div className="text-center text-gray-500 py-10 italic">
                        기록된 대화가 없습니다.
                    </div>
                )}
                {logs.map(log => <LogEntry key={log.id} log={log} />)}
                <div ref={logsEndRef} />
            </div>
        </motion.div>
    );
};

export default ChatLog;
