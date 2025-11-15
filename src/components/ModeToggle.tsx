import React from 'react';
import styles from './ModeToggle.module.css';

interface ModeToggleProps {
  mode: 'manual' | 'api';
  onModeChange: (mode: 'manual' | 'api') => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Режим работы:</label>
      <div className={styles.toggle}>
        <button
          type="button"
          className={`${styles.button} ${mode === 'manual' ? styles.active : ''}`}
          onClick={() => onModeChange('manual')}
        >
          Ручной
        </button>
        <button
          type="button"
          className={`${styles.button} ${mode === 'api' ? styles.active : ''}`}
          onClick={() => onModeChange('api')}
        >
          API МойСклад
        </button>
      </div>
    </div>
  );
};
