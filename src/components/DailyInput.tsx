import React, { useState } from 'react';
import { parseAndValidateMoney, parseAndValidateInteger } from '../utils/validation';
import { LoadingSkeleton } from './LoadingSkeleton';
import styles from './DailyInput.module.css';

interface DailyInputProps {
  workDays: string[];
  salesByDay: { [date: string]: number };
  targetProductsCount: { [date: string]: number };
  onSalesChange: (date: string, value: number) => void;
  onTargetProductsCountChange: (date: string, value: number) => void;
  mode?: 'manual' | 'api';
  loadingDays?: string[];
  errorDays?: { [date: string]: string };
  dataSource?: { [date: string]: 'manual' | 'api' };
  onRefresh?: () => void;
  onRefreshDay?: (date: string) => void;
}

export const DailyInput: React.FC<DailyInputProps> = ({
  workDays,
  salesByDay,
  targetProductsCount,
  onSalesChange,
  onTargetProductsCountChange,
  mode = 'manual',
  loadingDays = [],
  errorDays = {},
  dataSource = {},
  onRefresh,
  onRefreshDay,
}) => {
  const [validationErrors, setValidationErrors] = useState<{
    [date: string]: { sales?: string; targetProducts?: string };
  }>({});

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short',
    });
  };

  const handleSalesChange = (date: string, value: string) => {
    const { value: numValue, validation } = parseAndValidateMoney(value);
    
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (!newErrors[date]) {
        newErrors[date] = {};
      }
      if (!validation.isValid && validation.error) {
        newErrors[date].sales = validation.error;
      } else {
        delete newErrors[date].sales;
        if (Object.keys(newErrors[date]).length === 0) {
          delete newErrors[date];
        }
      }
      return newErrors;
    });

    if (validation.isValid) {
      onSalesChange(date, numValue);
    }
  };

  const handleTargetProductsCountChange = (date: string, value: string) => {
    const { value: numValue, validation } = parseAndValidateInteger(value);
    
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (!newErrors[date]) {
        newErrors[date] = {};
      }
      if (!validation.isValid && validation.error) {
        newErrors[date].targetProducts = validation.error;
      } else {
        delete newErrors[date].targetProducts;
        if (Object.keys(newErrors[date]).length === 0) {
          delete newErrors[date];
        }
      }
      return newErrors;
    });

    if (validation.isValid) {
      onTargetProductsCountChange(date, numValue);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
    e.preventDefault();
  };

  if (workDays.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Данные по рабочим дням</h2>
        <p className={styles.emptyMessage}>
          Выберите рабочие дни в календаре для ввода данных
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Данные по рабочим дням</h2>
        {mode === 'api' && onRefresh && (
          <button
            onClick={onRefresh}
            className={styles.refreshButton}
            disabled={loadingDays.length > 0 || workDays.length === 0}
            title="Обновить все данные из API"
          >
            <span className={styles.refreshIcon}>↻</span>
            Обновить всё
          </button>
        )}
      </div>
      <div className={styles.daysList}>
        {workDays.map((date) => {
          const isLoading = loadingDays.includes(date);
          const error = errorDays[date];
          const source = dataSource[date] || mode;
          const isApiData = source === 'api';

          return (
            <div key={date} className={styles.dayItem}>
              <div className={styles.dayHeader}>
                <span className={styles.dateLabel}>{formatDate(date)}</span>
                <div className={styles.dayHeaderActions}>
                  {mode === 'api' && onRefreshDay && (
                    <button
                      onClick={() => onRefreshDay(date)}
                      className={styles.refreshDayButton}
                      disabled={isLoading}
                      title="Обновить данные этого дня из API"
                    >
                      <span className={styles.refreshDayIcon}>↻</span>
                    </button>
                  )}
                  {isApiData && (
                    <span className={styles.dataSource} title="Данные загружены из API">
                      API
                    </span>
                  )}
                  {source === 'manual' && mode === 'api' && (
                    <span className={styles.dataSourceManual} title="Ручной ввод">
                      Ручной
                    </span>
                  )}
                </div>
              </div>
              {isLoading && (
                <div className={styles.loadingContainer}>
                  <LoadingSkeleton width="100%" height="2rem" />
                  <LoadingSkeleton width="60%" height="2rem" />
                  <span className={styles.loadingText}>Загрузка данных из API...</span>
                </div>
              )}
              {error && (
                <div className={styles.error}>
                  Ошибка: {error}
                </div>
              )}
              {!isLoading && (
                <div className={styles.inputsRow}>
                  <label className={styles.inputGroup}>
                    <span className={styles.inputLabel}>Сумма продаж (₽)</span>
                    <div className={styles.inputWrapper}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={salesByDay[date] || ''}
                        onChange={(e) => handleSalesChange(date, e.target.value)}
                        onWheel={handleWheel}
                        className={`${styles.input} ${validationErrors[date]?.sales ? styles.inputError : ''}`}
                        placeholder="0.00"
                        disabled={isLoading}
                        aria-invalid={!!validationErrors[date]?.sales}
                        aria-describedby={validationErrors[date]?.sales ? `sales-error-${date}` : undefined}
                      />
                      <span className={styles.currency}>₽</span>
                    </div>
                    {validationErrors[date]?.sales && (
                      <span id={`sales-error-${date}`} className={styles.validationError} role="alert">
                        {validationErrors[date].sales}
                      </span>
                    )}
                  </label>
                  
                  <label className={styles.inputGroup}>
                    <span className={styles.inputLabel}>Целевые товары (шт.)</span>
                    <input
                      type="number"
                      min="0"
                      value={targetProductsCount[date] || ''}
                      onChange={(e) => handleTargetProductsCountChange(date, e.target.value)}
                      onWheel={handleWheel}
                      className={`${styles.input} ${validationErrors[date]?.targetProducts ? styles.inputError : ''}`}
                      placeholder="0"
                      disabled={isLoading}
                      aria-invalid={!!validationErrors[date]?.targetProducts}
                      aria-describedby={validationErrors[date]?.targetProducts ? `target-products-error-${date}` : undefined}
                    />
                    {validationErrors[date]?.targetProducts && (
                      <span id={`target-products-error-${date}`} className={styles.validationError} role="alert">
                        {validationErrors[date].targetProducts}
                      </span>
                    )}
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

