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
