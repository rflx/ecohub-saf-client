export type ApplicationLogTransport = 'rest' | 'kafka';
export type ApplicationLogDirection = 'request' | 'response' | 'error' | 'operation';
export type ApplicationLogStatus = 'pending' | 'success' | 'error';

export type ApplicationLogEntry = {
  id: string;
  correlationId: string;
  timestamp: string;
  timestampUtc: string;
  completedAtUtc?: string;
  transport: ApplicationLogTransport;
  direction: ApplicationLogDirection;
  status: ApplicationLogStatus;
  profileId?: string;
  profileName?: string;
  environmentId?: string;
  apiId?: string;
  apiName?: string;
  apiVersion?: string;
  operationId?: string;
  operationName?: string;
  method?: string;
  url?: string;
  httpStatus?: number;
  durationMs?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

export type ApplicationLogOperation = Omit<
  ApplicationLogEntry,
  'id' | 'correlationId' | 'timestamp' | 'timestampUtc' | 'direction' | 'status'
>;
