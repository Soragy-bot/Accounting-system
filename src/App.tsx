import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationContainer } from './shared/components/Notification';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { LoadingSkeleton } from './shared/components/LoadingSkeleton';

// Lazy loading для страниц с code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const CashCounter = lazy(() => import('./pages/CashCounter').then(module => ({ default: module.CashCounter })));
const SalaryCalculator = lazy(() => import('./pages/SalaryCalculator').then(module => ({ default: module.SalaryCalculator })));

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
        <NotificationProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cash-counter" element={<CashCounter />} />
                <Route path="/salary-calculator" element={<SalaryCalculator />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <NotificationContainer />
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
