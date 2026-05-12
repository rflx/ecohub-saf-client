import { resolveSafTopics } from '../../domain/saf';
import type { KafkaConfig, SafProfile } from '../../models';

type ProfileSummaryProps = {
  profiles?: SafProfile[];
  activeProfileId?: string;
  kafkaConfigs?: Record<string, KafkaConfig>;
  onEditProfile?: (profileId: string) => void;
};

export function ProfileSummary({
  profiles = [],
  activeProfileId,
  kafkaConfigs = {},
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
          const kafkaConfig = kafkaConfigs[profile.kafkaConfigId];
          const topics = kafkaConfig ? resolveSafTopics(profile, kafkaConfig) : undefined;
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
                  <dt>Receiver</dt>
                  <dd>{profile.receiver.displayName}</dd>
                </div>
                <div>
                  <dt>Input Topic</dt>
                  <dd>{topics?.inputTopic ?? 'nicht konfiguriert'}</dd>
                </div>
                <div>
                  <dt>Output Topic</dt>
                  <dd>{topics?.outputTopic ?? 'nicht konfiguriert'}</dd>
                </div>
                <div>
                  <dt>General API</dt>
                  <dd>{profile.generalApiConfig.baseUrl}</dd>
                </div>
                <div>
                  <dt>Public Key Store</dt>
                  <dd>{profile.publicKeyStoreApiConfig.baseUrl}</dd>
                </div>
                <div>
                  <dt>Lizenzschluessel</dt>
                  <dd>
                    {profile.generalApiConfig.licenceKey ||
                    profile.publicKeyStoreApiConfig.licenceKey
                      ? 'gesetzt'
                      : 'nicht gesetzt'}
                  </dd>
                </div>
                <div>
                  <dt>Credentials Ref</dt>
                  <dd>{profile.credentialsRef?.id ?? 'keine Referenz'}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}
