import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError } = useNotification();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      showError('Ошибка авторизации: ' + decodeURIComponent(errorParam));
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
      return;
    }

    if (token) {
      login(token, refresh || undefined)
        .then(() => {
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('Login error:', err);
          setError('Не удалось выполнить вход');
          showError('Ошибка при входе в систему');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        });
    } else {
      setError('Токен не получен');
      showError('Ошибка авторизации: токен не получен');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
    }
  }, [searchParams, login, navigate, showError]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
      {error ? (
        <>
          <div style={{ color: 'var(--accent-danger, #e74c3c)' }}>Ошибка: {error}</div>
          <div style={{ color: 'var(--text-secondary, #666)' }}>Перенаправление...</div>
        </>
      ) : (
        <div>Авторизация...</div>
      )}
    </div>
  );
};

