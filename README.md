# VkusiPar Utilities

Система учета для управления кассой и расчета зарплаты сотрудников.

## Функциональность

- **Подсчет кассы** - учет денежных операций с сохранением истории
- **Расчет зарплаты** - калькулятор зарплаты с экспортом в Excel
- **Темная тема** - переключение между светлой и темной темой
- **История операций** - просмотр последних подсчетов
- **Локальное хранение** - данные сохраняются в браузере

## Технологии

- React 18
- TypeScript
- Vite
- React Router
- xlsx-js-style

## Установка

```bash
npm install
```

## Запуск

```bash
# Режим разработки
npm run dev

# Сборка для производства
npm run build

# Просмотр собранной версии
npm run preview
```

## Структура проекта

```
src/
  ├── components/     # React компоненты
  ├── pages/          # Страницы приложения
  ├── contexts/       # React контексты
  ├── utils/          # Утилиты и вычисления
  └── types.ts        # TypeScript типы
```

## Использование

1. Откройте приложение в браузере
2. Выберите нужный инструмент (Подсчет кассы или Расчет зарплаты)
3. Введите данные и сохраните результат

## Развертывание на сервере с Docker

### Требования

- Docker (версия 20.10 или выше)
- Docker Compose (версия 2.0 или выше)

### Быстрый старт с Docker Compose

1. **Клонируйте репозиторий или скопируйте файлы на сервер**

2. **Перейдите в директорию проекта**
```bash
cd Accounting-system
```

3. **Соберите и запустите контейнер**
```bash
docker-compose up -d --build
```

4. **Приложение будет доступно по адресу:**
   - `http://localhost` (локально)
   - `http://your-server-ip` (на сервере)

### Управление контейнером

```bash
# Остановить контейнер
docker-compose down

# Перезапустить контейнер
docker-compose restart

# Просмотр логов
docker-compose logs -f

# Остановить и удалить контейнер с данными
docker-compose down -v
```

### Развертывание без Docker Compose

1. **Соберите Docker образ**
```bash
docker build -t accounting-system:latest .
```

2. **Запустите контейнер**
```bash
docker run -d \
  --name accounting-system \
  -p 80:80 \
  --restart unless-stopped \
  accounting-system:latest
```

3. **Управление контейнером**
```bash
# Остановить
docker stop accounting-system

# Запустить
docker start accounting-system

# Удалить
docker rm -f accounting-system

# Просмотр логов
docker logs -f accounting-system
```

### Настройка порта

Если порт 80 занят, измените порт в `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Внешний порт:Внутренний порт
```

Или при запуске через `docker run`:

```bash
docker run -d -p 8080:80 --name accounting-system accounting-system:latest
```

### Обновление приложения

1. **Остановите текущий контейнер**
```bash
docker-compose down
```

2. **Получите последние изменения** (если используете git)
```bash
git pull
```

3. **Пересоберите и запустите**
```bash
docker-compose up -d --build
```

### Проблемы и решения

**Проблема:** Порт уже занят
- **Решение:** Измените порт в `docker-compose.yml` или остановите службу, использующую порт 80

**Проблема:** Ошибка при сборке
- **Решение:** Убедитесь, что все файлы проекта скопированы, включая `package.json` и `package-lock.json`

**Проблема:** Приложение не открывается
- **Решение:** Проверьте логи: `docker-compose logs -f` или `docker logs accounting-system`

