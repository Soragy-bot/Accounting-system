import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DatePicker } from '../components/DatePicker';
import { SalaryInput } from '../components/SalaryInput';
import { DailyInput } from '../components/DailyInput';
import { SalaryResult } from '../components/SalaryResult';
import { SalaryHistory } from '../components/SalaryHistory';
import { ThemeToggle } from '../components/ThemeToggle';
import { calculateSalaryBreakdown } from '../utils/salaryCalculations';
import { saveSalaryEntry } from '../utils/salaryStorage';
import { exportSalaryToExcel } from '../utils/salaryExport';
import { SalaryState, SalaryCalculation } from '../types';
import styles from './SalaryCalculator.module.css';

export const SalaryCalculator: React.FC = () => {
  const [state, setState] = useState<SalaryState>({
    dailyRate: 0,
    workDays: [],
    salesPercentage: 0,
    salesByDay: {},
    targetProductBonus: 0,
    targetProductsCount: {},
  });
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const breakdown = useMemo(() => {
    return calculateSalaryBreakdown(state);
  }, [state]);

  const handleWorkDaysChange = useCallback((workDays: string[]) => {
    setState((prev) => {
      const newSalesByDay = { ...prev.salesByDay };
      const newTargetProductsCount = { ...prev.targetProductsCount };

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

      return {
        ...prev,
        workDays,
        salesByDay: newSalesByDay,
        targetProductsCount: newTargetProductsCount,
      };
    });
  }, []);

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
  }, []);

  const handleTargetProductBonusChange = useCallback((targetProductBonus: number) => {
    setState((prev) => ({ ...prev, targetProductBonus }));
  }, []);

  const handleTargetProductsCountChange = useCallback((date: string, value: number) => {
    setState((prev) => ({
      ...prev,
      targetProductsCount: {
        ...prev.targetProductsCount,
        [date]: value,
      },
    }));
  }, []);

  const handleSave = useCallback(() => {
    const entry: SalaryCalculation = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dailyRate: state.dailyRate,
      workDays: state.workDays,
      salesPercentage: state.salesPercentage,
      salesByDay: { ...state.salesByDay },
      targetProductBonus: state.targetProductBonus,
      targetProductsCount: { ...state.targetProductsCount },
      totalSalary: breakdown.totalSalary,
    };
    saveSalaryEntry(entry);
    setHistoryRefreshTrigger((prev) => prev + 1);
    alert('Расчет зарплаты сохранен в историю!');
  }, [state, breakdown]);

  const handleLoadEntry = useCallback((entry: SalaryCalculation) => {
    setState({
      dailyRate: entry.dailyRate,
      workDays: entry.workDays,
      salesPercentage: entry.salesPercentage,
      salesByDay: entry.salesByDay,
      targetProductBonus: entry.targetProductBonus,
      targetProductsCount: entry.targetProductsCount,
    });
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm('Вы уверены, что хотите сбросить все данные?')) {
      setState({
        dailyRate: 0,
        workDays: [],
        salesPercentage: 0,
        salesByDay: {},
        targetProductBonus: 0,
        targetProductsCount: {},
      });
    }
  }, []);

  const handleExportToExcel = useCallback(() => {
    if (state.workDays.length === 0) {
      alert('Нет данных для экспорта. Выберите рабочие дни.');
      return;
    }
    try {
      exportSalaryToExcel(state, breakdown);
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      alert('Произошла ошибка при экспорте в Excel.');
    }
  }, [state, breakdown]);

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
        <DatePicker
          selectedDates={state.workDays}
          onDatesChange={handleWorkDaysChange}
        />

        <SalaryInput
          dailyRate={state.dailyRate}
          salesPercentage={state.salesPercentage}
          targetProductBonus={state.targetProductBonus}
          onDailyRateChange={handleDailyRateChange}
          onSalesPercentageChange={handleSalesPercentageChange}
          onTargetProductBonusChange={handleTargetProductBonusChange}
        />

        <DailyInput
          workDays={state.workDays}
          salesByDay={state.salesByDay}
          targetProductsCount={state.targetProductsCount}
          onSalesChange={handleSalesChange}
          onTargetProductsCountChange={handleTargetProductsCountChange}
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

        <div className={styles.actions}>
          <button onClick={handleSave} className={styles.saveButton} disabled={state.workDays.length === 0}>
            Сохранить расчет
          </button>
          <button onClick={handleExportToExcel} className={styles.exportButton} disabled={state.workDays.length === 0}>
            Экспорт в Excel
          </button>
          <button onClick={handleReset} className={styles.resetButton}>
            Сбросить
          </button>
        </div>

        <SalaryHistory onLoadEntry={handleLoadEntry} refreshTrigger={historyRefreshTrigger} />
      </main>
    </div>
  );
};

