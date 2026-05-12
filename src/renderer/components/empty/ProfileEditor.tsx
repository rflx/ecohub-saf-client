import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { DEFAULT_INPUT_TOPIC, DEFAULT_OUTPUT_TOPIC_PATTERN } from '../../domain/saf';
import type {
  KafkaConfig,
  KafkaSecurityProtocol,
  ProfileEnvironment,
  SafProfile,
  ServiceProfileType,
} from '../../models';

type ProfileEditorProps = {
  profile?: SafProfile;
  kafkaConfig?: KafkaConfig;
  onCancel: () => void;
  onDelete?: (profileId: string) => void;
  onSave: (profile: SafProfile, kafkaConfig: KafkaConfig) => void;
};

type ProfileFormState = {
  id: string;
  name: string;
  type: ServiceProfileType;
  environment: ProfileEnvironment;
  description: string;
  ecoHubId: string;
  standard: string;
  receiverEcoHubId: string;
  receiverStandard: string;
  receiverDisplayName: string;
  generalApiBaseUrl: string;
  generalApiTimeoutMs: string;
  publicKeyStoreApiBaseUrl: string;
  publicKeyStoreApiTimeoutMs: string;
  apiLicenseKey: string;
  credentialsRefId: string;
  credentialsRefLabel: string;
  credentialsRefDescription: string;
  kafkaClientId: string;
  kafkaBrokers: string;
  kafkaSecurityProtocol: KafkaSecurityProtocol;
  kafkaSslEnabled: boolean;
  kafkaSaslMechanism: '' | 'plain' | 'scram-sha-256' | 'scram-sha-512';
  kafkaInputTopic: string;
  kafkaOutputTopic: string;
  kafkaOutputTopicPattern: string;
  kafkaConsumerGroupId: string;
  kafkaCredentialsRef: string;
};

const profileEnvironments: ProfileEnvironment[] = ['dev', 'iat', 'test', 'prod'];
const profileTypes: ServiceProfileType[] = ['consumer', 'provider'];
const securityProtocols: KafkaSecurityProtocol[] = ['PLAINTEXT', 'SSL', 'SASL_SSL'];

export function ProfileEditor({
  profile,
  kafkaConfig,
  onCancel,
  onDelete,
  onSave,
}: ProfileEditorProps) {
  const initialState = useMemo(() => createFormState(profile, kafkaConfig), [profile, kafkaConfig]);
  const [formState, setFormState] = useState<ProfileFormState>(initialState);

  useEffect(() => {
    setFormState(initialState);
  }, [initialState]);

  const handleChange = (field: keyof ProfileFormState, value: string | boolean) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const now = new Date().toISOString();
    const kafkaConfigId = formState.id;
    const credentialsRef = formState.credentialsRefId.trim();
    const kafkaCredentialsRef = formState.kafkaCredentialsRef.trim() || credentialsRef;
    const apiLicenseKey = optionalValue(formState.apiLicenseKey);
    const kafkaConfigToSave: KafkaConfig = {
      clientId: formState.kafkaClientId.trim(),
      brokers: toList(formState.kafkaBrokers),
      securityProtocol: formState.kafkaSecurityProtocol,
      sslEnabled: formState.kafkaSslEnabled,
      topics: {
        inputTopic: optionalValue(formState.kafkaInputTopic),
        outputTopic: optionalValue(formState.kafkaOutputTopic),
        outputTopicPattern: optionalValue(formState.kafkaOutputTopicPattern),
      },
      consumerGroupId: optionalValue(formState.kafkaConsumerGroupId),
      credentialsRef: optionalValue(kafkaCredentialsRef),
    };

    if (formState.kafkaSaslMechanism) {
      kafkaConfigToSave.saslMechanism = formState.kafkaSaslMechanism;
    }

    const profileToSave: SafProfile = {
      id: formState.id,
      name: formState.name.trim(),
      type: formState.type,
      environment: formState.environment,
      description: optionalValue(formState.description),
      connectionStatus: profile?.connectionStatus ?? 'offline',
      ecoHubId: formState.ecoHubId.trim(),
      standard: formState.standard.trim(),
      receiver: {
        ecoHubId: formState.receiverEcoHubId.trim(),
        standard: formState.receiverStandard.trim(),
        displayName: formState.receiverDisplayName.trim(),
      },
      kafkaConfigId,
      generalApiConfig: {
        baseUrl: formState.generalApiBaseUrl.trim(),
        timeoutMs: toNumber(formState.generalApiTimeoutMs, 5000),
        credentialsRef: optionalValue(credentialsRef),
        licenceKey: apiLicenseKey,
      },
      publicKeyStoreApiConfig: {
        baseUrl: formState.publicKeyStoreApiBaseUrl.trim(),
        timeoutMs: toNumber(formState.publicKeyStoreApiTimeoutMs, 5000),
        credentialsRef: optionalValue(credentialsRef),
        licenceKey: apiLicenseKey,
      },
      credentialsRef: credentialsRef
        ? {
            id: credentialsRef,
            label: formState.credentialsRefLabel.trim() || credentialsRef,
            description: optionalValue(formState.credentialsRefDescription),
          }
        : undefined,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };

    onSave(profileToSave, kafkaConfigToSave);
  };

  return (
    <form className="placeholder-panel placeholder-panel--large profile-editor" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <h2>{profile ? 'Profil bearbeiten' : 'Profil anlegen'}</h2>
          <p>Lokale Profile und Kafka-Parameter ohne Secrets konfigurieren.</p>
        </div>
        <div className="panel-actions">
          {profile && onDelete && (
            <button className="button button--danger" type="button" onClick={() => onDelete(profile.id)}>
              Loeschen
            </button>
          )}
          <button className="button button--secondary" type="button" onClick={onCancel}>
            Abbrechen
          </button>
          <button className="button button--primary" type="submit">
            Speichern
          </button>
        </div>
      </div>

      <section className="form-section">
        <h3>Profil</h3>
        <div className="form-grid">
          <TextField label="Name" required value={formState.name} onChange={(value) => handleChange('name', value)} />
          <TextField
            label="Profil-ID"
            required
            value={formState.id}
            onChange={(value) => handleChange('id', toSlug(value))}
            disabled={Boolean(profile)}
          />
          <SelectField
            label="Typ"
            value={formState.type}
            options={profileTypes}
            onChange={(value) => handleChange('type', value as ServiceProfileType)}
          />
          <SelectField
            label="Environment"
            value={formState.environment}
            options={profileEnvironments}
            onChange={(value) => handleChange('environment', value as ProfileEnvironment)}
          />
          <TextField label="EcoHub ID" required value={formState.ecoHubId} onChange={(value) => handleChange('ecoHubId', value)} />
          <TextField label="Standard" required value={formState.standard} onChange={(value) => handleChange('standard', value)} />
          <TextAreaField label="Beschreibung" value={formState.description} onChange={(value) => handleChange('description', value)} />
        </div>
      </section>

      <section className="form-section">
        <h3>Receiver</h3>
        <div className="form-grid">
          <TextField label="Receiver EcoHub ID" required value={formState.receiverEcoHubId} onChange={(value) => handleChange('receiverEcoHubId', value)} />
          <TextField label="Receiver Standard" required value={formState.receiverStandard} onChange={(value) => handleChange('receiverStandard', value)} />
          <TextField label="Anzeigename" required value={formState.receiverDisplayName} onChange={(value) => handleChange('receiverDisplayName', value)} />
        </div>
      </section>

      <section className="form-section">
        <h3>APIs und Credentials-Referenz</h3>
        <div className="form-grid">
          <TextField label="General API Base URL" required value={formState.generalApiBaseUrl} onChange={(value) => handleChange('generalApiBaseUrl', value)} />
          <TextField label="General API Timeout ms" type="number" required value={formState.generalApiTimeoutMs} onChange={(value) => handleChange('generalApiTimeoutMs', value)} />
          <TextField label="Public Key Store Base URL" required value={formState.publicKeyStoreApiBaseUrl} onChange={(value) => handleChange('publicKeyStoreApiBaseUrl', value)} />
          <TextField label="Public Key Store Timeout ms" type="number" required value={formState.publicKeyStoreApiTimeoutMs} onChange={(value) => handleChange('publicKeyStoreApiTimeoutMs', value)} />
          <TextField label="Lizenzschluessel" type="password" value={formState.apiLicenseKey} onChange={(value) => handleChange('apiLicenseKey', value)} />
          <TextField label="Credentials Ref ID" value={formState.credentialsRefId} onChange={(value) => handleChange('credentialsRefId', value)} />
          <TextField label="Credentials Ref Label" value={formState.credentialsRefLabel} onChange={(value) => handleChange('credentialsRefLabel', value)} />
          <TextAreaField label="Credentials Ref Beschreibung" value={formState.credentialsRefDescription} onChange={(value) => handleChange('credentialsRefDescription', value)} />
        </div>
      </section>

      <section className="form-section">
        <h3>Kafka</h3>
        <div className="form-grid">
          <TextField label="Client ID" required value={formState.kafkaClientId} onChange={(value) => handleChange('kafkaClientId', value)} />
          <TextField label="Broker" required value={formState.kafkaBrokers} onChange={(value) => handleChange('kafkaBrokers', value)} />
          <SelectField
            label="Security Protocol"
            value={formState.kafkaSecurityProtocol}
            options={securityProtocols}
            onChange={(value) => handleChange('kafkaSecurityProtocol', value as KafkaSecurityProtocol)}
          />
          <SelectField
            label="SASL Mechanism"
            value={formState.kafkaSaslMechanism}
            options={['', 'plain', 'scram-sha-256', 'scram-sha-512']}
            onChange={(value) => handleChange('kafkaSaslMechanism', value as ProfileFormState['kafkaSaslMechanism'])}
          />
          <CheckboxField label="SSL aktiviert" checked={formState.kafkaSslEnabled} onChange={(value) => handleChange('kafkaSslEnabled', value)} />
          <TextField label="Consumer Group" value={formState.kafkaConsumerGroupId} onChange={(value) => handleChange('kafkaConsumerGroupId', value)} />
          <TextField label="Input Topic" value={formState.kafkaInputTopic} onChange={(value) => handleChange('kafkaInputTopic', value)} />
          <TextField label="Output Topic" value={formState.kafkaOutputTopic} onChange={(value) => handleChange('kafkaOutputTopic', value)} />
          <TextField label="Output Topic Pattern" value={formState.kafkaOutputTopicPattern} onChange={(value) => handleChange('kafkaOutputTopicPattern', value)} />
          <TextField label="Kafka Credentials Ref" value={formState.kafkaCredentialsRef} onChange={(value) => handleChange('kafkaCredentialsRef', value)} />
        </div>
      </section>
    </form>
  );
}

function TextField({
  disabled = false,
  label,
  onChange,
  required = false,
  type = 'text',
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input disabled={disabled} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="field field--wide">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
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
  options: string[];
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option || 'keine Auswahl'}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="field field--checkbox">
      <input checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function createFormState(profile?: SafProfile, kafkaConfig?: KafkaConfig): ProfileFormState {
  const id = profile?.id ?? `profile-${Date.now()}`;
  const credentialsRefId = profile?.credentialsRef?.id ?? '';

  return {
    id,
    name: profile?.name ?? '',
    type: profile?.type ?? 'consumer',
    environment: profile?.environment ?? 'dev',
    description: profile?.description ?? '',
    ecoHubId: profile?.ecoHubId ?? '',
    standard: profile?.standard ?? 'saf',
    receiverEcoHubId: profile?.receiver.ecoHubId ?? '',
    receiverStandard: profile?.receiver.standard ?? 'saf',
    receiverDisplayName: profile?.receiver.displayName ?? '',
    generalApiBaseUrl: profile?.generalApiConfig.baseUrl ?? 'http://localhost:8080/general-api',
    generalApiTimeoutMs: String(profile?.generalApiConfig.timeoutMs ?? 5000),
    publicKeyStoreApiBaseUrl: profile?.publicKeyStoreApiConfig.baseUrl ?? 'http://localhost:8080/public-key-store-api',
    publicKeyStoreApiTimeoutMs: String(profile?.publicKeyStoreApiConfig.timeoutMs ?? 5000),
    apiLicenseKey:
      profile?.generalApiConfig.licenceKey ??
      profile?.publicKeyStoreApiConfig.licenceKey ??
      '',
    credentialsRefId,
    credentialsRefLabel: profile?.credentialsRef?.label ?? '',
    credentialsRefDescription: profile?.credentialsRef?.description ?? '',
    kafkaClientId: kafkaConfig?.clientId ?? `ecohub-saf-client-${id}`,
    kafkaBrokers: kafkaConfig?.brokers.join(', ') ?? 'localhost:9092',
    kafkaSecurityProtocol: kafkaConfig?.securityProtocol ?? 'PLAINTEXT',
    kafkaSslEnabled: kafkaConfig?.sslEnabled ?? false,
    kafkaSaslMechanism: kafkaConfig?.saslMechanism ?? '',
    kafkaInputTopic: kafkaConfig?.topics.inputTopic ?? DEFAULT_INPUT_TOPIC,
    kafkaOutputTopic: kafkaConfig?.topics.outputTopic ?? '',
    kafkaOutputTopicPattern: kafkaConfig?.topics.outputTopicPattern ?? DEFAULT_OUTPUT_TOPIC_PATTERN,
    kafkaConsumerGroupId: kafkaConfig?.consumerGroupId ?? '',
    kafkaCredentialsRef: kafkaConfig?.credentialsRef ?? credentialsRefId,
  };
}

function optionalValue(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function toList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: string, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
