export type AlertSeverity = 'error' | 'warning' | 'info';
export type AlertSource = 'process' | 'docker' | 'file' | 'custom';

export interface LogSource {
  type: 'process' | 'docker' | 'file';
  id: string;
  patterns?: string[];
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  source: AlertSource;
  sourceId: string;
  pattern?: string;
  message: string;
  context?: string;
}

export interface WatchLogsInput {
  sources: LogSource[];
  alertOn?: string[];
  debounceMs?: number;
}

export interface SubscribeErrorsInput {
  severity?: AlertSeverity[];
  sources?: AlertSource[];
  patterns?: string[];
}

export interface GetAlertsInput {
  since?: number;
  severity?: AlertSeverity[];
  source?: AlertSource;
  limit?: number;
}

export interface ClearAlertsInput {
  olderThan?: number;
  severity?: AlertSeverity[];
}

export interface PatternMatch {
  pattern: string;
  matched: string;
  severity: AlertSeverity;
}
