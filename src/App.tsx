import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CashCounter } from './pages/CashCounter';
import { SalaryCalculator } from './pages/SalaryCalculator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cash-counter" element={<CashCounter />} />
        <Route path="/salary-calculator" element={<SalaryCalculator />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
