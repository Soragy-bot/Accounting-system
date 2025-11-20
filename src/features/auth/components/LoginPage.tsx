import React, { useState } from 'react';
import { authApi } from '../../../shared/api/auth/api';
import { useNotification } from '../../../contexts/NotificationContext';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleTelegramLogin = () => {
    try {
      setLoading(true);
      const authUrl = authApi.getTelegramAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Telegram login:', error);
      showError('Не удалось начать авторизацию. Попробуйте позже.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Система учета</h1>
        <p className={styles.description}>
          Войдите через Telegram для доступа к системе
        </p>
        <button
          onClick={handleTelegramLogin}
          className={styles.telegramButton}
          disabled={loading}
        >
          <span className={styles.telegramIcon}>✈</span>
          {loading ? 'Подключение...' : 'Войти через Telegram'}
        </button>
        {loading && (
          <p className={styles.hint} style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            Перенаправление на Telegram...
          </p>
        )}
      </div>
    </div>
  );
};

