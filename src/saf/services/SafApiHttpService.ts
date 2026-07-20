import type { ApplicationLogOperation } from '../../renderer/models';
import { applicationLogService } from '../../renderer/services/applicationLog';

export type SafApiHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type SafApiJsonRequest = {
  method: SafApiHttpMethod;
  url: string;
  timeoutMs: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export type SafApiJsonResponse = {
  ok: boolean;
  status: number;
  responseBody: unknown;
  responseHeaders?: Record<string, string>;
  networkError?: string;
};

type SafApiBridge = {
  requestJson(request: SafApiJsonRequest): Promise<SafApiJsonResponse>;
};

declare global {
  interface Window {
    safApi?: SafApiBridge;
  }
}

export class SafApiHttpService {
  protected async requestJson<ResponseBody>(request: SafApiJsonRequest, context: Partial<ApplicationLogOperation> = {}): Promise<ResponseBody> {
    const correlationId = applicationLogService.startOperation({
      ...context,
      transport: 'rest',
      method: request.method,
      url: request.url,
      requestHeaders: {
        Accept: 'application/json',
        ...(request.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...request.headers,
      },
      requestBody: request.body,
    });
    const bridge = globalThis.window?.safApi;

    if (!bridge) {
      const error = new Error(createMissingSafApiBridgeMessage());
      applicationLogService.failOperation(correlationId, { errorCode: 'BRIDGE_UNAVAILABLE', errorMessage: error.message });
      throw error;
    }

    let response: SafApiJsonResponse;

    try {
      response = await bridge.requestJson(request);
    } catch (error) {
      const reason = error instanceof Error ? error.message : undefined;
      const networkError = new Error(createNetworkErrorMessage(reason));
      applicationLogService.failOperation(correlationId, { errorCode: 'NETWORK_ERROR', errorMessage: networkError.message });
      throw networkError;
    }

    if (response.status === 0) {
      const error = new Error(createNetworkErrorMessage(response.networkError));
      applicationLogService.failOperation(correlationId, {
        errorCode: getNetworkErrorCode(response.networkError), errorMessage: error.message,
        responseBody: response.responseBody, responseHeaders: response.responseHeaders,
      });
      throw error;
    }

    if (!response.ok) {
      const error = this.createApiError(response.status, response.responseBody);
      const apiDetails = getApiErrorDetails(response.responseBody);
      applicationLogService.failOperation(correlationId, {
        httpStatus: response.status, responseHeaders: response.responseHeaders,
        responseBody: response.responseBody, errorCode: apiDetails.errorCode ?? 'HTTP_ERROR',
        errorMessage: apiDetails.errorMessage ?? `SAF API request failed (${response.status}).`,
      });
      throw error;
    }

    applicationLogService.completeOperation(correlationId, {
      httpStatus: response.status,
      responseHeaders: response.responseHeaders,
      responseBody: response.responseBody,
    });
    return response.responseBody as ResponseBody;
  }

  protected postJson<ResponseBody>(
    url: string,
    body: unknown,
    timeoutMs: number,
    headers?: Record<string, string>,
    context?: Partial<ApplicationLogOperation>,
  ): Promise<ResponseBody> {
    return this.requestJson<ResponseBody>({
      method: 'POST',
      url,
      timeoutMs,
      body,
      headers,
    }, context);
  }

  protected createApiError(status: number, responseBody: unknown): Error {
    return new Error(createApiErrorMessage(status, responseBody));
  }
}

function getApiErrorDetails(responseBody: unknown): { errorCode?: string; errorMessage?: string } {
  if (!responseBody || typeof responseBody !== 'object') return {};
  const value = responseBody as Record<string, unknown>;
  return {
    errorCode: typeof value.errorCode === 'string' ? value.errorCode : undefined,
    errorMessage: typeof value.errorMessage === 'string' ? value.errorMessage : undefined,
  };
}

function getNetworkErrorCode(message?: string): string {
  return message?.match(/\b(?:ERR|E)[A-Z0-9_]+\b/)?.[0] ?? 'NETWORK_ERROR';
}

function createApiErrorMessage(status: number, responseBody: unknown): string {
  if (typeof responseBody === 'string' && responseBody.trim()) {
    return `SAF API request failed (${status}): ${responseBody}`;
  }

  if (typeof responseBody === 'object' && responseBody !== null) {
    return `SAF API request failed (${status}): ${JSON.stringify(responseBody)}`;
  }

  return `SAF API request failed (${status}).`;
}

function createNetworkErrorMessage(reason?: string): string {
  const details = reason?.trim() ? ` Detail: ${reason.trim()}` : '';
  const hint = reason?.includes('ERR_SSL_CLIENT_AUTH_CERT_NEEDED')
    ? ' Hinweis: Der Node.js-HTTPS-Request meldet fuer diesen Verbindungsversuch, dass im TLS-Handshake ein Client-Zertifikat benoetigt wird. Wenn derselbe Endpoint in anderen Tests ohne Client-Zertifikat erreichbar ist, vergleiche Host, Pfad, Proxy, DNS/SNI, VPN und Trust-/Zertifikatseinstellungen der Electron-App mit dem erfolgreichen Testclient.'
    : '';

  return `SAF API Netzwerkfehler: Request konnte nicht ausgefuehrt werden. Pruefe Service Host, Netzwerk, TLS/Zertifikat und Erreichbarkeit.${hint}${details}`;
}

function createMissingSafApiBridgeMessage(): string {
  return 'SAF API Netzwerkfehler: Electron SAF API Bridge ist nicht verfuegbar. Der API-Call muss ueber den Electron Main Process laufen, weil der Service Host keinen CORS-Preflight fuer Browser-Requests beantworten muss. Starte die App mit Electron und pruefe, ob src/preload.ts geladen wird.';
}
