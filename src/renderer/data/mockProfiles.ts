import type { KafkaConfig, Profile, TopicConfig } from '../models';

export const mockKafkaConfigs: Record<string, KafkaConfig> = {
  'service-consumer-iat': {
    clientId: 'ecohub-saf-client-consumer-iat',
    brokers: ['localhost:9092'],
    securityProtocol: 'PLAINTEXT',
    sslEnabled: false,
  },
  'service-provider-iat': {
    clientId: 'ecohub-saf-client-provider-iat',
    brokers: ['localhost:9092'],
    securityProtocol: 'PLAINTEXT',
    sslEnabled: false,
  },
};

export const mockProfiles: Profile[] = [
  {
    id: 'service-consumer-iat',
    name: 'Service Consumer IAT',
    type: 'consumer',
    environment: 'iat',
    description: 'Lokales Beispielprofil fuer Consumer-Tests ohne echte Kafka-Verbindung.',
    connectionStatus: 'offline',
    createdAt: '2026-05-12T08:00:00.000Z',
    updatedAt: '2026-05-12T08:00:00.000Z',
  },
  {
    id: 'service-provider-iat',
    name: 'Service Provider IAT',
    type: 'provider',
    environment: 'iat',
    description: 'Lokales Beispielprofil fuer Provider-Tests ohne echte Kafka-Verbindung.',
    connectionStatus: 'offline',
    createdAt: '2026-05-12T08:05:00.000Z',
    updatedAt: '2026-05-12T08:05:00.000Z',
  },
];

export const mockTopicConfigs: TopicConfig[] = [
  {
    id: 'topic-consumer-orders',
    topicName: 'ecohub.saf.iat.orders',
    consumerGroup: 'ecohub-saf-client-iat',
    status: 'idle',
    direction: 'consume',
    description: 'Mock Topic fuer eingehende SAF Order Events.',
    lastEventAt: '2026-05-12T08:30:00.000Z',
  },
  {
    id: 'topic-provider-status',
    topicName: 'ecohub.saf.iat.status',
    status: 'idle',
    direction: 'produce',
    description: 'Mock Topic fuer ausgehende SAF Status Events.',
    lastEventAt: '2026-05-12T08:36:00.000Z',
  },
];
