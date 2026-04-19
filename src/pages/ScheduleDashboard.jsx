import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, Copy, Download, RefreshCw,
  Sparkles, Check, BookOpen, Lightbulb, Clock, X, Edit3, ArrowLeft, Camera, ShieldCheck, History, Trash2
} from 'lucide-react';
import { format, parseISO, startOfWeek, addDays, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { getSubjectColor } from '../utils/colors';
import { useAuth } from '../hooks/useAuth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};

const entryContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const entryVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function ScheduleDashboard({ schedule, subjects, onRegenerate, onBack }) {
  const { currentUser, restoreHistoryItem, deleteHistoryItem } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });
  const [completedDays, setCompletedDays] = useState(() => {
    try {
      const saved = localStorage.getItem('completed-days');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save completed days
  useEffect(() => {
    localStorage.setItem('completed-days', JSON.stringify(completedDays));
  }, [completedDays]);

  // Build a lookup map: date string -> schedule entries
  const scheduleMap = useMemo(() => {
    const map = {};
    schedule.forEach(day => {
      const dateStr = day.date;
      if (day.entries) {
        map[dateStr] = day.entries;
      } else {
        // Fallback for flat format
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push({
          subject: day.subject,
          hours: day.hours,
          topics: day.topics || [],
          tip: day.tip || '',
        });
      }
    });
    return map;
  }, [schedule]);

  // Subject color map
  const subjectColorMap = useMemo(() => {
    const map = {};
    subjects.forEach((s, i) => {
      map[s.name.toLowerCase()] = getSubjectColor(s.colorIndex ?? i);
    });
    return map;
  }, [subjects]);

  const getColor = (subjectName) => {
    return subjectColorMap[subjectName.toLowerCase()] || getSubjectColor(0);
  };

  // Week navigation
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const prevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));

  // Copy schedule to clipboard
  const copySchedule = () => {
    let text = '📚 Study Schedule\n\n';
    Object.entries(scheduleMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, entries]) => {
        text += `📅 ${format(parseISO(date), 'EEEE, MMM dd')}\n`;
        entries.forEach(e => {
          text += `  📖 ${e.subject} — ${e.hours}h\n`;
          if (e.topics?.length) text += `     Topics: ${e.topics.join(', ')}\n`;
          if (e.tip) text += `     💡 ${e.tip}\n`;
        });
        text += '\n';
      });

    navigator.clipboard.writeText(text).then(() => {
      toast.success('Schedule copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // PDF download via print
  const downloadPDF = () => {
    window.print();
  };

  // Mark day complete with confetti
  const toggleComplete = (dateStr) => {
    setCompletedDays(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      // Fire confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#8b5cf6', '#22d3ee', '#a78bfa'],
      });
      toast.success('Great job! Day completed! 🎉');
      return [...prev, dateStr];
    });
  };

  // Edit subject on a day entry
  const startEdit = (dateStr, entryIndex) => {
    setEditMode({ dateStr, entryIndex });
    setEditSubject(scheduleMap[dateStr][entryIndex].subject);
  };

  const saveEdit = () => {
    if (!editMode) return;
    const { dateStr, entryIndex } = editMode;
    scheduleMap[dateStr][entryIndex].subject = editSubject;
    setEditMode(null);
    toast.success('Subject updated!');
  };

  // Stats
  const totalDays = Object.keys(scheduleMap).length;
  const completedCount = completedDays.filter(d => scheduleMap[d]).length;
  const totalHours = Object.values(scheduleMap).reduce(
    (sum, entries) => sum + entries.reduce((s, e) => s + (e.hours || 0), 0), 0
  );

  const subjectsWithSyllabusCount = subjects.filter(s => s.syllabusText || s.syllabusImage).length;
  const totalSubjects = subjects.length;

  return (
    <motion.div
      className="min-h-screen py-10 px-4 sm:px-8 md:px-12 lg:px-24 w-full max-w-[1600px] mx-auto flex flex-col"
      style={{ gap: '2.5rem' }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button
            id="back-to-form-btn"
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm no-print"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft size={16} />
            Edit
          </motion.button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-blue-300 to-pink-300 flex items-center gap-2">
              <Calendar size={28} className="text-violet-400" />
              Your Study Schedule
            </h1>
            <p className="text-sm mt-1 text-white/50">
              {subjectsWithSyllabusCount > 0 
                ? `${subjectsWithSyllabusCount} of ${totalSubjects} subjects had syllabus attached — schedule is based on your actual content`
                : 'AI-generated personalized plan'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 no-print flex-wrap">
          <motion.button
            id="history-btn"
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            onClick={() => setShowHistory(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <History size={16} />
            History
          </motion.button>
          <motion.button
            id="copy-schedule-btn"
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            onClick={copySchedule}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Copy size={16} />
            Copy
          </motion.button>
          <motion.button
            id="download-pdf-btn"
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            onClick={downloadPDF}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Download size={16} />
            PDF
          </motion.button>
          <motion.button
            id="regenerate-btn"
            className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white font-semibold px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.65)] transition-all duration-200 border border-white/20 flex items-center gap-2 text-sm"
            onClick={onRegenerate}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <RefreshCw size={16} />
            Regenerate
          </motion.button>
        </div>
      </div>

      {/* Stats Bar */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{ gap: '1.5rem' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: 'Total Days', value: totalDays, icon: Calendar, color: 'text-violet-400' },
          { label: 'Completed', value: `${completedCount}/${totalDays}`, icon: Check, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="backdrop-blur-md bg-white/[0.07] border border-white/10 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] p-4 text-center"
            variants={cardVariants}
          >
            <stat.icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{stat.value}</p>
            <p className="text-xs text-white/50">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between no-print backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <motion.button
          id="prev-week-btn"
          onClick={prevWeek}
          className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white p-2 rounded-lg transition-all duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={20} />
        </motion.button>
        <h2 className="text-lg font-semibold text-white/90">
          {format(weekDays[0], 'MMM dd')} — {format(weekDays[6], 'MMM dd, yyyy')}
        </h2>
        <motion.button
          id="next-week-btn"
          onClick={nextWeek}
          className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white p-2 rounded-lg transition-all duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* Calendar Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 no-print"
        style={{ gap: '1rem' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={currentWeekStart.toISOString()}
      >
        {weekDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const entries = scheduleMap[dateStr] || [];
          const hasEntries = entries.length > 0;
          const isComplete = completedDays.includes(dateStr);
          const isCurrentDay = isToday(day);
          const isPast = isBefore(day, startOfDay(new Date())) && !isCurrentDay;

          return (
            <motion.div
              key={dateStr}
              variants={cardVariants}
              className={`backdrop-blur-md bg-white/[0.07] border rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] p-3 cursor-pointer transition-all min-h-[140px] relative ${
                isCurrentDay ? 'border-violet-500/50 ring-1 ring-violet-500/50 bg-white/[0.12]' : 'border-white/10'
              } ${isComplete ? 'opacity-70' : ''}`}
              onClick={() => setSelectedDay(dateStr)}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-white/40">
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${isCurrentDay ? 'text-violet-400' : 'text-white/80'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
                {isComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"
                  >
                    <Check size={14} className="text-green-400" />
                  </motion.div>
                )}
              </div>

              {/* Entries preview */}
              {hasEntries ? (
                <div className="space-y-1.5">
                  {entries.slice(0, 3).map((entry, j) => {
                    const color = getColor(entry.subject);
                    return (
                      <div
                        key={j}
                        className="rounded-lg px-2 py-1 text-xs font-medium truncate"
                        style={{
                          background: color.bg,
                          color: color.text,
                          border: `1px solid ${color.border}`,
                        }}
                      >
                        {entry.subject} • {entry.hours}h
                      </div>
                    );
                  })}
                  {entries.length > 3 && (
                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                      +{entries.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                  {isPast ? 'Past' : 'Day off'}
                </p>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Full list view */}
      <motion.div
        className="flex flex-col"
        style={{ gap: '1.5rem' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-xl font-bold mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen size={22} className="text-violet-400" />
            Day-by-Day Breakdown
          </div>
          <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 flex items-center gap-2 shadow-sm self-start sm:self-auto">
            <Clock size={16} className="text-violet-400" /> {totalHours} Total Hours
          </span>
        </h2>

        {Object.entries(scheduleMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateStr, entries], i) => {
            const isComplete = completedDays.includes(dateStr);
            const dayDate = parseISO(dateStr);
            const isCurrentDay = isToday(dayDate);

            return (
              <motion.div
                key={dateStr}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={cardVariants}
                className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${isComplete ? 'opacity-60' : ''} ${
                  isCurrentDay ? 'ring-2 ring-violet-500/50 bg-white/[0.15]' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px] bg-white/5 rounded-xl py-2 px-3 border border-white/10">
                      <p className="text-xs font-medium text-white/50">
                        {format(dayDate, 'EEE')}
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {format(dayDate, 'dd')}
                      </p>
                      <p className="text-xs text-white/50">
                        {format(dayDate, 'MMM')}
                      </p>
                    </div>
                    {isCurrentDay && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/30 text-white border border-violet-400/50 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                        Today
                      </span>
                    )}
                  </div>

                  <motion.button
                    id={`complete-day-${dateStr}`}
                    className={`no-print transition-all duration-200 text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-xl ${
                      isComplete
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white'
                    }`}
                    onClick={() => toggleComplete(dateStr)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check size={14} />
                    {isComplete ? 'Completed' : 'Mark Done'}
                  </motion.button>
                </div>

                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  variants={entryContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {entries.map((entry, j) => {
                    const color = getColor(entry.subject);
                    const isEditing = editMode?.dateStr === dateStr && editMode?.entryIndex === j;

                    return (
                      <motion.div
                        key={j}
                        variants={entryVariants}
                        className="rounded-2xl p-5 transition-all duration-300 backdrop-blur-md"
                        style={{
                          background: `linear-gradient(135deg, ${color.bg}, rgba(255,255,255,0.02))`,
                          border: `1px solid ${color.border}`,
                        }}
                        whileHover={{ scale: 1.02, boxShadow: `0 8px 32px ${color.bg.replace('0.18', '0.4')}` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <select
                                className="input-glass text-sm py-1 px-2"
                                value={editSubject}
                                onChange={e => setEditSubject(e.target.value)}
                              >
                                {subjects.map(s => (
                                  <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                              </select>
                              <button
                                className="p-1 rounded bg-green-500/20 text-green-400"
                                onClick={saveEdit}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                className="p-1 rounded bg-red-500/20 text-red-400"
                                onClick={() => setEditMode(null)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-semibold flex items-center gap-1.5" style={{ color: color.text }}>
                                {entry.subject}
                                {subjects.find(s => s.name === entry.subject)?.syllabusImage && (
                                  <Camera size={12} className="opacity-70" title="Generated from syllabus image" />
                                )}
                              </h4>
                              <div className="flex items-center gap-2 no-print">
                                {subjects.find(s => s.name === entry.subject)?.syllabusText || subjects.find(s => s.name === entry.subject)?.syllabusImage ? (
                                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    From your syllabus
                                  </span>
                                ) : (
                                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                    AI generated
                                  </span>
                                )}
                                <motion.button
                                  className="p-1 rounded hover:bg-white/10 transition"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(dateStr, j);
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Edit3 size={12} style={{ color: color.text }} />
                                </motion.button>
                                <span
                                  className="text-sm font-medium flex items-center gap-1"
                                  style={{ color: color.text }}
                                >
                                  <Clock size={12} /> {entry.hours}h
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {entry.topics && entry.topics.length > 0 && (
                          <motion.div 
                            className="flex flex-wrap gap-1.5 mb-2 mt-3"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            viewport={{ once: true }}
                          >
                            {entry.topics.map((topic, k) => (
                              <motion.span
                                key={k}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 + (k * 0.05) }}
                                viewport={{ once: true }}
                                className="text-xs font-medium px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 shadow-sm"
                              >
                                {topic}
                              </motion.span>
                            ))}
                          </motion.div>
                        )}

                        {entry.tip && (
                          <p
                            className="text-xs flex items-start gap-2 mt-4 pt-3 border-t border-white/10 text-white/50"
                          >
                            <Lightbulb size={14} className="shrink-0 mt-0.5 text-yellow-400/80" />
                            {entry.tip}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            );
          })}
      </motion.div>

      {/* History Slide-in Panel */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 no-print"
            />
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 z-50 backdrop-blur-xl bg-white/10 border-l border-white/20 shadow-[-8px_0_32px_rgba(0,0,0,0.3)] flex flex-col no-print"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <History size={20} className="text-violet-400" />
                  My Schedules
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-white/50 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {currentUser?.data?.scheduleHistory?.length > 0 ? (
                  [...currentUser.data.scheduleHistory].reverse().map((hist) => (
                    <div
                      key={hist.id}
                      className="backdrop-blur-md bg-white/5 border border-white/10 hover:border-violet-500/50 rounded-xl p-4 transition-all group cursor-pointer"
                      onClick={() => {
                        const restored = restoreHistoryItem(hist.id);
                        if (restored) {
                          setShowHistory(false);
                          toast.success('Restored previous schedule');
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                          {hist.label}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(hist.id);
                            toast.success('Removed from history');
                          }}
                          className="text-white/30 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-white/50 mb-1">
                        Generated on {format(parseISO(hist.generatedAt), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-white/40">
                        {hist.subjects?.length || 0} subjects
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center mt-10">
                    <History size={40} className="text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No saved schedules yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
