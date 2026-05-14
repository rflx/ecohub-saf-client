import type { operations } from '../generated/general-api-2.0.0';
import { SafApiHttpService } from './SafApiHttpService';

export type EnrolTechUserRequest =
  operations['EnrolTechUser']['requestBody']['content']['application/json'];

export type EnrolTechUserResponse =
  operations['EnrolTechUser']['responses']['200']['content']['application/json'];

export type GeneralApiRequestOptions = {
  url: string;
  timeoutMs: number;
};

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

export class GeneralApiService extends SafApiHttpService {
  async enrolTechUser(
    request: EnrolTechUserRequest,
    options: GeneralApiRequestOptions,
  ): Promise<EnrolTechUserResponse> {
    return this.postJson<EnrolTechUserResponse>(options.url, request, options.timeoutMs);
  }

  protected createApiError(status: number, responseBody: unknown): Error {
    return createGeneralApiError(status, responseBody);
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
