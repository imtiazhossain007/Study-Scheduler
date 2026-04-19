import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Plus, X, BookOpen, Clock, CalendarDays, ChevronLeft, Sparkles,
  AlertTriangle, GraduationCap, CheckCircle2, UploadCloud, FileText, Image as ImageIcon, Camera
} from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import { getSubjectColor } from '../utils/colors';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const priorityConfig = {
  High: { class: 'bg-red-500/20 border border-red-400/40 text-red-300 px-3 py-1 rounded-full text-xs font-semibold', icon: '🔴' },
  Medium: { class: 'bg-amber-500/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold', icon: '🟡' },
  Low: { class: 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold', icon: '🟢' },
};

// Animated background moved to App.jsx for global glassmorphism

export default function InputFormPage({ onBack, onGenerate, initialData }) {
  const [subjects, setSubjects] = useState(initialData?.subjects || []);
  const [hoursPerDay, setHoursPerDay] = useState(initialData?.hoursPerDay || 4);
  const [daysOff, setDaysOff] = useState(initialData?.daysOff || []);
  const [newSubject, setNewSubject] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [expandedSubjects, setExpandedSubjects] = useState([]);

  const toggleExpand = (id) => {
    setExpandedSubjects(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const updateSubject = (id, updates) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files supported. Use the text tab to paste PDF content.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large, please use under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => updateSubject(id, { syllabusImage: ev.target.result, syllabusImageName: file.name });
    reader.readAsDataURL(file);
  };


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
      syllabusText: '',
      syllabusImage: null,
      syllabusImageName: '',
      syllabusTab: 'text'
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
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            onClick={onBack}
          >
            <ChevronLeft size={18} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap size={24} className="text-purple-400" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-blue-300 to-pink-300">Set Up Your Plan</h1>
          </div>
        </motion.div>

        {/* === Add Subject Section === */}
        <motion.div
          className="p-6 sm:p-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col"
          style={{ gap: '1.5rem' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 * 0.15, duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-white/40 tracking-widest text-xs uppercase font-semibold flex items-center gap-2">
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
              className="flex-1 bg-white/[0.07] border border-white/15 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/30 focus:bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 outline-none transition-all duration-200 backdrop-blur-sm"
              placeholder="Subject name (e.g. Mathematics)"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubject()}
              maxLength={50}
            />
            <input
              id="exam-date-input"
              type="date"
              className="flex-1 bg-white/[0.07] border border-white/15 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/30 focus:bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 outline-none transition-all duration-200 backdrop-blur-sm [&::-webkit-calendar-picker-indicator]:invert"
              value={newExamDate}
              onChange={e => setNewExamDate(e.target.value)}
              min={todayStr}
            />
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-white/40 tracking-widest text-xs uppercase font-semibold mr-2">Priority:</span>
            {Object.entries(priorityConfig).map(([level, config]) => (
              <button
                key={level}
                id={`priority-${level.toLowerCase()}-btn`}
                className={`transition-all duration-200 ${newPriority === level ? config.class + ' ring-2 ring-violet-400/70 bg-violet-500/30 scale-105' : 'bg-white/[0.07] border border-white/15 text-white/50 hover:text-white/80 px-3 py-1 rounded-full text-xs font-semibold'}`}
                onClick={() => setNewPriority(level)}
              >
                {config.icon} {level}
              </button>
            ))}
          </div>

          <motion.button
            id="add-subject-btn"
            className="flex items-center gap-3 w-full sm:w-auto self-start justify-center bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white font-semibold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.65)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 border border-white/20"
            onClick={addSubject}
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
                      className="backdrop-blur-md bg-white/[0.07] border border-white/10 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(139,92,246,0.25)] hover:border-white/30 transition-all duration-300 overflow-hidden mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      layout
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ background: color.solid }}
                          />
                          <div className="min-w-0 flex flex-col items-start">
                            <h3 className="font-semibold text-white truncate w-full text-left">
                              {subject.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-white/60">
                                Exam: {format(new Date(subject.examDate + 'T00:00:00'), 'MMM dd, yyyy')}
                              </p>
                              <span className={prioClass}>
                                {subject.priority}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Syllabus Badge / Add Button */}
                          {subject.syllabusText ? (
                            <button
                              onClick={() => toggleExpand(subject.id)}
                              className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold hover:bg-emerald-500/30 transition-all duration-200"
                            >
                              <CheckCircle2 size={14} />
                              <span className="hidden sm:inline">Syllabus: Text Added</span>
                              <span className="sm:hidden">Text</span>
                            </button>
                          ) : subject.syllabusImage ? (
                            <button
                              onClick={() => toggleExpand(subject.id)}
                              className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold hover:bg-emerald-500/30 transition-all duration-200"
                            >
                              <CheckCircle2 size={14} />
                              <span className="hidden sm:inline">Syllabus: Image Added</span>
                              <span className="sm:hidden">Image</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleExpand(subject.id)}
                              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 text-xs font-medium"
                            >
                              <Plus size={14} />
                              <span className="hidden sm:inline">Add Syllabus</span>
                              <span className="sm:hidden">Syllabus</span>
                            </button>
                          )}

                          <motion.button
                            id={`remove-subject-${i}-btn`}
                            onClick={() => removeSubject(subject.id)}
                            className="bg-red-500/20 hover:bg-red-500/35 border border-red-400/30 text-red-300 hover:text-red-200 rounded-lg px-3 py-1.5 transition-all duration-200"
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X size={16} />
                          </motion.button>
                        </div>
                      </div>

                      {/* Expandable Syllabus Panel */}
                      <AnimatePresence>
                    {expandedSubjects.includes(subject.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-white/5"
                      >
                        <div className="p-4 bg-black/20 rounded-b-xl">
                          {/* Tabs */}
                          <div className="flex border-b border-white/10 mb-4">
                            <button
                              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subject.syllabusTab === 'text'
                                  ? 'border-violet-400 text-white'
                                  : 'border-transparent text-white/60 hover:text-white/80'
                                }`}
                              onClick={() => updateSubject(subject.id, { syllabusTab: 'text' })}
                            >
                              <FileText size={16} />
                              Type / Paste
                            </button>
                            <button
                              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subject.syllabusTab === 'image'
                                  ? 'border-violet-400 text-white'
                                  : 'border-transparent text-white/60 hover:text-white/80'
                                }`}
                              onClick={() => updateSubject(subject.id, { syllabusTab: 'image' })}
                            >
                              <ImageIcon size={16} />
                              Upload Image
                            </button>
                          </div>

                          {/* Tab Content */}
                          {subject.syllabusTab === 'text' ? (
                            <div className="relative">
                              <textarea
                                className={`w-full bg-white/[0.07] border focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/30 focus:bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 outline-none transition-all duration-200 backdrop-blur-sm resize-none min-h-[120px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 ${(subject.syllabusText?.length || 0) >= 3000 ? 'border-red-500 focus:border-red-500' : 'border-white/15 focus:border-violet-400/70'
                                  }`}
                                rows={5}
                                placeholder="Paste your syllabus here... e.g. Unit 1: Calculus - Limits, Derivatives, Integration..."
                                value={subject.syllabusText || ''}
                                onChange={e => {
                                  const text = e.target.value;
                                  if (text.length <= 3000) {
                                    updateSubject(subject.id, { syllabusText: text });
                                  }
                                }}
                              />
                              <div className={`absolute bottom-3 right-3 text-xs font-medium ${(subject.syllabusText?.length || 0) >= 2800 ? 'text-red-400' : 'text-white/40'
                                }`}>
                                {subject.syllabusText?.length || 0} / 3000 chars
                              </div>
                            </div>
                          ) : (
                            <div>
                              {!subject.syllabusImage ? (
                                <div className="relative w-full border-2 border-dashed border-white/20 bg-white/[0.04] hover:bg-white/[0.08] hover:border-violet-400/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 group">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(subject.id, e)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  />
                                  <div className="w-10 h-10 mb-1 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <UploadCloud size={32} className="text-white/30 group-hover:text-violet-400" />
                                  </div>
                                  <p className="text-white/50 text-sm text-center">
                                    <span className="hidden sm:inline">Drag image here or click to upload</span>
                                    <span className="sm:hidden">Tap to upload image</span>
                                  </p>
                                  <p className="text-white/25 text-xs">JPG, PNG, WEBP · Max 5MB</p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4 bg-white/[0.07] border border-white/15 rounded-xl p-3 backdrop-blur-sm">
                                  <img
                                    src={subject.syllabusImage}
                                    alt="Syllabus thumbnail"
                                    className="w-20 h-20 object-cover rounded-xl border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate mb-1">
                                      {subject.syllabusImageName || 'syllabus-image.jpg'}
                                    </p>
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                      <CheckCircle2 size={12} /> Image ready
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => updateSubject(subject.id, { syllabusImage: null, syllabusImageName: '' })}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all duration-200 shrink-0"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </motion.div>
              );
                })}
            </AnimatePresence>
            </div>
      ) : (
      <div className="p-8 rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.04] text-center text-white/50">
        <AlertTriangle size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No subjects added yet. Add your first subject above!</p>
      </div>
          )}
    </motion.div>

        {/* === Daily Hours === */ }
  <motion.div
    className="p-6 sm:p-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col"
    style={{ gap: '1.5rem' }}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1 * 0.15, duration: 0.5, ease: "easeOut" }}
  >
    <h2 className="text-white/40 tracking-widest text-xs uppercase font-semibold flex items-center gap-2">
      <Clock size={16} />
      Daily Study Hours
    </h2>
    <div className="relative flex items-center pr-16 sm:pr-20 mt-2">
      <input
        id="hours-slider"
        type="range"
        min="1"
        max="12"
        value={hoursPerDay}
        onChange={e => setHoursPerDay(Number(e.target.value))}
        className="appearance-none w-full h-1.5 bg-white/20 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-violet-400 [&::-webkit-slider-thumb]:to-blue-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(139,92,246,0.6)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30"
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-violet-500/30 border border-violet-400/40 text-violet-200 font-bold text-lg px-3 py-1 rounded-xl min-w-[52px] text-center">
        {hoursPerDay}<span className="text-xs ml-0.5 text-violet-300/70">h</span>
      </div>
    </div>
  </motion.div>

  {/* === Days Off === */ }
  <motion.div
    className="p-6 sm:p-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 flex flex-col space-y-6"
    style={{ gap: '1.5rem' }}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 2 * 0.15, duration: 0.5, ease: "easeOut" }}
  >
    <h2 className="text-white/40 tracking-widest text-xs uppercase font-semibold flex items-center gap-2">
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
            className={`flex items-center justify-center transition-all duration-200 ${isSelected
                ? 'bg-gradient-to-r from-violet-600/60 to-blue-500/60 border border-violet-400/50 text-white font-semibold shadow-[0_0_12px_rgba(139,92,246,0.35)] scale-105 px-3 py-2 rounded-xl text-sm'
                : 'bg-white/[0.07] border border-white/15 text-white/50 hover:text-white/80 hover:bg-white/15 px-3 py-2 rounded-xl text-sm cursor-pointer'
              }`}
          >
            {day.slice(0, 3)}
          </button>
        );
      })}
    </div>
  </motion.div>

  {/* === Generate Button === */ }
  <motion.button
    id="generate-schedule-btn"
    className="mx-auto flex items-center justify-center gap-3 px-12 py-5 text-xl rounded-2xl w-full sm:w-auto bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white font-semibold transition-all duration-200 border border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.65)] hover:scale-[1.03] active:scale-[0.97]"
    onClick={handleGenerate}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 3 * 0.15, duration: 0.5, ease: "easeOut" }}
  >
    <span className="flex items-center justify-center gap-2">
      <Sparkles size={20} className="animate-pulse" />
      Generate Schedule
    </span>
  </motion.button>
      </div >
    </div >
  );
}
