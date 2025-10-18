# @vibecoding/process-manager

> MCP server for managing and monitoring development processes

## Overview

A Model Context Protocol (MCP) server that enables AI assistants like Claude Code to manage and monitor development processes such as NX serves, npm scripts, and other long-running development tasks.

## Features

- 🚀 Start, stop, and restart processes with full control
- 📊 Real-time log streaming and buffering
- 🔍 Pattern-based monitoring for errors and warnings
- 🔄 Auto-restart on failure
- 📝 Interactive process input (stdin)
- 🎯 Filter logs by regex patterns

## Installation

```bash
# Global installation
npm install -g @vibecoding/process-manager

# Or use with npx
npx @vibecoding/process-manager
```

## Usage

Add to your Claude Code MCP configuration (`~/.config/claude/mcp.json`):

```json
{
  "mcpServers": {
    "process-manager": {
      "command": "npx",
      "args": ["-y", "@vibecoding/process-manager"]
    }
  }
}
```

## Available Tools

### `start_process`

Start a new development process.

**Input:**
```typescript
{
  command: string;          // e.g., "pnpm nx serve admin"
  cwd?: string;            // Working directory
  env?: Record<string, string>;
  label?: string;          // Human-readable label
  autoRestart?: boolean;   // Restart on failure
  watchPatterns?: string[]; // Patterns to monitor
}
```

**Example:**
```typescript
{
  "command": "pnpm nx serve admin",
  "cwd": "/Users/dev/myproject",
  "label": "Admin Frontend",
  "autoRestart": true,
  "watchPatterns": ["ERROR", "TS\\d+", "Failed to compile"]
}
```

### `stop_process`

Stop a running process gracefully.

**Input:**
```typescript
{
  processId: string;
  timeout?: number;        // Milliseconds before SIGKILL (default: 5000)
}
```

### `restart_process`

Restart a process.

**Input:**
```typescript
{
  processId: string;
}
```

### `get_process_logs`

Retrieve logs from a process.

**Input:**
```typescript
{
  processId: string;
  filter?: string;         // Regex pattern
  since?: number;          // Unix timestamp
  lines?: number;          // Number of recent lines
  follow?: boolean;        // Stream logs (not yet implemented)
}
```

### `list_processes`

List all managed processes.

**Input:**
```typescript
{
  status?: 'running' | 'stopped' | 'failed' | 'all';
}
```

### `send_input`

Send input to a running process.

**Input:**
```typescript
{
  processId: string;
  input: string;
}
```

## Example Workflows

### Start an NX Development Server

```
Claude: I'll start the admin frontend for you
- Executes: start_process with "pnpm nx serve admin"
- Returns: Process ID and status
- Monitors: Compile errors with watchPatterns
```

### Monitor Multiple Services

```
Developer: Start the admin and API services
Claude:
- Starts: Admin frontend (proc-1)
- Starts: API backend (proc-2)
- Reports: Both running, ports ready
- Alerts: If any compile errors occur
```

### Debug a Failing Build

```
Developer: Check the logs for errors
Claude:
- Gets: Recent logs with get_process_logs
- Filters: For "ERROR" pattern
- Reports: Specific error messages with context
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

## Requirements

- Node.js >= 18.0.0
- Process support (works on Linux, macOS, Windows)

## License

MIT © [mastoica](https://github.com/mastoica)

## Related

- [@vibecoding/docker-manager](../docker-manager) - Docker container management
- [@vibecoding/dev-watcher](../dev-watcher) - Real-time error detection
