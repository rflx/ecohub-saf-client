export type TopicSubscriptionStatus = 'idle' | 'subscribing' | 'subscribed' | 'error';

export type KafkaTopicSubscription = {
  id: string;
  topicName: string;
  consumerGroup?: string;
  status: TopicSubscriptionStatus;
  lastEventAt?: string;
};
