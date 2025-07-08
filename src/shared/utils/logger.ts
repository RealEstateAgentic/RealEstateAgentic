/**
 * Logger Utility
 * Provides consistent logging functionality across the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerConfig {
  level: LogLevel
  prefix?: string
  timestamp?: boolean
}

/**
 * Simple logger with configurable levels
 */
export class Logger {
  private config: LoggerConfig
  
  constructor(config: LoggerConfig = { level: 'info' }) {
    this.config = config
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.config.level)
    const messageLevelIndex = levels.indexOf(level)
    
    if (messageLevelIndex < currentLevelIndex) {
      return
    }
    
    const timestamp = this.config.timestamp ? `[${new Date().toISOString()}]` : ''
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : ''
    const logPrefix = `${timestamp}${prefix}`.trim()
    
    const consoleMethod = level === 'error' ? console.error : 
                         level === 'warn' ? console.warn : 
                         level === 'debug' ? console.debug : 
                         console.log
    
    if (logPrefix) {
      consoleMethod(`${logPrefix} ${message}`, ...args)
    } else {
      consoleMethod(message, ...args)
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args)
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args)
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args)
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger({
  level: 'info',
  prefix: 'App',
  timestamp: true
})

/**
 * Create a logger with custom configuration
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config)
} 