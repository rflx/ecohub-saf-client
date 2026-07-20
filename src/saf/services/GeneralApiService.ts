import type { operations as GeneralApiOperationsV120 } from '../generated/general-api-1.2.0';
import type { operations as GeneralApiOperationsV200 } from '../generated/general-api-2.0.0';
import { SafApiHttpService } from './SafApiHttpService';

export type GeneralApiVersion = '1.2.0' | '2.0.0';

type EnrolTechUserRequestV120 =
  GeneralApiOperationsV120['EnrolTechUser']['requestBody']['content']['application/json'];
type EnrolTechUserResponseV120 =
  GeneralApiOperationsV120['EnrolTechUser']['responses']['200']['content']['application/json'];

type EnrolTechUserRequestV200 =
  GeneralApiOperationsV200['EnrolTechUser']['requestBody']['content']['application/json'];
type EnrolTechUserResponseV200 =
  GeneralApiOperationsV200['EnrolTechUser']['responses']['200']['content']['application/json'];

export type EnrolTechUserRequest =
  | EnrolTechUserRequestV120
  | EnrolTechUserRequestV200;

export type EnrolTechUserResponse =
  | EnrolTechUserResponseV120
  | EnrolTechUserResponseV200;

export type GeneralApiRequestOptions = {
  url: string;
  apiVersion: string;
  timeoutMs: number;
  logContext: {
    profileId?: string;
    profileName?: string;
    environmentId: string;
    apiId: string;
    apiName: string;
    operationId: string;
    operationName: string;
  };
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
    switch (options.apiVersion) {
      case '1.2.0':
        return this.postJson<EnrolTechUserResponseV120>(options.url, request, options.timeoutMs, undefined, {
          ...options.logContext, apiVersion: options.apiVersion,
        });
      case '2.0.0':
        return this.postJson<EnrolTechUserResponseV200>(options.url, request, options.timeoutMs, undefined, {
          ...options.logContext, apiVersion: options.apiVersion,
        });
      default:
        throw new Error(`General API Version ${options.apiVersion} wird fuer Tech User Enrollment nicht unterstuetzt.`);
    }
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
