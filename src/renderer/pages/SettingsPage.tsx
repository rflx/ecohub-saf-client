import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { apiManagementConfig } from '../data';
import type { ApiId, ApiVersion, ProfileEnvironment, SafEnvironment } from '../models';
import { profileStorageService } from '../services';

type ApiEnvironmentFormState = {
  baseUrl: string;
  timeoutMs: string;
};

const environments: ProfileEnvironment[] = ['prod', 'iat', 'test', 'dev'];

export function SettingsPage() {
  const [profileState, setProfileState] = useState(() => profileStorageService.getSnapshot());
  const [environmentForms, setEnvironmentForms] = useState<Record<ProfileEnvironment, ApiEnvironmentFormState>>(() =>
    createEnvironmentForms(profileStorageService.getSnapshot().safEnvironments),
  );

  const handleEnvironmentChange = (
    environmentId: ProfileEnvironment,
    field: keyof ApiEnvironmentFormState,
    value: string,
  ) => {
    setEnvironmentForms((current) => ({
      ...current,
      [environmentId]: {
        ...current[environmentId],
        [field]: value,
      },
    }));
  };

  const handleEnvironmentBlur = (environmentId: ProfileEnvironment) => {
    const environment = profileStorageService.getSnapshot().safEnvironments[environmentId];
    const formState = environmentForms[environmentId];
    const updatedEnvironment: SafEnvironment = {
      ...environment,
      baseUrl: formState.baseUrl.trim(),
      timeoutMs: toNumber(formState.timeoutMs, environment.timeoutMs),
    };

    const updatedSnapshot = profileStorageService.saveSafEnvironment(updatedEnvironment);
    setProfileState(updatedSnapshot);
    setEnvironmentForms((current) => ({
      ...current,
      [environmentId]: createEnvironmentForm(updatedEnvironment),
    }));
  };

  const handleVersionChange = (environmentId: ProfileEnvironment, apiId: ApiId, version: string) => {
    const environment = profileStorageService.getSnapshot().safEnvironments[environmentId];
    const updatedEnvironment: SafEnvironment = {
      ...environment,
      activeApiVersions: {
        ...environment.activeApiVersions,
        [apiId]: normalizeVersion(version),
      },
    };

    setProfileState(profileStorageService.saveSafEnvironment(updatedEnvironment));
  };

  return (
    <div className="page-stack">
      <div className="placeholder-panel placeholder-panel--large">
        <div className="panel-header">
          <div>
            <h2>API Environments</h2>
            <p>Service Host und Timeout pro Environment. Aenderungen werden beim Verlassen des Feldes gespeichert.</p>
          </div>
        </div>
        <div className="environment-version-grid">
          {environments.map((environmentId) => {
            const environment = profileState.safEnvironments[environmentId];
            const formState = environmentForms[environmentId];
            const warnings = getEnvironmentWarnings(environment);

            return (
              <article className="environment-card" key={environmentId}>
                <div className="profile-card__header">
                  <div>
                    <strong>{environment.name}</strong>
                    <span>{environment.id}</span>
                  </div>
                </div>
                <div className="form-grid">
                  <TextField
                    label="Base URL"
                    required
                    value={formState.baseUrl}
                    onBlur={() => handleEnvironmentBlur(environmentId)}
                    onChange={(value) => handleEnvironmentChange(environmentId, 'baseUrl', value)}
                  />
                  <TextField
                    label="API Timeout ms"
                    required
                    type="number"
                    value={formState.timeoutMs}
                    onBlur={() => handleEnvironmentBlur(environmentId)}
                    onChange={(value) => handleEnvironmentChange(environmentId, 'timeoutMs', value)}
                  />
                  {apiManagementConfig.apis.map((api) => (
                    <SelectField
                      key={api.id}
                      label={api.name}
                      options={getApiVersions(api.id)}
                      value={environment.activeApiVersions[api.id] ?? ''}
                      onChange={(value) => handleVersionChange(environmentId, api.id, value)}
                    />
                  ))}
                </div>
                {warnings.length > 0 && (
                  <div className="warning-list">
                    {warnings.map((warning) => (
                      <p className="form-message form-message--error" key={warning}>
                        {warning}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="placeholder-panel placeholder-panel--large">
        <div className="panel-header">
          <div>
            <h2>API Management</h2>
            <p>Verfuegbare SAF APIs, lokale Specs und generierte Typen.</p>
          </div>
        </div>
        <div className="api-management-list">
          {apiManagementConfig.apis.map((api) => (
            <article className="profile-card" key={api.id}>
              <div className="profile-card__header">
                <div>
                  <strong>{api.name}</strong>
                  <span>{api.id}</span>
                </div>
              </div>
              <div className="api-version-list">
                {api.versions.map((version, index) => (
                  <ApiVersionAccordion
                    key={`${api.id}-${version.version}`}
                    initiallyOpen={index === 0}
                  >
                    <summary>
                      <span>Version {version.version}</span>
                      <span className="api-version-accordion__status">
                        <span className={`status-label status-label--${version.supportStatus}`}>
                          {version.supportStatus}
                        </span>
                      </span>
                    </summary>
                    <dl className="profile-details">
                      <div>
                        <dt>API Base Path</dt>
                        <dd>{version.basePath}</dd>
                      </div>
                      <div>
                        <dt>Lokaler Spec-Pfad</dt>
                        <dd>{version.localSpecPath}</dd>
                      </div>
                      <div>
                        <dt>Generated Types</dt>
                        <dd>{version.generatedTypesPath}</dd>
                      </div>
                      <div className="field--wide">
                        <dt>Operationen</dt>
                        <dd>{version.operations.map((operation) => operation.id).join(', ') || 'keine Metadaten'}</dd>
                      </div>
                    </dl>
                  </ApiVersionAccordion>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiVersionAccordion({
  children,
  initiallyOpen,
}: {
  children: ReactNode;
  initiallyOpen: boolean;
}) {
  const hasAppliedInitialOpen = useRef(false);

  return (
    <details
      className="api-version-accordion"
      ref={(element) => {
        if (!element || hasAppliedInitialOpen.current) {
          return;
        }

        element.open = initiallyOpen;
        hasAppliedInitialOpen.current = true;
      }}
    >
      {children}
    </details>
  );
}

function TextField({
  label,
  onBlur,
  onChange,
  required = false,
  type = 'text',
  value,
}: {
  label: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: ApiVersion[];
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Nicht gesetzt</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function getApiVersions(apiId: ApiId): ApiVersion[] {
  return apiManagementConfig.apis.find((api) => api.id === apiId)?.versions.map((version) => version.version) ?? [];
}

function normalizeVersion(value: string): ApiVersion | undefined {
  return value.trim() || undefined;
}

function createEnvironmentForms(
  safEnvironments: Record<ProfileEnvironment, SafEnvironment>,
): Record<ProfileEnvironment, ApiEnvironmentFormState> {
  return Object.fromEntries(
    environments.map((environmentId) => [environmentId, createEnvironmentForm(safEnvironments[environmentId])]),
  ) as Record<ProfileEnvironment, ApiEnvironmentFormState>;
}

function createEnvironmentForm(config: SafEnvironment): ApiEnvironmentFormState {
  return {
    baseUrl: config.baseUrl,
    timeoutMs: String(config.timeoutMs),
  };
}

function toNumber(value: string, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function getEnvironmentWarnings(environment: SafEnvironment): string[] {
  const warnings: string[] = [];

  apiManagementConfig.apis.forEach((api) => {
    const activeVersion = environment.activeApiVersions[api.id];
    const version = api.versions.find((item) => item.version === activeVersion);

    if (!activeVersion) {
      warnings.push(`Warnung: Keine aktive Version fuer ${api.name} gesetzt.`);
    }

    if (activeVersion && !version) {
      warnings.push(`Warnung: ${api.name} ${activeVersion} ist nicht in der API Registry konfiguriert.`);
    }

    if (version?.supportStatus === 'deprecated') {
      warnings.push(`Warnung: ${api.name} ${version.version} ist deprecated.`);
    }
  });

  return warnings;
}
