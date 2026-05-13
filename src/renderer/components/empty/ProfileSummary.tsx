import { apiManagementConfig } from '../../data';
import type { ProfileEnvironment, SafEnvironment, SafProfile } from '../../models';

type ProfileSummaryProps = {
  profiles?: SafProfile[];
  activeProfileId?: string;
  safEnvironments?: Partial<Record<ProfileEnvironment, SafEnvironment>>;
  onEditProfile?: (profileId: string) => void;
};

export function ProfileSummary({
  profiles = [],
  activeProfileId,
  safEnvironments = {},
  onEditProfile,
}: ProfileSummaryProps) {
  if (profiles.length === 0) {
    return (
      <div className="placeholder-panel">
        <h2>Profile</h2>
        <p>Service Consumer und Service Provider Profile.</p>
      </div>
    );
  }

  return (
    <div className="placeholder-panel placeholder-panel--large">
      <h2>Profile</h2>
      <div className="profile-list">
        {profiles.map((profile) => {
          const safEnvironment = safEnvironments[profile.environment];
          const isActive = profile.id === activeProfileId;

          return (
            <article
              className={`profile-card${isActive ? ' profile-card--active' : ''}`}
              key={profile.id}
            >
              <div className="profile-card__header">
                <div>
                  <strong>{profile.name}</strong>
                  <span>{profile.description}</span>
                </div>
                <div className="profile-card__actions">
                  <span className="profile-badge">{isActive ? 'Aktiv' : profile.environment}</span>
                  {onEditProfile && (
                    <button className="button button--secondary" type="button" onClick={() => onEditProfile(profile.id)}>
                      Bearbeiten
                    </button>
                  )}
                </div>
              </div>
              <dl className="profile-details">
                <div>
                  <dt>Typ</dt>
                  <dd>{profile.type}</dd>
                </div>
                <div>
                  <dt>EcoHub ID</dt>
                  <dd>{profile.ecoHubId}</dd>
                </div>
                <div>
                  <dt>Licence Key</dt>
                  <dd>{profile.licenceKey ?? 'nicht konfiguriert'}</dd>
                </div>
                <div>
                  <dt>API Base URL</dt>
                  <dd>{safEnvironment?.baseUrl ?? 'nicht konfiguriert'}</dd>
                </div>
                {apiManagementConfig.apis.map((api) => (
                  <div key={api.id}>
                    <dt>{api.name} Version</dt>
                    <dd>{safEnvironment?.activeApiVersions[api.id] ?? 'nicht konfiguriert'}</dd>
                  </div>
                ))}
                <div>
                  <dt>Tech User Auth</dt>
                  <dd>{profile.techUserAuth?.preferredMethod ?? 'nicht konfiguriert'}</dd>
                </div>
                <div>
                  <dt>Tech User IDP Number</dt>
                  <dd>{profile.techUserAuth?.techUserIdpNumber ?? 'nicht konfiguriert'}</dd>
                </div>
                <div>
                  <dt>Available Auth Methods</dt>
                  <dd>{profile.techUserAuth?.availableMethods.join(', ') ?? 'keine'}</dd>
                </div>
                <div>
                  <dt>Enrollment Status</dt>
                  <dd>{profile.techUserAuth?.enrollmentStatus ?? 'not-enrolled'}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}
