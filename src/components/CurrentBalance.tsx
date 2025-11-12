import React from 'react';
import styles from './CurrentBalance.module.css';

interface CurrentBalanceProps {
  totalAmount: number;
}

export const CurrentBalance: React.FC<CurrentBalanceProps> = ({
  totalAmount,
}) => {
  const isPositive = totalAmount > 0;
  const isNegative = totalAmount < 0;
  const isZero = totalAmount === 0;

  const formatAmount = (amount: number): string => {
    return Math.abs(amount).toFixed(2);
  };

  const getSign = (): string => {
    if (isPositive) return '+';
    if (isNegative) return '-';
    return '';
  };

  const getClassName = (): string => {
    if (isPositive) return `${styles.balance} ${styles.positive}`;
    if (isNegative) return `${styles.balance} ${styles.negative}`;
    return `${styles.balance} ${styles.zero}`;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Текущая сумма</h2>
      <div className={getClassName()}>
        <span className={styles.sign}>{getSign()}</span>
        <span className={styles.amount}>{formatAmount(totalAmount)}</span>
        <span className={styles.currency}>₽</span>
      </div>
      <p className={styles.status}>
        {isPositive && 'Касса в плюсе'}
        {isNegative && 'Касса в минусе'}
        {isZero && 'Касса сведена к нулю'}
      </p>
    </div>
  );
};

