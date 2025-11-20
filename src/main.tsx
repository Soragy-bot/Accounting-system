import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupApiInterceptor } from './shared/api/interceptor'

// Настраиваем перехватчик API для обработки ошибок авторизации
setupApiInterceptor()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

