import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { InitialAmount } from '../components/InitialAmount';
import { MoneyInput } from '../components/MoneyInput';
import { CurrentBalance } from '../components/CurrentBalance';
import { History } from '../components/History';
import { ThemeToggle } from '../components/ThemeToggle';
import { useNotification } from '../contexts/NotificationContext';
import { calculateTotal } from '../utils/calculations';
import { saveHistoryEntry } from '../utils/storage';
import { CashState, CashEntry, MoneyCount } from '../types';
import { useAutoSave } from '../hooks/useAutoSave';
import { saveCashCounterDraft, loadCashCounterDraft, clearCashCounterDraft } from '../utils/draftStorage';
import styles from './CashCounter.module.css';

const INITIAL_STATE: CashState = {
  initialAmount: 0,
  bills: {},
  coinsRubles: {},
  coinsKopecks: {},
};

export const CashCounter: React.FC = () => {
  const { showSuccess, showInfo } = useNotification();
  const [state, setState] = useState<CashState>(INITIAL_STATE);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const initialStateRef = useRef<CashState>(INITIAL_STATE);

  // Мемоизация вычисления общей суммы
  const totalAmount = useMemo(() => {
    return calculateTotal(
      state.initialAmount,
      state.bills,
      state.coinsRubles,
      state.coinsKopecks
    );
  }, [state.initialAmount, state.bills, state.coinsRubles, state.coinsKopecks]);

  const handleSetInitialAmount = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, initialAmount: amount }));
  }, []);

  const handleUpdateBills = useCallback((bills: MoneyCount) => {
    setState((prev) => ({ ...prev, bills }));
  }, []);

  const handleUpdateCoinsRubles = useCallback((coinsRubles: MoneyCount) => {
    setState((prev) => ({ ...prev, coinsRubles }));
  }, []);

  const handleUpdateCoinsKopecks = useCallback((coinsKopecks: MoneyCount) => {
    setState((prev) => ({ ...prev, coinsKopecks }));
  }, []);

  // Обработчик восстановления черновика
  const handleRestore = useCallback((draft: CashState) => {
    // Сохраняем текущее состояние перед восстановлением
    const previousState = { ...state };
    
    // Восстанавливаем черновик
    setState(draft);
    
    // Показываем уведомление с возможностью отменить (автоматически исчезнет через 7 секунд)
    showInfo('Черновик восстановлен', 7000, {
      label: 'Отменить',
      onClick: () => {
        // Возвращаем предыдущее состояние
        setState(previousState);
        clearCashCounterDraft();
      },
    });
  }, [state, showInfo]);

  // Обработчик отмены восстановления
  const handleRestoreCancel = useCallback(() => {
    setState(INITIAL_STATE);
    initialStateRef.current = INITIAL_STATE;
  }, []);

  // Автосохранение черновика
  const clearDraft = useAutoSave({
    key: 'cash-counter-draft',
    state,
    saveDraft: saveCashCounterDraft,
    loadDraft: loadCashCounterDraft,
    clearDraft: clearCashCounterDraft,
    onRestore: handleRestore,
    onRestoreCancel: handleRestoreCancel,
  });

  const handleSave = useCallback(() => {
    const entry: CashEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      initialAmount: state.initialAmount,
      bills: { ...state.bills },
      coinsRubles: { ...state.coinsRubles },
      coinsKopecks: { ...state.coinsKopecks },
      totalAmount,
    };
    saveHistoryEntry(entry);
    setHistoryRefreshTrigger((prev) => prev + 1);
    showSuccess('Подсчет сохранен в историю!');
    // Очищаем черновик после сохранения в историю
    clearDraft();
  }, [state, totalAmount, showSuccess, clearDraft]);

  const handleLoadEntry = useCallback((entry: CashEntry) => {
    setState({
      initialAmount: entry.initialAmount,
      bills: entry.bills,
      coinsRubles: entry.coinsRubles,
      coinsKopecks: entry.coinsKopecks,
    });
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные?')) {
      setState(INITIAL_STATE);
      initialStateRef.current = INITIAL_STATE;
      // Очищаем черновик при явном сбросе
      clearDraft();
    }
  }, [clearDraft]);

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

