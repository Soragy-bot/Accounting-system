import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHistory } from '../features/cash-counter/services/cashStorage';
import { CashEntry } from '../features/cash-counter/types';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
  const [recentEntries, setRecentEntries] = useState<CashEntry[]>([]);

  useEffect(() => {
    const loadRecentEntries = () => {
      const history = getHistory();
      // Берем последние 5 записей
      setRecentEntries(history.slice(0, 5));
    };

    loadRecentEntries();

    // Обновляем список при фокусе на окне (когда пользователь возвращается на вкладку)
    const handleFocus = () => {
      loadRecentEntries();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerActions}>
          <ThemeToggle />
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Система учета</h1>
          <p className={styles.subtitle}>
            Удобные инструменты для ведения учета кассы и расчета зарплаты
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.actions}>
          <Link to="/cash-counter" className={styles.primaryButton}>
            <span className={styles.buttonIcon}>💰</span>
            <span className={styles.buttonText}>
              <span className={styles.buttonTitle}>Подсчет кассы</span>
              <span className={styles.buttonDescription}>
                Перейти к подсчету кассы
              </span>
            </span>
          </Link>
          <Link to="/salary-calculator" className={styles.primaryButton}>
            <span className={styles.buttonIcon}>💵</span>
            <span className={styles.buttonText}>
              <span className={styles.buttonTitle}>Расчет зарплаты</span>
              <span className={styles.buttonDescription}>
                Рассчитать зарплату сотрудника
              </span>
            </span>
          </Link>
        </div>

        {recentEntries.length > 0 && (
          <div className={styles.recentSection}>
            <h2 className={styles.sectionTitle}>Последние подсчеты</h2>
            <div className={styles.entriesList}>
              {recentEntries.map((entry) => (
                <div key={entry.id} className={styles.entryCard}>
                  <div className={styles.entryHeader}>
                    <span className={styles.entryDate}>
                      {formatDate(entry.timestamp)}
                    </span>
                    <span
                      className={`${styles.entryAmount} ${
                        entry.totalAmount >= 0
                          ? styles.positive
                          : styles.negative
                      }`}
                    >
                      {formatAmount(entry.totalAmount)}
                    </span>
                  </div>
                  <div className={styles.entryDetails}>
                    <span>
                      Начальная сумма: {entry.initialAmount.toFixed(2)} ₽
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {recentEntries.length === 5 && (
              <Link to="/cash-counter" className={styles.viewAllLink}>
                Просмотреть все подсчеты →
              </Link>
            )}
          </div>
        )}

        {recentEntries.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <p className={styles.emptyText}>
              У вас пока нет сохраненных подсчетов
            </p>
            <p className={styles.emptyDescription}>
              Начните новый подсчет, чтобы отслеживать состояние кассы
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

