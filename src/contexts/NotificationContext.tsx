import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
  action?: NotificationAction;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (message: string, type?: NotificationType, duration?: number, action?: NotificationAction) => void;
  removeNotification: (id: string) => void;
  showSuccess: (message: string, duration?: number, action?: NotificationAction) => void;
  showError: (message: string, duration?: number, action?: NotificationAction) => void;
  showWarning: (message: string, duration?: number, action?: NotificationAction) => void;
  showInfo: (message: string, duration?: number, action?: NotificationAction) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEFAULT_DURATION = 5000; // 5 секунд

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const showNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration: number = DEFAULT_DURATION, action?: NotificationAction) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      const notification: Notification = {
        id,
        message,
        type,
        duration,
        action,
      };

      setNotifications((prev) => [...prev, notification]);

      // Автоматическое удаление теперь управляется компонентом NotificationItem
      // для правильной работы прогресс-бара и предотвращения конфликтов таймеров
    },
    [removeNotification]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number, action?: NotificationAction) => {
      showNotification(message, 'success', duration, action);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, duration?: number, action?: NotificationAction) => {
      showNotification(message, 'error', duration, action);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, duration?: number, action?: NotificationAction) => {
      showNotification(message, 'warning', duration, action);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, duration?: number, action?: NotificationAction) => {
      showNotification(message, 'info', duration, action);
    },
    [showNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

