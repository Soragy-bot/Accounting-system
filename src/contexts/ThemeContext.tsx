import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme-mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'system';
  });

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    let initialTheme: 'light' | 'dark';
    if (themeMode === 'system') {
      initialTheme = getSystemTheme();
    } else {
      initialTheme = themeMode;
    }
    // Устанавливаем тему сразу при инициализации для предотвращения мигания
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialTheme);
      document.body.setAttribute('data-theme', initialTheme);
    }
    return initialTheme;
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    
    if (mode === 'system') {
      setTheme(getSystemTheme());
    } else {
      setTheme(mode);
    }
  };

  useEffect(() => {
    const updateTheme = () => {
      if (themeMode === 'system') {
        setTheme(getSystemTheme());
      }
    };

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      updateTheme();

      return () => {
        mediaQuery.removeEventListener('change', updateTheme);
      };
    }
  }, [themeMode]);

  useEffect(() => {
    // Устанавливаем тему сразу при монтировании
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Также устанавливаем тему в body для дополнительной поддержки
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

