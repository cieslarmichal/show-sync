import { useState, useEffect, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './ThemeContext';

interface Props {
  children: ReactNode;
}

export function ThemeContextProvider({ children }: Props) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateEffectiveTheme = () => {
      let resolved: 'light' | 'dark';

      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }

      setEffectiveTheme(resolved);

      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
    };

    updateEffectiveTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateEffectiveTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>{children}</ThemeContext.Provider>;
}
