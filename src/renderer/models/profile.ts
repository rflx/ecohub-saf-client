export type ServiceProfileType = 'consumer' | 'provider';

export type ConnectionStatus = 'offline' | 'connecting' | 'online' | 'error';

export type ProfileEnvironment = 'prod' | 'iat' | 'test' | 'dev';

export type TechUserAuthMethod = 'mtls' | 'oauth2';

export type AuthMode = TechUserAuthMethod;

export type TechUserEnrollmentStatus = 'not-enrolled' | 'enrolled' | 'failed';

export type KeyUsage = 'encryption' | 'signing';

export type SecretRef = {
  id: string;
  type: string;
  profileId: string;
};

export type TechUserAuthConfig = {
  availableMethods: TechUserAuthMethod[];
  preferredMethod: TechUserAuthMethod;
  techUserIdpNumber: string;
  mtlsCertificateRef?: SecretRef;
  oauthClientIdRef?: SecretRef;
  oauthClientSecretRef?: SecretRef;
  openIdConfigurationEndpoint?: string;
  tokenEndpoint?: string;
  enrollmentStatus: TechUserEnrollmentStatus;
  lastEnrollmentAt?: string;
};

export type TechUserEnrollmentRequest = {
  profileId: string;
  techUserIdpNumber: string;
  password: string;
  identificationCode: string;
};

export type MtlsCertificateInfo = {
  certificateBase64: string;
  expiresAt?: string;
  fingerprint?: string;
};

export type OAuth2ClientCredentials = {
  clientId: string;
  clientSecret: string;
  openIdConfigurationEndpoint: string;
  tokenEndpoint?: string;
  scope: 'https://graph.microsoft.com/.default';
};

export type BearerTokenInfo = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  scope: string;
};

export type TechUserEnrollmentResponse = {
  techUserIdpNumber: string;
  mtlsCertificate?: MtlsCertificateInfo;
  oauth2Credentials?: OAuth2ClientCredentials;
  enrolledAt: string;
};

export type Receiver = {
  ecoHubId: string;
  standard: string;
  displayName: string;
};

export type SafApiConfig = {
  generalApiBaseUrl: string;
  publicKeyStoreApiBaseUrl: string;
  timeoutMs: number;
};

export type SafEnvironmentApiConfig = SafApiConfig & {
  environment: ProfileEnvironment;
};

export type SafKeyReference = {
  usage: KeyUsage;
  keyPairRef: string;
  publicKeyRef: string;
  privateKeyRef: string;
  publicKeyId?: string;
  description?: string;
};

export type SafKeyReferences = {
  encryption: SafKeyReference;
  signing: SafKeyReference;
};

export type SafProfile = {
  id: string;
  name: string;
  type: ServiceProfileType;
  environment: ProfileEnvironment;
  description?: string;
  connectionStatus: ConnectionStatus;
  ecoHubId: string;
  licenceKey?: string;
  standard: string;
  receiver: Receiver;
  kafkaConfigId: string;
  techUserAuth: TechUserAuthConfig;
  apiConfig?: SafApiConfig;
  keyReferences: SafKeyReferences;
  createdAt: string;
  updatedAt: string;
};

export type Profile = SafProfile;
export type ServiceProfile = SafProfile;
