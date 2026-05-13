import type { TechUserEnrollmentRequest, TechUserEnrollmentResponse } from '../../models';
import { GeneralApiService, type EnrolTechUserRequest } from '../../../saf/services';
import packageJson from '../../../../package.json';
import { ApiRuntimeResolver } from '../../domain/saf';
import { profileStorageService } from '../profileStorage';

export interface TechUserEnrollmentService {
  enrollTechUser(request: TechUserEnrollmentRequest): Promise<TechUserEnrollmentResponse>;
}

export class GeneralApiTechUserEnrollmentService implements TechUserEnrollmentService {
  constructor(private readonly generalApiService = new GeneralApiService()) {}

  async enrollTechUser(request: TechUserEnrollmentRequest): Promise<TechUserEnrollmentResponse> {
    validateEnrollmentRequest(request);

    const snapshot = profileStorageService.getSnapshot();
    const environment = snapshot.safEnvironments[request.environmentId];

    if (!environment) {
      throw new Error(`Environment nicht gefunden: ${request.environmentId}`);
    }

    if (!environment.baseUrl.trim()) {
      throw new Error(`General API Base URL fuer ${environment.name} ist nicht konfiguriert.`);
    }

    const resolver = new ApiRuntimeResolver(snapshot.safEnvironments, snapshot.profiles);
    const resolution = resolver.resolve({
      environmentId: request.environmentId,
      apiId: 'general-api',
      operationId: 'techUserEnrolment',
    });
    const enrolmentRequest: EnrolTechUserRequest = {
      idpUserId: request.techUserIdpNumber.trim(),
      password: request.password,
      iak: request.identificationCode.trim(),
      licenceKey: request.licenceKey.trim(),
      requestId: createRequestId(),
      requestTime: new Date().toISOString(),
      userAgent: {
        name: packageJson.productName ?? 'EcoHub SAF Client',
        version: packageJson.version ?? '1.0.0',
      },
    };
    const response = await this.generalApiService.enrolTechUser(enrolmentRequest, {
      url: resolution.resolvedUrl,
      timeoutMs: environment.timeoutMs,
    });

    validateEnrollmentResponse(response);

    return {
      techUserIdpNumber: request.techUserIdpNumber.trim(),
      mtlsCertificate: response.techUserCert
        ? {
            certificateBase64: response.techUserCert,
          }
        : undefined,
      oauth2Credentials: response.oAuth2
        ? {
            clientId: response.oAuth2.clientId,
            clientSecret: response.oAuth2.clientSecret,
            openIdConfigurationEndpoint: response.oAuth2.openIdConfigurationEndpoint,
            scope: 'https://graph.microsoft.com/.default',
          }
        : undefined,
      enrolledAt: new Date().toISOString(),
    };
  }
}

export const techUserEnrollmentService = new GeneralApiTechUserEnrollmentService();

function validateEnrollmentRequest(request: TechUserEnrollmentRequest): void {
  if (!request.profileId.trim()) {
    throw new Error('Profil-ID ist fuer Tech User Enrollment erforderlich.');
  }

  if (!request.techUserIdpNumber.trim()) {
    throw new Error('TechUser IDP Number ist erforderlich.');
  }

  if (!request.password.trim()) {
    throw new Error('Password ist erforderlich.');
  }

  if (!request.identificationCode.trim()) {
    throw new Error('Identification Code ist erforderlich.');
  }

  if (!request.licenceKey.trim()) {
    throw new Error('Licence Key ist fuer Tech User Enrollment erforderlich.');
  }
}

function createRequestId(): string {
  const browserCrypto = crypto as Crypto & { randomUUID?: () => string };

  if (typeof browserCrypto.randomUUID === 'function') {
    return browserCrypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomValue : (randomValue & 0x3) | 0x8;

    return value.toString(16);
  });
}

function validateEnrollmentResponse(response: Awaited<ReturnType<GeneralApiService['enrolTechUser']>>): void {
  if (!response.techUserCert) {
    throw new Error('General API Enrollment Response enthaelt kein TechUser-Zertifikat.');
  }

  if (
    !response.oAuth2?.clientId ||
    !response.oAuth2.clientSecret ||
    !response.oAuth2.openIdConfigurationEndpoint
  ) {
    throw new Error('General API Enrollment Response enthaelt keine vollstaendigen OAuth2 Credentials.');
  }
}
