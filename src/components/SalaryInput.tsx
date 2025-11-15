import React from 'react';
import styles from './SalaryInput.module.css';

interface SalaryInputProps {
  dailyRate: number;
  salesPercentage: number;
  onDailyRateChange: (value: number) => void;
  onSalesPercentageChange: (value: number) => void;
}

export const SalaryInput: React.FC<SalaryInputProps> = ({
  dailyRate,
  salesPercentage,
  onDailyRateChange,
  onSalesPercentageChange,
}) => {
  const handleChange = (
    value: string,
    onChange: (value: number) => void
  ) => {
    if (value === '') {
      onChange(0);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
    e.preventDefault();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Параметры зарплаты</h2>
      
      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <span className={styles.labelText}>Ставка за день (₽)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={dailyRate || ''}
            onChange={(e) => handleChange(e.target.value, onDailyRateChange)}
            onWheel={handleWheel}
            className={styles.input}
            placeholder="0.00"
          />
        </label>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>
          <span className={styles.labelText}>Процент с продаж (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={salesPercentage || ''}
            onChange={(e) => handleChange(e.target.value, onSalesPercentageChange)}
            onWheel={handleWheel}
            className={styles.input}
            placeholder="0"
          />
        </label>
      </div>
    </div>
  );
};

