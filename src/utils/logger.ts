/**
 * Logger utility for consistent logging throughout the application
 * Provides log levels, formatting, and centralized control over logging
 */

/**
 * Log levels enum
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableConsoleColors: boolean;
  enableGrouping: boolean;
  context: string;
}

// Default configuration
const config: LoggerConfig = {
  level: LogLevel.INFO,
  enableTimestamps: true,
  enableConsoleColors: true,
  enableGrouping: true,
  context: 'App'
};

// Grouping state
let groupDepth = 0;

/**
 * Sets the current log level
 * @param level - The log level to set
 */
export function setLogLevel(level: LogLevel): void {
  config.level = level;
}

/**
 * Gets the current log level
 * @returns The current log level
 */
export function getLogLevel(): LogLevel {
  return config.level;
}

/**
 * Enables or disables timestamps in logs
 * @param enable - Whether to enable timestamps
 */
export function enableTimestamps(enable: boolean): void {
  config.enableTimestamps = enable;
}

/**
 * Enables or disables console colors
 * @param enable - Whether to enable console colors
 */
export function enableConsoleColors(enable: boolean): void {
  config.enableConsoleColors = enable;
}

/**
 * Enables or disables log grouping
 * @param enable - Whether to enable grouping
 */
export function enableGrouping(enable: boolean): void {
  config.enableGrouping = enable;
}

/**
 * Sets the logger context (app name/section)
 * @param context - The context string to display in logs
 */
export function setContext(context: string): void {
  config.context = context;
}

/**
 * Formats a log message with timestamp and context
 * @param message - The message to format
 * @returns Formatted message
 */
function formatMessage(message: string): string {
  let formatted = '';
  
  if (config.enableTimestamps) {
    const now = new Date();
    const timestamp = now.toISOString().slice(11, 23); // HH:MM:SS.mmm
    formatted += `[${timestamp}] `;
  }
  
  formatted += `[${config.context}] ${message}`;
  
  return formatted;
}

/**
 * Logs error messages
 * @param message - The message to log
 * @param args - Additional arguments
 */
export function error(message: string, ...args: any[]): void {
  if (config.level >= LogLevel.ERROR) {
    const formatted = formatMessage(message);
    
    if (config.enableConsoleColors) {
      console.error(`%c${formatted}`, 'color: #FF5252;', ...args);
    } else {
      console.error(formatted, ...args);
    }
  }
}

/**
 * Logs warning messages
 * @param message - The message to log
 * @param args - Additional arguments
 */
export function warn(message: string, ...args: any[]): void {
  if (config.level >= LogLevel.WARN) {
    const formatted = formatMessage(message);
    
    if (config.enableConsoleColors) {
      console.warn(`%c${formatted}`, 'color: #FFC107;', ...args);
    } else {
      console.warn(formatted, ...args);
    }
  }
}

/**
 * Logs info messages
 * @param message - The message to log
 * @param args - Additional arguments
 */
export function log(message: string, ...args: any[]): void {
  if (config.level >= LogLevel.INFO) {
    const formatted = formatMessage(message);
    
    if (config.enableConsoleColors) {
      console.log(`%c${formatted}`, 'color: #4CAF50;', ...args);
    } else {
      console.log(formatted, ...args);
    }
  }
}

/**
 * Alias for log() for semantic consistency
 * @param message - The message to log
 * @param args - Additional arguments
 */
export function info(message: string, ...args: any[]): void {
  log(message, ...args);
}

/**
 * Logs debug messages
 * @param message - The message to log
 * @param args - Additional arguments
 */
export function debug(message: string, ...args: any[]): void {
  if (config.level >= LogLevel.DEBUG) {
    const formatted = formatMessage(message);
    
    if (config.enableConsoleColors) {
      console.debug(`%c${formatted}`, 'color: #2196F3;', ...args);
    } else {
      console.debug(formatted, ...args);
    }
  }
}

/**
 * Logs trace messages
 * @param message - The message to log
 * @param args - Additional arguments
 */
export function trace(message: string, ...args: any[]): void {
  if (config.level >= LogLevel.TRACE) {
    const formatted = formatMessage(message);
    
    if (config.enableConsoleColors) {
      console.debug(`%c${formatted}`, 'color: #9E9E9E;', ...args);
    } else {
      console.debug(formatted, ...args);
    }
  }
}

/**
 * Creates a collapsible group in the console
 * @param title - Group title
 */
export function group(title: string): void {
  if (config.level >= LogLevel.DEBUG && config.enableGrouping) {
    const formatted = formatMessage(title);
    
    if (config.enableConsoleColors) {
      console.group(`%c${formatted}`, 'color: #673AB7; font-weight: bold;');
    } else {
      console.group(formatted);
    }
    
    groupDepth++;
  }
}

/**
 * Creates an expanded collapsible group in the console
 * @param title - Group title
 */
export function groupCollapsed(title: string): void {
  if (config.level >= LogLevel.DEBUG && config.enableGrouping) {
    const formatted = formatMessage(title);
    
    if (config.enableConsoleColors) {
      console.groupCollapsed(`%c${formatted}`, 'color: #673AB7; font-weight: bold;');
    } else {
      console.groupCollapsed(formatted);
    }
    
    groupDepth++;
  }
}

/**
 * Ends the current group
 */
export function groupEnd(): void {
  if (config.level >= LogLevel.DEBUG && config.enableGrouping && groupDepth > 0) {
    console.groupEnd();
    groupDepth--;
  }
}

/**
 * Logs a table of data
 * @param data - Data to display in table format
 */
export function table(data: any): void {
  if (config.level >= LogLevel.DEBUG) {
    console.table(data);
  }
}

/**
 * Logs with custom styling
 * @param message - The message to log
 * @param cssStyle - CSS style to apply
 * @param args - Additional arguments
 */
export function styled(message: string, cssStyle: string, ...args: any[]): void {
  if (config.level >= LogLevel.INFO) {
    const formatted = formatMessage(message);
    
    if (config.enableConsoleColors) {
      console.log(`%c${formatted}`, cssStyle, ...args);
    } else {
      console.log(formatted, ...args);
    }
  }
}

/**
 * Measures execution time of a function
 * @param label - Label for the timing
 * @param fn - Function to execute and time
 * @returns The function result
 */
export function time<T>(label: string, fn: () => T): T {
  if (config.level >= LogLevel.DEBUG) {
    console.time(label);
    try {
      return fn();
    } finally {
      console.timeEnd(label);
    }
  } else {
    return fn();
  }
}

/**
 * Creates a logger instance with a specific context
 * @param context - Context name for this logger
 * @returns Object with logger methods
 */
export function createLogger(context: string) {
  return {
    error: (message: string, ...args: any[]) => {
      const currentContext = config.context;
      config.context = context;
      error(message, ...args);
      config.context = currentContext;
    },
    
    warn: (message: string, ...args: any[]) => {
      const currentContext = config.context;
      config.context = context;
      warn(message, ...args);
      config.context = currentContext;
    },
    
    log: (message: string, ...args: any[]) => {
      const currentContext = config.context;
      config.context = context;
      log(message, ...args);
      config.context = currentContext;
    },
    
    info: (message: string, ...args: any[]) => {
      const currentContext = config.context;
      config.context = context;
      info(message, ...args);
      config.context = currentContext;
    },
    
    debug: (message: string, ...args: any[]) => {
      const currentContext = config.context;
      config.context = context;
      debug(message, ...args);
      config.context = currentContext;
    },
    
    trace: (message: string, ...args: any[]) => {
      const currentContext = config.context;
      config.context = context;
      trace(message, ...args);
      config.context = currentContext;
    },
    
    group: (title: string) => {
      const currentContext = config.context;
      config.context = context;
      group(title);
      config.context = currentContext;
    },
    
    groupCollapsed: (title: string) => {
      const currentContext = config.context;
      config.context = context;
      groupCollapsed(title);
      config.context = currentContext;
    },
    
    groupEnd: () => groupEnd(),
    table: (data: any) => table(data),
    time: <T>(label: string, fn: () => T) => time(label, fn)
  };
}