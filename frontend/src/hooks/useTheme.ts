import { useEffect, useState } from 'react';
import { Theme } from '../types/dashboard';

// Must match the inline script in index.html, which applies the theme before
// React renders (prevents a flash of the wrong theme on load).
const STORAGE_KEY = 'kats-theme';

function initialTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable (private mode) - theme just isn't remembered
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
