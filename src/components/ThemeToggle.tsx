import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ColorPaletteSelector } from './ColorPaletteSelector';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();

  const handleToggle = () => {
    // Переключаем между светлой и тёмной темой
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const getIcon = () => {
    return themeMode === 'light' ? '☀️' : '🌙';
  };

  const getLabel = () => {
    return themeMode === 'light' ? 'Светлая' : 'Тёмная';
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.toggleButton}
        onClick={handleToggle}
        aria-label={`Тема: ${getLabel()}. Нажмите для переключения`}
        title={`Текущая тема: ${getLabel()}. Нажмите для переключения`}
      >
        <span className={styles.icon}>{getIcon()}</span>
        <span className={styles.label}>{getLabel()}</span>
      </button>
      <ColorPaletteSelector />
    </div>
  );
};

