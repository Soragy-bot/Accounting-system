import React from 'react';
import { BILLS, COINS_RUBLES, COINS_KOPECKS } from '../constants';
import { parseAndValidateInteger } from '../../../shared/utils/validation';
import { MoneyCount } from '../../../shared/types';
import styles from './MoneyInput.module.css';

interface MoneyInputProps {
  bills: MoneyCount;
  coinsRubles: MoneyCount;
  coinsKopecks: MoneyCount;
  onUpdateBills: (bills: MoneyCount) => void;
  onUpdateCoinsRubles: (coins: MoneyCount) => void;
  onUpdateCoinsKopecks: (coins: MoneyCount) => void;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  bills,
  coinsRubles,
  coinsKopecks,
  onUpdateBills,
  onUpdateCoinsRubles,
  onUpdateCoinsKopecks,
}) => {
  const getCurrentValue = (
    category: 'bills' | 'coinsRubles' | 'coinsKopecks',
    denomination: number
  ): number => {
    if (category === 'bills') {
      return bills[denomination] ?? 0;
    } else if (category === 'coinsRubles') {
      return coinsRubles[denomination] ?? 0;
    } else {
      return coinsKopecks[denomination] ?? 0;
    }
  };

  const updateValue = (
    category: 'bills' | 'coinsRubles' | 'coinsKopecks',
    denomination: number,
    value: number
  ) => {
    if (category === 'bills') {
      if (value === 0) {
        const newBills = { ...bills };
        delete newBills[denomination];
        onUpdateBills(newBills);
      } else {
        onUpdateBills({ ...bills, [denomination]: value });
      }
    } else if (category === 'coinsRubles') {
      if (value === 0) {
        const newCoinsRubles = { ...coinsRubles };
        delete newCoinsRubles[denomination];
        onUpdateCoinsRubles(newCoinsRubles);
      } else {
        onUpdateCoinsRubles({ ...coinsRubles, [denomination]: value });
      }
    } else {
      if (value === 0) {
        const newCoinsKopecks = { ...coinsKopecks };
        delete newCoinsKopecks[denomination];
        onUpdateCoinsKopecks(newCoinsKopecks);
      } else {
        onUpdateCoinsKopecks({ ...coinsKopecks, [denomination]: value });
      }
    }
  };

  const handleIncrement = (
    category: 'bills' | 'coinsRubles' | 'coinsKopecks',
    denomination: number
  ) => {
    const currentValue = getCurrentValue(category, denomination);
    updateValue(category, denomination, currentValue + 1);
  };

  const handleDecrement = (
    category: 'bills' | 'coinsRubles' | 'coinsKopecks',
    denomination: number
  ) => {
    const currentValue = getCurrentValue(category, denomination);
    updateValue(category, denomination, currentValue - 1);
  };

  const handleChange = (
    value: string,
    category: 'bills' | 'coinsRubles' | 'coinsKopecks',
    denomination: number
  ) => {
    const { value: numValue, validation } = parseAndValidateInteger(value, 0);
    
    // Если валидация не прошла, не обновляем значение
    if (!validation.isValid) {
      return;
    }

    updateValue(category, denomination, numValue);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
    e.preventDefault();
  };

  const renderMoneyInput = (
    denominations: readonly number[],
    _counts: MoneyCount,
    category: 'bills' | 'coinsRubles' | 'coinsKopecks',
    unit: string
  ) => {
    return (
      <div className={styles.category}>
        {denominations.map((denomination) => {
          const currentValue = getCurrentValue(category, denomination);
          return (
            <div key={denomination} className={styles.inputRow}>
              <label className={styles.label}>
                <span className={styles.denomination}>
                  {denomination} {unit}
                </span>
                <div className={styles.inputGroup}>
                  <button
                    type="button"
                    onClick={() => handleDecrement(category, denomination)}
                    className={styles.button}
                    aria-label="Уменьшить"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={currentValue === 0 ? '' : currentValue}
                    onChange={(e) =>
                      handleChange(e.target.value, category, denomination)
                    }
                    onWheel={handleWheel}
                    className={styles.input}
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => handleIncrement(category, denomination)}
                    className={styles.button}
                    aria-label="Увеличить"
                  >
                    +
                  </button>
                </div>
              </label>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Ввод купюр и монет</h2>
      
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Купюры (₽)</h3>
        {renderMoneyInput(BILLS, bills, 'bills', '₽')}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Монеты (₽)</h3>
        {renderMoneyInput(COINS_RUBLES, coinsRubles, 'coinsRubles', '₽')}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Монеты (коп.)</h3>
        {renderMoneyInput(COINS_KOPECKS, coinsKopecks, 'coinsKopecks', 'коп.')}
      </div>
    </div>
  );
};

