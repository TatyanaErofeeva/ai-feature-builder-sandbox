export type SessionStatus = 'idle' | 'generating' | 'ready' | 'error';

export type LogLevel = 'info' | 'success' | 'error';

export interface SessionLog {
  id: string;
  at: number;
  level: LogLevel;
  message: string;
}

export interface SessionMetrics {
  streamedChars: number;
  tokensPerSecond: number;
}

export interface LogDraft {
  level: LogLevel;
  message: string;
}
