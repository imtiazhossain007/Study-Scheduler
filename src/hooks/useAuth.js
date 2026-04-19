import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadUserFromStorage = useCallback(() => {
    try {
      const currentUserId = localStorage.getItem('sched_current_user');
      if (currentUserId) {
        const usersStr = localStorage.getItem('sched_users');
        if (usersStr) {
          const users = JSON.parse(usersStr);
          const user = users.find(u => u.id === currentUserId);
          if (user) {
            setCurrentUser(user);
            setIsLoggedIn(true);
            return;
          }
        }
      }
      setCurrentUser(null);
      setIsLoggedIn(false);
    } catch (e) {
      console.error('Failed to parse users from localStorage', e);
      localStorage.setItem('sched_users', '[]');
      setCurrentUser(null);
      setIsLoggedIn(false);
    }
  }, []);

  // Initialize on mount and listen to changes
  useEffect(() => {
    loadUserFromStorage();
    
    const handleAuthChange = () => {
      loadUserFromStorage();
    };

    window.addEventListener('auth_changed', handleAuthChange);
    return () => window.removeEventListener('auth_changed', handleAuthChange);
  }, [loadUserFromStorage]);

  const login = async (username, password) => {
    try {
      const usersStr = localStorage.getItem('sched_users') || '[]';
      const users = JSON.parse(usersStr);
      
      const normalizedUsername = username.toLowerCase().trim();
      const user = users.find(u => u.username === normalizedUsername);
      
      if (!user) {
        return { success: false, error: 'No account found. Please sign up.' };
      }

      const inputHash = await hashPassword(password);
      if (user.passwordHash !== inputHash) {
        return { success: false, error: 'Invalid username or password' };
      }

      localStorage.setItem('sched_current_user', user.id);
      setCurrentUser(user);
      setIsLoggedIn(true);
      window.dispatchEvent(new Event('auth_changed'));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Login failed due to storage error' };
    }
  };

  const signup = async (username, displayName, password) => {
    try {
      const usersStr = localStorage.getItem('sched_users') || '[]';
      let users = JSON.parse(usersStr);

      if (!Array.isArray(users)) {
         users = [];
      }
      
      if (users.length >= 50) {
        return { success: false, error: 'Device storage full (max 50 accounts)' };
      }

      const normalizedUsername = username.toLowerCase().trim();
      
      if (normalizedUsername.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }
      
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      if (users.some(u => u.username === normalizedUsername)) {
        const suggestions = [];
        const suffixes = ['123', '42', '99', '2026', 'x', '_pro', '88'];
        let attempts = 0;
        while (suggestions.length < 3 && attempts < 20) {
          const randSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
          const randNum = Math.floor(Math.random() * 1000);
          const suggestion = attempts < 5 
            ? `${normalizedUsername}${randSuffix}` 
            : `${normalizedUsername}${randNum}`;
            
          if (!users.some(u => u.username === suggestion) && !suggestions.includes(suggestion)) {
            suggestions.push(suggestion);
          }
          attempts++;
        }
        return { success: false, error: 'Username already taken', suggestions };
      }

      const passwordHash = await hashPassword(password);
      const newUser = {
        id: uuidv4(),
        username: normalizedUsername,
        passwordHash,
        createdAt: new Date().toISOString(),
        displayName: displayName.trim() || normalizedUsername,
        data: {
          subjects: [],
          schedule: [],
          hoursPerDay: 4,
          daysOff: [],
          lastUpdated: null,
          scheduleHistory: []
        }
      };

      users.push(newUser);
      localStorage.setItem('sched_users', JSON.stringify(users));
      
      localStorage.setItem('sched_current_user', newUser.id);
      setCurrentUser(newUser);
      setIsLoggedIn(true);
      window.dispatchEvent(new Event('auth_changed'));
      
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Signup failed due to storage error' };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('sched_current_user');
    setCurrentUser(null);
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('auth_changed'));
  }, []);

  const saveUserData = useCallback((dataObject) => {
    if (!currentUser) return;
    try {
      const usersStr = localStorage.getItem('sched_users') || '[]';
      const users = JSON.parse(usersStr);
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex !== -1) {
        // Handle schedule history
        let newHistory = users[userIndex].data.scheduleHistory || [];
        if (dataObject.schedule && dataObject.schedule.length > 0) {
           const maxNumber = newHistory.reduce((max, h) => {
             const match = h.label.match(/#(\d+)/);
             return match ? Math.max(max, parseInt(match[1])) : max;
           }, 0);
           
           const historyEntry = {
              id: uuidv4(),
              generatedAt: new Date().toISOString(),
              subjects: dataObject.subjects || [],
              schedule: dataObject.schedule,
              label: `Schedule #${maxNumber + 1}`
           };
           newHistory.push(historyEntry);
           
           // Keep max 5 entries
           if (newHistory.length > 5) {
             newHistory = newHistory.slice(newHistory.length - 5);
           }
        }

        users[userIndex].data = {
          ...users[userIndex].data,
          ...dataObject,
          scheduleHistory: newHistory,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('sched_users', JSON.stringify(users));
        setCurrentUser(users[userIndex]);
        window.dispatchEvent(new Event('auth_changed'));
      }
    } catch (e) {
      console.error('Failed to save user data', e);
    }
  }, [currentUser]);

  const deleteHistoryItem = useCallback((historyId) => {
    if (!currentUser) return;
    try {
      const usersStr = localStorage.getItem('sched_users') || '[]';
      const users = JSON.parse(usersStr);
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        const history = users[userIndex].data.scheduleHistory || [];
        users[userIndex].data.scheduleHistory = history.filter(h => h.id !== historyId);
        localStorage.setItem('sched_users', JSON.stringify(users));
        setCurrentUser(users[userIndex]);
        window.dispatchEvent(new Event('auth_changed'));
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const restoreHistoryItem = useCallback((historyId) => {
    if (!currentUser) return;
    try {
      const usersStr = localStorage.getItem('sched_users') || '[]';
      const users = JSON.parse(usersStr);
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        const history = users[userIndex].data.scheduleHistory || [];
        const entry = history.find(h => h.id === historyId);
        if (entry) {
           users[userIndex].data = {
             ...users[userIndex].data,
             schedule: entry.schedule,
             subjects: entry.subjects,
             lastUpdated: new Date().toISOString()
           };
           localStorage.setItem('sched_users', JSON.stringify(users));
           setCurrentUser(users[userIndex]);
           window.dispatchEvent(new Event('auth_changed'));
           return entry;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [currentUser]);

  const getAllUsers = () => {
    try {
      const usersStr = localStorage.getItem('sched_users') || '[]';
      return JSON.parse(usersStr);
    } catch {
      return [];
    }
  };

  const updatePassword = async (oldPassword, newPassword) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    try {
      const usersStr = localStorage.getItem('sched_users') || '[]';
      const users = JSON.parse(usersStr);
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex === -1) return { success: false, error: 'User not found' };
      
      const user = users[userIndex];
      const oldHash = await hashPassword(oldPassword);
      
      if (user.passwordHash !== oldHash) {
        return { success: false, error: 'Incorrect current password' };
      }
      
      const newHash = await hashPassword(newPassword);
      users[userIndex].passwordHash = newHash;
      
      localStorage.setItem('sched_users', JSON.stringify(users));
      setCurrentUser(users[userIndex]);
      window.dispatchEvent(new Event('auth_changed'));
      
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Failed to update password' };
    }
  };

  return {
    currentUser,
    isLoggedIn,
    login,
    signup,
    logout,
    saveUserData,
    getAllUsers,
    deleteHistoryItem,
    restoreHistoryItem,
    updatePassword
  };
}
