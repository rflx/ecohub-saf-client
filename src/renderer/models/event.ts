export type EventDirection = 'incoming' | 'outgoing';

export type SafEventStatus = 'received' | 'sent' | 'failed';

export type SafEvent = {
  id: string;
  topic: string;
  direction: EventDirection;
  eventType: string;
  correlationId?: string;
  payload: Record<string, unknown>;
  timestamp: string;
  status: SafEventStatus;
  profileId?: string;
};

export type JsonEvent = SafEvent & {
  receivedAt?: string;
};
