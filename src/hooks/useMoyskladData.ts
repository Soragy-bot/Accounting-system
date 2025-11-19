import { useState, useCallback, useRef, useEffect } from 'react';
import { MoyskladSettings } from '../types';
import { calculateSalesByDay, calculateTargetProductsByDay, MoyskladApiError } from '../utils/moyskladApi';
import { logger } from '../utils/logger';
import { useNotification } from '../contexts/NotificationContext';

interface UseMoyskladDataResult {
  loadingDays: string[];
  errorDays: { [date: string]: string };
  dataSource: { [date: string]: 'manual' | 'api' };
  loadDataFromAPI: (dates: string[]) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

/**
 * Кастомный хук для работы с данными из API МойСклад
 * Управляет загрузкой данных, состоянием загрузки и ошибок
 */
export const useMoyskladData = (
  moyskladSettings: MoyskladSettings | null,
  mode: 'manual' | 'api'
): UseMoyskladDataResult => {
  const { showError } = useNotification();
  const [loadingDays, setLoadingDays] = useState<string[]>([]);
  const [errorDays, setErrorDays] = useState<{ [date: string]: string }>({});
  const [dataSource, setDataSource] = useState<{ [date: string]: 'manual' | 'api' }>({});
  const loadedDaysRef = useRef<Set<string>>(new Set());

  // Форматирование даты для отображения
  const formatDate = useCallback((dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  // Загрузка данных из API для выбранных дней
  const loadDataFromAPI = useCallback(
    async (
      dates: string[],
      onSuccess?: (date: string, sales: number, targetProducts: number) => void
    ): Promise<void> => {
      if (!moyskladSettings || !moyskladSettings.accessToken || !moyskladSettings.storeId) {
        return;
      }

      // Добавляем дни в список загрузки
      setLoadingDays((prev) => {
        const newLoadingDays = [...prev];
        dates.forEach((date) => {
          if (!newLoadingDays.includes(date)) {
            newLoadingDays.push(date);
          }
        });
        return newLoadingDays;
      });

      // Очищаем ошибки для загружаемых дней
      setErrorDays((prev) => {
        const newErrors = { ...prev };
        dates.forEach((date) => {
          delete newErrors[date];
        });
        return newErrors;
      });

      const newErrors: { [date: string]: string } = {};

      try {
        // Загружаем данные для каждого дня
        for (const date of dates) {
          try {
            // Подсчитываем продажи
            const sales = await calculateSalesByDay(
              moyskladSettings.accessToken,
              date,
              moyskladSettings.storeId
            );

            // Подсчитываем целевые продукты
            const targetProducts = await calculateTargetProductsByDay(
              moyskladSettings.accessToken,
              date,
              moyskladSettings
            );

            const salesInRubles = sales.total / 100; // Конвертируем из копеек в рубли

            // Отмечаем день как успешно загруженный
            loadedDaysRef.current.add(date);
            setDataSource((prev) => ({ ...prev, [date]: 'api' }));

            // Вызываем callback с загруженными данными
            if (onSuccess) {
              onSuccess(date, salesInRubles, targetProducts);
            }
          } catch (error) {
            logger.error(`Ошибка при загрузке данных за ${date}:`, error);
            let errorMessage = 'Не удалось загрузить данные';
            if (error instanceof MoyskladApiError) {
              errorMessage = error.message;
              showError(`Ошибка загрузки данных за ${formatDate(date)}: ${error.message}`);
            } else {
              showError(`Ошибка загрузки данных за ${formatDate(date)}`);
            }
            newErrors[date] = errorMessage;
            // Удаляем из ref при ошибке, чтобы можно было повторить загрузку
            loadedDaysRef.current.delete(date);
          }
        }

        setErrorDays((prev) => ({ ...prev, ...newErrors }));
      } catch (error) {
        logger.error('Ошибка при загрузке данных из API:', error);
        if (error instanceof MoyskladApiError) {
          showError(`Ошибка API: ${error.message}`);
        } else {
          showError('Произошла ошибка при загрузке данных из API');
        }
      } finally {
        // Удаляем дни из списка загрузки
        setLoadingDays((prev) => prev.filter((date) => !dates.includes(date)));
      }
    },
    [moyskladSettings, formatDate, showError]
  );

  // Очистка данных при переключении режима
  useEffect(() => {
    if (mode === 'manual') {
      setDataSource({});
      setErrorDays({});
      setLoadingDays([]);
      loadedDaysRef.current.clear();
    }
  }, [mode]);

  return {
    loadingDays,
    errorDays,
    dataSource,
    loadDataFromAPI,
    formatDate,
  };
};

