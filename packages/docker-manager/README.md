# @vibecoding/docker-manager

> MCP server for managing and inspecting Docker containers

## Overview

A Model Context Protocol (MCP) server that enables AI assistants like Claude Code to control and inspect Docker containers, making it easy to manage development environments, databases, and services.

## Features

- 🐳 List, start, stop, and restart Docker containers
- 📋 Execute commands inside running containers
- 📊 Retrieve and stream container logs
- 🔍 Inspect container configuration and state
- 🚀 Create containers from images with full configuration
- 🔌 Port mappings and volume mounts support

## Installation

```bash
# Global installation
npm install -g @vibecoding/docker-manager

# Or use with npx
npx @vibecoding/docker-manager
```

## Requirements

- Node.js >= 18.0.0
- Docker Engine or Docker Desktop running
- Docker socket accessible (usually `/var/run/docker.sock`)

## Usage

Add to your Claude Code MCP configuration (`~/.config/claude/mcp.json`):

```json
{
  "mcpServers": {
    "docker-manager": {
      "command": "npx",
      "args": ["-y", "@vibecoding/docker-manager"]
    }
  }
}
```

## Available Tools

### `list_containers`

List Docker containers with optional filtering.

**Input:**
```typescript
{
  all?: boolean;           // Include stopped containers
  filters?: {
    status?: string[];     // ['running', 'exited', etc.]
    label?: string[];
    name?: string;
  };
}
```

### `start_container`

Start an existing container or create and start from an image.

**Input:**
```typescript
{
  containerId?: string;    // Existing container
  image?: string;          // Or create from image
  name?: string;
  ports?: Record<string, string>; // "3000": "3000"
  env?: Record<string, string>;
  volumes?: Record<string, string>; // "/host/path": "/container/path"
}
```

**Example:**
```typescript
{
  "image": "postgres:15",
  "name": "dev-postgres",
  "ports": { "5432": "5432" },
  "env": {
    "POSTGRES_PASSWORD": "dev",
    "POSTGRES_DB": "myapp"
  }
}
```

### `stop_container`

Stop a running container.

**Input:**
```typescript
{
  containerId: string;
  timeout?: number;        // Seconds before force kill
}
```

### `restart_container`

Restart a container.

**Input:**
```typescript
{
  containerId: string;
  timeout?: number;
}
```

### `get_container_logs`

Retrieve container logs.

**Input:**
```typescript
{
  containerId: string;
  since?: number;          // Unix timestamp
  tail?: number;           // Number of lines
  follow?: boolean;        // Stream logs
  timestamps?: boolean;
}
```

### `exec_command`

Execute a command inside a running container.

**Input:**
```typescript
{
  containerId: string;
  command: string[];       // ["ls", "-la", "/app"]
  workDir?: string;
  env?: Record<string, string>;
}
```

**Example:**
```typescript
{
  "containerId": "postgres-dev",
  "command": ["psql", "-U", "postgres", "-c", "SELECT version();"]
}
```

### `inspect_container`

Get detailed container information.

**Input:**
```typescript
{
  containerId: string;
}
```

## Example Workflows

### Start a PostgreSQL Database

```
Developer: "Set up a local PostgreSQL database"
Claude:
- Creates: postgres:15 container
- Configures: Port 5432, password, database name
- Reports: "PostgreSQL ready on localhost:5432"
```

### Debug a Container Issue

```
Developer: "Check why the API container keeps restarting"
Claude:
- Inspects: Container state and config
- Gets: Recent logs
- Executes: Health check commands
- Reports: Specific error found in logs
```

### Execute Database Migration

```
Developer: "Run migrations in the database container"
Claude:
- Executes: Migration command in container
- Monitors: Output and exit code
- Reports: Success or specific errors
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test
```

## Troubleshooting

### Cannot connect to Docker daemon

Ensure Docker is running:
```bash
docker ps
```

Check Docker socket permissions (Linux):
```bash
sudo chmod 666 /var/run/docker.sock
```

### Container not found

Use container ID or exact name:
```bash
docker ps -a  # List all containers
```

## License

MIT © [mastoica](https://github.com/mastoica)

## Related

- [@vibecoding/process-manager](../process-manager) - Development process management
- [@vibecoding/dev-watcher](../dev-watcher) - Real-time error detection
