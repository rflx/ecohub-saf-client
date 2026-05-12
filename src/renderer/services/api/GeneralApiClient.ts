import type { SafApiConfig, TechUserAuthConfig } from '../../models';

export class GeneralApiClient {
  constructor(
    private readonly config: SafApiConfig,
    private readonly techUserAuth?: TechUserAuthConfig,
  ) {}

  getConnectionSummary() {
    return {
      baseUrl: this.config.generalApiBaseUrl,
      timeoutMs: this.config.timeoutMs,
      authMode: this.techUserAuth?.preferredMethod,
      techUserIdpNumber: this.techUserAuth?.techUserIdpNumber,
      connected: false,
    };
  }
}
