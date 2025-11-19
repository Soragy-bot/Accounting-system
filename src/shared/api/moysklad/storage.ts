import { MoyskladSettings } from './types';
import { getJsonItem, setJsonItem, safeRemoveItem } from '../storage';

const STORAGE_KEY = 'moysklad-settings';

export const saveMoyskladSettings = (settings: MoyskladSettings): void => {
    setJsonItem(STORAGE_KEY, settings);
};

export const getMoyskladSettings = (): MoyskladSettings | null => {
    const settings = getJsonItem<MoyskladSettings>(STORAGE_KEY, null);
    // Валидация структуры данных
    if (settings !== null && typeof settings === 'object' && 'accessToken' in settings) {
        return settings;
    }
    return null;
};

export const clearMoyskladSettings = (): void => {
    safeRemoveItem(STORAGE_KEY);
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

