import type { LogEntry } from '../models';

export const mockLogs: LogEntry[] = [
  {
    id: 'log-001',
    level: 'info',
    message: 'Mock profile loaded: Service Consumer IAT',
    timestamp: '2026-05-12T08:10:00.000Z',
    context: {
      profileId: 'service-consumer-iat',
    },
  },
  {
    id: 'log-002',
    level: 'debug',
    message: 'Mock topic list initialized without Kafka connection',
    timestamp: '2026-05-12T08:12:00.000Z',
    context: {
      topicCount: 2,
    },
  },
  {
    id: 'log-003',
    level: 'warn',
    message: 'Kafka integration is intentionally disabled in the project baseline',
    timestamp: '2026-05-12T08:14:00.000Z',
  },
];
