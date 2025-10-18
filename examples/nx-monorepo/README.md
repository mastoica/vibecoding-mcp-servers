# NX Monorepo Example

This example demonstrates using all three MCP servers with an NX monorepo (like AMShop).

## Configuration

Add to your `~/.config/claude/mcp.json`:

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

## Common Workflows

### Start Multiple Services

Ask Claude Code:

> "Start the admin frontend and products API services"

Claude will:

1. Use process-manager to start: `pnpm nx serve admin`
2. Use process-manager to start: `pnpm nx serve products`
3. Monitor both for compilation errors
4. Report when services are ready

### Monitor for Errors

> "Watch all running processes for TypeScript errors"

Claude will:

1. Use dev-watcher to monitor all processes
2. Set up pattern matching for TS errors (`TS\d+`)
3. Alert you when errors occur

### Manage Database Container

> "Start the PostgreSQL database"

Claude will:

1. Use docker-manager to start the postgres container
2. Check container health
3. Report when database is ready

### Full Environment Setup

> "Set up my complete development environment"

Claude will:

1. Start Docker containers (PostgreSQL, Redis)
2. Start all NX services
3. Set up error monitoring
4. Report full status
