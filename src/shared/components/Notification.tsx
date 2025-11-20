import React, { useEffect, useState, useRef } from 'react';
import { useNotification, Notification as NotificationType } from '../../contexts/NotificationContext';
import styles from './Notification.module.css';

interface NotificationItemProps {
  notification: NotificationType;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isClosing, setIsClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  const isClosedRef = useRef(false);

  // Обновляем ref при изменении onClose
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Автоматически закрываем если указана длительность
    if (notification.duration && notification.duration > 0) {
      const startTime = Date.now();
      const duration = notification.duration;
      const interval = 50; // Обновляем прогресс каждые 50мс для плавности
      isClosedRef.current = false;
      
      const progressInterval = setInterval(() => {
        if (isClosedRef.current) {
          return;
        }
        
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const progressPercent = (remaining / duration) * 100;
        
        setProgress(progressPercent);
        
        if (remaining <= 0) {
          isClosedRef.current = true;
          clearInterval(progressInterval);
          setIsClosing(true);
          
          // Закрываем уведомление после анимации
          setTimeout(() => {
            onCloseRef.current();
          }, 200);
        }
      }, interval);

      return () => {
        isClosedRef.current = true;
        clearInterval(progressInterval);
      };
    }
  }, [notification.id, notification.duration]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  const handleActionClick = () => {
    if (notification.action) {
      notification.action.onClick();
      onClose();
    }
  };

  const showProgress = notification.duration && notification.duration > 0;

  return (
    <div
      className={`${styles.notification} ${styles[notification.type]} ${isClosing ? styles.closing : ''}`}
      role="alert"
      aria-live="polite"
    >
      {showProgress && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className={styles.icon}>{getIcon()}</div>
      <div className={styles.message}>{notification.message}</div>
      <div className={styles.actions}>
        {notification.action && (
          <button
            className={styles.actionButton}
            onClick={handleActionClick}
            aria-label={notification.action.label}
          >
            {notification.action.label}
          </button>
        )}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрыть уведомление"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

