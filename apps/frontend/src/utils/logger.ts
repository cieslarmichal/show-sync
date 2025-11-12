const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};
