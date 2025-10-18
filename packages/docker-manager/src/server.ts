import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DockerClient } from './docker-client.js';
import type {
  ListContainersInput,
  StartContainerInput,
  StopContainerInput,
  RestartContainerInput,
  GetContainerLogsInput,
  ExecCommandInput,
  InspectContainerInput,
} from './types.js';

export class DockerManagerServer {
  private server: Server;
  private dockerClient: DockerClient;

  constructor() {
    this.dockerClient = new DockerClient();
    this.server = new Server(
      {
        name: '@vibecoding/docker-manager',
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_containers':
            return await this.handleListContainers((args ?? {}) as unknown as ListContainersInput);

          case 'start_container':
            return await this.handleStartContainer(args as unknown as StartContainerInput);

          case 'stop_container':
            return await this.handleStopContainer(args as unknown as StopContainerInput);

          case 'restart_container':
            return await this.handleRestartContainer(args as unknown as RestartContainerInput);

          case 'get_container_logs':
            return await this.handleGetContainerLogs(args as unknown as GetContainerLogsInput);

          case 'exec_command':
            return await this.handleExecCommand(args as unknown as ExecCommandInput);

          case 'inspect_container':
            return await this.handleInspectContainer(args as unknown as InspectContainerInput);

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
        name: 'list_containers',
        description: 'List Docker containers with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            all: {
              type: 'boolean',
              description: 'Include stopped containers (default: false)',
            },
            filters: {
              type: 'object',
              description: 'Filters to apply',
              properties: {
                status: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by status (e.g., ["running", "exited"])',
                },
                label: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by label',
                },
                name: {
                  type: 'string',
                  description: 'Filter by container name',
                },
              },
            },
          },
        },
      },
      {
        name: 'start_container',
        description: 'Start an existing container or create and start a new one from an image',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'ID or name of existing container to start',
            },
            image: {
              type: 'string',
              description: 'Docker image to create container from',
            },
            name: {
              type: 'string',
              description: 'Name for the new container',
            },
            ports: {
              type: 'object',
              description: 'Port mappings (containerPort: hostPort)',
              additionalProperties: { type: 'string' },
            },
            env: {
              type: 'object',
              description: 'Environment variables',
              additionalProperties: { type: 'string' },
            },
            volumes: {
              type: 'object',
              description: 'Volume mappings (hostPath: containerPath)',
              additionalProperties: { type: 'string' },
            },
          },
        },
      },
      {
        name: 'stop_container',
        description: 'Stop a running container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'ID or name of container to stop',
            },
            timeout: {
              type: 'number',
              description: 'Seconds to wait before force killing (default: 10)',
            },
          },
          required: ['containerId'],
        },
      },
      {
        name: 'restart_container',
        description: 'Restart a container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'ID or name of container to restart',
            },
            timeout: {
              type: 'number',
              description: 'Seconds to wait before force killing (default: 10)',
            },
          },
          required: ['containerId'],
        },
      },
      {
        name: 'get_container_logs',
        description: 'Retrieve logs from a container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'ID or name of container',
            },
            since: {
              type: 'number',
              description: 'Unix timestamp to get logs since',
            },
            tail: {
              type: 'number',
              description: 'Number of lines from the end of logs',
            },
            follow: {
              type: 'boolean',
              description: 'Stream logs (not yet fully supported)',
            },
            timestamps: {
              type: 'boolean',
              description: 'Include timestamps in logs',
            },
          },
          required: ['containerId'],
        },
      },
      {
        name: 'exec_command',
        description: 'Execute a command inside a running container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'ID or name of container',
            },
            command: {
              type: 'array',
              items: { type: 'string' },
              description: 'Command and arguments to execute',
            },
            workDir: {
              type: 'string',
              description: 'Working directory for command execution',
            },
            env: {
              type: 'object',
              description: 'Environment variables for command',
              additionalProperties: { type: 'string' },
            },
          },
          required: ['containerId', 'command'],
        },
      },
      {
        name: 'inspect_container',
        description: 'Get detailed information about a container',
        inputSchema: {
          type: 'object',
          properties: {
            containerId: {
              type: 'string',
              description: 'ID or name of container',
            },
          },
          required: ['containerId'],
        },
      },
    ];
  }

  private async handleListContainers(input: ListContainersInput) {
    const containers = await this.dockerClient.listContainers(input);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(containers, null, 2),
        },
      ],
    };
  }

  private async handleStartContainer(input: StartContainerInput) {
    const info = await this.dockerClient.startContainer(input);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  private async handleStopContainer(input: StopContainerInput) {
    await this.dockerClient.stopContainer(input.containerId, input.timeout);
    return {
      content: [
        {
          type: 'text',
          text: `Container ${input.containerId} stopped successfully`,
        },
      ],
    };
  }

  private async handleRestartContainer(input: RestartContainerInput) {
    await this.dockerClient.restartContainer(input.containerId, input.timeout);
    return {
      content: [
        {
          type: 'text',
          text: `Container ${input.containerId} restarted successfully`,
        },
      ],
    };
  }

  private async handleGetContainerLogs(input: GetContainerLogsInput) {
    const logs = await this.dockerClient.getContainerLogs(input);
    return {
      content: [
        {
          type: 'text',
          text: logs || 'No logs found',
        },
      ],
    };
  }

  private async handleExecCommand(input: ExecCommandInput) {
    const result = await this.dockerClient.execCommand(input);
    return {
      content: [
        {
          type: 'text',
          text: `Exit Code: ${result.exitCode}\n\n${result.output}`,
        },
      ],
    };
  }

  private async handleInspectContainer(input: InspectContainerInput) {
    const info = await this.dockerClient.inspectContainer(input.containerId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    // Check Docker connection
    const connected = await this.dockerClient.checkConnection();
    if (!connected) {
      console.error('Warning: Unable to connect to Docker daemon');
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
