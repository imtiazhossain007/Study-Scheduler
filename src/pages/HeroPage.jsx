import { motion } from 'framer-motion';
import { Sparkles, Brain, Calendar, ArrowRight } from 'lucide-react';

const headlineWords = ['Plan', 'Smarter.', 'Study', 'Better.', 'Ace', 'Everything.'];

const floatingIcons = [
  { Icon: Brain, x: '10%', y: '20%', delay: 0, size: 32 },
  { Icon: Calendar, x: '85%', y: '15%', delay: 0.5, size: 28 },
  { Icon: Sparkles, x: '75%', y: '75%', delay: 1, size: 24 },
  { Icon: Brain, x: '15%', y: '70%', delay: 1.5, size: 26 },
  { Icon: Calendar, x: '50%', y: '10%', delay: 2, size: 30 },
];

export default function HeroPage({ onStart }) {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center relative px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
    >
      {/* Floating icons background */}
      {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
        <motion.div
          key={i}
          className="absolute opacity-10 pointer-events-none"
          style={{ left: x, top: y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay,
            ease: 'easeInOut',
          }}
        >
          <Icon size={size} className="text-indigo-400" />
        </motion.div>
      ))}

      {/* Glowing orb */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Logo */}
      <motion.div
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Brain size={24} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-secondary)' }}>
          StudyAI
        </span>
      </motion.div>

      {/* Headline — word-by-word stagger */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6 max-w-3xl">
        {headlineWords.map((word, i) => (
          <motion.span
            key={i}
            className={`text-5xl sm:text-6xl md:text-7xl font-extrabold ${
              i % 2 === 1 ? 'gradient-text' : ''
            }`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.4 + i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      {/* Subtitle */}
      <motion.p
        className="text-lg sm:text-xl max-w-xl text-center mb-10 leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        Let AI craft your perfect study plan. Enter your subjects, set your goals, and watch
        the magic happen.
      </motion.p>

      {/* CTA Button */}
      <motion.button
        id="start-planning-btn"
        className="btn-primary flex items-center gap-3 text-lg group"
        onClick={onStart}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
        Start Planning
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </motion.button>

      {/* Bottom hint */}
      <motion.p
        className="absolute bottom-8 text-sm"
        style={{ color: 'var(--text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        Powered by Gemini AI • Free to use
      </motion.p>
    </motion.div>
  );
}
