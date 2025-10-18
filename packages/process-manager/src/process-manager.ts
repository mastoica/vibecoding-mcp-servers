import { execa } from 'execa';
import EventEmitter from 'eventemitter3';
import type {
  ProcessConfig,
  ProcessInfo,
  ProcessLog,
  ManagedProcess,
} from './types.js';

export class ProcessManager extends EventEmitter {
  private processes = new Map<string, ManagedProcess>();
  private nextId = 1;
  private readonly defaultLogBuffer = 1000;

  constructor() {
    super();
  }

  async startProcess(config: ProcessConfig): Promise<ProcessInfo> {
    const id = `proc-${this.nextId++}`;

    // Parse command and arguments
    const [cmd, ...args] = config.command.split(' ');

    // Create process info
    const info: ProcessInfo = {
      id,
      config,
      status: 'running',
      startTime: new Date(),
    };

    // Start the process
    const childProcess = execa(cmd, args, {
      cwd: config.cwd,
      env: { ...globalThis.process.env, ...config.env },
      reject: false,
      all: true,
      buffer: false,
    });

    info.pid = childProcess.pid;

    // Create managed process
    const managedProcess: ManagedProcess = {
      info,
      process: childProcess,
      logs: [],
      logBuffer: this.defaultLogBuffer,
    };

    this.processes.set(id, managedProcess);

    // Handle stdout
    childProcess.stdout?.on('data', (data: Buffer) => {
      this.addLog(id, 'stdout', data.toString());
    });

    // Handle stderr
    childProcess.stderr?.on('data', (data: Buffer) => {
      this.addLog(id, 'stderr', data.toString());
    });

    // Handle process exit
    childProcess.on('exit', (code: number | null) => {
      const proc = this.processes.get(id);
      if (proc) {
        proc.info.status = code === 0 ? 'stopped' : 'failed';
        proc.info.stopTime = new Date();
        proc.info.exitCode = code ?? undefined;
        this.emit('process:exit', { id, code });

        // Auto-restart if configured
        if (config.autoRestart && code !== 0) {
          setTimeout(() => {
            this.restartProcess(id).catch(err => {
              console.error(`Failed to restart process ${id}:`, err);
            });
          }, 1000);
        }
      }
    });

    // Handle errors
    childProcess.on('error', (error: Error) => {
      const proc = this.processes.get(id);
      if (proc) {
        proc.info.status = 'failed';
        proc.info.error = error.message;
        this.emit('process:error', { id, error });
      }
    });

    this.emit('process:start', info);
    return info;
  }

  async stopProcess(processId: string, timeout = 5000): Promise<void> {
    const managed = this.processes.get(processId);
    if (!managed) {
      throw new Error(`Process ${processId} not found`);
    }

    if (!managed.process || managed.info.status !== 'running') {
      throw new Error(`Process ${processId} is not running`);
    }

    // Try graceful shutdown first
    managed.process.kill('SIGTERM');

    // Wait for process to exit or timeout
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        // Force kill if still running
        if (managed.process && managed.info.status === 'running') {
          managed.process.kill('SIGKILL');
        }
        resolve();
      }, timeout);

      managed.process?.on('exit', () => {
        clearTimeout(timer);
        resolve();
      });

      managed.process?.on('error', (error: Error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  async restartProcess(processId: string): Promise<ProcessInfo> {
    const managed = this.processes.get(processId);
    if (!managed) {
      throw new Error(`Process ${processId} not found`);
    }

    // Stop the process if running
    if (managed.info.status === 'running') {
      await this.stopProcess(processId);
    }

    // Start new process with same config
    const newInfo = await this.startProcess(managed.info.config);

    // Remove old process
    this.processes.delete(processId);

    return newInfo;
  }

  getProcessLogs(
    processId: string,
    filter?: string,
    since?: number,
    lines?: number
  ): ProcessLog[] {
    const managed = this.processes.get(processId);
    if (!managed) {
      throw new Error(`Process ${processId} not found`);
    }

    let logs = managed.logs;

    // Filter by timestamp
    if (since !== undefined) {
      const sinceDate = new Date(since);
      logs = logs.filter(log => log.timestamp >= sinceDate);
    }

    // Filter by pattern
    if (filter) {
      const regex = new RegExp(filter);
      logs = logs.filter(log => regex.test(log.data));
    }

    // Limit number of lines
    if (lines !== undefined) {
      logs = logs.slice(-lines);
    }

    return logs;
  }

  listProcesses(status?: 'running' | 'stopped' | 'failed' | 'all'): ProcessInfo[] {
    const processes = Array.from(this.processes.values());

    if (!status || status === 'all') {
      return processes.map(p => p.info);
    }

    return processes
      .filter(p => p.info.status === status)
      .map(p => p.info);
  }

  sendInput(processId: string, input: string): void {
    const managed = this.processes.get(processId);
    if (!managed) {
      throw new Error(`Process ${processId} not found`);
    }

    if (!managed.process || managed.info.status !== 'running') {
      throw new Error(`Process ${processId} is not running`);
    }

    if (!managed.process.stdin) {
      throw new Error(`Process ${processId} does not support stdin`);
    }

    managed.process.stdin.write(input + '\n');
  }

  private addLog(processId: string, stream: 'stdout' | 'stderr', data: string): void {
    const managed = this.processes.get(processId);
    if (!managed) return;

    const log: ProcessLog = {
      timestamp: new Date(),
      stream,
      data: data.trim(),
    };

    managed.logs.push(log);

    // Trim log buffer if needed
    if (managed.logs.length > managed.logBuffer) {
      managed.logs = managed.logs.slice(-managed.logBuffer);
      this.processes.get(processId)!.logs = managed.logs;
    }

    // Emit log event
    this.emit('process:log', { processId, log });

    // Check watch patterns
    if (managed.info.config.watchPatterns) {
      for (const pattern of managed.info.config.watchPatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(data)) {
          this.emit('process:pattern-match', {
            processId,
            pattern,
            log,
          });
        }
      }
    }
  }

  cleanup(): void {
    for (const managed of this.processes.values()) {
      if (managed.info.status === 'running' && managed.process) {
        managed.process.kill('SIGTERM');
      }
    }
    this.processes.clear();
  }
}
