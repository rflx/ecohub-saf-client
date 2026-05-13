import { resolveSafTopics } from '../../domain/saf';
import type { KafkaConfig, ProfileEnvironment, SafApiConfig, SafProfile } from '../../models';

type ProfileSummaryProps = {
  profiles?: SafProfile[];
  activeProfileId?: string;
  apiConfigs?: Partial<Record<ProfileEnvironment, SafApiConfig>>;
  kafkaConfigs?: Record<string, KafkaConfig>;
  onEditProfile?: (profileId: string) => void;
};

export function ProfileSummary({
  profiles = [],
  activeProfileId,
  apiConfigs = {},
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
          const apiConfig = apiConfigs[profile.environment] ?? profile.apiConfig;
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
                  <dt>Licence Key</dt>
                  <dd>{profile.licenceKey ?? 'nicht konfiguriert'}</dd>
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
                  <dd>{apiConfig?.generalApiBaseUrl ?? 'nicht konfiguriert'}</dd>
                </div>
                <div>
                  <dt>Public Key Store / PKI</dt>
                  <dd>{apiConfig?.publicKeyStoreApiBaseUrl ?? 'nicht konfiguriert'}</dd>
                </div>
                <div>
                  <dt>TechUser Auth</dt>
                  <dd>{profile.techUserAuth?.preferredMethod ?? 'nicht konfiguriert'}</dd>
                </div>
                <div>
                  <dt>TechUser IDP Number</dt>
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
                <div>
                  <dt>Encryption Keypair</dt>
                  <dd>{profile.keyReferences?.encryption.keyPairRef ?? 'keine Referenz'}</dd>
                </div>
                <div>
                  <dt>Signing Keypair</dt>
                  <dd>{profile.keyReferences?.signing.keyPairRef ?? 'keine Referenz'}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}
