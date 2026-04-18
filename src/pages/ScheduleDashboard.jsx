import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, Copy, Download, RefreshCw,
  Sparkles, Check, BookOpen, Lightbulb, Clock, X, Edit3, ArrowLeft
} from 'lucide-react';
import { format, parseISO, startOfWeek, addDays, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { getSubjectColor } from '../utils/colors';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function ScheduleDashboard({ schedule, subjects, onRegenerate, onBack }) {
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
            className="btn-secondary flex items-center gap-2 text-sm no-print"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft size={16} />
            Edit
          </motion.button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text flex items-center gap-2">
              <Calendar size={28} />
              Your Study Schedule
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              AI-generated personalized plan
            </p>
          </div>
        </div>

        <div className="flex gap-2 no-print flex-wrap">
          <motion.button
            id="copy-schedule-btn"
            className="btn-secondary flex items-center gap-2 text-sm"
            onClick={copySchedule}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Copy size={16} />
            Copy
          </motion.button>
          <motion.button
            id="download-pdf-btn"
            className="btn-secondary flex items-center gap-2 text-sm"
            onClick={downloadPDF}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Download size={16} />
            PDF
          </motion.button>
          <motion.button
            id="regenerate-btn"
            className="btn-primary flex items-center gap-2 text-sm"
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
        className="grid grid-cols-1 sm:grid-cols-3"
        style={{ gap: '1.5rem' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: 'Total Days', value: totalDays, icon: Calendar, color: 'text-indigo-400' },
          { label: 'Completed', value: `${completedCount}/${totalDays}`, icon: Check, color: 'text-green-400' },
          { label: 'Total Hours', value: totalHours, icon: Clock, color: 'text-purple-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card-sm p-4 text-center"
            variants={cardVariants}
          >
            <stat.icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold gradient-text">{stat.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between no-print bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <motion.button
          id="prev-week-btn"
          onClick={prevWeek}
          className="btn-secondary p-2"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={20} />
        </motion.button>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {format(weekDays[0], 'MMM dd')} — {format(weekDays[6], 'MMM dd, yyyy')}
        </h2>
        <motion.button
          id="next-week-btn"
          onClick={nextWeek}
          className="btn-secondary p-2"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* Calendar Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7"
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
              className={`glass-card p-3 cursor-pointer transition-all min-h-[140px] relative ${
                isCurrentDay ? 'ring-2 ring-indigo-500/50' : ''
              } ${isComplete ? 'opacity-70' : ''}`}
              style={{ padding: '12px' }}
              onClick={() => setSelectedDay(dateStr)}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${isCurrentDay ? 'text-indigo-400' : ''}`}>
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
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen size={22} className="text-indigo-400" />
          Day-by-Day Breakdown
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
                variants={cardVariants}
                className={`glass-card p-5 ${isComplete ? 'opacity-60' : ''} ${
                  isCurrentDay ? 'ring-2 ring-indigo-500/40' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {format(dayDate, 'EEE')}
                      </p>
                      <p className="text-xl font-bold gradient-text">
                        {format(dayDate, 'dd')}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {format(dayDate, 'MMM')}
                      </p>
                    </div>
                    {isCurrentDay && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Today
                      </span>
                    )}
                  </div>

                  <motion.button
                    id={`complete-day-${dateStr}`}
                    className={`no-print px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                      isComplete
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'glass-card-sm'
                    }`}
                    style={!isComplete ? { color: 'var(--text-secondary)' } : {}}
                    onClick={() => toggleComplete(dateStr)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check size={14} />
                    {isComplete ? 'Completed' : 'Mark Done'}
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {entries.map((entry, j) => {
                    const color = getColor(entry.subject);
                    const isEditing = editMode?.dateStr === dateStr && editMode?.entryIndex === j;

                    return (
                      <motion.div
                        key={j}
                        className="rounded-xl p-4"
                        style={{
                          background: color.bg,
                          border: `1px solid ${color.border}`,
                        }}
                        whileHover={{ scale: 1.02 }}
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
                              <h4 className="font-semibold" style={{ color: color.text }}>
                                {entry.subject}
                              </h4>
                              <div className="flex items-center gap-2 no-print">
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
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {entry.topics.map((topic, k) => (
                              <span
                                key={k}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}

                        {entry.tip && (
                          <p
                            className="text-xs flex items-start gap-1.5 mt-2"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Lightbulb size={12} className="shrink-0 mt-0.5 text-yellow-400" />
                            {entry.tip}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
      </motion.div>
    </motion.div>
  );
}
