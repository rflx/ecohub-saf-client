import type { ApplicationLogEntry, ApplicationLogOperation } from '../../models';

export const APPLICATION_LOG_STORAGE_KEY = 'ecohub-saf-client.application-logs';
export const MAX_APPLICATION_LOG_ENTRIES = 500;
export const MAX_APPLICATION_LOG_BODY_CHARS = 16_000;
export const REDACTED_VALUE = '[REDACTED]';

const SECRET_KEY_PARTS = [
  'password', 'identificationcode', 'activationcode', 'iak', 'licencekey',
  'clientsecret', 'client_secret', 'accesstoken', 'refreshtoken', 'authorization',
  'cookie', 'certificate', 'techusercert', 'privatekey', 'p12', 'sasl',
];

export interface ApplicationLogStorage {
  load(): ApplicationLogEntry[];
  save(entries: ApplicationLogEntry[]): void;
  clear(): void;
}

export class LocalStorageApplicationLogStorage implements ApplicationLogStorage {
  load(): ApplicationLogEntry[] {
    if (!canUseLocalStorage()) return [];
    try {
      const value = window.localStorage.getItem(APPLICATION_LOG_STORAGE_KEY);
      const parsed = value ? JSON.parse(value) as unknown : [];
      return Array.isArray(parsed) ? parsed.filter(isApplicationLogEntry).slice(-MAX_APPLICATION_LOG_ENTRIES) : [];
    } catch {
      return [];
    }
  }

  save(entries: ApplicationLogEntry[]): void {
    if (!canUseLocalStorage()) return;
    try {
      window.localStorage.setItem(APPLICATION_LOG_STORAGE_KEY, JSON.stringify(entries.slice(-MAX_APPLICATION_LOG_ENTRIES)));
    } catch {
      // Logging must never interrupt the application flow (for example on storage quota errors).
    }
  }

  clear(): void {
    if (!canUseLocalStorage()) return;
    try { window.localStorage.removeItem(APPLICATION_LOG_STORAGE_KEY); } catch { /* no-op */ }
  }
}

type Completion = {
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  httpStatus?: number;
  metadata?: Record<string, unknown>;
};

type Failure = Completion & { errorCode?: string; errorMessage: string };

export class ApplicationLogService {
  private entries: ApplicationLogEntry[];
  private visibleEntries: ApplicationLogEntry[];
  private readonly listeners = new Set<() => void>();

  constructor(private readonly storage: ApplicationLogStorage = new LocalStorageApplicationLogStorage()) {
    this.entries = storage.load();
    this.visibleEntries = [...this.entries].reverse();
  }

  getEntries = (): ApplicationLogEntry[] => this.visibleEntries;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  startOperation(operation: ApplicationLogOperation): string {
    const now = new Date().toISOString();
    const correlationId = createId();
    this.entries.push(sanitizeLogEntry({
      ...operation,
      id: createId(), correlationId, timestamp: now, timestampUtc: now,
      direction: 'request', status: 'pending',
    }));
    this.commit();
    return correlationId;
  }

  completeOperation(correlationId: string, completion: Completion): void {
    this.finish(correlationId, 'success', 'response', completion);
  }

  failOperation(correlationId: string, failure: Failure): void {
    this.finish(correlationId, 'error', 'error', failure);
  }

  logOperation(operation: ApplicationLogOperation, status: 'success' | 'error' = 'success'): string {
    const correlationId = this.startOperation(operation);
    this.finish(correlationId, status, status === 'success' ? 'operation' : 'error', {});
    return correlationId;
  }

  clear(): void {
    this.entries = [];
    this.visibleEntries = [];
    this.storage.clear();
    this.emit();
  }

  private finish(correlationId: string, status: 'success' | 'error', direction: 'response' | 'error' | 'operation', values: Completion | Failure): void {
    const index = this.entries.findIndex((entry) => entry.correlationId === correlationId);
    if (index < 0) return;
    const completedAtUtc = new Date().toISOString();
    const startedAt = Date.parse(this.entries[index].timestampUtc);
    this.entries[index] = sanitizeLogEntry({
      ...this.entries[index], ...values, status, direction, completedAtUtc,
      durationMs: Math.max(0, Date.parse(completedAtUtc) - startedAt),
    });
    this.commit();
  }

  private commit(): void {
    this.entries = this.entries.slice(-MAX_APPLICATION_LOG_ENTRIES);
    this.visibleEntries = [...this.entries].reverse();
    this.storage.save(this.entries);
    this.emit();
  }

  private emit(): void { this.listeners.forEach((listener) => listener()); }
}

export function sanitizeForApplicationLog(value: unknown, key = ''): unknown {
  if (isSecretKey(key)) return REDACTED_VALUE;
  if (key.toLowerCase() === 'url' && typeof value === 'string') return redactUrl(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeForApplicationLog(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .map(([childKey, childValue]) => [childKey, sanitizeForApplicationLog(childValue, childKey)]));
  }
  if (typeof value === 'string' && (value.length > 2_000 || looksLikeLargeBase64(value))) {
    return `${value.slice(0, 256)}...[TRUNCATED ${value.length - 256} chars]`;
  }
  return value;
}

function redactUrl(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.forEach((_parameterValue, parameterKey) => {
      if (isSecretKey(parameterKey)) url.searchParams.set(parameterKey, REDACTED_VALUE);
    });
    return url.toString();
  } catch {
    return value;
  }
}

function sanitizeLogEntry(entry: ApplicationLogEntry): ApplicationLogEntry {
  const sanitized = sanitizeForApplicationLog(entry) as ApplicationLogEntry;
  return {
    ...sanitized,
    requestBody: limitBody(sanitized.requestBody),
    responseBody: limitBody(sanitized.responseBody),
  };
}

function limitBody(body: unknown): unknown {
  if (body === undefined) return undefined;
  let serialized: string;
  try { serialized = JSON.stringify(body); } catch { return '[UNSERIALIZABLE]'; }
  if (serialized.length <= MAX_APPLICATION_LOG_BODY_CHARS) return body;
  return { truncated: true, originalSize: serialized.length, preview: serialized.slice(0, MAX_APPLICATION_LOG_BODY_CHARS) };
}

function isSecretKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return SECRET_KEY_PARTS.some((part) => normalized.includes(part));
}

function looksLikeLargeBase64(value: string): boolean {
  return value.length > 512 && /^[A-Za-z0-9+/=\r\n]+$/.test(value);
}

function isApplicationLogEntry(value: unknown): value is ApplicationLogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<ApplicationLogEntry>;
  return typeof entry.id === 'string' && typeof entry.correlationId === 'string' &&
    typeof entry.timestampUtc === 'string' && (entry.transport === 'rest' || entry.transport === 'kafka');
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function createId(): string {
  const uuid = (globalThis.crypto as Crypto & { randomUUID?: () => string } | undefined)?.randomUUID?.();
  return uuid ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const applicationLogService = new ApplicationLogService();
