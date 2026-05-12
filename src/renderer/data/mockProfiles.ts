import { DEFAULT_INPUT_TOPIC, DEFAULT_OUTPUT_TOPIC_PATTERN, resolveSafTopics } from '../domain/saf';
import type { KafkaConfig, KafkaTopicSubscription, ProfileEnvironment, SafApiConfig, SafProfile } from '../models';

export const mockApiConfigs: Record<ProfileEnvironment, SafApiConfig> = {
  prod: {
    generalApiBaseUrl: 'https://prod-api.example.invalid/general-api',
    publicKeyStoreApiBaseUrl: 'https://prod-api.example.invalid/public-key-store-api',
    timeoutMs: 10000,
  },
  iat: {
    generalApiBaseUrl: 'https://iat-api.example.invalid/general-api',
    publicKeyStoreApiBaseUrl: 'https://iat-api.example.invalid/public-key-store-api',
    timeoutMs: 8000,
  },
  test: {
    generalApiBaseUrl: 'https://test-api.example.invalid/general-api',
    publicKeyStoreApiBaseUrl: 'https://test-api.example.invalid/public-key-store-api',
    timeoutMs: 8000,
  },
  dev: {
    generalApiBaseUrl: 'http://localhost:8080/general-api',
    publicKeyStoreApiBaseUrl: 'http://localhost:8080/public-key-store-api',
    timeoutMs: 5000,
  },
};

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
    credentialsRef: 'ref://tech-users/service-consumer-dev',
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
    credentialsRef: 'ref://tech-users/service-provider-dev',
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
    licenceKey: 'mock-licence-key-consumer-dev',
    standard: 'saf',
    receiver: {
      ecoHubId: 'provider-dev',
      standard: 'saf',
      displayName: 'Service Provider DEV',
    },
    kafkaConfigId: 'service-consumer-dev',
    techUserAuth: {
      availableMethods: ['oauth2'],
      preferredMethod: 'oauth2',
      techUserIdpNumber: 'mock-tech-user-consumer-dev',
      oauthClientIdRef: {
        id: 'ref://local-mock-secrets/service-consumer-dev/oauth-client-id',
        type: 'oauth-client-id',
        profileId: 'service-consumer-dev',
      },
      oauthClientSecretRef: {
        id: 'ref://local-mock-secrets/service-consumer-dev/oauth-client-secret',
        type: 'oauth-client-secret',
        profileId: 'service-consumer-dev',
      },
      openIdConfigurationEndpoint:
        'https://login.example.invalid/mock-tenant/v2.0/.well-known/openid-configuration',
      tokenEndpoint: 'http://localhost:8080/oauth2/token',
      enrollmentStatus: 'enrolled',
      lastEnrollmentAt: '2026-05-12T08:00:00.000Z',
    },
    keyReferences: {
      encryption: {
        usage: 'encryption',
        keyPairRef: 'ref://keys/service-consumer-dev/encryption',
        publicKeyRef: 'ref://keys/service-consumer-dev/encryption/public',
        privateKeyRef: 'ref://keys/service-consumer-dev/encryption/private',
        publicKeyId: 'mock-consumer-dev-encryption-public-key',
        description: 'Referenzen auf lokales DEV Encryption Keypair, keine Schluesselwerte.',
      },
      signing: {
        usage: 'signing',
        keyPairRef: 'ref://keys/service-consumer-dev/signing',
        publicKeyRef: 'ref://keys/service-consumer-dev/signing/public',
        privateKeyRef: 'ref://keys/service-consumer-dev/signing/private',
        publicKeyId: 'mock-consumer-dev-signing-public-key',
        description: 'Referenzen auf lokales DEV Signing Keypair, keine Schluesselwerte.',
      },
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
    licenceKey: 'mock-licence-key-provider-dev',
    standard: 'saf',
    receiver: {
      ecoHubId: 'consumer-dev',
      standard: 'saf',
      displayName: 'Service Consumer DEV',
    },
    kafkaConfigId: 'service-provider-dev',
    techUserAuth: {
      availableMethods: ['mtls'],
      preferredMethod: 'mtls',
      techUserIdpNumber: 'mock-tech-user-provider-dev',
      mtlsCertificateRef: {
        id: 'ref://local-mock-secrets/service-provider-dev/mtls-certificate',
        type: 'mtls-certificate',
        profileId: 'service-provider-dev',
      },
      enrollmentStatus: 'enrolled',
      lastEnrollmentAt: '2026-05-12T08:05:00.000Z',
    },
    keyReferences: {
      encryption: {
        usage: 'encryption',
        keyPairRef: 'ref://keys/service-provider-dev/encryption',
        publicKeyRef: 'ref://keys/service-provider-dev/encryption/public',
        privateKeyRef: 'ref://keys/service-provider-dev/encryption/private',
        publicKeyId: 'mock-provider-dev-encryption-public-key',
        description: 'Referenzen auf lokales DEV Encryption Keypair, keine Schluesselwerte.',
      },
      signing: {
        usage: 'signing',
        keyPairRef: 'ref://keys/service-provider-dev/signing',
        publicKeyRef: 'ref://keys/service-provider-dev/signing/public',
        privateKeyRef: 'ref://keys/service-provider-dev/signing/private',
        publicKeyId: 'mock-provider-dev-signing-public-key',
        description: 'Referenzen auf lokales DEV Signing Keypair, keine Schluesselwerte.',
      },
    },
    createdAt: '2026-05-12T08:05:00.000Z',
    updatedAt: '2026-05-12T08:05:00.000Z',
  },
];

const consumerTopics = resolveSafTopics(mockProfiles[0], mockKafkaConfigs[mockProfiles[0].kafkaConfigId]);
const providerTopics = resolveSafTopics(mockProfiles[1], mockKafkaConfigs[mockProfiles[1].kafkaConfigId]);

export const mockTopicConfigs: KafkaTopicSubscription[] = [
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
