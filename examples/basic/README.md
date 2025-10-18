# Basic Setup Example

This example shows the minimal configuration to get started with AMS Development MCP servers.

## Prerequisites

- Node.js >= 18.0.0
- Claude Code installed

## Installation

```bash
npm install -g @ams-dev/process-manager
```

Or use with npx (no installation required):

```bash
npx @ams-dev/process-manager
```

## Configuration

Add to your `~/.config/claude/mcp.json`:

```json
{
  "mcpServers": {
    "process-manager": {
      "command": "npx",
      "args": ["-y", "@ams-dev/process-manager"]
    }
  }
}
```

## Usage Example

Once configured, you can ask Claude Code to:

- "Start my development server with `npm run dev`"
- "Show me the logs from the running process"
- "Restart the server"
- "Check if there are any errors in the logs"

Claude Code will use the process-manager MCP server to execute these commands.
