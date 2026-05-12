import type { SafApiConfig, TechUserAuthConfig } from '../../models';

export class PublicKeyStoreClient {
  constructor(
    private readonly config: SafApiConfig,
    private readonly techUserAuth?: TechUserAuthConfig,
  ) {}

  getConnectionSummary() {
    return {
      baseUrl: this.config.publicKeyStoreApiBaseUrl,
      timeoutMs: this.config.timeoutMs,
      authMode: this.techUserAuth?.preferredMethod,
      techUserIdpNumber: this.techUserAuth?.techUserIdpNumber,
      connected: false,
    };
  }
}
