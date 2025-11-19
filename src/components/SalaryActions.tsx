import React from 'react';
import styles from './SalaryActions.module.css';

interface SalaryActionsProps {
  onSave: () => void;
  onExport: () => void;
  onReset: () => void;
  canSave: boolean;
  canExport: boolean;
}

/**
 * Компонент для действий с расчетом зарплаты (сохранение, экспорт, сброс)
 */
export const SalaryActions: React.FC<SalaryActionsProps> = ({
  onSave,
  onExport,
  onReset,
  canSave,
  canExport,
}) => {
  return (
    <div className={styles.actions}>
      <button
        onClick={onSave}
        className={styles.saveButton}
        disabled={!canSave}
        aria-label="Сохранить расчет зарплаты"
      >
        Сохранить расчет
      </button>
      <button
        onClick={onExport}
        className={styles.exportButton}
        disabled={!canExport}
        aria-label="Экспортировать расчет в Excel"
      >
        Экспорт в Excel
      </button>
      <button
        onClick={onReset}
        className={styles.resetButton}
        aria-label="Сбросить все данные"
      >
        Сбросить
      </button>
    </div>
  );
};

