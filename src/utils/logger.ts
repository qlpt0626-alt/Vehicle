export const DEBUG_MODE = false;

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface LogMessage {
  id: string;
  type: LogLevel;
  time: string;
  shortMessage: string;
  details?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogMessage[] = [];
  private listeners: ((logs: LogMessage[]) => void)[] = [];

  private constructor() {
    this.overrideConsole();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private overrideConsole() {
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.log = (...args: any[]) => {
      if (DEBUG_MODE) {
        originalConsoleLog(...args);
      }
    };

    console.warn = (...args: any[]) => {
      if (DEBUG_MODE) {
        originalConsoleWarn(...args);
      }
      this.addLog('warn', typeof args[0] === 'string' ? args[0] : 'Warning occurred', args);
    };

    console.error = (...args: any[]) => {
      if (DEBUG_MODE) {
        originalConsoleError(...args);
      }
      // Determine if it's a websocket error to filter out
      const text = args.map(a => String(a)).join(' ');
      let shortMsg = typeof args[0] === 'string' ? args[0] : 'Đã có lỗi xảy ra';
      if (text.includes('websocket') || text.includes('WebSocket')) {
        shortMsg = 'Mất kết nối máy chủ phát triển.';
      }

      this.addLog('error', shortMsg, args);
    };
  }

  public subscribe(listener: (logs: LogMessage[]) => void) {
    this.listeners.push(listener);
    listener(this.logs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.logs));
  }

  public addLog(type: LogLevel, shortMessage: string, details?: any) {
    const id = Math.random().toString(36).substring(2, 9);
    const date = new Date();
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const log: LogMessage = { id, type, time, shortMessage, details };
    
    this.logs = [log, ...this.logs].slice(0, 50); // Keep last 50 logs
    this.notify();

    // Remove notification after 5 seconds if not in debug panel
    setTimeout(() => {
      this.removeLog(id);
    }, 5000);
  }

  public removeLog(id: string) {
    this.logs = this.logs.filter(l => l.id !== id);
    this.notify();
  }

  public success(shortMessage: string, details?: any) {
    if (DEBUG_MODE && details) console.log(details);
    this.addLog('success', shortMessage, details);
  }

  public warn(shortMessage: string, details?: any) {
    if (DEBUG_MODE && details) console.warn(details);
    this.addLog('warn', shortMessage, details);
  }

  public error(shortMessage: string, details?: any) {
    if (DEBUG_MODE && details) console.error(details);
    this.addLog('error', shortMessage, details);
  }

  public info(shortMessage: string, details?: any) {
    if (DEBUG_MODE && details) console.log(details);
    this.addLog('info', shortMessage, details);
  }
}

export const logger = Logger.getInstance();
