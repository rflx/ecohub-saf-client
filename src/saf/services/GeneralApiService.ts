import type { operations } from '../generated/general-api-2.0.0';

export type EnrolTechUserRequest =
  operations['EnrolTechUser']['requestBody']['content']['application/json'];

export type EnrolTechUserResponse =
  operations['EnrolTechUser']['responses']['200']['content']['application/json'];

export type SafReceiversRequest =
  operations['SafReceivers']['requestBody']['content']['application/json'];

export type SafReceiversResponse =
  operations['SafReceivers']['responses']['200']['content']['application/json'];

export type SafInsurersRequest =
  operations['SafInsurers']['requestBody']['content']['application/json'];

export type SafInsurersResponse =
  operations['SafInsurers']['responses']['200']['content']['application/json'];

export type GeneralApiRequestOptions = {
  url: string;
  timeoutMs: number;
};

type SafApiPostJsonRequest = {
  url: string;
  timeoutMs: number;
  body: unknown;
};

type SafApiPostJsonResponse = {
  ok: boolean;
  status: number;
  responseBody: unknown;
  networkError?: string;
};

type SafApiBridge = {
  postJson(request: SafApiPostJsonRequest): Promise<SafApiPostJsonResponse>;
};

declare global {
  interface Window {
    safApi?: SafApiBridge;
  }
}

export class GeneralApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly responseBody: unknown,
    readonly errorCode?: string,
    readonly apiErrorMessage?: string,
  ) {
    super(message);
    this.name = 'GeneralApiError';
  }
}

export class GeneralApiService {
  async enrolTechUser(
    request: EnrolTechUserRequest,
    options: GeneralApiRequestOptions,
  ): Promise<EnrolTechUserResponse> {
    return this.postJson<EnrolTechUserResponse>(options.url, request, options.timeoutMs);
  }

  getSafReceivers(_request: SafReceiversRequest): Promise<SafReceiversResponse> {
    return Promise.reject(new Error('General API runtime requests are not implemented yet.'));
  }

  getSafInsurers(_request: SafInsurersRequest): Promise<SafInsurersResponse> {
    return Promise.reject(new Error('General API runtime requests are not implemented yet.'));
  }

  private async postJson<ResponseBody>(
    url: string,
    request: unknown,
    timeoutMs: number,
  ): Promise<ResponseBody> {
    const bridge = globalThis.window?.safApi;

    if (!bridge) {
      throw new Error(createMissingSafApiBridgeMessage());
    }

    return this.postJsonViaMainProcess<ResponseBody>(url, request, timeoutMs, bridge);
  }

  private async postJsonViaMainProcess<ResponseBody>(
    url: string,
    request: unknown,
    timeoutMs: number,
    bridge: SafApiBridge,
  ): Promise<ResponseBody> {
    let response: SafApiPostJsonResponse;

    try {
      response = await bridge.postJson({
        url,
        timeoutMs,
        body: request,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : undefined;

      throw new Error(createNetworkErrorMessage(reason));
    }

    if (response.status === 0) {
      throw new Error(createNetworkErrorMessage(response.networkError));
    }

    if (!response.ok) {
      throw createGeneralApiError(response.status, response.responseBody);
    }

    return response.responseBody as ResponseBody;
  }
}

function createApiErrorMessage(status: number, responseBody: unknown): string {
  const apiError = getApiErrorResponse(responseBody);

  if (apiError) {
    const details = [apiError.errorCode, apiError.errorMessage].filter(Boolean).join(': ');

    return details ? `General API Enrollment fehlgeschlagen (${status}): ${details}` : `General API Enrollment fehlgeschlagen (${status}).`;
  }

  if (typeof responseBody === 'string' && responseBody.trim()) {
    return `General API Enrollment fehlgeschlagen (${status}): ${responseBody}`;
  }

  if (typeof responseBody === 'object' && responseBody !== null) {
    return `General API Enrollment fehlgeschlagen (${status}): ${JSON.stringify(responseBody)}`;
  }

  return `General API Enrollment fehlgeschlagen (${status}).`;
}

function createGeneralApiError(status: number, responseBody: unknown): GeneralApiError {
  const apiError = getApiErrorResponse(responseBody);

  return new GeneralApiError(
    createApiErrorMessage(status, responseBody),
    status,
    responseBody,
    apiError?.errorCode,
    apiError?.errorMessage,
  );
}

function createNetworkErrorMessage(reason?: string): string {
  const details = reason?.trim() ? ` Detail: ${reason.trim()}` : '';
  const hint = reason?.includes('ERR_SSL_CLIENT_AUTH_CERT_NEEDED')
    ? ' Hinweis: Der Node.js-HTTPS-Request meldet fuer diesen Verbindungsversuch, dass im TLS-Handshake ein Client-Zertifikat benoetigt wird. Wenn derselbe Endpoint in anderen Tests ohne Client-Zertifikat erreichbar ist, vergleiche Host, Pfad, Proxy, DNS/SNI, VPN und Trust-/Zertifikatseinstellungen der Electron-App mit dem erfolgreichen Testclient.'
    : '';

  return `General API Netzwerkfehler: Request konnte nicht ausgefuehrt werden. Pruefe Service Host, Netzwerk, TLS/Zertifikat und Erreichbarkeit.${hint}${details}`;
}

function createMissingSafApiBridgeMessage(): string {
  return 'General API Netzwerkfehler: Electron SAF API Bridge ist nicht verfuegbar. Der Enrollment-POST muss ueber den Electron Main Process laufen, weil der Service Host keinen CORS-Preflight fuer Browser-Requests beantwortet. Starte die App mit Electron und pruefe, ob src/preload.ts geladen wird.';
}

function getApiErrorResponse(value: unknown): { errorCode?: string; errorMessage?: string } | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const errorResponse = value as { errorCode?: unknown; errorMessage?: unknown };

  if (!('errorCode' in value) && !('errorMessage' in value)) {
    return undefined;
  }

  return {
    errorCode: typeof errorResponse.errorCode === 'string' ? errorResponse.errorCode : undefined,
    errorMessage: typeof errorResponse.errorMessage === 'string' ? errorResponse.errorMessage : undefined,
  };
}
