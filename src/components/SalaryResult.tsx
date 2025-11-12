import React from 'react';
import styles from './SalaryResult.module.css';

interface SalaryResultProps {
  rateSalary: number;
  salesBonus: number;
  targetBonus: number;
  totalSalary: number;
  workDaysCount: number;
}

export const SalaryResult: React.FC<SalaryResultProps> = ({
  rateSalary,
  salesBonus,
  targetBonus,
  totalSalary,
  workDaysCount,
}) => {
  const formatAmount = (amount: number): string => {
    return amount.toFixed(2);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Расчет зарплаты</h2>
      
      <div className={styles.breakdown}>
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>
            Зарплата по ставке ({workDaysCount} {workDaysCount === 1 ? 'день' : workDaysCount < 5 ? 'дня' : 'дней'}):
          </span>
          <span className={styles.breakdownValue}>
            {formatAmount(rateSalary)} ₽
          </span>
        </div>
        
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>
            Процент с продаж:
          </span>
          <span className={styles.breakdownValue}>
            {formatAmount(salesBonus)} ₽
          </span>
        </div>
        
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>
            Бонус за целевые товары:
          </span>
          <span className={styles.breakdownValue}>
            {formatAmount(targetBonus)} ₽
          </span>
        </div>
      </div>

      <div className={styles.total}>
        <span className={styles.totalLabel}>Итого:</span>
        <span className={styles.totalValue}>{formatAmount(totalSalary)} ₽</span>
      </div>
    </div>
  );
};

