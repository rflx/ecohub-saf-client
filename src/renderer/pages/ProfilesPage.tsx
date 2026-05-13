import { useState } from 'react';

import { ProfileEditor, ProfileSummary, ProfileSwitcher } from '../components/empty';
import type { KafkaConfig, SafProfile } from '../models';
import { profileStorageService } from '../services';

export function ProfilesPage() {
  const [profileState, setProfileState] = useState(() => profileStorageService.getSnapshot());
  const [editedProfileId, setEditedProfileId] = useState<string | undefined>();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const handleActiveProfileChange = (profileId: string) => {
    setProfileState(profileStorageService.setActiveProfile(profileId));
  };

  const handleCreateProfile = () => {
    setEditedProfileId(undefined);
    setIsCreatingProfile(true);
  };

  const handleEditProfile = (profileId: string) => {
    setEditedProfileId(profileId);
    setIsCreatingProfile(false);
  };

  const handleCancelEditing = () => {
    setEditedProfileId(undefined);
    setIsCreatingProfile(false);
  };

  const handleSaveProfile = (profile: SafProfile, kafkaConfig: KafkaConfig) => {
    setProfileState(profileStorageService.saveProfile(profile, kafkaConfig));
    setEditedProfileId(undefined);
    setIsCreatingProfile(false);
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfileState(profileStorageService.deleteProfile(profileId));
    setEditedProfileId(undefined);
    setIsCreatingProfile(false);
  };

  const editedProfile = profileState.profiles.find((profile) => profile.id === editedProfileId);
  const editedKafkaConfig = editedProfile ? profileState.kafkaConfigs[editedProfile.kafkaConfigId] : undefined;

  return (
    <div className="page-grid">
      <ProfileSwitcher
        activeProfileId={profileState.activeProfileId}
        profiles={profileState.profiles}
        onActiveProfileChange={handleActiveProfileChange}
        onCreateProfile={handleCreateProfile}
      />
      {(isCreatingProfile || editedProfile) && (
        <ProfileEditor
          kafkaConfig={editedKafkaConfig}
          profile={editedProfile}
          onCancel={handleCancelEditing}
          onDelete={editedProfile ? handleDeleteProfile : undefined}
          onSave={handleSaveProfile}
        />
      )}
      <ProfileSummary
        activeProfileId={profileState.activeProfileId}
        profiles={profileState.profiles}
        safEnvironments={profileState.safEnvironments}
        onEditProfile={handleEditProfile}
      />
    </div>
  );
}
