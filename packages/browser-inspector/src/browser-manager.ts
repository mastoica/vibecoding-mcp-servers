import { chromium, Browser, Page, BrowserContext } from 'playwright';
import type {
  ConsoleLog,
  NetworkRequest,
  PerformanceMetrics,
  AccessibilityReport,
  AccessibilityIssue,
  ConnectionMode,
  BrowserTab,
} from './types.js';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private consoleLogs: ConsoleLog[] = [];
  private networkRequests: NetworkRequest[] = [];
  private isMonitoring = false;
  private connectionMode: ConnectionMode = 'attach' as ConnectionMode;
  private debugPort = 9222;
  private cdpUrl: string | null = null;

  async ensureBrowser(mode: ConnectionMode = 'attach' as ConnectionMode): Promise<Browser> {
    if (!this.browser) {
      // Try attach mode first (if not explicitly set to puppeteer)
      if (mode === ('attach' as ConnectionMode)) {
        try {
          this.cdpUrl = `http://localhost:${this.debugPort}`;
          this.browser = await chromium.connectOverCDP(this.cdpUrl);
          this.connectionMode = 'attach' as ConnectionMode;
          console.error(
            `✓ Connected to existing Chrome instance on port ${this.debugPort} (attach mode)`
          );
        } catch (error) {
          // Fallback to puppeteer mode if attach fails
          console.error(
            `ℹ No Chrome instance found on port ${this.debugPort}, launching new browser (puppeteer mode)`
          );
          this.browser = await chromium.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });
          this.connectionMode = 'puppeteer' as ConnectionMode;
        }
      } else {
        // Explicitly requested puppeteer mode
        this.browser = await chromium.launch({
          headless: false,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        this.connectionMode = 'puppeteer' as ConnectionMode;
      }
    }
    return this.browser;
  }

  async ensurePage(): Promise<Page> {
    if (!this.page) {
      const browser = await this.ensureBrowser(this.connectionMode);

      if (this.connectionMode === ('attach' as ConnectionMode)) {
        // Get existing contexts (tabs)
        const contexts = browser.contexts();
        if (contexts.length > 0) {
          this.context = contexts[0];
          const pages = this.context.pages();
          if (pages.length > 0) {
            this.page = pages[0];
          }
        }

        if (!this.page) {
          throw new Error('No active tab found. Please open a tab in Chrome.');
        }
      } else {
        // Create new context and page for puppeteer mode
        this.context = await browser.newContext({
          viewport: { width: 1920, height: 1080 },
        });
        this.page = await this.context.newPage();
      }

      if (!this.isMonitoring) {
        this.setupMonitoring();
      }
    }
    return this.page;
  }

  async listAvailableTabs(): Promise<BrowserTab[]> {
    const response = await fetch(`http://localhost:${this.debugPort}/json`);
    const tabs = (await response.json()) as Array<{
      id: string;
      url: string;
      title: string;
      type: string;
      webSocketDebuggerUrl?: string;
    }>;

    return tabs
      .filter((tab) => tab.type === 'page')
      .map((tab) => ({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        type: tab.type,
      }));
  }

  async connectToExistingTab(urlPattern?: string, port = 9222): Promise<BrowserTab> {
    this.debugPort = port;

    // Close existing connection if any
    if (this.browser) {
      await this.disconnect();
    }

    const tabs = await this.listAvailableTabs();

    if (tabs.length === 0) {
      throw new Error(
        'No tabs found. Make sure Chrome is running with --remote-debugging-port=9222'
      );
    }

    let targetTab: BrowserTab;

    if (urlPattern) {
      const regex = new RegExp(urlPattern);
      const matchingTab = tabs.find((tab) => regex.test(tab.url));
      if (!matchingTab) {
        throw new Error(`No tab found matching pattern: ${urlPattern}`);
      }
      targetTab = matchingTab;
    } else {
      // Use the first tab
      targetTab = tabs[0];
    }

    // Connect to the browser
    this.connectionMode = 'attach' as ConnectionMode;
    await this.ensureBrowser('attach' as ConnectionMode);
    await this.ensurePage();

    return targetTab;
  }

  async disconnect(): Promise<void> {
    this.page = null;
    this.context = null;
    if (this.browser) {
      if (this.connectionMode === ('attach' as ConnectionMode)) {
        await this.browser.close();
      } else {
        await this.browser.close();
      }
      this.browser = null;
    }
    this.isMonitoring = false;
    this.consoleLogs = [];
    this.networkRequests = [];
  }

  private setupMonitoring(): void {
    if (!this.page) return;

    this.consoleLogs = [];
    this.networkRequests = [];

    this.page.on('console', (msg) => {
      const log: ConsoleLog = {
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
        location: msg.location()?.url,
      };
      this.consoleLogs.push(log);
    });

    this.page.on('pageerror', (error) => {
      const log: ConsoleLog = {
        type: 'error',
        text: error.message,
        timestamp: Date.now(),
      };
      this.consoleLogs.push(log);
    });

    const requestStartTimes = new Map<string, number>();

    this.page.on('request', (request) => {
      const key = `${request.url()}_${Date.now()}`;
      requestStartTimes.set(key, Date.now());

      const networkReq: NetworkRequest = {
        url: request.url(),
        method: request.method(),
        type: request.resourceType(),
        timestamp: Date.now(),
        headers: request.headers(),
      };
      this.networkRequests.push(networkReq);
    });

    this.page.on('response', async (response) => {
      const request = this.networkRequests.find((req) => req.url === response.url() && !req.status);
      if (request) {
        request.status = response.status();
        request.statusText = response.statusText();

        const startTime = Array.from(requestStartTimes.entries()).find(([key]) =>
          key.startsWith(response.url())
        );
        if (startTime) {
          request.responseTime = Date.now() - startTime[1];
          requestStartTimes.delete(startTime[0]);
        }

        try {
          const buffer = await response.body();
          if (request && buffer) {
            request.size = buffer.length;
          }
        } catch {
          // Ignore buffer errors
        }
      }
    });

    this.page.on('requestfailed', (request) => {
      const networkReq = this.networkRequests.find(
        (req) => req.url === request.url() && !req.failed
      );
      if (networkReq) {
        networkReq.failed = true;
        networkReq.errorText = request.failure()?.errorText;
      }
    });

    this.isMonitoring = true;
  }

  async navigate(url: string): Promise<void> {
    const page = await this.ensurePage();

    this.consoleLogs = [];
    this.networkRequests = [];

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  }

  getConsoleLogs(limit?: number): ConsoleLog[] {
    return limit ? this.consoleLogs.slice(-limit) : this.consoleLogs;
  }

  getNetworkRequests(limit?: number): NetworkRequest[] {
    return limit ? this.networkRequests.slice(-limit) : this.networkRequests;
  }

  clearLogs(): void {
    this.consoleLogs = [];
    this.networkRequests = [];
  }

  async screenshot(fullPage = false): Promise<string> {
    const page = await this.ensurePage();
    const screenshot = await page.screenshot({
      fullPage,
      type: 'png',
    });
    return screenshot.toString('base64');
  }

  async getPageContent(): Promise<string> {
    const page = await this.ensurePage();
    return await page.content();
  }

  async getPageTitle(): Promise<string> {
    const page = await this.ensurePage();
    return await page.title();
  }

  async executeScript<T = unknown>(script: string): Promise<T> {
    const page = await this.ensurePage();
    return (await page.evaluate(script)) as T;
  }

  async click(selector: string): Promise<void> {
    const page = await this.ensurePage();
    await page.click(selector);
  }

  async type(selector: string, text: string): Promise<void> {
    const page = await this.ensurePage();
    await page.fill(selector, text);
  }

  async waitForSelector(selector: string, timeout = 5000): Promise<void> {
    const page = await this.ensurePage();
    await page.waitForSelector(selector, { timeout });
  }

  getCurrentUrl(): string | null {
    return this.page?.url() || null;
  }

  getConnectionMode(): ConnectionMode {
    return this.connectionMode;
  }

  isConnected(): boolean {
    return this.page !== null;
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const page = await this.ensurePage();

    const metrics = (await page.evaluate(`
      (() => {
        const perf = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        const resources = performance.getEntriesByType('resource');

        const fp = paint.find(entry => entry.name === 'first-paint');
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');

        const scripts = resources.filter(r => r.initiatorType === 'script');
        const stylesheets = resources.filter(r => r.initiatorType === 'link' || r.initiatorType === 'css');
        const images = resources.filter(r => r.initiatorType === 'img' || r.initiatorType === 'image');

        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

        return {
          domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
          load: perf.loadEventEnd - perf.fetchStart,
          firstPaint: fp?.startTime,
          firstContentfulPaint: fcp?.startTime,
          scriptCount: scripts.length,
          stylesheetCount: stylesheets.length,
          imageCount: images.length,
          totalSize,
        };
      })()
    `)) as {
      domContentLoaded: number;
      load: number;
      firstPaint?: number;
      firstContentfulPaint?: number;
      scriptCount: number;
      stylesheetCount: number;
      imageCount: number;
      totalSize: number;
    };

    return {
      timestamp: Date.now(),
      metrics: {
        domContentLoaded: metrics.domContentLoaded,
        load: metrics.load,
        firstPaint: metrics.firstPaint,
        firstContentfulPaint: metrics.firstContentfulPaint,
      },
      resources: {
        scriptCount: metrics.scriptCount,
        stylesheetCount: metrics.stylesheetCount,
        imageCount: metrics.imageCount,
        totalSize: metrics.totalSize,
      },
    };
  }

  async runAccessibilityAudit(): Promise<AccessibilityReport> {
    const page = await this.ensurePage();
    const url = this.getCurrentUrl() || 'unknown';

    const issues = (await page.evaluate(`
      (() => {
        const foundIssues = [];

        // Check for images without alt text
        document.querySelectorAll('img').forEach((img, index) => {
          if (!img.hasAttribute('alt')) {
            foundIssues.push({
              type: 'error',
              rule: 'img-alt',
              message: 'Image missing alt attribute',
              selector: \`img:nth-of-type(\${index + 1})\`,
              element: img.outerHTML.substring(0, 100),
            });
          }
        });

        // Check for form inputs without labels
        document.querySelectorAll('input, textarea, select').forEach(input => {
          const id = input.id;
          if (id && !document.querySelector(\`label[for="\${id}"]\`)) {
            const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
            if (!hasAriaLabel) {
              foundIssues.push({
                type: 'error',
                rule: 'label',
                message: 'Form control missing associated label',
                selector: \`#\${id}\`,
                element: input.outerHTML.substring(0, 100),
              });
            }
          }
        });

        // Check for missing page title
        if (!document.title || document.title.trim() === '') {
          foundIssues.push({
            type: 'error',
            rule: 'document-title',
            message: 'Page missing title element',
          });
        }

        // Check for missing lang attribute
        if (!document.documentElement.hasAttribute('lang')) {
          foundIssues.push({
            type: 'error',
            rule: 'html-lang',
            message: 'HTML element missing lang attribute',
          });
        }

        // Check for proper heading hierarchy
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        let lastLevel = 0;
        headings.forEach((heading, index) => {
          const level = parseInt(heading.tagName.substring(1));
          if (level - lastLevel > 1) {
            foundIssues.push({
              type: 'warning',
              rule: 'heading-order',
              message: \`Heading level skipped (from h\${lastLevel} to h\${level})\`,
              selector: \`\${heading.tagName.toLowerCase()}:nth-of-type(\${index + 1})\`,
            });
          }
          lastLevel = level;
        });

        // Check for links without discernible text
        document.querySelectorAll('a').forEach((link, index) => {
          const text = link.textContent?.trim() || '';
          const ariaLabel = link.getAttribute('aria-label');
          if (!text && !ariaLabel) {
            foundIssues.push({
              type: 'error',
              rule: 'link-name',
              message: 'Link missing discernible text',
              selector: \`a:nth-of-type(\${index + 1})\`,
              element: link.outerHTML.substring(0, 100),
            });
          }
        });

        // Check for proper button elements
        document.querySelectorAll('[onclick]:not(button):not(a)').forEach((element, index) => {
          foundIssues.push({
            type: 'warning',
            rule: 'button-semantics',
            message: 'Element with onclick should be a button or link for accessibility',
            selector: \`\${element.tagName.toLowerCase()}[onclick]:nth-of-type(\${index + 1})\`,
          });
        });

        return foundIssues;
      })()
    `)) as AccessibilityIssue[];

    const summary = {
      errors: issues.filter((i) => i.type === 'error').length,
      warnings: issues.filter((i) => i.type === 'warning').length,
      info: issues.filter((i) => i.type === 'info').length,
    };

    return {
      timestamp: Date.now(),
      url,
      issues,
      summary,
    };
  }

  async setCookie(
    name: string,
    value: string,
    options?: {
      domain?: string;
      path?: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
    }
  ): Promise<void> {
    const page = await this.ensurePage();
    const context = this.context || page.context();
    await context.addCookies([
      {
        name,
        value,
        domain: options?.domain || new URL(page.url()).hostname,
        path: options?.path || '/',
        expires: options?.expires,
        httpOnly: options?.httpOnly,
        secure: options?.secure,
      },
    ]);
  }

  async getCookies(): Promise<
    Array<{ name: string; value: string; domain: string; path: string }>
  > {
    const page = await this.ensurePage();
    const context = this.context || page.context();
    return await context.cookies();
  }

  async clearCookies(): Promise<void> {
    const page = await this.ensurePage();
    const context = this.context || page.context();
    await context.clearCookies();
  }

  async setLocalStorage(key: string, value: string): Promise<void> {
    const page = await this.ensurePage();
    await page.evaluate(`localStorage.setItem('${key}', '${value}')`);
  }

  async getLocalStorage(key?: string): Promise<Record<string, string>> {
    const page = await this.ensurePage();
    if (key) {
      return (await page.evaluate(`
        (() => {
          const value = localStorage.getItem('${key}');
          return value ? { '${key}': value } : {};
        })()
      `)) as Record<string, string>;
    }
    return (await page.evaluate(`
      (() => {
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            storage[key] = localStorage.getItem(key) || '';
          }
        }
        return storage;
      })()
    `)) as Record<string, string>;
  }

  async clearLocalStorage(): Promise<void> {
    const page = await this.ensurePage();
    await page.evaluate(`localStorage.clear()`);
  }

  async close(): Promise<void> {
    await this.disconnect();
  }

  getChromeLaunchCommand(): string {
    const platform = process.platform;
    const port = this.debugPort;

    switch (platform) {
      case 'darwin':
        return `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${port}`;
      case 'win32':
        return `chrome.exe --remote-debugging-port=${port}`;
      case 'linux':
        return `google-chrome --remote-debugging-port=${port}`;
      default:
        return `google-chrome --remote-debugging-port=${port}`;
    }
  }
}
