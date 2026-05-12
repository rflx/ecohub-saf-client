import type { SecretRef } from '../../models';

export type SecretType =
  | 'mtls-certificate'
  | 'oauth-client-id'
  | 'oauth-client-secret'
  | 'oauth-bearer-token';

export interface SecretStore {
  setSecret(profileId: string, secretType: SecretType, value: string): SecretRef;
  getSecret(profileId: string, secretType: SecretType): string | undefined;
  deleteSecret(profileId: string, secretType: SecretType): void;
}

const SECRET_STORAGE_KEY = 'ecohub-saf-client.local-mock-secrets';

export class LocalMockSecretStore implements SecretStore {
  private secrets: Record<string, string>;

  constructor() {
    this.secrets = this.readSecrets();
  }

  setSecret(profileId: string, secretType: SecretType, value: string): SecretRef {
    const ref = this.createRef(profileId, secretType);

    this.secrets[ref.id] = value;
    this.persistSecrets();

    return ref;
  }

  getSecret(profileId: string, secretType: SecretType): string | undefined {
    return this.secrets[this.createRef(profileId, secretType).id];
  }

  deleteSecret(profileId: string, secretType: SecretType): void {
    delete this.secrets[this.createRef(profileId, secretType).id];
    this.persistSecrets();
  }

  private createRef(profileId: string, secretType: SecretType): SecretRef {
    return {
      id: `ref://local-mock-secrets/${profileId}/${secretType}`,
      type: secretType,
      profileId,
    };
  }

  private readSecrets(): Record<string, string> {
    if (!this.canUseLocalStorage()) {
      return {};
    }

    try {
      const storedValue = window.localStorage.getItem(SECRET_STORAGE_KEY);
      return storedValue ? (JSON.parse(storedValue) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }

  private persistSecrets(): void {
    if (!this.canUseLocalStorage()) {
      return;
    }

    window.localStorage.setItem(SECRET_STORAGE_KEY, JSON.stringify(this.secrets));
  }

  private canUseLocalStorage(): boolean {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }
}

export const localMockSecretStore = new LocalMockSecretStore();
