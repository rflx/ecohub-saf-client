export type ServiceProfileType = 'consumer' | 'provider';

export type ConnectionStatus = 'offline' | 'connecting' | 'online' | 'error';

export type ServiceProfile = {
  id: string;
  name: string;
  type: ServiceProfileType;
  description?: string;
  connectionStatus: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
};
