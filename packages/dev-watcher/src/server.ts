import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DevWatcher } from './watcher.js';
import type {
  WatchLogsInput,
  SubscribeErrorsInput,
  GetAlertsInput,
  ClearAlertsInput,
} from './types.js';

export class DevWatcherServer {
  private server: Server;
  private watcher: DevWatcher;

  constructor() {
    this.watcher = new DevWatcher();
    this.server = new Server(
      {
        name: '@vibecoding/dev-watcher',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupWatcherEvents();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'watch_logs':
            return await this.handleWatchLogs(args as unknown as WatchLogsInput);

          case 'subscribe_errors':
            return await this.handleSubscribeErrors(args as unknown as SubscribeErrorsInput);

          case 'get_alerts':
            return await this.handleGetAlerts((args ?? {}) as unknown as GetAlertsInput);

          case 'clear_alerts':
            return await this.handleClearAlerts((args ?? {}) as unknown as ClearAlertsInput);

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

  private setupWatcherEvents(): void {
    this.watcher.on('alert', (alert) => {
      // Could emit notifications here in the future
      console.error(`[${alert.severity.toUpperCase()}] ${alert.message}`);
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'watch_logs',
        description: 'Start watching logs from multiple sources with pattern matching',
        inputSchema: {
          type: 'object',
          properties: {
            sources: {
              type: 'array',
              description: 'Log sources to watch',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['process', 'docker', 'file'],
                    description: 'Type of source',
                  },
                  id: {
                    type: 'string',
                    description: 'Source identifier (process ID, container ID, or file path)',
                  },
                  patterns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Regex patterns to match',
                  },
                },
                required: ['type', 'id'],
              },
            },
            alertOn: {
              type: 'array',
              items: { type: 'string' },
              description: 'Global alert patterns',
            },
            debounceMs: {
              type: 'number',
              description: 'Milliseconds to debounce rapid alerts',
            },
          },
          required: ['sources'],
        },
      },
      {
        name: 'subscribe_errors',
        description: 'Subscribe to automatic error notifications',
        inputSchema: {
          type: 'object',
          properties: {
            severity: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['error', 'warning', 'info'],
              },
              description: 'Alert severity levels to subscribe to',
            },
            sources: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['process', 'docker', 'file', 'custom'],
              },
              description: 'Source types to monitor',
            },
            patterns: {
              type: 'array',
              items: { type: 'string' },
              description: 'Custom regex patterns',
            },
          },
        },
      },
      {
        name: 'get_alerts',
        description: 'Retrieve accumulated alerts with filtering',
        inputSchema: {
          type: 'object',
          properties: {
            since: {
              type: 'number',
              description: 'Unix timestamp to get alerts since',
            },
            severity: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['error', 'warning', 'info'],
              },
              description: 'Filter by severity',
            },
            source: {
              type: 'string',
              enum: ['process', 'docker', 'file', 'custom'],
              description: 'Filter by source type',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of alerts to return',
            },
          },
        },
      },
      {
        name: 'clear_alerts',
        description: 'Clear alert history with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            olderThan: {
              type: 'number',
              description: 'Unix timestamp - clear alerts older than this',
            },
            severity: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['error', 'warning', 'info'],
              },
              description: 'Clear alerts of specific severity',
            },
          },
        },
      },
    ];
  }

  private async handleWatchLogs(input: WatchLogsInput) {
    // Set up watch sources
    for (const source of input.sources) {
      this.watcher.addWatchSource(source);
    }

    // Set global alert patterns
    if (input.alertOn) {
      this.watcher.setAlertPatterns(input.alertOn);
    }

    // Set debounce
    if (input.debounceMs) {
      this.watcher.setDebounce(input.debounceMs);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Now watching ${input.sources.length} source(s):\n${input.sources
            .map(s => `- ${s.type}:${s.id}`)
            .join('\n')}`,
        },
      ],
    };
  }

  private async handleSubscribeErrors(input: SubscribeErrorsInput) {
    // Set up subscription patterns
    const patterns = input.patterns || [
      'ERROR',
      'FATAL',
      'CRITICAL',
      'Exception',
      'TS\\d+', // TypeScript errors
      'Failed to compile',
      'ECONNREFUSED',
      'Cannot find module',
    ];

    this.watcher.setAlertPatterns(patterns);

    const subscriptionInfo = {
      severity: input.severity || ['error', 'warning', 'info'],
      sources: input.sources || ['process', 'docker', 'file', 'custom'],
      patterns,
    };

    return {
      content: [
        {
          type: 'text',
          text: `Subscribed to errors:\n${JSON.stringify(subscriptionInfo, null, 2)}`,
        },
      ],
    };
  }

  private async handleGetAlerts(input: GetAlertsInput) {
    const alerts = this.watcher.getAlerts(
      input.since,
      input.severity,
      input.source,
      input.limit
    );

    const stats = this.watcher.getStats();

    return {
      content: [
        {
          type: 'text',
          text: `Found ${alerts.length} alert(s)\n\nStats:\n${JSON.stringify(stats, null, 2)}\n\nAlerts:\n${JSON.stringify(alerts, null, 2)}`,
        },
      ],
    };
  }

  private async handleClearAlerts(input: ClearAlertsInput) {
    const cleared = this.watcher.clearAlerts(input.olderThan, input.severity);

    return {
      content: [
        {
          type: 'text',
          text: `Cleared ${cleared} alert(s)`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
