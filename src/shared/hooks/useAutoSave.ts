import { useEffect, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';

const DEBOUNCE_DELAY = 800; // 800мс

interface UseAutoSaveOptions<T> {
  key: string;
  state: T;
  saveDraft: (draft: T) => boolean;
  loadDraft: () => T | null;
  clearDraft: () => boolean;
  onRestore?: (draft: T) => void;
  onRestoreCancel?: () => void;
  enabled?: boolean;
}

/**
 * Хук для автосохранения состояния в черновик
 * 
 * @param options - Опции автосохранения
 * @returns Функция для очистки черновика
 */
export function useAutoSave<T>({
  key,
  state,
  saveDraft,
  loadDraft,
  clearDraft,
  onRestore,
  enabled = true,
}: UseAutoSaveOptions<T>): () => void {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoredRef = useRef(false);
  const initialStateRef = useRef<T>(state);

  // Сохранение с debounce
  const saveWithDebounce = useCallback(() => {
    if (!enabled) {
      return;
    }

    // Очищаем предыдущий таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Устанавливаем новый таймер
    debounceTimerRef.current = setTimeout(() => {
      try {
        saveDraft(state);
      } catch (error) {
        logger.error(`Ошибка при автосохранении черновика (ключ: ${key}):`, error);
      }
    }, DEBOUNCE_DELAY);
  }, [key, state, saveDraft, enabled]);

  // Сохранение при изменении состояния
  useEffect(() => {
    // Не сохраняем при первой загрузке (до восстановления)
    if (!isRestoredRef.current) {
      return;
    }

    saveWithDebounce();

    // Очистка таймера при размонтировании
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state, saveWithDebounce]);

  // Сохранение при beforeunload
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleBeforeUnload = () => {
      // Очищаем debounce таймер и сохраняем сразу
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      try {
        saveDraft(state);
      } catch (error) {
        logger.error(`Ошибка при сохранении черновика перед закрытием (ключ: ${key}):`, error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [key, state, saveDraft, enabled]);

  // Восстановление при монтировании
  useEffect(() => {
    if (!enabled || isRestoredRef.current) {
      return;
    }

    try {
      const draft = loadDraft();
      if (draft !== null) {
        isRestoredRef.current = true;
        initialStateRef.current = state;
        
        // Вызываем callback для восстановления
        if (onRestore) {
          onRestore(draft);
        }
      } else {
        isRestoredRef.current = true;
      }
    } catch (error) {
      logger.error(`Ошибка при восстановлении черновика (ключ: ${key}):`, error);
      isRestoredRef.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Функция для очистки черновика
  const clearDraftFn = useCallback(() => {
    try {
      clearDraft();
      // Очищаем таймер, если он активен
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    } catch (error) {
      logger.error(`Ошибка при очистке черновика (ключ: ${key}):`, error);
    }
  }, [key, clearDraft]);

  return clearDraftFn;
}

