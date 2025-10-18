# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Code Quality**: ESLint and Prettier configuration
- **Pre-commit Hooks**: Husky and lint-staged setup
- **Documentation**: Complete getting-started and troubleshooting guides
- **Examples**: Configuration examples for basic, NX, Docker Compose, and full-stack setups
- **Community**: CONTRIBUTING.md, SECURITY.md, CHANGELOG.md
- **GitHub Templates**: Issue templates (bug report, feature request) and PR template
- **Automation**: Dependabot configuration for dependency updates
- **Badges**: npm version badges, CI status, and license badges in README

### Changed

- Enhanced main README with professional badges and better structure
- Improved project organization with docs/ and examples/ directories

## [0.1.3] - 2025-10-18

### Added

- Automated GitHub Actions publishing workflow
- Complete documentation for all three MCP servers
- ESLint and Prettier configuration
- Professional badges in README

### Changed

- Package scope changed from `@vibecoding` to `@ams-dev`
- Updated all documentation with correct package names

### Fixed

- README files now correctly reference `@ams-dev` scope

## [0.1.0] - 2025-10-18

### Added

- Initial release of three MCP servers:
  - `@ams-dev/process-manager` - Process management and monitoring
  - `@ams-dev/docker-manager` - Docker container management
  - `@ams-dev/dev-watcher` - Real-time error detection
- Complete TypeScript implementation
- PNPM monorepo structure
- MIT License
- CI/CD with GitHub Actions

### Features

#### Process Manager

- Start, stop, restart processes
- Real-time log streaming
- Pattern-based monitoring
- Auto-restart on failure
- Interactive stdin support

#### Docker Manager

- List, start, stop, restart containers
- Execute commands in containers
- Stream container logs
- Inspect container configuration
- Support for Docker Compose

#### Dev Watcher

- Multi-source log aggregation
- Regex pattern matching
- Alert deduplication
- Severity classification
- Statistics and filtering

[0.1.3]: https://github.com/mastoica/vibecoding-mcp-servers/releases/tag/v0.1.3
[0.1.0]: https://github.com/mastoica/vibecoding-mcp-servers/releases/tag/v0.1.0
