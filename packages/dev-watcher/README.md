# @ams-dev/dev-watcher

> MCP server for real-time error detection and pattern matching across development sources

## Overview

A Model Context Protocol (MCP) server that provides intelligent error detection and pattern matching across multiple development sources including processes, Docker containers, and log files. Features automatic alert deduplication, severity classification, and flexible filtering.

## Features

- 🔍 Real-time pattern matching with regex
- 🎯 Multi-source log aggregation (processes, Docker, files)
- 🚨 Automatic severity classification (error, warning, info)
- ⚡ Alert deduplication to prevent spam
- 📊 Statistics and filtering capabilities
- 🔔 Configurable alert patterns and debouncing

## Installation

```bash
# Global installation
npm install -g @ams-dev/dev-watcher

# Or use with npx
npx @ams-dev/dev-watcher
```

## Usage

Add to your Claude Code MCP configuration (`~/.config/claude/mcp.json`):

```json
{
  "mcpServers": {
    "dev-watcher": {
      "command": "npx",
      "args": ["-y", "@ams-dev/dev-watcher"]
    }
  }
}
```

## Available Tools

### `watch_logs`

Start watching logs from multiple sources with pattern matching.

**Input:**
```typescript
{
  sources: Array<{
    type: 'process' | 'docker' | 'file';
    id: string;              // Process ID, container ID, or file path
    patterns?: string[];     // Regex patterns to match
  }>;
  alertOn?: string[];        // Global alert patterns
  debounceMs?: number;       // Debounce rapid alerts (default: 1000)
}
```

**Example:**
```typescript
{
  "sources": [
    {
      "type": "process",
      "id": "proc-1",
      "patterns": ["ERROR", "TS\\d+"]
    },
    {
      "type": "docker",
      "id": "postgres-dev",
      "patterns": ["FATAL", "ERROR"]
    }
  ],
  "alertOn": ["Failed to compile", "ECONNREFUSED"],
  "debounceMs": 2000
}
```

### `subscribe_errors`

Subscribe to automatic error notifications with default patterns.

**Input:**
```typescript
{
  severity?: ('error' | 'warning' | 'info')[];
  sources?: ('process' | 'docker' | 'file' | 'custom')[];
  patterns?: string[];       // Custom regex patterns
}
```

**Default Patterns:**
- `ERROR`, `FATAL`, `CRITICAL`
- `Exception`
- `TS\\d+` (TypeScript errors)
- `Failed to compile`
- `ECONNREFUSED`
- `Cannot find module`

### `get_alerts`

Retrieve accumulated alerts with filtering.

**Input:**
```typescript
{
  since?: number;            // Unix timestamp
  severity?: string[];       // Filter by severity
  source?: string;           // Filter by source type
  limit?: number;            // Max number of alerts
}
```

**Returns:**
```json
{
  "Found 5 alert(s)",
  "Stats": {
    "totalAlerts": 5,
    "alertsBySeverity": {
      "error": 3,
      "warning": 2,
      "info": 0
    },
    "alertsBySource": {
      "process:proc-1": 3,
      "docker:postgres-dev": 2
    },
    "watchedSources": 2
  },
  "Alerts": [ /* array of alerts */ ]
}
```

### `clear_alerts`

Clear alert history.

**Input:**
```typescript
{
  olderThan?: number;        // Unix timestamp
  severity?: string[];       // Clear specific severity levels
}
```

## Alert Structure

Each alert contains:

```typescript
{
  id: string;                // Unique alert ID
  timestamp: Date;           // When the alert was created
  severity: 'error' | 'warning' | 'info';
  source: 'process' | 'docker' | 'file' | 'custom';
  sourceId: string;          // ID of the source
  pattern?: string;          // Regex pattern that matched
  message: string;           // The matched content
  context?: string;          // Full log line for context
}
```

## Example Workflows

### Monitor NX Build Process

```
Developer: "Watch the build process for errors"
Claude:
- Sets up: watch_logs for NX process
- Patterns: TypeScript errors, compile failures
- Reports: Alerts when errors occur
```

### Track Docker Container Issues

```
Developer: "Monitor the database container for errors"
Claude:
- Watches: PostgreSQL container logs
- Patterns: FATAL, ERROR, connection issues
- Alerts: When database errors occur
```

### Aggregate Multi-Source Monitoring

```
Developer: "Watch all services for problems"
Claude:
- Watches: Frontend process, API process, database container
- Patterns: Common error patterns across all sources
- Deduplicates: Repeated errors
- Reports: Unified view of all issues
```

## Pattern Matching

Patterns are JavaScript regular expressions. Examples:

```javascript
// Exact match
"ERROR"

// TypeScript errors
"TS\\d+"

// Connection errors
"ECONNREFUSED|Connection refused"

// Case-insensitive
"(?i)warning"

// Capture specific formats
"Error: .+"
```

## Severity Classification

Automatic severity detection based on keywords:

- **Error**: Contains "error", "fatal", "critical"
- **Warning**: Contains "warn", "warning"
- **Info**: Everything else

## Deduplication

Alerts are deduplicated based on:
- Source + Source ID
- Pattern
- Message content

Duplicates within the debounce window (default 1000ms) are suppressed.

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

## License

MIT © [mastoica](https://github.com/mastoica)

## Related

- [@ams-dev/process-manager](../process-manager) - Development process management
- [@ams-dev/docker-manager](../docker-manager) - Docker container management
