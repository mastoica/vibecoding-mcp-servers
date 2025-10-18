import EventEmitter from 'eventemitter3';
import type {
  Alert,
  AlertSeverity,
  AlertSource,
  LogSource,
  PatternMatch,
} from './types.js';

export class DevWatcher extends EventEmitter {
  private alerts: Alert[] = [];
  private watchedSources = new Map<string, LogSource>();
  private alertPatterns: string[] = [];
  private debounceMs = 1000;
  private seenAlerts = new Map<string, number>(); // Alert hash -> timestamp
  private readonly maxAlerts = 1000;
  private nextAlertId = 1;

  constructor() {
    super();
  }

  addWatchSource(source: LogSource): void {
    const key = `${source.type}:${source.id}`;
    this.watchedSources.set(key, source);
  }

  removeWatchSource(type: string, id: string): void {
    const key = `${type}:${id}`;
    this.watchedSources.delete(key);
  }

  setAlertPatterns(patterns: string[]): void {
    this.alertPatterns = patterns;
  }

  setDebounce(ms: number): void {
    this.debounceMs = ms;
  }

  processLogLine(
    source: AlertSource,
    sourceId: string,
    line: string
  ): Alert | null {
    // Check against watch patterns
    const sourceKey = `${source}:${sourceId}`;
    const watchSource = this.watchedSources.get(sourceKey);

    const patterns = [
      ...(watchSource?.patterns || []),
      ...this.alertPatterns,
    ];

    for (const pattern of patterns) {
      const match = this.matchPattern(line, pattern);
      if (match) {
        const alert = this.createAlert(
          match.severity,
          source,
          sourceId,
          match.matched,
          line,
          pattern
        );

        // Check for duplicate (debounce)
        if (this.shouldSuppress(alert)) {
          return null;
        }

        this.addAlert(alert);
        this.emit('alert', alert);
        return alert;
      }
    }

    return null;
  }

  private matchPattern(line: string, pattern: string): PatternMatch | null {
    try {
      const regex = new RegExp(pattern, 'i');
      const match = line.match(regex);

      if (match) {
        const severity = this.determineSeverity(pattern, line);
        return {
          pattern,
          matched: match[0],
          severity,
        };
      }
    } catch (error) {
      // Invalid regex pattern
      console.error(`Invalid pattern: ${pattern}`, error);
    }

    return null;
  }

  private determineSeverity(pattern: string, line: string): AlertSeverity {
    const lowerLine = line.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    // Check for error indicators
    if (
      lowerLine.includes('error') ||
      lowerLine.includes('fatal') ||
      lowerLine.includes('critical') ||
      lowerPattern.includes('error')
    ) {
      return 'error';
    }

    // Check for warning indicators
    if (
      lowerLine.includes('warn') ||
      lowerLine.includes('warning') ||
      lowerPattern.includes('warn')
    ) {
      return 'warning';
    }

    // Default to info
    return 'info';
  }

  private createAlert(
    severity: AlertSeverity,
    source: AlertSource,
    sourceId: string,
    message: string,
    context?: string,
    pattern?: string
  ): Alert {
    return {
      id: `alert-${this.nextAlertId++}`,
      timestamp: new Date(),
      severity,
      source,
      sourceId,
      pattern,
      message,
      context,
    };
  }

  private shouldSuppress(alert: Alert): boolean {
    // Create hash of alert for deduplication
    const hash = `${alert.source}:${alert.sourceId}:${alert.pattern}:${alert.message}`;
    const lastSeen = this.seenAlerts.get(hash);

    if (lastSeen) {
      const elapsed = Date.now() - lastSeen;
      if (elapsed < this.debounceMs) {
        return true; // Suppress duplicate
      }
    }

    this.seenAlerts.set(hash, Date.now());

    // Clean old entries
    if (this.seenAlerts.size > this.maxAlerts) {
      const cutoff = Date.now() - this.debounceMs * 2;
      for (const [key, timestamp] of this.seenAlerts.entries()) {
        if (timestamp < cutoff) {
          this.seenAlerts.delete(key);
        }
      }
    }

    return false;
  }

  private addAlert(alert: Alert): void {
    this.alerts.push(alert);

    // Trim alerts if too many
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }
  }

  getAlerts(
    since?: number,
    severity?: AlertSeverity[],
    source?: AlertSource,
    limit?: number
  ): Alert[] {
    let filtered = this.alerts;

    // Filter by timestamp
    if (since !== undefined) {
      const sinceDate = new Date(since);
      filtered = filtered.filter(alert => alert.timestamp >= sinceDate);
    }

    // Filter by severity
    if (severity && severity.length > 0) {
      filtered = filtered.filter(alert => severity.includes(alert.severity));
    }

    // Filter by source
    if (source) {
      filtered = filtered.filter(alert => alert.source === source);
    }

    // Apply limit
    if (limit !== undefined) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  clearAlerts(olderThan?: number, severity?: AlertSeverity[]): number {
    const initialCount = this.alerts.length;

    if (olderThan !== undefined) {
      const cutoffDate = new Date(olderThan);
      this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoffDate);
    }

    if (severity && severity.length > 0) {
      this.alerts = this.alerts.filter(alert => !severity.includes(alert.severity));
    }

    if (olderThan === undefined && (!severity || severity.length === 0)) {
      this.alerts = [];
    }

    return initialCount - this.alerts.length;
  }

  getStats(): {
    totalAlerts: number;
    alertsBySeverity: Record<AlertSeverity, number>;
    alertsBySource: Record<string, number>;
    watchedSources: number;
  } {
    const stats = {
      totalAlerts: this.alerts.length,
      alertsBySeverity: {
        error: 0,
        warning: 0,
        info: 0,
      } as Record<AlertSeverity, number>,
      alertsBySource: {} as Record<string, number>,
      watchedSources: this.watchedSources.size,
    };

    for (const alert of this.alerts) {
      stats.alertsBySeverity[alert.severity]++;

      const sourceKey = `${alert.source}:${alert.sourceId}`;
      stats.alertsBySource[sourceKey] = (stats.alertsBySource[sourceKey] || 0) + 1;
    }

    return stats;
  }
}
