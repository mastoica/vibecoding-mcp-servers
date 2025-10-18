# Docker Compose Example

This example shows how to use the docker-manager MCP server with Docker Compose projects.

## Sample docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    ports:
      - '5432:5432'
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

## Configuration

Add to your `~/.config/claude/mcp.json`:

```json
{
  "mcpServers": {
    "docker-manager": {
      "command": "npx",
      "args": ["-y", "@ams-dev/docker-manager"]
    }
  }
}
```

## Usage Examples

### Start All Services

> "Start all Docker services from docker-compose"

### Check Service Status

> "Show me the status of all running containers"

### View Logs

> "Show me the PostgreSQL logs from the last 5 minutes"

### Execute Commands

> "Run a database migration in the postgres container"

Claude will execute: `docker exec postgres psql -U postgres -c "your migration"`

### Debugging

> "Why is my database container not responding?"

Claude will:

1. Check container status
2. Inspect container configuration
3. Review recent logs
4. Report findings
