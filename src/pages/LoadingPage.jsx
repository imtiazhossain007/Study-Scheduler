import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader } from 'lucide-react';

const statusMessages = [
  'Analyzing your exam schedule...',
  'Calculating optimal study distribution...',
  'Mapping topic dependencies...',
  'Crafting personalized recommendations...',
  'Generating motivational tips...',
  'Building your perfect plan...',
  'Almost there — polishing the details...',
];

export default function LoadingPage({ progress }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % statusMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Orbiting dots */}
      <div className="orbit-container mb-10">
        <div className="orbit-dot" />
        <div className="orbit-dot" />
        <div className="orbit-dot" />
        <div className="orbit-dot" />
        <div className="orbit-dot" />
      </div>

      {/* Brain icon */}
      <motion.div
        className="mb-6"
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Brain size={48} className="text-indigo-400" />
      </motion.div>

      {/* Status message */}
      <motion.h2
        key={messageIndex}
        className="text-xl sm:text-2xl font-semibold text-center mb-4 gradient-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
      >
        {statusMessages[messageIndex]}
      </motion.h2>

      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        Gemini AI is building your schedule
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="progress-bar">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Generating...</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Animated background particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-indigo-500/20"
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
