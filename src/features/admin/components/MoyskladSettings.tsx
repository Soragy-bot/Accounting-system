import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, Store } from '../../../shared/api/admin/api';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import styles from './MoyskladSettings.module.css';

export const AdminMoyskladSettings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [accessToken, setAccessToken] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await adminApi.getMoyskladSettings();
      setStoreId(settings.storeId);
      
      if (settings.storeId) {
        await loadStores();
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      setLoading(true);
      const storesList = await adminApi.getStores();
      setStores(storesList);
    } catch (error) {
      console.error('Failed to load stores:', error);
      showError('Не удалось загрузить точки продажи');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = useCallback(async () => {
    if (!accessToken) {
      showError('Введите токен доступа');
      return;
    }

    setTesting(true);
    setConnectionStatus('testing');

    try {
      await adminApi.testConnection();
      setConnectionStatus('success');
      showSuccess('Подключение успешно установлено');
      await loadStores();
    } catch (error: any) {
      setConnectionStatus('error');
      showError(error.message || 'Не удалось установить подключение');
    } finally {
      setTesting(false);
    }
  }, [accessToken, showSuccess, showError]);

  const handleSave = useCallback(async () => {
    if (!accessToken) {
      showError('Введите токен доступа');
      return;
    }

    try {
      setLoading(true);
      await adminApi.saveMoyskladSettings(accessToken, storeId);
      showSuccess('Настройки сохранены');
      setAccessToken(''); // Очищаем поле токена после сохранения
    } catch (error: any) {
      showError(error.message || 'Не удалось сохранить настройки');
    } finally {
      setLoading(false);
    }
  }, [accessToken, storeId, showSuccess, showError]);

  const handleStoreChange = useCallback((newStoreId: string) => {
    setStoreId(newStoreId || null);
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Настройки API МойСклад</h2>

      <div className={styles.section}>
        <label className={styles.label}>
          <span className={styles.labelText}>Токен доступа *</span>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className={styles.input}
            placeholder="Введите токен доступа"
          />
        </label>
        <p className={styles.hint}>
          Токен доступа можно получить в личном кабинете МойСклад в разделе "Настройки" → "API" → "Токены доступа"
        </p>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing || !accessToken}
          className={styles.testButton}
        >
          {testing ? 'Проверка...' : 'Проверить подключение'}
        </button>
      </div>

      {connectionStatus === 'testing' && (
        <div className={styles.status}>
          <span className={`${styles.statusIcon} ${styles.statusIconSpinning}`}>⟳</span>
          Проверка подключения...
        </div>
      )}

      <div className={styles.section}>
        <label className={styles.label}>
          <span className={styles.labelText}>Розничная точка продажи *</span>
          <select
            value={storeId || ''}
            onChange={(e) => handleStoreChange(e.target.value)}
            className={styles.select}
            disabled={loading || !accessToken}
          >
            <option value="">Выберите розничную точку продажи</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
        {loading && (
          <div className={styles.loadingContainer}>
            <LoadingSkeleton width="100%" height="2.5rem" />
            <span className={styles.loadingText}>Загрузка точек продажи...</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !accessToken || !storeId}
          className={styles.saveButton}
        >
          Сохранить настройки
        </button>
      </div>
    </div>
  );
};

