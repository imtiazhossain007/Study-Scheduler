import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';

import HeroPage from './pages/HeroPage';
import InputFormPage from './pages/InputFormPage';
import LoadingPage from './pages/LoadingPage';
import ScheduleDashboard from './pages/ScheduleDashboard';
import AuthPage from './pages/AuthPage';
import ProfileModal from './components/ProfileModal';
import { generateSchedule, extractTopicsFromImage } from './services/claude';
import { useAuth } from './hooks/useAuth';

const PAGES = {
  HERO: 'hero',
  INPUT: 'input',
  LOADING: 'loading',
  DASHBOARD: 'dashboard',
};

export default function App() {
  const { currentUser, isLoggedIn, logout, saveUserData } = useAuth();
  
  const [page, setPage] = useState(PAGES.HERO);
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('study-scheduler-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const [formData, setFormData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('generating'); // 'reading-images' | 'generating' | 'done'
  
  // Track if we've already shown the welcome back toast for the current session
  const [hasRestoredSession, setHasRestoredSession] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('study-scheduler-theme', theme);
  }, [theme]);

  // Auto-restore on login
  useEffect(() => {
    if (isLoggedIn && currentUser && !hasRestoredSession) {
      const savedData = currentUser.data;
      let restored = false;
      
      if (savedData?.subjects && savedData.subjects.length > 0) {
        setFormData({
          subjects: savedData.subjects,
          hoursPerDay: savedData.hoursPerDay || 4,
          daysOff: savedData.daysOff || []
        });
        restored = true;
      }
      
      if (savedData?.schedule && savedData.schedule.length > 0) {
        setSchedule(savedData.schedule);
        setPage(PAGES.DASHBOARD);
        restored = true;
      } else {
        setPage(PAGES.HERO);
      }
      
      if (restored) {
        toast.success('Welcome back! Your last schedule has been restored.');
      }
      
      setHasRestoredSession(true);
    }
  }, [isLoggedIn, currentUser?.id, hasRestoredSession]);

  // Reset restore flag on logout
  useEffect(() => {
    if (!isLoggedIn) {
      setHasRestoredSession(false);
      setFormData(null);
      setSchedule(null);
      setPage(PAGES.HERO);
    }
  }, [isLoggedIn]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleStart = () => {
    if (schedule && formData) {
      setPage(PAGES.DASHBOARD);
    } else {
      setPage(PAGES.INPUT);
    }
  };

  const handleGenerate = useCallback(async (data) => {
    setFormData(data);
    setPage(PAGES.LOADING);
    setLoadingProgress(0);

    const hasImages = data.subjects.some(s => s.syllabusImage && !s.syllabusText);
    setLoadingStage(hasImages ? 'reading-images' : 'generating');

    try {
      let processedSubjects = [...data.subjects];

      // Step A: Extract OCR text from images if needed
      if (hasImages) {
        processedSubjects = await Promise.all(
          data.subjects.map(async (subject) => {
            if (subject.syllabusImage && !subject.syllabusText) {
              try {
                const extractedText = await extractTopicsFromImage(subject.syllabusImage);
                return { ...subject, syllabusText: extractedText, fromImage: true };
              } catch (e) {
                console.error('Failed to extract topics from image for', subject.name, e);
                // Fallback: Continue silently without syllabus
                return subject;
              }
            }
            return subject;
          })
        );
      }

      setLoadingStage('generating');

      // Simulate progress (API call doesn't give real progress)
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 12;
        });
      }, 800);

      const result = await generateSchedule(processedSubjects, data.hoursPerDay, data.daysOff);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingStage('done');

      // Save to localStorage under current user
      saveUserData({
        subjects: data.subjects,
        schedule: result,
        hoursPerDay: data.hoursPerDay,
        daysOff: data.daysOff
      });

      setSchedule(result);

      // Small delay for the progress bar to reach 100%
      setTimeout(() => {
        setPage(PAGES.DASHBOARD);
        toast.success('Your schedule is ready! 🎉');
      }, 600);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Generation failed:', error);
      toast.error(error.message || 'Failed to generate schedule');
      setPage(PAGES.INPUT);
    }
  }, []);

  const handleRegenerate = () => {
    if (formData) {
      handleGenerate(formData);
    }
  };

  const handleBackToInput = () => {
    setPage(PAGES.INPUT);
  };

  return (
    <>
      {/* Fixed blurred orbs for Glassmorphism UI */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/25 blur-[120px] z-0 pointer-events-none" />
      <div className="fixed top-[40%] right-[-8%] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[100px] z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[35%] w-[400px] h-[400px] rounded-full bg-pink-500/20 blur-[90px] z-0 pointer-events-none" />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            color: '#f1f5f9',
            borderRadius: '12px',
          },
        }}
      />

      {/* Auth Gate */}
      {!isLoggedIn ? (
        <AuthPage />
      ) : (
        <>
          {/* Header Bar */}
          <div className="fixed top-0 left-0 right-0 p-4 z-50 flex justify-between items-center no-print backdrop-blur-md bg-white/5 border-b border-white/10">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-blue-300 to-pink-300">StudySync</h1>
            <div className="flex items-center gap-4">
               <button onClick={() => setShowProfile(true)} className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                     {currentUser?.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white/80 text-sm hidden sm:block hover:text-white transition-colors">Hi, {currentUser?.displayName}</span>
               </button>
               <button
                  onClick={logout}
                  className="bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-400/30 text-white/70 hover:text-red-300 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2"
               >
                  <LogOut size={16} />
                  <span className="hidden sm:block">Logout</span>
               </button>
            </div>
          </div>

          {/* Page transitions */}
          <div className="relative z-10 pt-20">
            <AnimatePresence mode="wait">
          {page === PAGES.HERO && (
            <HeroPage key="hero" onStart={handleStart} />
          )}
          {page === PAGES.INPUT && (
            <InputFormPage
              key="input"
              onBack={() => setPage(PAGES.HERO)}
              onGenerate={handleGenerate}
              initialData={formData}
            />
          )}
          {page === PAGES.LOADING && (
            <LoadingPage key="loading" progress={loadingProgress} stage={loadingStage} />
          )}
          {page === PAGES.DASHBOARD && schedule && (
            <ScheduleDashboard
              key="dashboard"
              schedule={schedule}
              subjects={formData?.subjects || []}
              onRegenerate={handleRegenerate}
              onBack={handleBackToInput}
            />
          )}
        </AnimatePresence>
          </div>

          <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
        </>
      )}
    </>
  );
}
