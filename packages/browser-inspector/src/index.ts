#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from './browser-manager.js';

const browserManager = new BrowserManager();

const tools: Tool[] = [
  {
    name: 'connect_to_existing_tab',
    description:
      'Connect to an existing Chrome/Chromium tab via remote debugging. Chrome must be started with --remote-debugging-port=9222',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: {
          type: 'string',
          description:
            'Optional regex pattern to match against tab URLs (e.g., "localhost:3000"). If not provided, connects to the first available tab.',
        },
        port: {
          type: 'number',
          description: 'Remote debugging port (default: 9222)',
        },
      },
    },
  },
  {
    name: 'list_available_tabs',
    description:
      'List all available tabs in the Chrome/Chromium instance running with remote debugging enabled.',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          description: 'Remote debugging port (default: 9222)',
        },
      },
    },
  },
  {
    name: 'disconnect',
    description: 'Disconnect from the current browser/tab and clean up resources.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_connection_status',
    description:
      'Get the current connection status including mode (puppeteer/attach), connection state, and current URL.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_chrome_launch_command',
    description:
      'Get the command to launch Chrome with remote debugging enabled for your OS. Use this to enable attach mode.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'navigate',
    description:
      'Navigate to a URL in the browser. This will clear previous console logs and network requests.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to navigate to (must include protocol, e.g., https://example.com)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_console_logs',
    description:
      'Get console logs from the current page (errors, warnings, info, debug). Includes timestamps and types.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description:
            'Maximum number of recent logs to return (optional, returns all if not specified)',
        },
        filter: {
          type: 'string',
          description: 'Filter logs by type: error, warning, info, log, debug (optional)',
          enum: ['error', 'warning', 'info', 'log', 'debug'],
        },
      },
    },
  },
  {
    name: 'get_network_requests',
    description:
      'Get network requests made by the page, including status codes, methods, response times, and sizes.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of recent requests to return (optional)',
        },
        failedOnly: {
          type: 'boolean',
          description: 'Only return failed requests (optional)',
        },
      },
    },
  },
  {
    name: 'screenshot',
    description: 'Take a screenshot of the current page and return as base64 encoded image.',
    inputSchema: {
      type: 'object',
      properties: {
        fullPage: {
          type: 'boolean',
          description: 'Capture full page or just viewport (default: false - viewport only)',
        },
      },
    },
  },
  {
    name: 'get_page_content',
    description: 'Get the full HTML content of the current page.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_page_info',
    description: 'Get basic information about the current page (URL, title).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'execute_script',
    description: 'Execute JavaScript code in the page context and return the result.',
    inputSchema: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description: 'JavaScript code to execute',
        },
      },
      required: ['script'],
    },
  },
  {
    name: 'click',
    description: 'Click an element on the page using a CSS selector.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the element to click',
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'type_text',
    description: 'Type text into an input element using a CSS selector.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for the input element',
        },
        text: {
          type: 'string',
          description: 'Text to type into the element',
        },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'wait_for_selector',
    description: 'Wait for an element to appear on the page.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector to wait for',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 5000)',
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'clear_logs',
    description: 'Clear all console logs and network request history.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_performance_metrics',
    description:
      'Get comprehensive performance metrics including load times, resource counts, and Core Web Vitals.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'run_accessibility_audit',
    description:
      'Run an accessibility audit on the current page to identify common accessibility issues.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'manage_cookies',
    description: 'Manage browser cookies (get, set, clear).',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action to perform: get, set, clear',
          enum: ['get', 'set', 'clear'],
        },
        name: {
          type: 'string',
          description: 'Cookie name (required for set action)',
        },
        value: {
          type: 'string',
          description: 'Cookie value (required for set action)',
        },
        domain: {
          type: 'string',
          description: 'Cookie domain (optional for set action)',
        },
        path: {
          type: 'string',
          description: 'Cookie path (optional for set action)',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'manage_local_storage',
    description: 'Manage localStorage (get, set, clear).',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action to perform: get, set, clear',
          enum: ['get', 'set', 'clear'],
        },
        key: {
          type: 'string',
          description: 'Storage key (required for set, optional for get to retrieve specific key)',
        },
        value: {
          type: 'string',
          description: 'Storage value (required for set action)',
        },
      },
      required: ['action'],
    },
  },
];

const server = new Server(
  {
    name: 'browser-inspector',
    version: '0.2.2',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'connect_to_existing_tab': {
        const { urlPattern, port } = args as unknown as { urlPattern?: string; port?: number };
        const tab = await browserManager.connectToExistingTab(urlPattern, port);
        return {
          content: [
            {
              type: 'text',
              text: `Connected to tab:\nURL: ${tab.url}\nTitle: ${tab.title}\nID: ${tab.id}`,
            },
          ],
        };
      }

      case 'list_available_tabs': {
        // Future: support custom port parameter
        const tabs = await browserManager.listAvailableTabs();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tabs, null, 2),
            },
          ],
        };
      }

      case 'disconnect': {
        await browserManager.disconnect();
        return {
          content: [
            {
              type: 'text',
              text: 'Disconnected from browser',
            },
          ],
        };
      }

      case 'get_connection_status': {
        const mode = browserManager.getConnectionMode();
        const isConnected = browserManager.isConnected();
        const url = browserManager.getCurrentUrl();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  mode,
                  connected: isConnected,
                  currentUrl: url,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'navigate': {
        const { url } = args as unknown as { url: string };

        // Check if in attach mode - user should navigate manually
        if (browserManager.getConnectionMode() === ('attach' as any)) {
          throw new Error(
            'Please attach to the tab do not navigate to it as it is allready opened in a chrome with remote debugging'
          );
        }

        await browserManager.navigate(url);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully navigated to ${url}`,
            },
          ],
        };
      }

      case 'get_console_logs': {
        const { limit, filter } = args as unknown as {
          limit?: number;
          filter?: string;
        };
        let logs = browserManager.getConsoleLogs(limit);

        if (filter) {
          logs = logs.filter((log) => log.type === filter);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(logs, null, 2),
            },
          ],
        };
      }

      case 'get_network_requests': {
        const { limit, failedOnly } = args as unknown as {
          limit?: number;
          failedOnly?: boolean;
        };
        let requests = browserManager.getNetworkRequests(limit);

        if (failedOnly) {
          requests = requests.filter((req) => req.failed);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(requests, null, 2),
            },
          ],
        };
      }

      case 'screenshot': {
        const { fullPage = false } = args as unknown as {
          fullPage?: boolean;
        };
        const screenshot = await browserManager.screenshot(fullPage);
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot captured (base64): ${screenshot.substring(0, 100)}...`,
            },
            {
              type: 'image',
              data: screenshot,
              mimeType: 'image/png',
            },
          ],
        };
      }

      case 'get_page_content': {
        const content = await browserManager.getPageContent();
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'get_page_info': {
        const url = browserManager.getCurrentUrl();
        const title = await browserManager.getPageTitle();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ url, title }, null, 2),
            },
          ],
        };
      }

      case 'execute_script': {
        const { script } = args as unknown as { script: string };
        const result = await browserManager.executeScript(script);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'click': {
        const { selector } = args as unknown as { selector: string };
        await browserManager.click(selector);
        return {
          content: [
            {
              type: 'text',
              text: `Clicked element: ${selector}`,
            },
          ],
        };
      }

      case 'type_text': {
        const { selector, text } = args as unknown as {
          selector: string;
          text: string;
        };
        await browserManager.type(selector, text);
        return {
          content: [
            {
              type: 'text',
              text: `Typed text into element: ${selector}`,
            },
          ],
        };
      }

      case 'wait_for_selector': {
        const { selector, timeout } = args as unknown as {
          selector: string;
          timeout?: number;
        };
        await browserManager.waitForSelector(selector, timeout);
        return {
          content: [
            {
              type: 'text',
              text: `Element found: ${selector}`,
            },
          ],
        };
      }

      case 'clear_logs': {
        browserManager.clearLogs();
        return {
          content: [
            {
              type: 'text',
              text: 'Logs cleared successfully',
            },
          ],
        };
      }

      case 'get_performance_metrics': {
        const metrics = await browserManager.getPerformanceMetrics();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metrics, null, 2),
            },
          ],
        };
      }

      case 'run_accessibility_audit': {
        const report = await browserManager.runAccessibilityAudit();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(report, null, 2),
            },
          ],
        };
      }

      case 'manage_cookies': {
        const { action, name, value, domain, path } = args as unknown as {
          action: 'get' | 'set' | 'clear';
          name?: string;
          value?: string;
          domain?: string;
          path?: string;
        };

        if (action === 'get') {
          const cookies = await browserManager.getCookies();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(cookies, null, 2),
              },
            ],
          };
        } else if (action === 'set') {
          if (!name || !value) {
            throw new Error('name and value are required for set action');
          }
          await browserManager.setCookie(name, value, { domain, path });
          return {
            content: [
              {
                type: 'text',
                text: `Cookie set: ${name}=${value}`,
              },
            ],
          };
        } else if (action === 'clear') {
          await browserManager.clearCookies();
          return {
            content: [
              {
                type: 'text',
                text: 'All cookies cleared',
              },
            ],
          };
        }
        break;
      }

      case 'manage_local_storage': {
        const { action, key, value } = args as unknown as {
          action: 'get' | 'set' | 'clear';
          key?: string;
          value?: string;
        };

        if (action === 'get') {
          const storage = await browserManager.getLocalStorage(key);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(storage, null, 2),
              },
            ],
          };
        } else if (action === 'set') {
          if (!key || !value) {
            throw new Error('key and value are required for set action');
          }
          await browserManager.setLocalStorage(key, value);
          return {
            content: [
              {
                type: 'text',
                text: `LocalStorage set: ${key}=${value}`,
              },
            ],
          };
        } else if (action === 'clear') {
          await browserManager.clearLocalStorage();
          return {
            content: [
              {
                type: 'text',
                text: 'LocalStorage cleared',
              },
            ],
          };
        }
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: 'Operation completed',
      },
    ],
  };
});

globalThis.process.on('SIGINT', async () => {
  await browserManager.close();
  globalThis.process.exit(0);
});

globalThis.process.on('SIGTERM', async () => {
  await browserManager.close();
  globalThis.process.exit(0);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Browser Inspector MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  globalThis.process.exit(1);
});
