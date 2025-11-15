import { MoyskladSettings } from '../types';

const STORAGE_KEY = 'moysklad-settings';

export const saveMoyskladSettings = (settings: MoyskladSettings): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Ошибка при сохранении настроек МойСклад:', error);
    }
};

export const getMoyskladSettings = (): MoyskladSettings | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (error) {
        console.error('Ошибка при загрузке настроек МойСклад:', error);
        return null;
    }
};

export const clearMoyskladSettings = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};

export const hasMoyskladSettings = (): boolean => {
    const settings = getMoyskladSettings();
    return settings !== null && settings.accessToken !== '';
};

export const getDefaultMoyskladSettings = (): MoyskladSettings => {
  return {
    accessToken: '',
    storeId: null,
  };
};
