/**
 * Main Process Logger
 * A simple logger for the Electron main process.
 */

export const logger = {
  info: (...args: any[]) => {
    console.log('[INFO]', ...args)
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },
} 