import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { safeGetItem, safeSetItem } from '../utils/localStorage';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme-mode';

/**
 * Определяет системную тему пользователя
 */
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // При инициализации определяем тему: сначала из localStorage, если нет - из системы
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = safeGetItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Миграция: если было сохранено 'system', определяем системную тему и сохраняем её
    if (saved === 'system') {
      const systemTheme = getSystemTheme();
      safeSetItem(THEME_STORAGE_KEY, systemTheme);
      return systemTheme;
    }
    // Если в localStorage нет сохраненной темы, используем системную и сохраняем её
    const systemTheme = getSystemTheme();
    safeSetItem(THEME_STORAGE_KEY, systemTheme);
    return systemTheme;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Устанавливаем тему сразу при инициализации для предотвращения мигания
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeMode);
      document.body.setAttribute('data-theme', themeMode);
    }
    return themeMode;
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setTheme(mode);
    safeSetItem(THEME_STORAGE_KEY, mode);
  };

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

