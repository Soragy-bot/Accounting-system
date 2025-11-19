import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { safeGetItem, safeSetItem } from '../shared/api/storage';

export type ThemeMode = 'light' | 'dark';
export type ColorPalette = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'cyan' | 'teal' | 'indigo' | 'amber' | 'midnight';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  colorPalette: ColorPalette;
  setThemeMode: (mode: ThemeMode) => void;
  setColorPalette: (palette: ColorPalette) => void;
  availablePalettes: { value: ColorPalette; label: string; icon: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme-mode';
const COLOR_PALETTE_KEY = 'app-color-palette';

export const availablePalettes = [
  { value: 'midnight' as ColorPalette, label: 'Полночь', icon: '🌘' },
  { value: 'blue' as ColorPalette, label: 'Синяя', icon: '🔵' },
  { value: 'purple' as ColorPalette, label: 'Фиолетовая', icon: '💜' },
  { value: 'green' as ColorPalette, label: 'Зеленая', icon: '🟢' },
  { value: 'orange' as ColorPalette, label: 'Оранжевая', icon: '🟠' },
  { value: 'red' as ColorPalette, label: 'Красная', icon: '🔴' },
  { value: 'pink' as ColorPalette, label: 'Розовая', icon: '🌸' },
  { value: 'cyan' as ColorPalette, label: 'Голубая', icon: '💎' },
  { value: 'teal' as ColorPalette, label: 'Бирюзовая', icon: '🌊' },
  { value: 'indigo' as ColorPalette, label: 'Индиго', icon: '💙' },
  { value: 'amber' as ColorPalette, label: 'Янтарная', icon: '🟡' },
];

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

  // Цветовая палитра независима от темы
  const [colorPalette, setColorPaletteState] = useState<ColorPalette>(() => {
    const saved = safeGetItem(COLOR_PALETTE_KEY);
    const validPalettes: ColorPalette[] = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'cyan', 'teal', 'indigo', 'amber', 'midnight'];
    if (saved && validPalettes.includes(saved as ColorPalette)) {
      return saved as ColorPalette;
    }
    // По умолчанию палитра "Полночь"
    safeSetItem(COLOR_PALETTE_KEY, 'midnight');
    return 'midnight';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Устанавливаем тему сразу при инициализации для предотвращения мигания
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeMode);
      document.documentElement.setAttribute('data-color-palette', colorPalette);
      document.body.setAttribute('data-theme', themeMode);
    }
    return themeMode;
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setTheme(mode);
    safeSetItem(THEME_STORAGE_KEY, mode);
    
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
      document.body.setAttribute('data-theme', mode);
    }
  };

  const setColorPalette = (palette: ColorPalette) => {
    setColorPaletteState(palette);
    safeSetItem(COLOR_PALETTE_KEY, palette);
    
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-color-palette', palette);
    }
  };

  useEffect(() => {
    // Устанавливаем тему и палитру сразу при монтировании
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-color-palette', colorPalette);
    
    // Также устанавливаем тему в body для дополнительной поддержки
    document.body.setAttribute('data-theme', theme);
  }, [theme, colorPalette]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode, 
      colorPalette,
      setThemeMode, 
      setColorPalette,
      availablePalettes 
    }}>
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

