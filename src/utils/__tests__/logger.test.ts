import { logger, LogLevel, Logger } from '../logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logger methods', () => {
    it('логирует debug сообщения', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('логирует info сообщения', () => {
      logger.info('Test info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('логирует warn сообщения', () => {
      logger.warn('Test warn message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('логирует error сообщения', () => {
      logger.error('Test error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('логирует ошибки с данными', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Logger class', () => {
    it('позволяет установить уровень логирования', () => {
      const customLogger = new Logger({ level: LogLevel.WARN, enableConsole: true });
      customLogger.setLevel(LogLevel.ERROR);
      
      customLogger.warn('This should not be logged');
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      
      customLogger.error('This should be logged');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('позволяет отключить вывод в консоль', () => {
      const customLogger = new Logger({ level: LogLevel.INFO, enableConsole: false });
      customLogger.info('This should not be logged');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });
  });
});

