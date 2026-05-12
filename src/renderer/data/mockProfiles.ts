import { DEFAULT_INPUT_TOPIC, DEFAULT_OUTPUT_TOPIC_PATTERN, resolveSafTopics } from '../domain/saf';
import type { KafkaConfig, SafProfile, TopicConfig } from '../models';

export const mockKafkaConfigs: Record<string, KafkaConfig> = {
  'service-consumer-dev': {
    clientId: 'ecohub-saf-client-consumer-dev',
    brokers: ['localhost:9092'],
    securityProtocol: 'PLAINTEXT',
    sslEnabled: false,
    topics: {
      inputTopic: DEFAULT_INPUT_TOPIC,
      outputTopicPattern: DEFAULT_OUTPUT_TOPIC_PATTERN,
    },
    consumerGroupId: 'ecohub-saf-client-consumer-dev',
    credentialsRef: 'local-dev-consumer-tech-user',
  },
  'service-provider-dev': {
    clientId: 'ecohub-saf-client-provider-dev',
    brokers: ['localhost:9092'],
    securityProtocol: 'PLAINTEXT',
    sslEnabled: false,
    topics: {
      inputTopic: DEFAULT_INPUT_TOPIC,
      outputTopicPattern: DEFAULT_OUTPUT_TOPIC_PATTERN,
    },
    consumerGroupId: 'ecohub-saf-client-provider-dev',
    credentialsRef: 'local-dev-provider-tech-user',
  },
};

export const mockProfiles: SafProfile[] = [
  {
    id: 'service-consumer-dev',
    name: 'Service Consumer DEV',
    type: 'consumer',
    environment: 'dev',
    description: 'Lokales Beispielprofil fuer Consumer-Tests ohne echte Kafka- oder API-Verbindung.',
    connectionStatus: 'offline',
    ecoHubId: 'consumer-dev',
    standard: 'saf',
    receiver: {
      ecoHubId: 'provider-dev',
      standard: 'saf',
      displayName: 'Service Provider DEV',
    },
    kafkaConfigId: 'service-consumer-dev',
    generalApiConfig: {
      baseUrl: 'http://localhost:8080/general-api',
      timeoutMs: 5000,
      credentialsRef: 'local-dev-consumer-tech-user',
      licenceKey: 'mock-licence-key-consumer-dev',
    },
    publicKeyStoreApiConfig: {
      baseUrl: 'http://localhost:8080/public-key-store-api',
      timeoutMs: 5000,
      credentialsRef: 'local-dev-consumer-tech-user',
      licenceKey: 'mock-licence-key-consumer-dev',
    },
    credentialsRef: {
      id: 'local-dev-consumer-tech-user',
      label: 'Local DEV Consumer Tech User',
      description: 'Nur Referenz auf lokal bereitzustellende Zugangsdaten, keine Secrets.',
    },
    createdAt: '2026-05-12T08:00:00.000Z',
    updatedAt: '2026-05-12T08:00:00.000Z',
  },
  {
    id: 'service-provider-dev',
    name: 'Service Provider DEV',
    type: 'provider',
    environment: 'dev',
    description: 'Lokales Beispielprofil fuer Provider-Tests ohne echte Kafka- oder API-Verbindung.',
    connectionStatus: 'offline',
    ecoHubId: 'provider-dev',
    standard: 'saf',
    receiver: {
      ecoHubId: 'consumer-dev',
      standard: 'saf',
      displayName: 'Service Consumer DEV',
    },
    kafkaConfigId: 'service-provider-dev',
    generalApiConfig: {
      baseUrl: 'http://localhost:8081/general-api',
      timeoutMs: 5000,
      credentialsRef: 'local-dev-provider-tech-user',
      licenceKey: 'mock-licence-key-provider-dev',
    },
    publicKeyStoreApiConfig: {
      baseUrl: 'http://localhost:8081/public-key-store-api',
      timeoutMs: 5000,
      credentialsRef: 'local-dev-provider-tech-user',
      licenceKey: 'mock-licence-key-provider-dev',
    },
    credentialsRef: {
      id: 'local-dev-provider-tech-user',
      label: 'Local DEV Provider Tech User',
      description: 'Nur Referenz auf lokal bereitzustellende Zugangsdaten, keine Secrets.',
    },
    createdAt: '2026-05-12T08:05:00.000Z',
    updatedAt: '2026-05-12T08:05:00.000Z',
  },
];

const consumerTopics = resolveSafTopics(mockProfiles[0], mockKafkaConfigs[mockProfiles[0].kafkaConfigId]);
const providerTopics = resolveSafTopics(mockProfiles[1], mockKafkaConfigs[mockProfiles[1].kafkaConfigId]);

export const mockTopicConfigs: TopicConfig[] = [
  {
    id: 'topic-consumer-input',
    topicName: consumerTopics.inputTopic,
    consumerGroup: mockKafkaConfigs['service-consumer-dev'].consumerGroupId,
    status: 'idle',
    direction: 'consume',
    description: 'Default Input Topic fuer eingehende SAF Events.',
    lastEventAt: '2026-05-12T08:30:00.000Z',
  },
  {
    id: 'topic-provider-output',
    topicName: providerTopics.outputTopic,
    status: 'idle',
    direction: 'produce',
    description: 'Konfigurierbares Output Topic aus dem SAF Topic Pattern.',
    lastEventAt: '2026-05-12T08:36:00.000Z',
  },
];
