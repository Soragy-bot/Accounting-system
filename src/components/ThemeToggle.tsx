import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();

  const handleToggle = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  const getIcon = () => {
    if (themeMode === 'light') {
      return '☀️';
    } else if (themeMode === 'dark') {
      return '🌙';
    } else {
      return '💻';
    }
  };

  const getLabel = () => {
    if (themeMode === 'light') {
      return 'Светлая';
    } else if (themeMode === 'dark') {
      return 'Тёмная';
    } else {
      return 'Системная';
    }
  };

  return (
    <button
      className={styles.toggleButton}
      onClick={handleToggle}
      aria-label={`Тема: ${getLabel()}`}
      title={`Текущая тема: ${getLabel()}. Нажмите для переключения`}
    >
      <span className={styles.icon}>{getIcon()}</span>
      <span className={styles.label}>{getLabel()}</span>
    </button>
  );
};

