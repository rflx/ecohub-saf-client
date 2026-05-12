import type { GeneralApiConfig, TechUserCredentialsRef } from '../../models';

export class GeneralApiClient {
  constructor(
    private readonly config: GeneralApiConfig,
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
