import { useState, useCallback, useMemo, useRef } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { calculateTotal } from '../services/cashCalculations';
import { saveHistoryEntry } from '../services/cashStorage';
import { CashState, CashEntry, MoneyCount } from '../types';
import { useAutoSave } from '../../../shared/hooks/useAutoSave';
import { saveCashCounterDraft, loadCashCounterDraft, clearCashCounterDraft } from '../services/cashDraftStorage';

const INITIAL_STATE: CashState = {
  initialAmount: 0,
  bills: {},
  coinsRubles: {},
  coinsKopecks: {},
};

export const useCashCounter = () => {
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

  // Проверка наличия данных в черновике
  const hasDraftData = useCallback((draft: CashState): boolean => {
    // Проверяем начальную сумму
    if (draft.initialAmount !== 0) {
      return true;
    }
    
    // Проверяем наличие купюр
    if (Object.keys(draft.bills).length > 0) {
      return true;
    }
    
    // Проверяем наличие рублей в монетах
    if (Object.keys(draft.coinsRubles).length > 0) {
      return true;
    }
    
    // Проверяем наличие копеек в монетах
    if (Object.keys(draft.coinsKopecks).length > 0) {
      return true;
    }
    
    return false;
  }, []);

  // Обработчик восстановления черновика
  const handleRestore = useCallback((draft: CashState) => {
    // Сохраняем текущее состояние перед восстановлением
    const previousState = { ...state };
    
    // Восстанавливаем черновик
    setState(draft);
    
    // Показываем уведомление только если есть данные в черновике
    if (hasDraftData(draft)) {
      showInfo('Черновик восстановлен', 7000, {
        label: 'Отменить',
        onClick: () => {
          // Возвращаем предыдущее состояние
          setState(previousState);
          clearCashCounterDraft();
        },
      });
    }
  }, [state, showInfo, hasDraftData]);

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

  return {
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
  };
};

