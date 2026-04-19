import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Image as ImageIcon, Calendar } from 'lucide-react';

const statusMessages = [
  'Analyzing your exam schedule...',
  'Calculating optimal study distribution...',
  'Mapping topic dependencies...',
  'Crafting personalized recommendations...',
  'Generating motivational tips...',
  'Building your perfect plan...',
  'Almost there — polishing the details...',
];

export default function LoadingPage({ progress, stage = 'generating' }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % statusMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="h-64 flex flex-col items-center justify-end relative w-full mb-8">
        <AnimatePresence mode="wait">
          {stage === 'reading-images' ? (
            <motion.div
              key="reading"
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.4)] mb-6 animate-pulse overflow-hidden relative">
                <ImageIcon size={40} className="text-violet-400" />
                {/* Scanning line effect */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.8)] z-10"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                />
              </div>
              <h2 className="text-white/80 text-lg font-medium text-center">
                Reading your syllabus images...
              </h2>
              <p className="text-white/40 text-sm text-center mt-2">
                AI is extracting topics from your uploaded photos
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="generating"
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.4)] mb-6">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Calendar size={48} className="text-violet-400" />
                </motion.div>
              </div>

              {/* Status message */}
              <motion.h2
                key={messageIndex}
                className="text-white/80 text-lg font-medium text-center min-h-[3rem]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                Building your personalized schedule...
              </motion.h2>
              <p className="text-white/40 text-sm text-center mt-2">
                Mapping your actual syllabus topics to study days
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-full flex flex-col items-center">
        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-400 to-pink-400"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="w-64 flex justify-between mt-2">
          <span className="text-white/40 text-xs">
            {stage === 'reading-images' ? 'Extracting text...' : 'Generating schedule...'}
          </span>
          <span className="text-white/60 text-xs font-medium">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Animated background particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-violet-500/20"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
}
