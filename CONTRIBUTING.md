# Contributing to AMS Development MCP Servers

First off, thank you for considering contributing to AMS Development MCP Servers! It's people like you that make this project better.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** - Include code samples, configuration files, or screenshots
- **Describe the behavior you observed** and **explain which behavior you expected to see**
- **Include your environment details**: OS, Node.js version, package versions

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List some examples** of how it would be used

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `pnpm install`
3. **Make your changes** and ensure code quality:
   ```bash
   pnpm lint:fix    # Fix linting issues
   pnpm format      # Format code
   pnpm build       # Build packages
   pnpm test        # Run tests
   ```
4. **Commit your changes** using conventional commits:
   ```
   feat: add support for Docker Compose
   fix: resolve process cleanup issue
   docs: update installation guide
   chore: update dependencies
   ```
5. **Push to your fork** and **submit a pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vibecoding-mcp-servers.git
cd vibecoding-mcp-servers

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development mode
pnpm dev

# Run linting
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
vibecoding-mcp-servers/
├── packages/
│   ├── process-manager/    # Process management MCP server
│   ├── docker-manager/     # Docker container MCP server
│   └── dev-watcher/        # Error detection MCP server
├── examples/               # Example configurations
├── docs/                   # Documentation
└── .github/                # GitHub workflows and templates
```

## Coding Guidelines

### TypeScript

- Use TypeScript for all source code
- Enable strict mode
- Provide type annotations for public APIs
- Avoid `any` types when possible

### Style Guide

We use ESLint and Prettier to enforce code style:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Line length**: 100 characters max
- **Trailing commas**: ES5 style

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `ci:` - CI/CD changes

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Maintain or improve code coverage

## Package-Specific Guidelines

### Process Manager

- Handle process lifecycle carefully
- Clean up resources on exit
- Buffer logs efficiently

### Docker Manager

- Support both Docker Engine and Docker Desktop
- Handle connection errors gracefully
- Test with various Docker versions

### Dev Watcher

- Optimize pattern matching performance
- Deduplicate alerts effectively
- Support multiple log sources

## Release Process

Releases are automated via GitHub Actions:

1. Update version in `package.json` files
2. Update `CHANGELOG.md`
3. Commit changes
4. Create GitHub release with `gh release create vX.Y.Z`
5. Packages are automatically published to npm

## Questions?

Feel free to open an issue for:

- Questions about the codebase
- Feature discussions
- Implementation help

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
