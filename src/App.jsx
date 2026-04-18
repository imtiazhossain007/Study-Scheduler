import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import HeroPage from './pages/HeroPage';
import InputFormPage from './pages/InputFormPage';
import LoadingPage from './pages/LoadingPage';
import ScheduleDashboard from './pages/ScheduleDashboard';
import ThemeToggle from './components/ThemeToggle';
import { generateSchedule } from './services/claude';
import { saveToStorage, loadFromStorage } from './utils/storage';

const PAGES = {
  HERO: 'hero',
  INPUT: 'input',
  LOADING: 'loading',
  DASHBOARD: 'dashboard',
};

export default function App() {
  const [page, setPage] = useState(PAGES.HERO);
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

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('study-scheduler-theme', theme);
  }, [theme]);

  // Restore saved state
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved?.schedule && saved?.formData) {
      setFormData(saved.formData);
      setSchedule(saved.schedule);
      // Don't auto-navigate — let user choose from hero
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleStart = () => {
    // If we have saved data, offer to restore
    const saved = loadFromStorage();
    if (saved?.schedule && saved?.formData) {
      setFormData(saved.formData);
      setSchedule(saved.schedule);
      setPage(PAGES.DASHBOARD);
    } else {
      setPage(PAGES.INPUT);
    }
  };

  const handleGenerate = useCallback(async (data) => {
    setFormData(data);
    setPage(PAGES.LOADING);
    setLoadingProgress(0);

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

    try {
      const result = await generateSchedule(data.subjects, data.hoursPerDay, data.daysOff);
      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Save to localStorage
      saveToStorage({ formData: data, schedule: result });

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
      {/* Animated background */}
      <div className="animated-bg" />

      {/* Theme toggle */}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            borderRadius: '12px',
          },
        }}
      />

      {/* Page transitions */}
      <div className="relative z-10">
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
            <LoadingPage key="loading" progress={loadingProgress} />
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
    </>
  );
}
