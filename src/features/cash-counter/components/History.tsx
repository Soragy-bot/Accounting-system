import React, { useState, useEffect } from 'react';
import { CashEntry } from '../types';
import { cashApi } from '../../../shared/api/cash/api';
import { useNotification } from '../../../contexts/NotificationContext';
import styles from './History.module.css';

interface HistoryProps {
  onLoadEntry: (entry: CashEntry) => void;
  refreshTrigger?: number;
}

export const History: React.FC<HistoryProps> = ({ onLoadEntry, refreshTrigger }) => {
  const { showError } = useNotification();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [refreshTrigger]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await cashApi.getHistory();
      setEntries(history);
    } catch (error) {
      console.error('Failed to load history:', error);
      showError('Не удалось загрузить историю');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    // Очистка истории не реализована на бэкенде, можно добавить позже
    if (window.confirm('Очистка всей истории пока не доступна. Вы можете удалять записи по одной.')) {
      // Пока ничего не делаем
    }
  };

  const handleLoad = (entry: CashEntry) => {
    onLoadEntry(entry);
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      try {
        await cashApi.deleteEntry(id);
        await loadHistory();
      } catch (error) {
        console.error('Failed to delete entry:', error);
        showError('Не удалось удалить запись');
      }
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
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${amount.toFixed(2)} ₽`;
  };

  if (!isOpen) {
    return (
      <div className={styles.container}>
        <button
          onClick={() => setIsOpen(true)}
          className={styles.toggleButton}
          aria-label={`Показать историю подсчетов. Всего записей: ${entries.length}`}
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
        <h2 className={styles.title}>История подсчетов</h2>
        <div className={styles.actions}>
          <button 
            onClick={handleClear} 
            className={styles.clearButton}
            aria-label="Очистить всю историю подсчетов"
          >
            Очистить
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
            aria-label="Скрыть историю подсчетов"
            aria-expanded="true"
          >
            Скрыть
          </button>
        </div>
      </div>

      {loading ? (
        <p className={styles.empty} role="status" aria-live="polite">Загрузка...</p>
      ) : entries.length === 0 ? (
        <p className={styles.empty} role="status" aria-live="polite">История пуста</p>
      ) : (
        <div className={styles.list} role="list" aria-label="Список записей истории подсчетов">
          {entries.map((entry) => (
            <div key={entry.id} className={styles.entry} role="listitem">
              <div className={styles.entryHeader}>
                <time className={styles.date} dateTime={new Date(entry.timestamp).toISOString()}>
                  {formatDate(entry.timestamp)}
                </time>
                <span
                  className={`${styles.total} ${
                    entry.totalAmount >= 0 ? styles.positive : styles.negative
                  }`}
                  aria-label={`Итоговая сумма: ${formatAmount(entry.totalAmount)}`}
                >
                  {formatAmount(entry.totalAmount)}
                </span>
              </div>
              <div className={styles.entryDetails}>
                <span>Начальная сумма: {entry.initialAmount.toFixed(2)} ₽</span>
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

