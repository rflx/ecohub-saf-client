export type ServiceProfileType = 'consumer' | 'provider';

export type ConnectionStatus = 'offline' | 'connecting' | 'online' | 'error';

export type ProfileEnvironment = 'dev' | 'iat' | 'test' | 'prod';

export type Profile = {
  id: string;
  name: string;
  type: ServiceProfileType;
  environment: ProfileEnvironment;
  description?: string;
  connectionStatus: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
};

export type ServiceProfile = Profile;
