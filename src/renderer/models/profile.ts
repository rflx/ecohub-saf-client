export type ServiceProfileType = 'consumer' | 'provider';

export type ConnectionStatus = 'offline' | 'connecting' | 'online' | 'error';

export type ProfileEnvironment = 'dev' | 'iat' | 'test' | 'prod';

export type GeneralApiConfig = {
  baseUrl: string;
  timeoutMs: number;
  credentialsRef?: string;
  licenceKey?: string;
};

export type PublicKeyStoreApiConfig = {
  baseUrl: string;
  timeoutMs: number;
  credentialsRef?: string;
  licenceKey?: string;
};

export type Receiver = {
  ecoHubId: string;
  standard: string;
  displayName: string;
};

export type TechUserCredentialsRef = {
  id: string;
  label: string;
  description?: string;
};

export type SafProfile = {
  id: string;
  name: string;
  type: ServiceProfileType;
  environment: ProfileEnvironment;
  description?: string;
  connectionStatus: ConnectionStatus;
  ecoHubId: string;
  standard: string;
  receiver: Receiver;
  kafkaConfigId: string;
  generalApiConfig: GeneralApiConfig;
  publicKeyStoreApiConfig: PublicKeyStoreApiConfig;
  credentialsRef?: TechUserCredentialsRef;
  createdAt: string;
  updatedAt: string;
};

export type Profile = SafProfile;
export type ServiceProfile = SafProfile;
