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

export interface SessionState {
  status: Status;
  checkInTime: number | null;
  checkOutTime: number | null;
  breaks: BreakSession[];
  logs: LogEntry[];
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
  summary: {
    totalSession: number;
    totalBreak: number;
    effectiveHours: number;
    breakCount: number;
  };
}

export interface Settings {
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
