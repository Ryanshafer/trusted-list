import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// High quality diverse member portraits from Unsplash
const POOL_OF_AVATARS = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&h=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&h=150&auto=format&fit=crop',
];

const MemberCount = () => {
    // Keep track of which avatars are currently visible (last 5)
    const [visibleAvatars, setVisibleAvatars] = useState(() => {
        return POOL_OF_AVATARS.slice(0, 5).map((url, i) => ({ id: `init-${i}`, url }));
    });
    const [poolIndex, setPoolIndex] = useState(5);

    const handleNewMember = useCallback(() => {
        setVisibleAvatars(prev => {
            // Remove the oldest from the left
            const shifted = prev.slice(1);

            // Add one new one from the pool to the right
            const url = POOL_OF_AVATARS[poolIndex % POOL_OF_AVATARS.length];
            const newOne = {
                id: `new-${Date.now()}`,
                url
            };
            setPoolIndex(prev => prev + 1);

            return [...shifted, newOne];
        });
    }, [poolIndex]);

    useEffect(() => {
        let isMounted = true;

        const scheduleNextJoin = () => {
            // Random delay between 3s and 7s for organic feel
            const delay = Math.random() * 4000 + 3000;

            setTimeout(() => {
                if (!isMounted) return;
                handleNewMember();
                scheduleNextJoin();
            }, delay);
        };

        scheduleNextJoin();
        return () => { isMounted = false; };
    }, [handleNewMember]);

    return (
        <div className="mx-auto flex w-fit flex-col items-center gap-3 text-sm text-slate-500 sm:mx-0 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center">
                <div className="flex -space-x-3 items-center overflow-visible">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {visibleAvatars.map((item, i) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0, x: -20 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 20,
                                    mass: 1,
                                    layout: { duration: 0.3 }
                                }}
                                className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 bg-cover bg-center shadow-[0_10px_24px_rgba(15,23,42,0.2)] relative"
                                style={{
                                    backgroundImage: `url(${item.url})`,
                                    zIndex: 10 - i // Keep layering consistent
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
            <div className="h-10 px-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/50 shadow-2xl shadow-[#00A3AD]/10 flex items-center border-2 border-white">
                <p className="leading-none whitespace-nowrap font-bold !font-sans text-slate-600 text-center sm:text-left">
                    Joined by top talent from tech, design, and media.
                </p>
            </div>
        </div>
    );
};

export default MemberCount;
