import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Plus, X, BookOpen, Clock, CalendarDays, ChevronLeft, Sparkles,
  AlertTriangle, GraduationCap
} from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import { getSubjectColor } from '../utils/colors';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const priorityConfig = {
  High: { class: 'text-red-400 bg-red-500/10 border-red-500/20', icon: '🔴' },
  Medium: { class: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: '🟡' },
  Low: { class: 'text-green-400 bg-green-500/10 border-green-500/20', icon: '🟢' },
};

function AnimatedBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 100 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div 
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    >
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none"
        style={{ top: '-10%', left: '-10%', x: useTransform(smoothX, v => v * 0.02), y: useTransform(smoothY, v => v * 0.02) }}
      />
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"
        style={{ top: '40%', right: '-5%', x: useTransform(smoothX, v => v * 0.03), y: useTransform(smoothY, v => v * 0.03) }}
      />
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-violet-700/20 blur-3xl pointer-events-none"
        style={{ bottom: '-10%', left: '30%', x: useTransform(smoothX, v => v * 0.01), y: useTransform(smoothY, v => v * 0.01) }}
      />
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"
        style={{ top: '20%', left: '50%', x: useTransform(smoothX, v => v * 0.04), y: useTransform(smoothY, v => v * 0.04) }}
      />
    </div>
  );
}

export default function InputFormPage({ onBack, onGenerate, initialData }) {
  const [subjects, setSubjects] = useState(initialData?.subjects || []);
  const [hoursPerDay, setHoursPerDay] = useState(initialData?.hoursPerDay || 4);
  const [daysOff, setDaysOff] = useState(initialData?.daysOff || []);
  const [newSubject, setNewSubject] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');

  const addSubject = () => {
    const name = newSubject.trim();
    if (!name) {
      toast.error('Please enter a subject name');
      return;
    }
    if (subjects.length >= 10) {
      toast.error('Maximum 10 subjects allowed');
      return;
    }
    if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast('⚠️ This subject already exists!', { icon: '⚠️' });
      return;
    }
    if (!newExamDate) {
      toast.error('Please select an exam date');
      return;
    }
    if (isBefore(new Date(newExamDate), startOfDay(new Date()))) {
      toast.error('Exam date cannot be in the past');
      return;
    }

    const subject = {
      id: Date.now(),
      name,
      examDate: newExamDate,
      priority: newPriority,
      colorIndex: subjects.length,
    };

    setSubjects(prev => [...prev, subject]);
    setNewSubject('');
    setNewExamDate('');
    setNewPriority('Medium');
    toast.success(`Added ${name}!`);
  };

  const removeSubject = (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const toggleDayOff = (day) => {
    setDaysOff(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleGenerate = () => {
    if (subjects.length === 0) {
      toast.error('Add at least one subject to generate a schedule');
      return;
    }
    onGenerate({ subjects, hoursPerDay, daysOff });
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-8 md:px-12 lg:px-24 flex flex-col items-center justify-center w-full">
      <AnimatedBackground />
      
      <div className="w-full max-w-4xl flex-1 flex flex-col justify-center py-10" style={{ gap: '2rem' }}>
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button
            id="back-btn"
            className="btn-secondary flex items-center gap-2 text-sm"
            onClick={onBack}
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap size={24} className="text-purple-400" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">Set Up Your Plan</h1>
          </div>
        </motion.div>

        {/* === Add Subject Section === */}
        <motion.div 
          className="p-6 sm:p-10 rounded-3xl border-x border-b border-white/10 border-t border-t-purple-500/30 backdrop-blur-md bg-white/5 shadow-2xl shadow-black/20 flex flex-col"
          style={{ gap: '1.5rem' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 * 0.15, duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-sm font-semibold tracking-widest uppercase text-purple-300 flex items-center gap-2">
            <BookOpen size={16} />
            Add Subjects
            <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
              {subjects.length}/10
            </span>
          </h2>

          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
            <input
              id="subject-name-input"
              type="text"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-gray-400 outline-none"
              placeholder="Subject name (e.g. Mathematics)"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubject()}
              maxLength={50}
            />
            <input
              id="exam-date-input"
              type="date"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-gray-400 outline-none"
              value={newExamDate}
              onChange={e => setNewExamDate(e.target.value)}
              min={todayStr}
            />
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wider mr-2">Priority:</span>
            {Object.entries(priorityConfig).map(([level, config]) => (
              <button
                key={level}
                id={`priority-${level.toLowerCase()}-btn`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  newPriority === level ? config.class + ' ring-1 ring-offset-1 ring-offset-transparent ring-white/20' : 'text-gray-400 bg-white/5 border-white/10'
                }`}
                onClick={() => setNewPriority(level)}
              >
                {config.icon} {level}
              </button>
            ))}
          </div>

          <motion.button
            id="add-subject-btn"
            className="flex items-center gap-3 w-full sm:w-auto self-start px-8 justify-center bg-white/10 hover:bg-white/15 border border-white/10 text-white py-4 rounded-xl transition-colors font-medium text-lg"
            onClick={addSubject}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={18} />
            Add Subject
          </motion.button>

          {/* Subject List */}
          {subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {subjects.map((subject, i) => {
                  const color = getSubjectColor(subject.colorIndex);
                  const prioClass = priorityConfig[subject.priority].class;
                  return (
                    <motion.div
                      key={subject.id}
                      className="p-4 rounded-xl flex items-center justify-between bg-white/5 border border-white/10"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: color.solid }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate">
                            {subject.name}
                          </h3>
                          <p className="text-xs text-gray-400">
                            Exam: {format(new Date(subject.examDate + 'T00:00:00'), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${prioClass}`}>
                          {subject.priority}
                        </span>
                        <motion.button
                          id={`remove-subject-${i}-btn`}
                          onClick={() => removeSubject(subject.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-white/20 text-center text-gray-400">
              <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No subjects added yet. Add your first subject above!</p>
            </div>
          )}
        </motion.div>

        {/* === Daily Hours === */}
        <motion.div 
          className="p-6 sm:p-10 rounded-3xl border-x border-b border-white/10 border-t border-t-purple-500/30 backdrop-blur-md bg-white/5 shadow-2xl shadow-black/20 flex flex-col"
          style={{ gap: '1.5rem' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 * 0.15, duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-sm font-semibold tracking-widest uppercase text-purple-300 flex items-center gap-2">
            <Clock size={16} />
            Daily Study Hours
          </h2>
          <div className="relative flex items-center pr-16 sm:pr-20">
            <input
              id="hours-slider"
              type="range"
              min="1"
              max="12"
              value={hoursPerDay}
              onChange={e => setHoursPerDay(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 sm:w-16 h-10 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-purple-300">{hoursPerDay}</span>
              <span className="text-[10px] ml-0.5 text-purple-400/70">h</span>
            </div>
          </div>
        </motion.div>

        {/* === Days Off === */}
        <motion.div 
          className="p-6 sm:p-10 rounded-3xl border-x border-b border-white/10 border-t border-t-purple-500/30 backdrop-blur-md bg-white/5 shadow-2xl shadow-black/20 flex flex-col space-y-6"
          style={{ gap: '1.5rem' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 * 0.15, duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-sm font-semibold tracking-widest uppercase text-purple-300 flex items-center gap-2">
            <CalendarDays size={16} />
            Days Off
          </h2>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-6 gap-3">
            {DAYS_OF_WEEK.map(day => {
              const isSelected = daysOff.includes(day);
              return (
                <button
                  key={day}
                  id={`dayoff-${day.toLowerCase()}`}
                  onClick={() => toggleDayOff(day)}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* === Generate Button === */}
        <motion.button
          id="generate-schedule-btn"
          className="mx-auto flex items-center justify-center gap-3 px-16 py-6 text-xl rounded-full w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold transition-all shadow-xl shadow-purple-500/30 border border-white/10"
          onClick={handleGenerate}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 * 0.15, duration: 0.5, ease: "easeOut" }}
          whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(139,92,246,0.5)" }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles size={20} className="animate-pulse" />
            Generate Schedule
          </span>
        </motion.button>
      </div>
    </div>
  );
}
