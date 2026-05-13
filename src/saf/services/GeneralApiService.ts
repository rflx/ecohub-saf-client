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
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      const responseBody = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(createApiErrorMessage(response.status, responseBody));
      }

      return responseBody as ResponseBody;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`General API request timed out after ${timeoutMs} ms.`);
      }

      throw error;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText) {
    return undefined;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function createApiErrorMessage(status: number, responseBody: unknown): string {
  if (isApiErrorResponse(responseBody)) {
    const details = [responseBody.errorCode, responseBody.errorMessage].filter(Boolean).join(': ');

    return details ? `General API Enrollment fehlgeschlagen (${status}): ${details}` : `General API Enrollment fehlgeschlagen (${status}).`;
  }

  if (typeof responseBody === 'string' && responseBody.trim()) {
    return `General API Enrollment fehlgeschlagen (${status}): ${responseBody}`;
  }

  return `General API Enrollment fehlgeschlagen (${status}).`;
}

function isApiErrorResponse(value: unknown): value is { errorCode?: string; errorMessage?: string } {
  return typeof value === 'object' && value !== null && ('errorCode' in value || 'errorMessage' in value);
}
