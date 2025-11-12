import React, { useState } from 'react';
import styles from './InitialAmount.module.css';

interface InitialAmountProps {
  initialAmount: number;
  onSetInitialAmount: (amount: number) => void;
}

export const InitialAmount: React.FC<InitialAmountProps> = ({
  initialAmount,
  onSetInitialAmount,
}) => {
  const [inputValue, setInputValue] = useState(initialAmount.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(inputValue);
    if (!isNaN(amount) && amount >= 0) {
      onSetInitialAmount(amount);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Разрешаем только положительные числа и точку для десятичных
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Начальная сумма в кассе</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onWheel={(e) => {
            e.currentTarget.blur();
            e.preventDefault();
          }}
          placeholder="0.00"
          className={styles.input}
        />
        <span className={styles.currency}>₽</span>
        <button type="submit" className={styles.button}>
          Установить
        </button>
      </form>
      {initialAmount > 0 && (
        <p className={styles.current}>
          Текущая начальная сумма: <strong>{initialAmount.toFixed(2)} ₽</strong>
        </p>
      )}
    </div>
  );
};

