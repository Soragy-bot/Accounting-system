/**
 * Уровни логирования
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Конфигурация логирования
 */
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemoteLogging?: boolean;
  remoteEndpoint?: string;
}

/**
 * Интерфейс для записи лога
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

/**
 * Класс для централизованного логирования
 */
class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = { level: LogLevel.INFO, enableConsole: true }) {
    this.config = config;
  }

  /**
   * Проверяет, должен ли лог быть записан на текущем уровне
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Форматирует сообщение для вывода
   */
  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const levelName = LogLevel[level];
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${levelName}] ${message}`;
    
    if (data !== undefined) {
      try {
        formatted += ` ${JSON.stringify(data, null, 2)}`;
      } catch {
        formatted += ` [Не удалось сериализовать данные]`;
      }
    }
    
    return formatted;
  }

  /**
   * Создает запись лога
   */
  private createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  /**
   * Выводит лог в консоль
   */
  private logToConsole(level: LogLevel, message: string, data?: unknown): void {
    if (!this.config.enableConsole) return;

    const formatted = this.formatMessage(level, message, data);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        if (data instanceof Error && data.stack) {
          console.error('Stack trace:', data.stack);
        }
        break;
    }
  }

  /**
   * Отправляет лог на удаленный сервер (если настроено)
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemoteLogging || !this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Не логируем ошибки логирования, чтобы избежать бесконечного цикла
      if (this.config.enableConsole) {
        console.error('Не удалось отправить лог на сервер:', error);
      }
    }
  }

  /**
   * Записывает лог
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, data);
    this.logToConsole(level, message, data);

    // Отправляем только ошибки на удаленный сервер
    if (level === LogLevel.ERROR) {
      this.logToRemote(entry).catch(() => {
        // Игнорируем ошибки отправки
      });
    }
  }

  /**
   * Логирует отладочное сообщение
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Логирует информационное сообщение
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Логирует предупреждение
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Логирует ошибку
   */
  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Устанавливает уровень логирования
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Включает/выключает вывод в консоль
   */
  setConsoleEnabled(enabled: boolean): void {
    this.config.enableConsole = enabled;
  }
}

// Создаем экземпляр логгера с настройками по умолчанию
const defaultLogger = new Logger({
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.INFO,
  enableConsole: true,
});

// Экспортируем экземпляр и класс
export const logger = defaultLogger;
export { Logger };

