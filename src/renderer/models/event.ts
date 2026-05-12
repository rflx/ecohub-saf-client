export type EventDirection = 'incoming' | 'outgoing';

export type JsonEvent = {
  id: string;
  topic: string;
  direction: EventDirection;
  payload: Record<string, unknown>;
  receivedAt: string;
  profileId?: string;
};
