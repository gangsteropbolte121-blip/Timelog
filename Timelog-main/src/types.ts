export type Status = 'idle' | 'working' | 'on_break' | 'checked_out';

export interface BreakSession {
  start: number;
  end: number | null;
}

export interface LogEntry {
  time: number;
  event: string;
  type: 'check_in' | 'break_start' | 'break_end' | 'check_out';
  durationMs?: number;
}

export interface ResourceLink {
  id: string;
  name: string;
  url: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  links: ResourceLink[];
}

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export interface Project {
  id: string;
  name: string;
  rate: number;
  currency: Currency;
  figmaUrl?: string;
  resources?: ResourceCategory[];
}

export interface Decision {
  id: string;
  date: string;
  title: string;
  reasoning: string;
  impact: 'Low' | 'Med' | 'High';
}

export interface SessionState {
  status: Status;
  checkInTime: number | null;
  checkOutTime: number | null;
  breaks: BreakSession[];
  logs: LogEntry[];
  projectId: string | null;
  dailyIntent: string;
  activeTask: string;
  reflections: {
    win: string;
    blocker: string;
  };
}

export interface HistorySession {
  id: string;
  date: string;
  dateFormatted: string;
  status: 'complete' | 'incomplete' | 'no_activity';
  checkInTime: number | null;
  checkOutTime: number | null;
  breaks: BreakSession[];
  logs: LogEntry[];
  projectId: string | null;
  dailyIntent: string;
  activeTask: string;
  reflections: {
    win: string;
    blocker: string;
  };
  summary: {
    totalSession: number;
    totalBreak: number;
    effectiveHours: number;
    breakCount: number;
    earnedValue: number;
  };
}

export interface Settings {
  id?: number;
  autoExport: boolean;
  keepDays: number;
}

export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroState {
  mode: PomodoroMode;
  status: 'idle' | 'running' | 'paused';
  remainingMs: number;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesCompleted: number;
  endTime: number | null;
}

export interface CustomAlarm {
  id: string;
  name: string;
  durationMs: number;
  remainingMs: number;
  endTime: number | null;
  status: 'idle' | 'running' | 'paused' | 'finished';
}
