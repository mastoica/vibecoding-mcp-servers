export interface ConsoleLog {
  type: string;
  text: string;
  timestamp: number;
  location?: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  type?: string;
  timestamp: number;
  headers?: Record<string, string>;
  failed?: boolean;
  errorText?: string;
  responseTime?: number;
  size?: number;
}

export interface PerformanceMetrics {
  timestamp: number;
  metrics: {
    domContentLoaded: number;
    load: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    timeToInteractive?: number;
    totalBlockingTime?: number;
    cumulativeLayoutShift?: number;
  };
  resources: {
    scriptCount: number;
    stylesheetCount: number;
    imageCount: number;
    totalSize: number;
  };
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  selector?: string;
  element?: string;
}

export interface AccessibilityReport {
  timestamp: number;
  url: string;
  issues: AccessibilityIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export enum ConnectionMode {
  PUPPETEER = 'puppeteer',
  ATTACH = 'attach',
}

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  type: string;
}

export interface ConnectionOptions {
  mode: ConnectionMode;
  debugPort?: number;
  urlPattern?: string;
  tabId?: string;
}
