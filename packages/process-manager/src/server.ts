import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ProcessManager } from './process-manager.js';
import type {
  StartProcessInput,
  StopProcessInput,
  RestartProcessInput,
  GetProcessLogsInput,
  ListProcessesInput,
  SendInputInput,
} from './types.js';

export class ProcessManagerServer {
  private server: Server;
  private processManager: ProcessManager;

  constructor() {
    this.processManager = new ProcessManager();
    this.server = new Server(
      {
        name: '@vibecoding/process-manager',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'start_process':
            return await this.handleStartProcess(args as unknown as StartProcessInput);

          case 'stop_process':
            return await this.handleStopProcess(args as unknown as StopProcessInput);

          case 'restart_process':
            return await this.handleRestartProcess(args as unknown as RestartProcessInput);

          case 'get_process_logs':
            return await this.handleGetProcessLogs(args as unknown as GetProcessLogsInput);

          case 'list_processes':
            return await this.handleListProcesses((args ?? {}) as unknown as ListProcessesInput);

          case 'send_input':
            return await this.handleSendInput(args as unknown as SendInputInput);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${message}`,
            },
          ],
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'start_process',
        description: 'Start a new development process and return a process ID for monitoring',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Command to execute (e.g., "pnpm nx serve admin")',
            },
            cwd: {
              type: 'string',
              description: 'Working directory for the process',
            },
            env: {
              type: 'object',
              description: 'Environment variables to set',
              additionalProperties: { type: 'string' },
            },
            label: {
              type: 'string',
              description: 'Human-readable label for the process',
            },
            autoRestart: {
              type: 'boolean',
              description: 'Automatically restart the process on failure',
            },
            watchPatterns: {
              type: 'array',
              items: { type: 'string' },
              description: 'Regex patterns to monitor in logs (e.g., ["ERROR", "TS\\\\d+"])',
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'stop_process',
        description: 'Stop a running process gracefully (SIGTERM, then SIGKILL after timeout)',
        inputSchema: {
          type: 'object',
          properties: {
            processId: {
              type: 'string',
              description: 'Process ID to stop',
            },
            timeout: {
              type: 'number',
              description: 'Milliseconds before SIGKILL (default: 5000)',
            },
          },
          required: ['processId'],
        },
      },
      {
        name: 'restart_process',
        description: 'Restart a process (stop + start)',
        inputSchema: {
          type: 'object',
          properties: {
            processId: {
              type: 'string',
              description: 'Process ID to restart',
            },
          },
          required: ['processId'],
        },
      },
      {
        name: 'get_process_logs',
        description: 'Retrieve logs from a process with optional filtering and streaming',
        inputSchema: {
          type: 'object',
          properties: {
            processId: {
              type: 'string',
              description: 'Process ID to get logs from',
            },
            filter: {
              type: 'string',
              description: 'Regex pattern to filter logs',
            },
            since: {
              type: 'number',
              description: 'Unix timestamp to get logs since',
            },
            lines: {
              type: 'number',
              description: 'Number of recent lines to retrieve',
            },
            follow: {
              type: 'boolean',
              description: 'Stream new logs (not yet implemented)',
            },
          },
          required: ['processId'],
        },
      },
      {
        name: 'list_processes',
        description: 'List all managed processes with their status',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['running', 'stopped', 'failed', 'all'],
              description: 'Filter by process status',
            },
          },
        },
      },
      {
        name: 'send_input',
        description: 'Send input to a running process (useful for interactive commands)',
        inputSchema: {
          type: 'object',
          properties: {
            processId: {
              type: 'string',
              description: 'Process ID to send input to',
            },
            input: {
              type: 'string',
              description: 'Input to send to the process',
            },
          },
          required: ['processId', 'input'],
        },
      },
    ];
  }

  private async handleStartProcess(input: StartProcessInput) {
    const info = await this.processManager.startProcess(input);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  private async handleStopProcess(input: StopProcessInput) {
    await this.processManager.stopProcess(input.processId, input.timeout);
    return {
      content: [
        {
          type: 'text',
          text: `Process ${input.processId} stopped successfully`,
        },
      ],
    };
  }

  private async handleRestartProcess(input: RestartProcessInput) {
    const info = await this.processManager.restartProcess(input.processId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  private async handleGetProcessLogs(input: GetProcessLogsInput) {
    const logs = this.processManager.getProcessLogs(
      input.processId,
      input.filter,
      input.since,
      input.lines
    );

    const logText = logs
      .map(log => `[${log.timestamp.toISOString()}] [${log.stream}] ${log.data}`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: logText || 'No logs found',
        },
      ],
    };
  }

  private async handleListProcesses(input: ListProcessesInput) {
    const processes = this.processManager.listProcesses(input.status);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(processes, null, 2),
        },
      ],
    };
  }

  private async handleSendInput(input: SendInputInput) {
    this.processManager.sendInput(input.processId, input.input);
    return {
      content: [
        {
          type: 'text',
          text: `Input sent to process ${input.processId}`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      this.processManager.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.processManager.cleanup();
      process.exit(0);
    });
  }
}
