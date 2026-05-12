import type { KafkaConfig } from '../../models';

export class KafkaClient {
  constructor(private readonly config: KafkaConfig) {}

  getConnectionSummary() {
    return {
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      securityProtocol: this.config.securityProtocol,
      credentialsRef: this.config.credentialsRef,
      connected: false,
    };
  }
}
