import React from 'react';
import { Link } from 'react-router-dom';
import { AdminMoyskladSettings } from '../features/admin/components/MoyskladSettings';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import styles from './AdminPage.module.css';

export const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link to="/" className={styles.backButton}>
          ← Назад
        </Link>
        <h1 className={styles.title}>Админ панель</h1>
        <div className={styles.headerActions}>
          <span className={styles.userInfo}>
            {user?.firstName || user?.username || 'Пользователь'}
          </span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Выйти
          </button>
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>
        <AdminMoyskladSettings />
      </main>
    </div>
  );
};

