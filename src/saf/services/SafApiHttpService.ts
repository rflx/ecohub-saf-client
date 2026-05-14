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
  protected async requestJson<ResponseBody>(request: SafApiJsonRequest): Promise<ResponseBody> {
    const bridge = globalThis.window?.safApi;

    if (!bridge) {
      throw new Error(createMissingSafApiBridgeMessage());
    }

    let response: SafApiJsonResponse;

    try {
      response = await bridge.requestJson(request);
    } catch (error) {
      const reason = error instanceof Error ? error.message : undefined;

      throw new Error(createNetworkErrorMessage(reason));
    }

    if (response.status === 0) {
      throw new Error(createNetworkErrorMessage(response.networkError));
    }

    if (!response.ok) {
      throw this.createApiError(response.status, response.responseBody);
    }

    return response.responseBody as ResponseBody;
  }

  protected postJson<ResponseBody>(
    url: string,
    body: unknown,
    timeoutMs: number,
    headers?: Record<string, string>,
  ): Promise<ResponseBody> {
    return this.requestJson<ResponseBody>({
      method: 'POST',
      url,
      timeoutMs,
      body,
      headers,
    });
  }

  protected createApiError(status: number, responseBody: unknown): Error {
    return new Error(createApiErrorMessage(status, responseBody));
  }
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
