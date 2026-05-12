import { mockApiConfigs, mockKafkaConfigs, mockProfiles } from '../../data';
import type {
  KafkaConfig,
  ProfileEnvironment,
  SafApiConfig,
  SafKeyReferences,
  SafProfile,
  TechUserAuthConfig,
} from '../../models';

const PROFILE_STORAGE_KEY = 'ecohub-saf-client.profile-storage';

export type ProfileStorageSnapshot = {
  profiles: SafProfile[];
  kafkaConfigs: Record<string, KafkaConfig>;
  apiConfigs: Record<ProfileEnvironment, SafApiConfig>;
  activeProfileId: string;
};

export class ProfileStorageService {
  private snapshot: ProfileStorageSnapshot;

  constructor(initialProfiles: SafProfile[] = mockProfiles) {
    this.snapshot = this.readPersistedSnapshot() ?? {
      profiles: initialProfiles,
      kafkaConfigs: mockKafkaConfigs,
      apiConfigs: mockApiConfigs,
      activeProfileId: initialProfiles[0]?.id ?? '',
    };
  }

  getSnapshot(): ProfileStorageSnapshot {
    return {
      ...this.snapshot,
      profiles: [...this.snapshot.profiles],
      kafkaConfigs: { ...this.snapshot.kafkaConfigs },
      apiConfigs: { ...this.snapshot.apiConfigs },
    };
  }

  setActiveProfile(profileId: string): ProfileStorageSnapshot {
    if (!this.snapshot.profiles.some((profile) => profile.id === profileId)) {
      return this.getSnapshot();
    }

    this.snapshot = {
      ...this.snapshot,
      activeProfileId: profileId,
    };
    this.persistSnapshot();

    return this.getSnapshot();
  }

  saveProfile(profile: SafProfile, kafkaConfig: KafkaConfig): ProfileStorageSnapshot {
    const existingProfile = this.snapshot.profiles.find((item) => item.id === profile.id);
    const profiles = existingProfile
      ? this.snapshot.profiles.map((item) => (item.id === profile.id ? profile : item))
      : [...this.snapshot.profiles, profile];

    this.snapshot = {
      profiles,
      kafkaConfigs: {
        ...this.snapshot.kafkaConfigs,
        [profile.kafkaConfigId]: kafkaConfig,
      },
      apiConfigs: this.snapshot.apiConfigs,
      activeProfileId: this.snapshot.activeProfileId || profile.id,
    };
    this.persistSnapshot();

    return this.getSnapshot();
  }

  deleteProfile(profileId: string): ProfileStorageSnapshot {
    const profileToDelete = this.snapshot.profiles.find((profile) => profile.id === profileId);

    if (!profileToDelete) {
      return this.getSnapshot();
    }

    const profiles = this.snapshot.profiles.filter((profile) => profile.id !== profileId);
    const kafkaConfigs = { ...this.snapshot.kafkaConfigs };

    if (!profiles.some((profile) => profile.kafkaConfigId === profileToDelete.kafkaConfigId)) {
      delete kafkaConfigs[profileToDelete.kafkaConfigId];
    }

    this.snapshot = {
      profiles,
      kafkaConfigs,
      apiConfigs: this.snapshot.apiConfigs,
      activeProfileId:
        this.snapshot.activeProfileId === profileId
          ? profiles[0]?.id ?? ''
          : this.snapshot.activeProfileId,
    };
    this.persistSnapshot();

    return this.getSnapshot();
  }

  saveApiConfig(environment: ProfileEnvironment, apiConfig: SafApiConfig): ProfileStorageSnapshot {
    this.snapshot = {
      ...this.snapshot,
      apiConfigs: {
        ...this.snapshot.apiConfigs,
        [environment]: apiConfig,
      },
    };
    this.persistSnapshot();

    return this.getSnapshot();
  }

  private readPersistedSnapshot(): ProfileStorageSnapshot | undefined {
    if (!this.canUseLocalStorage()) {
      return undefined;
    }

    try {
      const storedValue = window.localStorage.getItem(PROFILE_STORAGE_KEY);

      if (!storedValue) {
        return undefined;
      }

      const parsedValue = JSON.parse(storedValue) as ProfileStorageSnapshot;

      if (!Array.isArray(parsedValue.profiles) || typeof parsedValue.kafkaConfigs !== 'object') {
        return undefined;
      }

      return this.normalizeSnapshot(parsedValue);
    } catch {
      return undefined;
    }
  }

  private normalizeSnapshot(snapshot: ProfileStorageSnapshot): ProfileStorageSnapshot {
    const apiConfigs = this.normalizeApiConfigs(snapshot);

    return {
      ...snapshot,
      profiles: snapshot.profiles.map((profile) => this.normalizeProfile(profile)),
      kafkaConfigs: Object.fromEntries(
        Object.entries(snapshot.kafkaConfigs).map(([id, kafkaConfig]) => [
          id,
          this.normalizeKafkaConfig(kafkaConfig),
        ]),
      ),
      apiConfigs,
    };
  }

  private normalizeProfile(profile: SafProfile): SafProfile {
    const legacyProfile = profile as SafProfile & {
      credentialsRef?: { id?: string };
      licenceKey?: string;
      generalApiConfig?: { baseUrl?: string; timeoutMs?: number };
      publicKeyStoreApiConfig?: { baseUrl?: string };
      techUserAuth?: TechUserAuthConfig & {
        authMode?: 'mtls' | 'oauth2';
        techUserRef?: string;
        certificateRef?: string;
        bearerTokenRef?: string;
      };
      keyReferences?: SafKeyReferences;
    };
    const techUserAuth = this.normalizeTechUserAuth(profile.id, legacyProfile.techUserAuth, legacyProfile.credentialsRef?.id);

    return {
      ...profile,
      techUserAuth,
      apiConfig: undefined,
      keyReferences: legacyProfile.keyReferences ?? {
        encryption: {
          usage: 'encryption',
          keyPairRef: `ref://keys/${profile.id}/encryption`,
          publicKeyRef: `ref://keys/${profile.id}/encryption/public`,
          privateKeyRef: `ref://keys/${profile.id}/encryption/private`,
        },
        signing: {
          usage: 'signing',
          keyPairRef: `ref://keys/${profile.id}/signing`,
          publicKeyRef: `ref://keys/${profile.id}/signing/public`,
          privateKeyRef: `ref://keys/${profile.id}/signing/private`,
        },
      },
    };
  }

  private normalizeTechUserAuth(
    profileId: string,
    authConfig?: TechUserAuthConfig & {
      authMode?: 'mtls' | 'oauth2';
      techUserRef?: string;
      certificateRef?: string;
      bearerTokenRef?: string;
    },
    credentialsRef?: string,
  ): TechUserAuthConfig {
    if (authConfig?.availableMethods?.length) {
      return {
        ...authConfig,
        enrollmentStatus: authConfig.enrollmentStatus ?? 'not-enrolled',
      };
    }

    const preferredMethod = authConfig?.authMode ?? 'oauth2';
    const techUserIdpNumber = authConfig?.techUserRef ?? credentialsRef ?? '';

    return {
      availableMethods: [preferredMethod],
      preferredMethod,
      techUserIdpNumber,
      mtlsCertificateRef:
        authConfig?.certificateRef && preferredMethod === 'mtls'
          ? {
              id: authConfig.certificateRef,
              type: 'mtls-certificate',
              profileId,
            }
          : undefined,
      oauthClientIdRef:
        authConfig?.bearerTokenRef && preferredMethod === 'oauth2'
          ? {
              id: authConfig.bearerTokenRef.replace('oauth2-bearer-token', 'oauth-client-id'),
              type: 'oauth-client-id',
              profileId,
            }
          : undefined,
      oauthClientSecretRef:
        authConfig?.bearerTokenRef && preferredMethod === 'oauth2'
          ? {
              id: authConfig.bearerTokenRef.replace('oauth2-bearer-token', 'oauth-client-secret'),
              type: 'oauth-client-secret',
              profileId,
            }
          : undefined,
      tokenEndpoint: authConfig?.tokenEndpoint,
      enrollmentStatus: authConfig ? 'enrolled' : 'not-enrolled',
    };
  }

  private normalizeKafkaConfig(kafkaConfig: KafkaConfig): KafkaConfig {
    const legacyTopics = kafkaConfig.topics as KafkaConfig['topics'] & { outputTopic?: string };

    return {
      ...kafkaConfig,
      topics: {
        inputTopic: kafkaConfig.topics.inputTopic,
        outputTopicPattern: kafkaConfig.topics.outputTopicPattern,
        outputTopicOverride: kafkaConfig.topics.outputTopicOverride ?? legacyTopics.outputTopic,
      },
    };
  }

  private normalizeApiConfigs(snapshot: ProfileStorageSnapshot): Record<ProfileEnvironment, SafApiConfig> {
    const apiConfigs = { ...mockApiConfigs, ...(snapshot.apiConfigs ?? {}) };

    snapshot.profiles.forEach((profile) => {
      const legacyProfile = profile as SafProfile & {
        apiConfig?: SafApiConfig;
        generalApiConfig?: { baseUrl?: string; timeoutMs?: number };
        publicKeyStoreApiConfig?: { baseUrl?: string };
      };
      const legacyApiConfig =
        legacyProfile.apiConfig ??
        (legacyProfile.generalApiConfig || legacyProfile.publicKeyStoreApiConfig
          ? {
              generalApiBaseUrl: legacyProfile.generalApiConfig?.baseUrl ?? mockApiConfigs[profile.environment].generalApiBaseUrl,
              publicKeyStoreApiBaseUrl:
                legacyProfile.publicKeyStoreApiConfig?.baseUrl ?? mockApiConfigs[profile.environment].publicKeyStoreApiBaseUrl,
              timeoutMs: legacyProfile.generalApiConfig?.timeoutMs ?? mockApiConfigs[profile.environment].timeoutMs,
            }
          : undefined);

      if (!snapshot.apiConfigs?.[profile.environment] && legacyApiConfig) {
        apiConfigs[profile.environment] = legacyApiConfig;
      }
    });

    return apiConfigs;
  }

  private persistSnapshot(): void {
    if (!this.canUseLocalStorage()) {
      return;
    }

    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.snapshot));
  }

  private canUseLocalStorage(): boolean {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }
}

export const profileStorageService = new ProfileStorageService();
