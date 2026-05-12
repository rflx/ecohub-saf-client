export type TopicSubscriptionStatus = 'idle' | 'subscribing' | 'subscribed' | 'error';

export type KafkaSecurityProtocol = 'PLAINTEXT' | 'SSL' | 'SASL_SSL';

export type TopicConfig = {
  inputTopic?: string;
  outputTopicPattern?: string;
  outputTopicOverride?: string;
};

export type KafkaConfig = {
  clientId: string;
  brokers: string[];
  securityProtocol: KafkaSecurityProtocol;
  sslEnabled: boolean;
  saslMechanism?: 'plain' | 'scram-sha-256' | 'scram-sha-512';
  topics: TopicConfig;
  consumerGroupId?: string;
  credentialsRef?: string;
};

export type KafkaTopicSubscription = {
  id: string;
  topicName: string;
  consumerGroup?: string;
  status: TopicSubscriptionStatus;
  direction: 'consume' | 'produce';
  description?: string;
  lastEventAt?: string;
};
