export type ServiceProfileType = 'consumer' | 'provider';

export type ConnectionStatus = 'offline' | 'connecting' | 'online' | 'error';

export type ProfileEnvironment = 'prod' | 'iat' | 'test' | 'dev';

export type ApiId = string;

export type ApiVersion = string;

export type ApiSupportStatus = 'supported' | 'experimental' | 'deprecated';

export type ActiveApiVersionMapping = Record<ApiId, ApiVersion | undefined>;

export type ApiOperationDefinition = {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  operationId: string;
};

export type ApiSpecDefinition = {
  apiId: ApiId;
  version: ApiVersion;
  name: string;
  basePath: string;
  localSpecPath: string;
  generatedTypesPath: string;
  supportStatus: ApiSupportStatus;
  operations: ApiOperationDefinition[];
};

export type ApiManagementConfig = {
  apis: {
    id: ApiId;
    name: string;
    versions: ApiSpecDefinition[];
  }[];
};

export type TechUserAuthMethod = 'mtls' | 'oauth2';

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
  techUserPasswordRef?: SecretRef;
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
  environmentId: ProfileEnvironment;
  techUserIdpNumber: string;
  password: string;
  identificationCode: string;
  licenceKey: string;
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

export type SafEnvironment = {
  id: ProfileEnvironment;
  name: string;
  baseUrl: string;
  activeApiVersions: ActiveApiVersionMapping;
  timeoutMs: number;
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
  keyReferences: SafKeyReferences;
  createdAt: string;
  updatedAt: string;
};

export type Profile = SafProfile;
export type ServiceProfile = SafProfile;
