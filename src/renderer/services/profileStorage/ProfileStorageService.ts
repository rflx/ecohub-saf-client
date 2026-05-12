import { mockKafkaConfigs, mockProfiles } from '../../data';
import type { KafkaConfig, SafProfile } from '../../models';

const PROFILE_STORAGE_KEY = 'ecohub-saf-client.profile-storage';

export type ProfileStorageSnapshot = {
  profiles: SafProfile[];
  kafkaConfigs: Record<string, KafkaConfig>;
  activeProfileId: string;
};

export class ProfileStorageService {
  private snapshot: ProfileStorageSnapshot;

  constructor(initialProfiles: SafProfile[] = mockProfiles) {
    this.snapshot = this.readPersistedSnapshot() ?? {
      profiles: initialProfiles,
      kafkaConfigs: mockKafkaConfigs,
      activeProfileId: initialProfiles[0]?.id ?? '',
    };
  }

  getSnapshot(): ProfileStorageSnapshot {
    return {
      ...this.snapshot,
      profiles: [...this.snapshot.profiles],
      kafkaConfigs: { ...this.snapshot.kafkaConfigs },
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
      activeProfileId:
        this.snapshot.activeProfileId === profileId
          ? profiles[0]?.id ?? ''
          : this.snapshot.activeProfileId,
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

      return parsedValue;
    } catch {
      return undefined;
    }
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
