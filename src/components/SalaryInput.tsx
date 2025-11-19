import React, { useState } from 'react';
import { parseAndValidateMoney, parseAndValidatePercentage } from '../utils/validation';
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
  const [dailyRateError, setDailyRateError] = useState<string | undefined>();
  const [salesPercentageError, setSalesPercentageError] = useState<string | undefined>();

  const handleDailyRateChange = (value: string) => {
    const { value: numValue, validation } = parseAndValidateMoney(value);
    
    if (!validation.isValid && validation.error) {
      setDailyRateError(validation.error);
    } else {
      setDailyRateError(undefined);
      onDailyRateChange(numValue);
    }
  };

  const handleSalesPercentageChange = (value: string) => {
    const { value: numValue, validation } = parseAndValidatePercentage(value, 0, 100);
    
    if (!validation.isValid && validation.error) {
      setSalesPercentageError(validation.error);
    } else {
      setSalesPercentageError(undefined);
      onSalesPercentageChange(numValue);
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
            onChange={(e) => handleDailyRateChange(e.target.value)}
            onWheel={handleWheel}
            className={`${styles.input} ${dailyRateError ? styles.inputError : ''}`}
            placeholder="0.00"
            aria-invalid={!!dailyRateError}
            aria-describedby={dailyRateError ? 'dailyRate-error' : undefined}
          />
          {dailyRateError && (
            <span id="dailyRate-error" className={styles.errorMessage} role="alert">
              {dailyRateError}
            </span>
          )}
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
            onChange={(e) => handleSalesPercentageChange(e.target.value)}
            onWheel={handleWheel}
            className={`${styles.input} ${salesPercentageError ? styles.inputError : ''}`}
            placeholder="0"
            aria-invalid={!!salesPercentageError}
            aria-describedby={salesPercentageError ? 'salesPercentage-error' : undefined}
          />
          {salesPercentageError && (
            <span id="salesPercentage-error" className={styles.errorMessage} role="alert">
              {salesPercentageError}
            </span>
          )}
        </label>
      </div>
    </div>
  );
};

