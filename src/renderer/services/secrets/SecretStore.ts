import type { SecretRef } from '../../models';

export type SecretType =
  | 'tech-user-password'
  | 'mtls-certificate'
  | 'oauth-client-id'
  | 'oauth-client-secret';

export const LOCAL_SECRET_TYPES: SecretType[] = [
  'tech-user-password',
  'mtls-certificate',
  'oauth-client-id',
  'oauth-client-secret',
];

export interface SecretStore {
  setSecret(profileId: string, secretType: SecretType, value: string): SecretRef;
  getSecret(profileId: string, secretType: SecretType): string | undefined;
  deleteSecret(profileId: string, secretType: SecretType): void;
}

const SECRET_STORAGE_KEY = 'ecohub-saf-client.local-secrets';
const LEGACY_MOCK_SECRET_STORAGE_KEY = 'ecohub-saf-client.local-mock-secrets';

export class LocalSecretStore implements SecretStore {
  private secrets: Record<string, string>;

  constructor() {
    this.secrets = this.readSecrets();
    this.deleteLegacyMockSecrets();
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
      id: `ref://local-secrets/${profileId}/${secretType}`,
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

  private deleteLegacyMockSecrets(): void {
    if (!this.canUseLocalStorage()) {
      return;
    }

    window.localStorage.removeItem(LEGACY_MOCK_SECRET_STORAGE_KEY);
  }

  private canUseLocalStorage(): boolean {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }
}

export const localSecretStore = new LocalSecretStore();
