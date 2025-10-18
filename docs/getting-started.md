# Getting Started

Welcome to AMS Development MCP Servers! This guide will help you get up and running quickly.

## What are MCP Servers?

Model Context Protocol (MCP) servers enable AI assistants like Claude Code to interact with your development environment. Our three servers provide:

- **Process Manager**: Control development processes
- **Docker Manager**: Manage Docker containers
- **Dev Watcher**: Monitor for errors and issues

## Prerequisites

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **Claude Code** installed ([Installation Guide](https://docs.claude.com/claude-code))
- **Docker** (optional, for docker-manager)

## Quick Start

### 1. Configure Claude Code

Edit `~/.config/claude/mcp.json` and add:

```json
{
  "mcpServers": {
    "process-manager": {
      "command": "npx",
      "args": ["-y", "@ams-dev/process-manager"]
    },
    "docker-manager": {
      "command": "npx",
      "args": ["-y", "@ams-dev/docker-manager"]
    },
    "dev-watcher": {
      "command": "npx",
      "args": ["-y", "@ams-dev/dev-watcher"]
    }
  }
}
```

### 2. Restart Claude Code

Close and reopen Claude Code for the changes to take effect.

### 3. Verify Installation

Ask Claude Code:

> "Can you list the available MCP tools?"

You should see tools from all three servers.

## First Steps

### Start a Development Server

> "Start my development server with npm run dev"

Claude will use process-manager to start and monitor your server.

### Monitor for Errors

> "Watch my running processes for errors"

Claude will use dev-watcher to monitor logs in real-time.

### Manage Docker Containers

> "Start my PostgreSQL container"

Claude will use docker-manager to start and configure containers.

## Common Use Cases

### NX Monorepo Development

```
You: "Start the admin and API services for my NX project"

Claude:
- Starts: pnpm nx serve admin
- Starts: pnpm nx serve api
- Monitors: Both for compile errors
- Reports: When servers are ready on their ports
```

### Full Stack Application

```
You: "Set up my complete development environment"

Claude:
- Starts: PostgreSQL and Redis (Docker)
- Starts: Backend API (Process)
- Starts: Frontend app (Process)
- Monitors: All services for errors
- Reports: Environment ready status
```

### Debugging

```
You: "Why is my API slow?"

Claude:
- Checks: API process logs
- Inspects: Database container
- Analyzes: Error patterns
- Reports: Specific issues found
```

## Configuration Options

### Global Installation (Optional)

Install packages globally for faster startup:

```bash
npm install -g @ams-dev/process-manager @ams-dev/docker-manager @ams-dev/dev-watcher
```

Then update your config to use the global binaries:

```json
{
  "mcpServers": {
    "process-manager": {
      "command": "process-manager"
    }
  }
}
```

### Custom Working Directory

Specify a working directory for operations:

```json
{
  "mcpServers": {
    "process-manager": {
      "command": "npx",
      "args": ["-y", "@ams-dev/process-manager"],
      "env": {
        "WORKING_DIR": "/path/to/your/project"
      }
    }
  }
}
```

## Next Steps

- [Configuration Guide](./configuration.md) - Advanced configuration options
- [Examples](../examples/) - Real-world usage examples
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Need Help?

- [GitHub Issues](https://github.com/mastoica/vibecoding-mcp-servers/issues)
- [Security Policy](../SECURITY.md)
- [Contributing Guide](../CONTRIBUTING.md)

Happy coding! 🚀
