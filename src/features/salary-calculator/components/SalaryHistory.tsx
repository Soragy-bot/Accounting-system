import React, { useState, useEffect } from 'react';
import { SalaryCalculation } from '../types';
import { getHistory, clearHistory, deleteSalaryEntry } from '../services/salaryStorage';
import styles from './SalaryHistory.module.css';

interface SalaryHistoryProps {
  onLoadEntry: (entry: SalaryCalculation) => void;
  refreshTrigger?: number;
}

export const SalaryHistory: React.FC<SalaryHistoryProps> = ({ onLoadEntry, refreshTrigger }) => {
  const [entries, setEntries] = useState<SalaryCalculation[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  const loadHistory = () => {
    const history = getHistory();
    setEntries(history);
  };

  const handleClear = () => {
    if (window.confirm('Вы уверены, что хотите очистить историю?')) {
      clearHistory();
      setEntries([]);
    }
  };

  const handleLoad = (entry: SalaryCalculation) => {
    onLoadEntry(entry);
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      deleteSalaryEntry(id);
      loadHistory();
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number): string => {
    return `${amount.toFixed(2)} ₽`;
  };

  if (!isOpen) {
    return (
      <div className={styles.container}>
        <button
          onClick={() => setIsOpen(true)}
          className={styles.toggleButton}
          aria-label={`Показать историю расчетов. Всего записей: ${entries.length}`}
          aria-expanded="false"
        >
          Показать историю ({entries.length})
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>История расчетов</h2>
        <div className={styles.actions}>
          <button 
            onClick={handleClear} 
            className={styles.clearButton}
            aria-label="Очистить всю историю расчетов"
          >
            Очистить
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
            aria-label="Скрыть историю расчетов"
            aria-expanded="true"
          >
            Скрыть
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className={styles.empty} role="status" aria-live="polite">История пуста</p>
      ) : (
        <div className={styles.list} role="list" aria-label="Список записей истории расчетов">
          {entries.map((entry) => (
            <div key={entry.id} className={styles.entry} role="listitem">
              <div className={styles.entryHeader}>
                <time className={styles.date} dateTime={new Date(entry.timestamp).toISOString()}>
                  {formatDate(entry.timestamp)}
                </time>
                <span
                  className={styles.total}
                  aria-label={`Итоговая зарплата: ${formatAmount(entry.totalSalary)}`}
                >
                  {formatAmount(entry.totalSalary)}
                </span>
              </div>
              <div className={styles.entryDetails}>
                <span>Дней: {entry.workDays.length}</span>
                <span>Ставка: {formatAmount(entry.dailyRate)}/день</span>
              </div>
              <div className={styles.entryActions}>
                <button
                  onClick={() => handleLoad(entry)}
                  className={styles.loadButton}
                  aria-label={`Загрузить запись от ${formatDate(entry.timestamp)}`}
                >
                  Загрузить
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className={styles.deleteButton}
                  aria-label={`Удалить запись от ${formatDate(entry.timestamp)}`}
                  title="Удалить запись"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

