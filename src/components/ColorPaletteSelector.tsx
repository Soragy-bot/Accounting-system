import React, { useState, useRef, useEffect } from 'react';
import { useTheme, availablePalettes } from '../contexts/ThemeContext';
import styles from './ColorPaletteSelector.module.css';

export const ColorPaletteSelector: React.FC = () => {
  const { colorPalette, setColorPalette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (palette: typeof availablePalettes[0]['value']) => {
    setColorPalette(palette);
    setIsOpen(false);
  };

  const currentPalette = availablePalettes.find(p => p.value === colorPalette);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Выбор цветовой палитры"
        aria-expanded={isOpen}
      >
        <span className={styles.icon}>{currentPalette?.icon}</span>
        <span className={styles.label}>{currentPalette?.label}</span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {availablePalettes.map((palette) => (
            <button
              key={palette.value}
              className={`${styles.option} ${colorPalette === palette.value ? styles.active : ''}`}
              onClick={() => handleSelect(palette.value)}
              aria-label={`Выбрать ${palette.label} палитру`}
            >
              <span className={styles.optionIcon}>{palette.icon}</span>
              <span className={styles.optionLabel}>{palette.label}</span>
              {colorPalette === palette.value && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

