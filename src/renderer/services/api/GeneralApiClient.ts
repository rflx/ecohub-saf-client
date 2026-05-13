import type { SafEnvironment, TechUserAuthConfig } from '../../models';

export class GeneralApiClient {
  constructor(
    private readonly environment: SafEnvironment,
    private readonly techUserAuth?: TechUserAuthConfig,
  ) {}

  getConnectionSummary() {
    return {
      baseUrl: this.environment.baseUrl,
      timeoutMs: this.environment.timeoutMs,
      authMode: this.techUserAuth?.preferredMethod,
      techUserIdpNumber: this.techUserAuth?.techUserIdpNumber,
      connected: false,
    };
  }
}
