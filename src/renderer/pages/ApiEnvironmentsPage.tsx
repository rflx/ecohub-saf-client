import { useState, type FormEvent } from 'react';

import type { ProfileEnvironment, SafApiConfig } from '../models';
import { profileStorageService } from '../services';

type ApiEnvironmentFormState = {
  generalApiBaseUrl: string;
  publicKeyStoreApiBaseUrl: string;
  timeoutMs: string;
};

const environments: ProfileEnvironment[] = ['prod', 'iat', 'test', 'dev'];

export function ApiEnvironmentsPage() {
  const [profileState, setProfileState] = useState(() => profileStorageService.getSnapshot());
  const [editedEnvironment, setEditedEnvironment] = useState<ProfileEnvironment>('prod');
  const editedConfig = profileState.apiConfigs[editedEnvironment];
  const [formState, setFormState] = useState<ApiEnvironmentFormState>(() => createFormState(editedConfig));

  const handleEditEnvironment = (environment: ProfileEnvironment) => {
    setEditedEnvironment(environment);
    setFormState(createFormState(profileState.apiConfigs[environment]));
  };

  const handleChange = (field: keyof ApiEnvironmentFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const configToSave: SafApiConfig = {
      generalApiBaseUrl: formState.generalApiBaseUrl.trim(),
      publicKeyStoreApiBaseUrl: formState.publicKeyStoreApiBaseUrl.trim(),
      timeoutMs: toNumber(formState.timeoutMs, 5000),
    };

    setProfileState(profileStorageService.saveApiConfig(editedEnvironment, configToSave));
    setFormState(createFormState(configToSave));
  };

  return (
    <div className="page-grid">
      <div className="placeholder-panel placeholder-panel--large">
        <div className="panel-header">
          <div>
            <h2>API Environments</h2>
            <p>API Base URL pro Environment konfigurieren.</p>
          </div>
        </div>
        <div className="environment-list">
          {environments.map((environment) => {
            const apiConfig = profileState.apiConfigs[environment];
            const isSelected = environment === editedEnvironment;

            return (
              <article className={`environment-card${isSelected ? ' environment-card--active' : ''}`} key={environment}>
                <div className="profile-card__header">
                  <div>
                    <strong>{environment.toUpperCase()}</strong>
                  </div>
                  <button className="button button--secondary" type="button" onClick={() => handleEditEnvironment(environment)}>
                    Bearbeiten
                  </button>
                </div>
                <dl className="profile-details">
                  <div>
                    <dt>General API</dt>
                    <dd>{apiConfig.generalApiBaseUrl}</dd>
                  </div>
                  <div>
                    <dt>Public Key Store / PKI</dt>
                    <dd>{apiConfig.publicKeyStoreApiBaseUrl}</dd>
                  </div>
                  <div>
                    <dt>Timeout</dt>
                    <dd>{apiConfig.timeoutMs} ms</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </div>

      <form className="placeholder-panel placeholder-panel--large profile-editor" onSubmit={handleSubmit}>
        <div className="panel-header">
          <div>
            <h2>{editedEnvironment.toUpperCase()} Endpoints</h2>
          </div>
          <div className="panel-actions">
            <button className="button button--primary" type="submit">
              Speichern
            </button>
          </div>
        </div>
        <section className="form-section">
          <div className="form-grid">
            <TextField
              label="General API Base URL"
              required
              value={formState.generalApiBaseUrl}
              onChange={(value) => handleChange('generalApiBaseUrl', value)}
            />
            <TextField
              label="Public Key Store / PKI API Base URL"
              required
              value={formState.publicKeyStoreApiBaseUrl}
              onChange={(value) => handleChange('publicKeyStoreApiBaseUrl', value)}
            />
            <TextField
              label="API Timeout ms"
              required
              type="number"
              value={formState.timeoutMs}
              onChange={(value) => handleChange('timeoutMs', value)}
            />
          </div>
        </section>
      </form>
    </div>
  );
}

function TextField({
  label,
  onChange,
  required = false,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function createFormState(config: SafApiConfig): ApiEnvironmentFormState {
  return {
    generalApiBaseUrl: config.generalApiBaseUrl,
    publicKeyStoreApiBaseUrl: config.publicKeyStoreApiBaseUrl,
    timeoutMs: String(config.timeoutMs),
  };
}

function toNumber(value: string, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}
