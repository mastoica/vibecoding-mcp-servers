# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### Please Do Not:

- Open a public GitHub issue for security vulnerabilities
- Discuss the vulnerability publicly until it has been addressed

### Instead:

1. **Email**: Send details to the repository owner via GitHub
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect:

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days with our assessment
- **Fix Timeline**: Critical issues will be prioritized and patched ASAP

### Disclosure Policy:

- We will coordinate the public disclosure
- Credit will be given to reporters (unless anonymity is requested)
- Security advisories will be published on GitHub

## Security Best Practices

When using these MCP servers:

1. **Authentication**: Ensure npm tokens are properly secured
2. **Permissions**: Run with minimum required privileges
3. **Updates**: Keep packages up to date
4. **Environment**: Don't expose sensitive information in logs
5. **Network**: Use secure connections when possible

## Dependencies

We monitor dependencies for known vulnerabilities using:

- Dependabot alerts
- npm audit
- Regular dependency updates

Thank you for helping keep AMS Development MCP Servers secure!
