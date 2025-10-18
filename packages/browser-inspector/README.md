# @ams-dev/browser-inspector

A Model Context Protocol (MCP) server that provides comprehensive browser automation, inspection, monitoring, and performance analysis capabilities using Playwright.

## Features

### 🔌 Connection Modes

- **Attach Mode** - Connect to an existing Chrome/Chromium tab for passive monitoring of your development work
- **Puppeteer Mode** - Launch a new browser instance for automated testing and form filling
- Seamlessly switch between modes as needed

### 🌐 Navigation & Inspection

- **Navigate to URLs** - Browse any website
- **Get Page Content** - Extract full HTML content
- **Get Page Info** - Retrieve URL and title
- **Take Screenshots** - Capture viewport or full page screenshots

### 🔍 Monitoring & Debugging

- **Console Logs** - Capture all console messages (errors, warnings, info, debug) with timestamps
- **Network Requests** - Monitor all HTTP requests with status codes, response times, and sizes
- **Failed Requests** - Track network failures
- **Real-time Monitoring** - Logs are captured as they happen

### 🤖 Automation

- **Click Elements** - Interact with page elements using CSS selectors
- **Type Text** - Fill forms and input fields
- **Execute JavaScript** - Run custom JavaScript in page context
- **Wait for Elements** - Wait for dynamic content to load

### ⚡ Performance Analysis

- **Performance Metrics** - Get comprehensive load time metrics including:
  - DOM Content Loaded time
  - Full page load time
  - First Paint (FP)
  - First Contentful Paint (FCP)
  - Resource counts (scripts, stylesheets, images)
  - Total page size

### ♿ Accessibility Testing

- **Accessibility Audit** - Automated accessibility checks including:
  - Missing alt text on images
  - Form controls without labels
  - Missing page title
  - Missing lang attribute
  - Heading hierarchy issues
  - Links without discernible text
  - Non-semantic interactive elements

### 🍪 State Management

- **Cookie Management** - Get, set, and clear browser cookies
- **LocalStorage Management** - Get, set, and clear localStorage items

## Installation

```bash
pnpm add @ams-dev/browser-inspector
```

## Configuration

### Claude Code Setup

Add to your MCP configuration file:

**macOS**: `~/Library/Application Support/Claude Code/mcp_settings.json`
**Linux**: `~/.config/claude-code/mcp_settings.json`
**Windows**: `%APPDATA%\\Claude Code\\mcp_settings.json`

```json
{
  "mcpServers": {
    "browser-inspector": {
      "command": "npx",
      "args": ["-y", "@ams-dev/browser-inspector"]
    }
  }
}
```

## Available Tools

### Connection Management

#### `connect_to_existing_tab`

Connect to an existing Chrome/Chromium tab via remote debugging (Attach Mode).

**Prerequisites**: Chrome must be started with remote debugging enabled:

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222
```

Parameters:

```typescript
{
  urlPattern?: string,  // Optional regex to match tab URL (e.g., "localhost:3000")
  port?: number         // Remote debugging port (default: 9222)
}
```

#### `list_available_tabs`

List all available tabs in the Chrome instance running with remote debugging.

Parameters:

```typescript
{
  port?: number  // Remote debugging port (default: 9222)
}
```

Returns:

```typescript
Array<{
  id: string;
  url: string;
  title: string;
  type: string;
}>;
```

#### `disconnect`

Disconnect from the current browser/tab and clean up resources.

#### `get_connection_status`

Get current connection status including:

- Connection mode (puppeteer/attach)
- Connection state (connected/disconnected)
- Current URL

Returns:

```typescript
{
  mode: 'puppeteer' | 'attach',
  connected: boolean,
  currentUrl: string | null
}
```

### Navigation & Content

#### `navigate`

Navigate to a URL in the browser. Works in both connection modes.

```typescript
{
  url: string;
} // Must include protocol (https://)
```

#### `get_page_content`

Get the full HTML content of the current page.

#### `get_page_info`

Get basic information about the current page (URL, title).

#### `screenshot`

Take a screenshot of the current page.

```typescript
{ fullPage?: boolean } // Default: false (viewport only)
```

### Monitoring & Debugging

#### `get_console_logs`

Get console logs from the current page.

```typescript
{
  limit?: number,           // Maximum number of logs to return
  filter?: 'error' | 'warning' | 'info' | 'log' | 'debug'
}
```

#### `get_network_requests`

Get network requests made by the page.

```typescript
{
  limit?: number,           // Maximum number of requests
  failedOnly?: boolean      // Only return failed requests
}
```

#### `clear_logs`

Clear all console logs and network request history.

### Automation

#### `execute_script`

Execute JavaScript code in the page context.

```typescript
{
  script: string;
} // JavaScript code to execute
```

#### `click`

Click an element using a CSS selector.

```typescript
{
  selector: string;
} // CSS selector
```

#### `type_text`

Type text into an input element.

```typescript
{
  selector: string,  // CSS selector
  text: string       // Text to type
}
```

#### `wait_for_selector`

Wait for an element to appear on the page.

```typescript
{
  selector: string,  // CSS selector
  timeout?: number   // Timeout in ms (default: 5000)
}
```

### Performance & Accessibility

#### `get_performance_metrics`

Get comprehensive performance metrics including:

- DOM Content Loaded and Load times
- First Paint and First Contentful Paint
- Resource counts and total size

Returns:

```typescript
{
  timestamp: number,
  metrics: {
    domContentLoaded: number,
    load: number,
    firstPaint?: number,
    firstContentfulPaint?: number
  },
  resources: {
    scriptCount: number,
    stylesheetCount: number,
    imageCount: number,
    totalSize: number
  }
}
```

#### `run_accessibility_audit`

Run an automated accessibility audit on the current page.

Returns:

```typescript
{
  timestamp: number,
  url: string,
  issues: Array<{
    type: 'error' | 'warning' | 'info',
    rule: string,
    message: string,
    selector?: string,
    element?: string
  }>,
  summary: {
    errors: number,
    warnings: number,
    info: number
  }
}
```

### State Management

#### `manage_cookies`

Manage browser cookies.

```typescript
{
  action: 'get' | 'set' | 'clear',
  name?: string,    // Required for 'set'
  value?: string,   // Required for 'set'
  domain?: string,  // Optional for 'set'
  path?: string     // Optional for 'set'
}
```

#### `manage_local_storage`

Manage localStorage.

```typescript
{
  action: 'get' | 'set' | 'clear',
  key?: string,    // Required for 'set', optional for 'get'
  value?: string   // Required for 'set'
}
```

## Usage Examples

### Attach to Existing Tab (Development Monitoring)

```
1. Start Chrome with remote debugging:
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

2. Open your local app in Chrome (e.g., http://localhost:3000)

3. List available tabs
4. Connect to existing tab with urlPattern "localhost:3000"
5. Get console logs to see errors
6. Get network requests to check API calls
7. Run accessibility audit
```

### Launch New Browser (Automated Testing)

```
1. Navigate to https://myapp.com  (automatically launches browser)
2. Get performance metrics
3. Take a screenshot
```

### Accessibility Audit

```
1. Navigate to https://myapp.com
2. Run accessibility audit
3. Show me all error-level issues
```

### Complete E2E Test

```
1. Navigate to https://myapp.com/login
2. Type "user@example.com" into input[name="email"]
3. Type "password123" into input[name="password"]
4. Click button[type="submit"]
5. Wait for .dashboard selector
6. Get console logs and show errors
7. Get performance metrics
8. Run accessibility audit
```

### Cookie Management

```
1. Navigate to https://example.com
2. Manage cookies with action "get"
3. Manage cookies with action "set", name "session", value "abc123"
4. Manage cookies with action "clear"
```

## Browser Behavior

### Puppeteer Mode (Default)

- Browser launches in **non-headless mode** for visibility
- Viewport set to 1920x1080 by default
- Automatically triggered when calling `navigate` without prior connection

### Attach Mode

- Connects to existing Chrome instance via CDP (Chrome DevTools Protocol)
- Does not control browser lifecycle (browser stays open after disconnect)
- Requires Chrome started with `--remote-debugging-port=9222`
- Can attach to specific tab by URL pattern

### Common to Both Modes

- Console logs and network requests automatically captured
- Each navigation clears previous logs and requests
- Full access to all browser automation capabilities

## Development

Build the package:

```bash
pnpm build
```

Watch mode for development:

```bash
pnpm dev
```

## Security Considerations

- Launches a real browser with access to any website
- JavaScript execution happens in page context
- Reduced security for automation (`--no-sandbox`, `--disable-web-security`)
- Use caution with untrusted websites and arbitrary JavaScript

## License

MIT
