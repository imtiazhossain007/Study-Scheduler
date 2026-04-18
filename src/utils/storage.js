const STORAGE_KEY = 'study-scheduler-data';

export const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

export const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
    return null;
  }
};

export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
};
