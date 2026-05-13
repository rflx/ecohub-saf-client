import type { KafkaConfig, SafProfile } from '../../models';

export const DEFAULT_INPUT_TOPIC = 'eh.saf.in.v1';
export const DEFAULT_OUTPUT_TOPIC_PATTERN = 'eh.saf.{ecoHubId}.{standard}.out.v1';

export type ResolvedSafTopics = {
  inputTopic: string;
  outputTopic: string;
};

export function resolveSafTopics(profile: SafProfile, kafkaConfig: KafkaConfig): ResolvedSafTopics {
  return {
    inputTopic: kafkaConfig.topics.inputTopic ?? DEFAULT_INPUT_TOPIC,
    outputTopic:
      kafkaConfig.topics.outputTopicOverride ??
      resolveOutputTopicPattern(
        kafkaConfig.topics.outputTopicPattern ?? DEFAULT_OUTPUT_TOPIC_PATTERN,
        profile,
      ),
  };
}

function resolveOutputTopicPattern(pattern: string, profile: SafProfile): string {
  return pattern
    .replace('{ecoHubId}', sanitizeTopicSegment(profile.receiver.ecoHubId || profile.ecoHubId))
    .replace('{standard}', sanitizeTopicSegment(profile.receiver.standard || profile.standard));
}

function sanitizeTopicSegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-');
}
