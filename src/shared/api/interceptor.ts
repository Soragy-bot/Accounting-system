// HTTP Interceptor для обработки ошибок авторизации
export const setupApiInterceptor = () => {
  // Перехватываем только ответы, не изменяя сам fetch
  // Обработка 401 будет в компонентах через try-catch
};

