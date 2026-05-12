export type TopicSubscriptionStatus = 'idle' | 'subscribing' | 'subscribed' | 'error';

export type KafkaSecurityProtocol = 'PLAINTEXT' | 'SSL' | 'SASL_SSL';

export type KafkaTopicNames = {
  inputTopic?: string;
  outputTopic?: string;
  outputTopicPattern?: string;
};

export type KafkaConfig = {
  clientId: string;
  brokers: string[];
  securityProtocol: KafkaSecurityProtocol;
  sslEnabled: boolean;
  saslMechanism?: 'plain' | 'scram-sha-256' | 'scram-sha-512';
  topics: KafkaTopicNames;
  consumerGroupId?: string;
  credentialsRef?: string;
};

export type TopicConfig = {
  id: string;
  topicName: string;
  consumerGroup?: string;
  status: TopicSubscriptionStatus;
  direction: 'consume' | 'produce';
  description?: string;
  lastEventAt?: string;
};

export type KafkaTopicSubscription = TopicConfig;
