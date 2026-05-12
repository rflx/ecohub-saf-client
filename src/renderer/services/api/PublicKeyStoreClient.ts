import type { PublicKeyStoreApiConfig, TechUserCredentialsRef } from '../../models';

export class PublicKeyStoreClient {
  constructor(
    private readonly config: PublicKeyStoreApiConfig,
    private readonly credentialsRef?: TechUserCredentialsRef,
  ) {}

  getConnectionSummary() {
    return {
      baseUrl: this.config.baseUrl,
      timeoutMs: this.config.timeoutMs,
      credentialsRef: this.credentialsRef?.id ?? this.config.credentialsRef,
      licenceKeyConfigured: Boolean(this.config.licenceKey),
      connected: false,
    };
  }
}
