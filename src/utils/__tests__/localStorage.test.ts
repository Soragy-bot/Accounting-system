import {
  isLocalStorageAvailable,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  getJsonItem,
  setJsonItem,
} from '../localStorage';

// Мокаем localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('localStorage utilities', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
  });

  describe('isLocalStorageAvailable', () => {
    it('возвращает true, когда localStorage доступен', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('возвращает false, когда localStorage недоступен', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      expect(isLocalStorageAvailable()).toBe(false);
    });
  });

  describe('safeGetItem', () => {
    it('возвращает значение из localStorage', () => {
      localStorageMock.setItem('test-key', 'test-value');
      expect(safeGetItem('test-key')).toBe('test-value');
    });

    it('возвращает null, если ключ не существует', () => {
      expect(safeGetItem('non-existent-key')).toBeNull();
    });
  });

  describe('safeSetItem', () => {
    it('сохраняет значение в localStorage', () => {
      expect(safeSetItem('test-key', 'test-value')).toBe(true);
      expect(localStorageMock.getItem('test-key')).toBe('test-value');
    });
  });

  describe('safeRemoveItem', () => {
    it('удаляет значение из localStorage', () => {
      localStorageMock.setItem('test-key', 'test-value');
      expect(safeRemoveItem('test-key')).toBe(true);
      expect(localStorageMock.getItem('test-key')).toBeNull();
    });
  });

  describe('getJsonItem', () => {
    it('парсит JSON из localStorage', () => {
      const testObject = { name: 'test', value: 123 };
      localStorageMock.setItem('test-key', JSON.stringify(testObject));
      expect(getJsonItem('test-key')).toEqual(testObject);
    });

    it('возвращает defaultValue, если ключ не существует', () => {
      const defaultValue = { default: true };
      expect(getJsonItem('non-existent-key', defaultValue)).toEqual(defaultValue);
    });

    it('возвращает null по умолчанию, если ключ не существует', () => {
      expect(getJsonItem('non-existent-key')).toBeNull();
    });
  });

  describe('setJsonItem', () => {
    it('сериализует объект в JSON и сохраняет в localStorage', () => {
      const testObject = { name: 'test', value: 123 };
      expect(setJsonItem('test-key', testObject)).toBe(true);
      expect(JSON.parse(localStorageMock.getItem('test-key') || '{}')).toEqual(testObject);
    });
  });
});

