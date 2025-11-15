import React, { useState, useEffect, useCallback } from 'react';
import { MoyskladSettings, Store } from '../types';
import { getMoyskladSettings, saveMoyskladSettings, getDefaultMoyskladSettings } from '../utils/moyskladStorage';
import { getStores, testConnection, MoyskladApiError } from '../utils/moyskladApi';
import styles from './MoyskladSettings.module.css';

interface MoyskladSettingsProps {
    onSettingsChange: (settings: MoyskladSettings | null) => void;
}

export const MoyskladSettingsComponent: React.FC<MoyskladSettingsProps> = ({ onSettingsChange }) => {
    const [settings, setSettings] = useState<MoyskladSettings>(getDefaultMoyskladSettings());
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    // Загрузка сохраненных настроек
    useEffect(() => {
        const savedSettings = getMoyskladSettings();
        if (savedSettings) {
            setSettings(savedSettings);
            onSettingsChange(savedSettings);

            // Загружаем списки при наличии токена
            if (savedSettings.accessToken) {
                loadStores(savedSettings.accessToken);
            }
        }
    }, [onSettingsChange]);

    // Загрузка списка точек продажи
    const loadStores = useCallback(async (token: string) => {
        try {
            setLoading(true);
            setError(null);
            const storesList = await getStores(token);
            setStores(storesList);
        } catch (err) {
            console.error('Ошибка при загрузке точек продажи:', err);
            if (err instanceof MoyskladApiError) {
                setError(err.message);
            } else {
                setError('Не удалось загрузить точки продажи');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Обработка изменения токена
    const handleTokenChange = useCallback((token: string) => {
        const newSettings = { ...settings, accessToken: token };
        setSettings(newSettings);
        setError(null);
        setSuccess(null);
        setConnectionStatus('idle');

        // Если токен есть, загружаем списки
        if (token) {
            loadStores(token);
        } else {
            setStores([]);
        }
    }, [settings, loadStores]);

    // Обработка изменения точки продажи
    const handleStoreChange = useCallback((storeId: string) => {
        const newSettings = { ...settings, storeId: storeId || null };
        setSettings(newSettings);
        setError(null);
    }, [settings]);


    // Тест подключения
    const handleTestConnection = useCallback(async () => {
        if (!settings.accessToken) {
            setError('Введите токен доступа');
            return;
        }

        setTesting(true);
        setError(null);
        setSuccess(null);
        setConnectionStatus('testing');

        try {
            const isConnected = await testConnection(settings.accessToken);
            if (isConnected) {
                setSuccess('Подключение успешно установлено');
                setConnectionStatus('success');
                // Загружаем списки после успешного теста
                await loadStores(settings.accessToken);
            } else {
                setError('Не удалось установить подключение');
                setConnectionStatus('error');
            }
        } catch (err) {
            console.error('Ошибка при тесте подключения:', err);
            if (err instanceof MoyskladApiError) {
                setError(err.message);
            } else {
                setError('Ошибка при проверке подключения');
            }
            setConnectionStatus('error');
        } finally {
            setTesting(false);
        }
    }, [settings.accessToken, loadStores]);

    // Сохранение настроек
    const handleSave = useCallback(() => {
        if (!settings.accessToken) {
            setError('Введите токен доступа');
            return;
        }

        if (!settings.storeId) {
            setError('Выберите розничную точку продажи');
            return;
        }

        try {
            saveMoyskladSettings(settings);
            setSuccess('Настройки сохранены');
            setError(null);
            onSettingsChange(settings);
        } catch (err) {
            console.error('Ошибка при сохранении настроек:', err);
            setError('Не удалось сохранить настройки');
        }
    }, [settings, onSettingsChange]);

    // Очистка сообщений об ошибках/успехе
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Настройки API МойСклад</h2>

            <div className={styles.section}>
                <label className={styles.label}>
                    <span className={styles.labelText}>Токен доступа *</span>
                    <input
                        type="password"
                        value={settings.accessToken}
                        onChange={(e) => handleTokenChange(e.target.value)}
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
                    disabled={testing || !settings.accessToken}
                    className={styles.testButton}
                >
                    {testing ? 'Проверка...' : 'Проверить подключение'}
                </button>
            </div>

            {connectionStatus === 'testing' && (
                <div className={styles.status}>Проверка подключения...</div>
            )}

            {connectionStatus === 'success' && (
                <div className={`${styles.status} ${styles.statusSuccess}`}>✓ Подключение установлено</div>
            )}

            {connectionStatus === 'error' && error && (
                <div className={`${styles.status} ${styles.statusError}`}>✗ {error}</div>
            )}

            {error && connectionStatus !== 'error' && (
                <div className={`${styles.status} ${styles.statusError}`}>✗ {error}</div>
            )}

            {success && (
                <div className={`${styles.status} ${styles.statusSuccess}`}>✓ {success}</div>
            )}

            <div className={styles.section}>
                <label className={styles.label}>
                    <span className={styles.labelText}>Розничная точка продажи *</span>
                    <select
                        value={settings.storeId || ''}
                        onChange={(e) => handleStoreChange(e.target.value)}
                        className={styles.select}
                        disabled={loading || !settings.accessToken}
                    >
                        <option value="">Выберите розничную точку продажи</option>
                        {stores.map((store) => (
                            <option key={store.id} value={store.id}>
                                {store.name}
                            </option>
                        ))}
                    </select>
                </label>
                {loading && <div className={styles.loading}>Загрузка...</div>}
            </div>

            <div className={styles.actions}>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading || testing || !settings.accessToken || !settings.storeId}
                    className={styles.saveButton}
                >
                    Сохранить настройки
                </button>
            </div>
        </div>
    );
};
