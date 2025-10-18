# Troubleshooting Guide

Common issues and solutions for AMS Development MCP Servers.

## Installation Issues

### npm install fails

**Problem**: Package installation fails

**Solutions**:

```bash
# Clear npm cache
npm cache clean --force

# Use latest npm
npm install -g npm@latest

# Try with npx instead
npx @ams-dev/process-manager
```

### Permission denied errors

**Problem**: EACCES errors when installing globally

**Solutions**:

```bash
# Use npx (no global install needed)
npx @ams-dev/process-manager

# Or fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

## Claude Code Integration

### MCP servers not showing up

**Problem**: Tools don't appear in Claude Code

**Checks**:

1. Verify config file location: `~/.config/claude/mcp.json`
2. Check JSON syntax is valid
3. Restart Claude Code completely
4. Check Claude Code logs for errors

**Example Valid Config**:

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

### MCP server crashes

**Problem**: Server exits unexpectedly

**Debug Steps**:

```bash
# Test server directly
npx @ams-dev/process-manager

# Check for errors in output
# Ensure Node.js >= 18.0.0
node --version
```

## Process Manager Issues

### Processes won't start

**Problem**: `start_process` fails

**Common Causes**:

- Invalid command syntax
- Missing executable in PATH
- Incorrect working directory

**Solutions**:

```bash
# Test command manually first
cd /path/to/project
npm run dev  # Verify it works

# Use absolute paths
{
  "command": "/usr/bin/node",
  "cwd": "/absolute/path/to/project"
}
```

### Logs not appearing

**Problem**: `get_process_logs` returns empty

**Causes**:

- Process hasn't output anything yet
- Logs were cleared
- Process ID is invalid

**Solutions**:

- Wait a few seconds after starting
- Verify process ID with `list_processes`
- Check process is still running

### Process won't stop

**Problem**: `stop_process` hangs

**Solutions**:

- Increase timeout: `{ "processId": "proc-1", "timeout": 10000 }`
- Manually kill: `kill -9 <PID>`
- Check for zombie processes

## Docker Manager Issues

### Cannot connect to Docker daemon

**Problem**: "Cannot connect to Docker" error

**Solutions**:

```bash
# Check Docker is running
docker ps

# Check Docker socket permissions (Linux)
sudo chmod 666 /var/run/docker.sock

# Start Docker Desktop (macOS/Windows)
# Open Docker Desktop application
```

### Container not found

**Problem**: Container ID/name not recognized

**Solutions**:

- List all containers: `docker ps -a`
- Use exact container name or ID
- Check container exists: `docker inspect <container>`

### Container logs truncated

**Problem**: Logs are cut off

**Cause**: Default line limit

**Solution**:

```javascript
{
  "containerId": "my-container",
  "tail": 1000  // Increase line limit
}
```

## Dev Watcher Issues

### Patterns not matching

**Problem**: Expected errors not detected

**Debug**:

```javascript
// Test pattern separately
const regex = new RegExp('TS\\d+');
regex.test('TS2304: Cannot find name'); // Should be true
```

**Common Pattern Issues**:

- Forgot to escape backslashes: `TS\\d+` not `TS\d+`
- Case sensitivity: Use `(?i)` for case-insensitive
- Too specific pattern

### Too many duplicate alerts

**Problem**: Same alert repeated

**Solution**:

- Increase debounce: `{ "debounceMs": 5000 }`
- Use more specific patterns
- Clear old alerts: `clear_alerts`

### Missing alerts

**Problem**: Errors not being caught

**Check**:

- Pattern is correct
- Source is being watched
- Severity filter allows the alert
- Alert wasn't deduplicated

## Performance Issues

### High memory usage

**Causes**:

- Too many processes running
- Large log buffers
- Many containers being monitored

**Solutions**:

```bash
# Reduce log buffer size in code
# Stop unused processes
# Clear old alerts regularly
```

### Slow response times

**Solutions**:

- Use global install instead of npx
- Reduce number of watched sources
- Optimize regex patterns
- Clear old data periodically

## Common Error Messages

### "ECONNREFUSED"

**Meaning**: Cannot connect to service

**Solutions**:

- Service not running
- Wrong port number
- Firewall blocking connection

### "TS2304" or similar

**Meaning**: TypeScript compilation error

**Action**: This is expected - dev-watcher is catching real errors!

### "Docker daemon not running"

**Solutions**:

- Start Docker Desktop
- Enable Docker service: `sudo systemctl start docker`

## Still Need Help?

1. **Check Logs**: Enable debug logging in Claude Code
2. **GitHub Issues**: [Report a bug](https://github.com/mastoica/vibecoding-mcp-servers/issues)
3. **Documentation**: Review [getting-started](./getting-started.md)
4. **Community**: Discuss in GitHub Discussions

## Debugging Tips

```bash
# Test each package independently
npx @ams-dev/process-manager
npx @ams-dev/docker-manager
npx @ams-dev/dev-watcher

# Check versions
npm list @ams-dev/process-manager
npm list @ams-dev/docker-manager
npm list @ams-dev/dev-watcher

# Update to latest
npm install -g @ams-dev/process-manager@latest
npm install -g @ams-dev/docker-manager@latest
npm install -g @ams-dev/dev-watcher@latest
```
