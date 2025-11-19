import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MoyskladSettings, Store } from '../../../shared/api/moysklad/types';
import { getMoyskladSettings, saveMoyskladSettings, getDefaultMoyskladSettings } from '../../../shared/api/moysklad/storage';
import { getStores, testConnection, MoyskladApiError } from '../../../shared/api/moysklad/client';
import { logger } from '../../../shared/utils/logger';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSkeleton } from '../../../shared/components/LoadingSkeleton';
import styles from './MoyskladSettings.module.css';

interface MoyskladSettingsProps {
    onSettingsChange: (settings: MoyskladSettings | null) => void;
}

export const MoyskladSettingsComponent: React.FC<MoyskladSettingsProps> = ({ onSettingsChange }) => {
    const { showSuccess, showError, showInfo } = useNotification();
    const [settings, setSettings] = useState<MoyskladSettings>(getDefaultMoyskladSettings());
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const isInitialLoadRef = useRef(true);
    const hasLoadedRef = useRef(false);

    // Загрузка списка точек продажи
    const loadStores = useCallback(async (token: string, showNotification = false) => {
        try {
            setLoading(true);
            const storesList = await getStores(token);
            setStores(storesList);
            // Показываем уведомление только если явно запрошено (при нажатии кнопки "Повторить попытку")
            if (showNotification && storesList.length > 0) {
                showSuccess(`Загружено точек продажи: ${storesList.length}`);
            }
        } catch (err) {
            logger.error('Ошибка при загрузке точек продажи:', err);
            // Показываем ошибку если явно запрошено или если это не первая автоматическая загрузка
            if (showNotification || !isInitialLoadRef.current) {
            if (err instanceof MoyskladApiError) {
                    showError(err.message);
            } else {
                    showError('Не удалось загрузить точки продажи');
                }
            }
        } finally {
            setLoading(false);
        }
    }, [showSuccess, showError]);

    // Загрузка сохраненных настроек
    useEffect(() => {
        // Защита от повторных вызовов
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        const savedSettings = getMoyskladSettings();
        if (savedSettings) {
            setSettings(savedSettings);
            onSettingsChange(savedSettings);

            // Загружаем списки при наличии токена (без уведомления при первой загрузке)
            if (savedSettings.accessToken) {
                loadStores(savedSettings.accessToken, false);
            }
        }
        isInitialLoadRef.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Загружаем только один раз при монтировании

    // Обработка изменения токена
    const handleTokenChange = useCallback((token: string) => {
        const newSettings = { ...settings, accessToken: token };
        setSettings(newSettings);
        setConnectionStatus('idle');

        // Автоматически сохраняем настройки
        if (token) {
            try {
                saveMoyskladSettings(newSettings);
                onSettingsChange(newSettings);
            } catch (err) {
                logger.error('Ошибка при сохранении настроек:', err);
            }
            loadStores(token, false); // Не показываем уведомление при автоматической загрузке
        } else {
            setStores([]);
            // Очищаем настройки если токен удален
            try {
                saveMoyskladSettings(newSettings);
                onSettingsChange(newSettings);
            } catch (err) {
                logger.error('Ошибка при сохранении настроек:', err);
            }
        }
    }, [settings, loadStores, onSettingsChange]);

    // Обработка изменения точки продажи
    const handleStoreChange = useCallback((storeId: string) => {
        const newSettings = { ...settings, storeId: storeId || null };
        setSettings(newSettings);
        
        // Автоматически сохраняем настройки
        try {
            saveMoyskladSettings(newSettings);
            onSettingsChange(newSettings);
            if (storeId) {
                showSuccess('Точка продажи выбрана');
            }
        } catch (err) {
            logger.error('Ошибка при сохранении настроек:', err);
            showError('Не удалось сохранить настройки');
        }
    }, [settings, onSettingsChange, showSuccess, showError]);


    // Тест подключения
    const handleTestConnection = useCallback(async () => {
        if (!settings.accessToken) {
            showError('Введите токен доступа');
            return;
        }

        setTesting(true);
        setConnectionStatus('testing');

        try {
            const isConnected = await testConnection(settings.accessToken);
            if (isConnected) {
                setConnectionStatus('success');
                showSuccess('Подключение успешно установлено');
                // Загружаем списки после успешного теста
                await loadStores(settings.accessToken, false);
            } else {
                setConnectionStatus('error');
                showError('Не удалось установить подключение');
            }
        } catch (err) {
            logger.error('Ошибка при тесте подключения:', err);
            setConnectionStatus('error');
            if (err instanceof MoyskladApiError) {
                showError(err.message);
            } else {
                showError('Ошибка при проверке подключения');
            }
        } finally {
            setTesting(false);
        }
    }, [settings.accessToken, loadStores, showSuccess, showError]);



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
                <div className={styles.status}>
                    <span className={`${styles.statusIcon} ${styles.statusIconSpinning}`}>⟳</span>
                    Проверка подключения...
                </div>
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
                {loading && (
                    <div className={styles.loadingContainer}>
                        <LoadingSkeleton width="100%" height="2.5rem" />
                        <span className={styles.loadingText}>Загрузка точек продажи...</span>
                    </div>
                )}
                {connectionStatus === 'error' && !loading && (
                    <div className={styles.retryContainer}>
                        <button
                            type="button"
                            onClick={() => settings.accessToken && loadStores(settings.accessToken, true)}
                            className={styles.retryButton}
                        >
                            Повторить попытку
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
