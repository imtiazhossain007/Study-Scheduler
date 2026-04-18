import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <motion.button
      id="theme-toggle-btn"
      className="fixed top-5 right-5 z-50 w-11 h-11 rounded-xl glass-card-sm flex items-center justify-center cursor-pointer no-print"
      onClick={onToggle}
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? (
          <Sun size={18} className="text-yellow-400" />
        ) : (
          <Moon size={18} className="text-indigo-500" />
        )}
      </motion.div>
    </motion.button>
  );
}
