import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotificationContainer } from './components/Notification';
import { HomePage } from './pages/HomePage';
import { CashCounter } from './pages/CashCounter';
import { SalaryCalculator } from './pages/SalaryCalculator';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cash-counter" element={<CashCounter />} />
            <Route path="/salary-calculator" element={<SalaryCalculator />} />
          </Routes>
        </BrowserRouter>
        <NotificationContainer />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
