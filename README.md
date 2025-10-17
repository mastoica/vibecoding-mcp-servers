# Vibecoding MCP Servers

> MCP servers for real-time development monitoring and interactive pair programming

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

## Overview

A suite of Model Context Protocol (MCP) servers designed to enhance AI-assisted development workflows. These servers enable AI assistants like Claude Code to actively monitor development processes, inspect running applications, and participate in interactive debugging sessions.

## Packages

This monorepo contains three interconnected MCP servers:

### [@vibecoding/process-manager](./packages/process-manager)
Monitor and control development processes (nx serve, npm run, etc.)
- Start, stop, and restart processes
- Stream and filter process logs in real-time
- Send input to interactive processes
- Pattern-based monitoring for errors and warnings

### [@vibecoding/docker-manager](./packages/docker-manager)
Control and inspect Docker containers
- List, start, stop, and restart containers
- Execute commands inside containers
- Stream container logs
- Inspect container configuration and state

### [@vibecoding/dev-watcher](./packages/dev-watcher)
Real-time error detection and pattern matching across all development sources
- Aggregate logs from processes and containers
- Regex pattern matching for errors and warnings
- Alert deduplication and severity classification
- Integration with browser console logs

## Quick Start

### Installation

```bash
# Install all packages globally
npm install -g @vibecoding/process-manager @vibecoding/docker-manager @vibecoding/dev-watcher

# Or use with npx (no installation required)
npx @vibecoding/process-manager
```

### Configuration

Add to your Claude Code MCP configuration (`~/.config/claude/mcp.json`):

```json
{
  "mcpServers": {
    "process-manager": {
      "command": "npx",
      "args": ["-y", "@vibecoding/process-manager"]
    },
    "docker-manager": {
      "command": "npx",
      "args": ["-y", "@vibecoding/docker-manager"]
    },
    "dev-watcher": {
      "command": "npx",
      "args": ["-y", "@vibecoding/dev-watcher"]
    }
  }
}
```

## Use Cases

### NX Monorepo Development
```
Claude: "I'll start the admin and products services for you"
- Starts both services with process-manager
- Monitors for compile errors
- Reports when servers are ready
```

### Docker-based Development
```
Developer: "Set up the local environment"
Claude: "Starting your database containers"
- Starts PostgreSQL and Redis containers
- Checks container health
- Reports when services are ready
```

### Interactive Debugging
```
Developer: "Why is the API slow?"
Claude:
- Checks API process logs for slow queries
- Inspects PostgreSQL container logs
- Reports findings with specific line references
```

## Development

This project uses PNPM workspaces for monorepo management.

```bash
# Clone the repository
git clone https://github.com/mastoica/vibecoding-mcp-servers.git
cd vibecoding-mcp-servers

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Documentation

- [Getting Started](./docs/getting-started.md) (coming soon)
- [Installation Guide](./docs/installation.md) (coming soon)
- [Configuration](./docs/configuration.md) (coming soon)
- [Examples](./examples) (coming soon)

## Requirements

- Node.js >= 18.0.0
- PNPM >= 8.0.0
- Docker (optional, for docker-manager)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT © [mastoica](https://github.com/mastoica)

## Roadmap

- [x] Repository setup
- [ ] Process Manager MCP (v0.1.0)
- [ ] Docker Manager MCP (v0.1.0)
- [ ] Dev Watcher MCP (v0.1.0)
- [ ] Complete documentation
- [ ] CI/CD pipeline
- [ ] Publish to npm

---

**Status**: 🚧 Work in Progress - Initial development phase
