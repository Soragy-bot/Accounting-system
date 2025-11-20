import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationContainer } from './shared/components/Notification';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { LoadingSkeleton } from './shared/components/LoadingSkeleton';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { AuthCallback } from './features/auth/components/AuthCallback';

// Lazy loading для страниц с code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const CashCounter = lazy(() => import('./pages/CashCounter').then(module => ({ default: module.CashCounter })));
const SalaryCalculator = lazy(() => import('./pages/SalaryCalculator').then(module => ({ default: module.SalaryCalculator })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));

// Компонент загрузки для Suspense
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <LoadingSkeleton width="100%" height="100vh" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <HomePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cash-counter"
                    element={
                      <ProtectedRoute>
                        <CashCounter />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/salary-calculator"
                    element={
                      <ProtectedRoute>
                        <SalaryCalculator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </BrowserRouter>
            <NotificationContainer />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
