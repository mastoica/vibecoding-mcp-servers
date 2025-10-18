# AMS Development MCP Servers

> MCP servers for real-time development monitoring and interactive pair programming

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)

[![process-manager](https://img.shields.io/npm/v/@ams-dev/process-manager?label=process-manager)](https://www.npmjs.com/package/@ams-dev/process-manager)
[![docker-manager](https://img.shields.io/npm/v/@ams-dev/docker-manager?label=docker-manager)](https://www.npmjs.com/package/@ams-dev/docker-manager)
[![dev-watcher](https://img.shields.io/npm/v/@ams-dev/dev-watcher?label=dev-watcher)](https://www.npmjs.com/package/@ams-dev/dev-watcher)
[![browser-inspector](https://img.shields.io/npm/v/@ams-dev/browser-inspector?label=browser-inspector)](https://www.npmjs.com/package/@ams-dev/browser-inspector)

[![CI](https://github.com/mastoica/vibecoding-mcp-servers/actions/workflows/test.yml/badge.svg)](https://github.com/mastoica/vibecoding-mcp-servers/actions/workflows/test.yml)

## Overview

A suite of Model Context Protocol (MCP) servers designed to enhance AI-assisted development workflows. These servers enable AI assistants like Claude Code to actively monitor development processes, inspect running applications, and participate in interactive debugging sessions.

## Packages

This monorepo contains four interconnected MCP servers:

### [@ams-dev/process-manager](./packages/process-manager) · [npm](https://www.npmjs.com/package/@ams-dev/process-manager)

Monitor and control development processes (nx serve, npm run, etc.)

- Start, stop, and restart processes
- Stream and filter process logs in real-time
- Send input to interactive processes
- Pattern-based monitoring for errors and warnings

### [@ams-dev/docker-manager](./packages/docker-manager) · [npm](https://www.npmjs.com/package/@ams-dev/docker-manager)

Control and inspect Docker containers

- List, start, stop, and restart containers
- Execute commands inside containers
- Stream container logs
- Inspect container configuration and state

### [@ams-dev/dev-watcher](./packages/dev-watcher) · [npm](https://www.npmjs.com/package/@ams-dev/dev-watcher)

Real-time error detection and pattern matching across all development sources

- Aggregate logs from processes and containers
- Regex pattern matching for errors and warnings
- Alert deduplication and severity classification
- Integration with browser console logs

### [@ams-dev/browser-inspector](./packages/browser-inspector) · [npm](https://www.npmjs.com/package/@ams-dev/browser-inspector)

Browser automation, inspection, monitoring, and performance analysis using Puppeteer

- Navigate and interact with web pages (click, type, wait for elements)
- Monitor console logs and network requests in real-time
- Capture screenshots and extract page content
- Execute custom JavaScript in browser context
- Performance metrics (load times, FCP, resource counts)
- Automated accessibility audits
- Cookie and localStorage management

## Quick Start

### Installation

```bash
# Install all packages globally
npm install -g @ams-dev/process-manager @ams-dev/docker-manager @ams-dev/dev-watcher @ams-dev/browser-inspector

# Or use with npx (no installation required)
npx @ams-dev/process-manager
```

### Configuration

Add to your Claude Code MCP configuration (`~/.config/claude/mcp.json`):

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
    },
    "browser-inspector": {
      "command": "npx",
      "args": ["-y", "@ams-dev/browser-inspector"]
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
