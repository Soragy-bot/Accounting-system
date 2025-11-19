import React from 'react';
import { Link } from 'react-router-dom';
import { 
  InitialAmount, 
  MoneyInput, 
  CurrentBalance, 
  History,
  useCashCounter 
} from '../features/cash-counter';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import styles from './CashCounter.module.css';

export const CashCounter: React.FC = () => {
  const {
    state,
    totalAmount,
    historyRefreshTrigger,
    handleSetInitialAmount,
    handleUpdateBills,
    handleUpdateCoinsRubles,
    handleUpdateCoinsKopecks,
    handleSave,
    handleLoadEntry,
    handleReset,
  } = useCashCounter();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link to="/" className={styles.backButton}>
          ← Назад
        </Link>
        <h1 className={styles.title}>Подсчет Кассы</h1>
        <div className={styles.headerActions}>
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>
        <InitialAmount
          initialAmount={state.initialAmount}
          onSetInitialAmount={handleSetInitialAmount}
        />
        <CurrentBalance totalAmount={totalAmount} />
        <MoneyInput
          bills={state.bills}
          coinsRubles={state.coinsRubles}
          coinsKopecks={state.coinsKopecks}
          onUpdateBills={handleUpdateBills}
          onUpdateCoinsRubles={handleUpdateCoinsRubles}
          onUpdateCoinsKopecks={handleUpdateCoinsKopecks}
        />
        <div className={styles.actions}>
          <button onClick={handleSave} className={styles.saveButton}>
            Сохранить подсчет
          </button>
          <button onClick={handleReset} className={styles.resetButton}>
            Сбросить
          </button>
        </div>
        <History onLoadEntry={handleLoadEntry} refreshTrigger={historyRefreshTrigger} />
      </main>
    </div>
  );
};

