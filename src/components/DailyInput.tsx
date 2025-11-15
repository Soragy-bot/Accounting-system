import React from 'react';
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
}) => {
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
    if (value === '') {
      onSalesChange(date, 0);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onSalesChange(date, numValue);
    }
  };

  const handleTargetProductsCountChange = (date: string, value: string) => {
    if (value === '') {
      onTargetProductsCountChange(date, 0);
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
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
      <h2 className={styles.title}>Данные по рабочим дням</h2>
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
              {isLoading && (
                <div className={styles.loading}>
                  Загрузка данных из API...
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
                        className={styles.input}
                        placeholder="0.00"
                        disabled={isLoading}
                      />
                      <span className={styles.currency}>₽</span>
                    </div>
                  </label>
                  
                  <label className={styles.inputGroup}>
                    <span className={styles.inputLabel}>Целевые товары (шт.)</span>
                    <input
                      type="number"
                      min="0"
                      value={targetProductsCount[date] || ''}
                      onChange={(e) => handleTargetProductsCountChange(date, e.target.value)}
                      onWheel={handleWheel}
                      className={styles.input}
                      placeholder="0"
                      disabled={isLoading}
                    />
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

