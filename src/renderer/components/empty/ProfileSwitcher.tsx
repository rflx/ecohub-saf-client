import type { SafProfile } from '../../models';

type ProfileSwitcherProps = {
  profiles?: SafProfile[];
  activeProfileId?: string;
  onCreateProfile?: () => void;
  onActiveProfileChange?: (profileId: string) => void;
};

export function ProfileSwitcher({
  profiles = [],
  activeProfileId,
  onCreateProfile,
  onActiveProfileChange,
}: ProfileSwitcherProps) {
  if (profiles.length === 0 || !activeProfileId || !onActiveProfileChange) {
    return (
      <div className="placeholder-panel">
        <div className="panel-header">
          <h2>Aktives Profil</h2>
          {onCreateProfile && (
            <button className="button button--primary" type="button" onClick={onCreateProfile}>
              Neu
            </button>
          )}
        </div>
        <p>Auswahl des spaeter aktiven Service-Profils.</p>
      </div>
    );
  }

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);

  return (
    <div className="placeholder-panel">
      <div className="panel-header">
        <h2>Aktives Profil</h2>
        {onCreateProfile && (
          <button className="button button--primary" type="button" onClick={onCreateProfile}>
            Neu
          </button>
        )}
      </div>
      <div className="profile-switcher">
        <label htmlFor="active-profile">Profil auswaehlen</label>
        <select
          id="active-profile"
          value={activeProfileId}
          onChange={(event) => onActiveProfileChange(event.target.value)}
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>
      {activeProfile && (
        <div className="profile-active-summary">
          <strong>{activeProfile.name}</strong>
          <span>
            {activeProfile.type} / {activeProfile.environment.toUpperCase()}
          </span>
          <span>Credentials: {activeProfile.credentialsRef?.id ?? 'keine Referenz'}</span>
        </div>
      )}
    </div>
  );
}
