import type { TechUserEnrollmentRequest, TechUserEnrollmentResponse } from '../../models';

const MOCK_SCOPE = 'https://graph.microsoft.com/.default' as const;

export interface TechUserEnrollmentService {
  enrollTechUser(request: TechUserEnrollmentRequest): Promise<TechUserEnrollmentResponse>;
}

export class MockTechUserEnrollmentService implements TechUserEnrollmentService {
  async enrollTechUser(request: TechUserEnrollmentRequest): Promise<TechUserEnrollmentResponse> {
    const enrolledAt = new Date().toISOString();
    const randomId = createRandomId();

    return Promise.resolve({
      techUserIdpNumber: request.techUserIdpNumber.trim(),
      enrolledAt,
      mtlsCertificate: {
        certificateBase64: createMockCertificate(request.profileId, randomId, enrolledAt),
        expiresAt: addDays(enrolledAt, 90),
        fingerprint: `mock-fingerprint-${randomId}`,
      },
      oauth2Credentials: {
        clientId: `mock-client-${request.profileId}-${randomId}`,
        clientSecret: createRandomSecret(),
        openIdConfigurationEndpoint:
          'https://login.example.invalid/mock-tenant/v2.0/.well-known/openid-configuration',
        tokenEndpoint: 'https://login.example.invalid/mock-tenant/oauth2/v2.0/token',
        scope: MOCK_SCOPE,
      },
    });
  }
}

function createMockCertificate(profileId: string, randomId: string, enrolledAt: string): string {
  const payload = JSON.stringify({
    kind: 'mock-mtls-certificate',
    profileId,
    randomId,
    enrolledAt,
  });

  return encodeBase64(payload);
}

function createRandomSecret(): string {
  return `mock-secret-${createRandomId()}-${createRandomId()}`;
}

function createRandomId(): string {
  const webCrypto = typeof crypto !== 'undefined'
    ? (crypto as Crypto & { randomUUID?: () => string })
    : undefined;

  if (webCrypto?.randomUUID) {
    return webCrypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function encodeBase64(value: string): string {
  if (typeof btoa === 'function') {
    return btoa(value);
  }

  return value;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const techUserEnrollmentService = new MockTechUserEnrollmentService();
