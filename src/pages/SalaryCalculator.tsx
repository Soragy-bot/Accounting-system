import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DatePicker } from '../features/salary-calculator/components/DatePicker';
import { SalaryInput } from '../features/salary-calculator/components/SalaryInput';
import { DailyInput } from '../features/salary-calculator/components/DailyInput';
import { SalaryResult } from '../features/salary-calculator/components/SalaryResult';
import { SalaryHistory } from '../features/salary-calculator/components/SalaryHistory';
import { SalaryActions } from '../features/salary-calculator/components/SalaryActions';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import { ModeToggle } from '../features/salary-calculator/components/ModeToggle';
import { useNotification } from '../contexts/NotificationContext';
import { salaryApi } from '../shared/api/salary/api';
import { exportSalaryToExcel } from '../features/salary-calculator/services/salaryExport';
import { adminApi } from '../shared/api/admin/api';
import { SalaryState, SalaryCalculation } from '../features/salary-calculator/types';
import { logger } from '../shared/utils/logger';
import { useAutoSave } from '../shared/hooks/useAutoSave';
import { saveSalaryCalculatorDraft, loadSalaryCalculatorDraft, clearSalaryCalculatorDraft } from '../features/salary-calculator/services/salaryDraftStorage';
import styles from './SalaryCalculator.module.css';

const INITIAL_STATE: SalaryState = {
    dailyRate: 0,
    workDays: [],
    salesPercentage: 0,
    salesByDay: {},
    targetProductsCount: {},
    mode: 'manual',
};

export const SalaryCalculator: React.FC = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [state, setState] = useState<SalaryState>(INITIAL_STATE);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [moyskladSettings, setMoyskladSettings] = useState<{ storeId: string | null } | null>(null);
  const [loadingDays, setLoadingDays] = useState<string[]>([]);
  const [errorDays, setErrorDays] = useState<{ [date: string]: string }>({});
  const [dataSource, setDataSource] = useState<{ [date: string]: 'manual' | 'api' }>({});
  const loadedDaysRef = useRef<Set<string>>(new Set());
  const initialStateRef = useRef<SalaryState>(INITIAL_STATE);

  const [breakdown, setBreakdown] = useState({
    rateSalary: 0,
    salesBonus: 0,
    targetBonus: 0,
    totalSalary: 0,
    workDaysCount: 0,
  });

  // Загрузка настроек API при монтировании (только storeId, токен на сервере)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await adminApi.getMoyskladSettings();
        if (settings.storeId) {
          setMoyskladSettings({ storeId: settings.storeId });
        }
      } catch (error) {
        // Не критично, если не админ или настройки не заданы
        console.log('Moysklad settings not available');
      }
    };
    loadSettings();
  }, []);

  // Расчет breakdown через API
  useEffect(() => {
    const calculateBreakdown = async () => {
      try {
        const result = await salaryApi.calculate({
          dailyRate: state.dailyRate,
          workDays: state.workDays,
          salesPercentage: state.salesPercentage,
          salesByDay: state.salesByDay,
          targetProductsCount: state.targetProductsCount,
        });
        setBreakdown(result.breakdown);
      } catch (error) {
        console.error('Failed to calculate breakdown:', error);
      }
    };
    calculateBreakdown();
  }, [state]);


  // Обработка изменения режима
  const handleModeChange = useCallback((mode: 'manual' | 'api') => {
    setState((prev) => ({ ...prev, mode }));
    
    // Если переключились в ручной режим, очищаем данные источников
    if (mode === 'manual') {
      setDataSource({});
      setErrorDays({});
      setLoadingDays([]);
      loadedDaysRef.current.clear();
    }
  }, []);

  // Форматирование даты для отображения (мемоизировано)
  const formatDate = useCallback((dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  // Мемоизация списка дней для загрузки
  const daysToLoadMemo = useMemo(() => {
    if (state.mode !== 'api' || state.workDays.length === 0 || !moyskladSettings?.storeId) {
      return [];
    }
    return state.workDays.filter(
      date => {
        const isLoaded = loadedDaysRef.current.has(date);
        const isLoading = loadingDays.includes(date);
        return !isLoaded && !isLoading;
      }
    );
  }, [state.mode, state.workDays, moyskladSettings?.storeId, loadingDays]);

  // Загрузка данных из API для выбранных дней
  const loadDataFromAPI = useCallback(async (dates: string[]) => {
    if (!moyskladSettings || !moyskladSettings.storeId) {
      return;
    }

    // Добавляем дни в список загрузки
    setLoadingDays((prev) => {
      const newLoadingDays = [...prev];
      dates.forEach(date => {
        if (!newLoadingDays.includes(date)) {
          newLoadingDays.push(date);
        }
      });
      return newLoadingDays;
    });

    // Очищаем ошибки для загружаемых дней
    setErrorDays((prev) => {
      const newErrors = { ...prev };
      dates.forEach(date => {
        delete newErrors[date];
      });
      return newErrors;
    });

    const newSalesByDay = { ...state.salesByDay };
    const newTargetProductsCount = { ...state.targetProductsCount };
    const newDataSource = { ...dataSource };
    const newErrors: { [date: string]: string } = {};

    try {
      // Загружаем данные через API
      const moyskladData = await salaryApi.getMoyskladData(dates);

      // Обрабатываем данные для каждого дня
      for (const date of dates) {
        const dayData = moyskladData[date];
        
        if ('error' in dayData) {
          newErrors[date] = dayData.error;
          showError(`Ошибка загрузки данных за ${formatDate(date)}: ${dayData.error}`);
          if (!(date in newSalesByDay)) {
            newSalesByDay[date] = 0;
          }
          if (!(date in newTargetProductsCount)) {
            newTargetProductsCount[date] = 0;
          }
          loadedDaysRef.current.delete(date);
        } else {
          newSalesByDay[date] = dayData.sales / 100; // Конвертируем из копеек в рубли
          newTargetProductsCount[date] = dayData.targetProducts;
          newDataSource[date] = 'api';
          loadedDaysRef.current.add(date);
        }
      }

      setState((prev) => ({
        ...prev,
        salesByDay: newSalesByDay,
        targetProductsCount: newTargetProductsCount,
      }));
      setDataSource(newDataSource);
      setErrorDays((prev) => ({ ...prev, ...newErrors }));
    } catch (error: any) {
      logger.error('Ошибка при загрузке данных из API:', error);
      showError(error.message || 'Произошла ошибка при загрузке данных из API');
    } finally {
      // Удаляем дни из списка загрузки
      setLoadingDays((prev) => prev.filter(date => !dates.includes(date)));
    }
  }, [moyskladSettings, state.salesByDay, state.targetProductsCount, dataSource, showError]);

  // Автоматическая загрузка данных при выборе дней в режиме API
  useEffect(() => {
    if (state.mode === 'api' && state.workDays.length > 0 && moyskladSettings) {
      // Проверяем, что все настройки заполнены
      if (!moyskladSettings.storeId) {
        return;
      }

      // Используем мемоизированный список дней для загрузки
      if (daysToLoadMemo.length > 0) {
        loadDataFromAPI(daysToLoadMemo);
      }
    }
  }, [daysToLoadMemo, loadDataFromAPI]);

  const handleWorkDaysChange = useCallback((workDays: string[]) => {
    setState((prev) => {
      const newSalesByDay = { ...prev.salesByDay };
      const newTargetProductsCount = { ...prev.targetProductsCount };
      const newDataSource = { ...dataSource };
      const newErrorDays = { ...errorDays };

      // Определяем дни, которые были добавлены (новые или перевыбранные)
      const addedDates = workDays.filter(date => !prev.workDays.includes(date));

      // Удаляем данные для дней, которые больше не выбраны
      Object.keys(newSalesByDay).forEach((date) => {
        if (!workDays.includes(date)) {
          delete newSalesByDay[date];
        }
      });

      Object.keys(newTargetProductsCount).forEach((date) => {
        if (!workDays.includes(date)) {
          delete newTargetProductsCount[date];
        }
      });

      Object.keys(newDataSource).forEach((date) => {
        if (!workDays.includes(date)) {
          delete newDataSource[date];
          loadedDaysRef.current.delete(date);
        }
      });

      // Для дней, которые были добавлены (включая перевыбранные), 
      // очищаем их из loadedDaysRef и dataSource, чтобы они перезагрузились из API
      // если режим API активен
      addedDates.forEach((date) => {
        // Очищаем день из loadedDaysRef, чтобы он перезагрузился при следующем useEffect
        loadedDaysRef.current.delete(date);
        // Очищаем dataSource для добавленного дня, чтобы он перезагрузился
        delete newDataSource[date];
      });

      Object.keys(newErrorDays).forEach((date) => {
        if (!workDays.includes(date)) {
          delete newErrorDays[date];
        }
      });

      setDataSource(newDataSource);
      setErrorDays(newErrorDays);

      return {
        ...prev,
        workDays,
        salesByDay: newSalesByDay,
        targetProductsCount: newTargetProductsCount,
      };
    });
  }, [dataSource, errorDays]);

  const handleDailyRateChange = useCallback((dailyRate: number) => {
    setState((prev) => ({ ...prev, dailyRate }));
  }, []);

  const handleSalesPercentageChange = useCallback((salesPercentage: number) => {
    setState((prev) => ({ ...prev, salesPercentage }));
  }, []);

  const handleSalesChange = useCallback((date: string, value: number) => {
    setState((prev) => ({
      ...prev,
      salesByDay: {
        ...prev.salesByDay,
        [date]: value,
      },
    }));
    // При ручном изменении отмечаем источник как manual
    if (state.mode === 'api') {
      setDataSource((prev) => ({ ...prev, [date]: 'manual' }));
    }
  }, [state.mode]);


  const handleTargetProductsCountChange = useCallback((date: string, value: number) => {
    setState((prev) => ({
      ...prev,
      targetProductsCount: {
        ...prev.targetProductsCount,
        [date]: value,
      },
    }));
    // При ручном изменении отмечаем источник как manual
    if (state.mode === 'api') {
      setDataSource((prev) => ({ ...prev, [date]: 'manual' }));
    }
  }, [state.mode]);

  // Проверка наличия данных в черновике
  const hasDraftData = useCallback((draft: SalaryState): boolean => {
    // Проверяем наличие рабочих дней
    if (draft.workDays.length > 0) {
      return true;
    }
    
    // Проверяем наличие данных о продажах
    if (Object.keys(draft.salesByDay).length > 0) {
      return true;
    }
    
    // Проверяем наличие данных о целевых товарах
    if (Object.keys(draft.targetProductsCount).length > 0) {
      return true;
    }
    
    // Проверяем наличие ставки или процента с продаж
    if (draft.dailyRate !== 0 || draft.salesPercentage !== 0) {
      return true;
    }
    
    return false;
  }, []);

  // Обработчик восстановления черновика
  const handleRestore = useCallback((draft: SalaryState) => {
    // Сохраняем текущее состояние и служебные состояния перед восстановлением
    const previousState = { ...state };
    const previousDataSource = { ...dataSource };
    const previousErrorDays = { ...errorDays };
    const previousLoadingDays = [...loadingDays];
    
    // Восстанавливаем черновик
    setState(draft);
    
    // Сбрасываем служебные состояния при восстановлении
    setDataSource({});
    setErrorDays({});
    setLoadingDays([]);
    
    // Если режим API и есть данные в черновике, отмечаем дни как загруженные,
    // чтобы предотвратить повторную загрузку из API
    if (draft.mode === 'api') {
      loadedDaysRef.current.clear();
      // Отмечаем дни, для которых есть данные, как уже загруженные
      draft.workDays.forEach(date => {
        if (draft.salesByDay[date] !== undefined || draft.targetProductsCount[date] !== undefined) {
          loadedDaysRef.current.add(date);
        }
      });
    } else {
      loadedDaysRef.current.clear();
    }
    
    // Показываем уведомление только если есть данные в черновике
    if (hasDraftData(draft)) {
      showInfo('Черновик восстановлен', 7000, {
        label: 'Отменить',
        onClick: () => {
          // Возвращаем предыдущее состояние
          setState(previousState);
          setDataSource(previousDataSource);
          setErrorDays(previousErrorDays);
          setLoadingDays(previousLoadingDays);
          // Восстанавливаем loadedDaysRef для предыдущего состояния
          loadedDaysRef.current.clear();
          Object.keys(previousDataSource).forEach(date => {
            if (previousDataSource[date] === 'api') {
              loadedDaysRef.current.add(date);
            }
          });
          clearSalaryCalculatorDraft();
        },
      });
    }
  }, [state, dataSource, errorDays, loadingDays, showInfo, hasDraftData]);

  // Обработчик отмены восстановления
  const handleRestoreCancel = useCallback(() => {
    setState(INITIAL_STATE);
    initialStateRef.current = INITIAL_STATE;
    setDataSource({});
    setErrorDays({});
    setLoadingDays([]);
    loadedDaysRef.current.clear();
  }, []);

  // Автосохранение черновика (сохраняем только SalaryState, без служебных состояний)
  const clearDraft = useAutoSave({
    key: 'salary-calculator-draft',
    state,
    saveDraft: saveSalaryCalculatorDraft,
    loadDraft: loadSalaryCalculatorDraft,
    clearDraft: clearSalaryCalculatorDraft,
    onRestore: handleRestore,
    onRestoreCancel: handleRestoreCancel,
  });

  const handleSave = useCallback(async () => {
    try {
      await salaryApi.saveCalculation({
        dailyRate: state.dailyRate,
        workDays: state.workDays,
        salesPercentage: state.salesPercentage,
        salesByDay: { ...state.salesByDay },
        targetProductsCount: { ...state.targetProductsCount },
      });
      setHistoryRefreshTrigger((prev) => prev + 1);
      showSuccess('Расчет зарплаты сохранен в историю!');
      // Очищаем черновик после сохранения в историю
      clearDraft();
    } catch (error) {
      console.error('Failed to save calculation:', error);
      showError('Не удалось сохранить расчет');
    }
  }, [state, showSuccess, showError, clearDraft]);

  const handleLoadEntry = useCallback((entry: SalaryCalculation) => {
    // Игнорируем поле targetProductBonus, если оно есть в старых записях
    setState({
      dailyRate: entry.dailyRate,
      workDays: entry.workDays,
      salesPercentage: entry.salesPercentage,
      salesByDay: entry.salesByDay,
      targetProductsCount: entry.targetProductsCount,
      mode: state.mode || 'manual',
    });
    // При загрузке записи сбрасываем источники данных
    setDataSource({});
    setErrorDays({});
    loadedDaysRef.current.clear();
  }, [state.mode]);

  const handleReset = useCallback(() => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные?')) {
      const resetState = {
        ...INITIAL_STATE,
        mode: state.mode || 'manual',
      };
      setState(resetState);
      initialStateRef.current = resetState;
      setDataSource({});
      setErrorDays({});
      setLoadingDays([]);
      loadedDaysRef.current.clear();
      // Очищаем черновик при явном сбросе
      clearDraft();
    }
  }, [state.mode, clearDraft]);

  // Обработчик обновления данных из API для всех дней
  const handleRefresh = useCallback(() => {
    if (state.mode !== 'api' || state.workDays.length === 0 || !moyskladSettings?.storeId) {
      return;
    }

    // Удаляем все выбранные дни из loadedDaysRef, чтобы они перезагрузились
    state.workDays.forEach(date => {
      loadedDaysRef.current.delete(date);
    });

    // Очищаем источники данных для выбранных дней
    const newDataSource = { ...dataSource };
    state.workDays.forEach(date => {
      delete newDataSource[date];
    });
    setDataSource(newDataSource);

    // Очищаем ошибки для выбранных дней
    const newErrorDays = { ...errorDays };
    state.workDays.forEach(date => {
      delete newErrorDays[date];
    });
    setErrorDays(newErrorDays);

    // Запускаем загрузку данных для всех выбранных дней
    loadDataFromAPI(state.workDays);
  }, [state.mode, state.workDays, moyskladSettings, dataSource, errorDays, loadDataFromAPI]);

  // Обработчик обновления данных из API для одного дня
  const handleRefreshDay = useCallback((date: string) => {
    if (state.mode !== 'api' || !moyskladSettings?.storeId || !state.workDays.includes(date)) {
      return;
    }

    // Удаляем день из loadedDaysRef, чтобы он перезагрузился
    loadedDaysRef.current.delete(date);

    // Очищаем источник данных для этого дня
    const newDataSource = { ...dataSource };
    delete newDataSource[date];
    setDataSource(newDataSource);

    // Очищаем ошибку для этого дня
    const newErrorDays = { ...errorDays };
    delete newErrorDays[date];
    setErrorDays(newErrorDays);

    // Запускаем загрузку данных для этого дня
    loadDataFromAPI([date]);
  }, [state.mode, state.workDays, moyskladSettings, dataSource, errorDays, loadDataFromAPI]);

  const handleExportToExcel = useCallback(() => {
    if (state.workDays.length === 0) {
      showError('Нет данных для экспорта. Выберите рабочие дни.');
      return;
    }
    try {
      exportSalaryToExcel(state, breakdown);
      showSuccess('Данные успешно экспортированы в Excel!');
    } catch (error) {
      logger.error('Ошибка при экспорте в Excel:', error);
      showError('Произошла ошибка при экспорте в Excel.');
    }
  }, [state, breakdown, showSuccess, showError]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link to="/" className={styles.backButton}>
          ← Назад
        </Link>
        <h1 className={styles.title}>Расчет зарплаты</h1>
        <div className={styles.headerActions}>
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>
        <ModeToggle
          mode={state.mode || 'manual'}
          onModeChange={handleModeChange}
        />

        {state.mode === 'api' && !moyskladSettings?.storeId && (
          <div style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '8px', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Для работы с API МойСклад необходимо настроить токен и точку продажи в{' '}
              <Link to="/admin" style={{ color: 'var(--accent-primary)' }}>админ панели</Link>.
            </p>
          </div>
        )}

        <DatePicker
          selectedDates={state.workDays}
          onDatesChange={handleWorkDaysChange}
        />

        <SalaryInput
          dailyRate={state.dailyRate}
          salesPercentage={state.salesPercentage}
          onDailyRateChange={handleDailyRateChange}
          onSalesPercentageChange={handleSalesPercentageChange}
        />

        <DailyInput
          workDays={state.workDays}
          salesByDay={state.salesByDay}
          targetProductsCount={state.targetProductsCount}
          onSalesChange={handleSalesChange}
          onTargetProductsCountChange={handleTargetProductsCountChange}
          mode={state.mode}
          loadingDays={loadingDays}
          errorDays={errorDays}
          dataSource={dataSource}
          onRefresh={handleRefresh}
          onRefreshDay={handleRefreshDay}
        />

        {state.workDays.length > 0 && (
          <SalaryResult
            rateSalary={breakdown.rateSalary}
            salesBonus={breakdown.salesBonus}
            targetBonus={breakdown.targetBonus}
            totalSalary={breakdown.totalSalary}
            workDaysCount={breakdown.workDaysCount}
          />
        )}

        <SalaryActions
          onSave={handleSave}
          onExport={handleExportToExcel}
          onReset={handleReset}
          canSave={state.workDays.length > 0}
          canExport={state.workDays.length > 0}
        />

        <SalaryHistory onLoadEntry={handleLoadEntry} refreshTrigger={historyRefreshTrigger} />
      </main>
    </div>
  );
};

