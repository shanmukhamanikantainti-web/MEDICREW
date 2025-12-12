import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5500); // 5.5s total duration

    const skipTimer = setTimeout(() => {
        setShowSkip(true);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(skipTimer);
    }
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-2xl h-64 flex items-center justify-center">
        {/* EKG Line Animation - White */}
        <svg className="absolute w-full h-full" viewBox="0 0 1000 200">
          <motion.path
            d="M0,100 L200,100 L250,20 L300,180 L350,100 L800,100"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
        </svg>

        {/* Logo Reveal - B&W */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="z-10 flex flex-col items-center bg-black p-8 border border-white shadow-[0_0_15px_rgba(255,255,255,0.1)] rounded-none"
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity size={48} className="text-white" />
            <h1 className="text-5xl font-bold text-white tracking-tighter">
              MEDICREW
            </h1>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            className="text-gray-400 text-lg tracking-widest font-medium uppercase"
          >
            Universal Engine
          </motion.p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showSkip && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
            className="absolute bottom-10 px-8 py-2 text-gray-400 hover:text-white hover:border-white border border-transparent transition-all text-sm uppercase tracking-widest font-medium"
          >
            Skip Intro
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};