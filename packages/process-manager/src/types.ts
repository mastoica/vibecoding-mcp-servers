import type { ResultPromise } from 'execa';

export interface ProcessConfig {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  label?: string;
  autoRestart?: boolean;
  watchPatterns?: string[];
}

export interface ProcessInfo {
  id: string;
  config: ProcessConfig;
  status: 'running' | 'stopped' | 'failed';
  pid?: number;
  startTime?: Date;
  stopTime?: Date;
  exitCode?: number;
  error?: string;
}

export interface ProcessLog {
  timestamp: Date;
  stream: 'stdout' | 'stderr';
  data: string;
}

export interface ManagedProcess {
  info: ProcessInfo;
  process?: ResultPromise;
  logs: ProcessLog[];
  logBuffer: number; // Maximum number of logs to keep
}

export interface StartProcessInput {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  label?: string;
  autoRestart?: boolean;
  watchPatterns?: string[];
}

export interface StopProcessInput {
  processId: string;
  timeout?: number;
}

export interface RestartProcessInput {
  processId: string;
}

export interface GetProcessLogsInput {
  processId: string;
  filter?: string;
  since?: number;
  lines?: number;
  follow?: boolean;
}

export interface ListProcessesInput {
  status?: 'running' | 'stopped' | 'failed' | 'all';
}

export interface SendInputInput {
  processId: string;
  input: string;
}
