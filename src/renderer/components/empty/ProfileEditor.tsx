import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { DEFAULT_INPUT_TOPIC, DEFAULT_OUTPUT_TOPIC_PATTERN } from '../../domain/saf';
import type {
  KafkaConfig,
  KafkaSecurityProtocol,
  ProfileEnvironment,
  SafProfile,
  ServiceProfileType,
  TechUserAuthMethod,
  TechUserEnrollmentResponse,
} from '../../models';
import { localMockSecretStore, techUserEnrollmentService } from '../../services';

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
  licenceKey: string;
  standard: string;
  receiverEcoHubId: string;
  receiverStandard: string;
  receiverDisplayName: string;
  techUserIdpNumber: string;
  enrollmentPassword: string;
  identificationCode: string;
  storeMtlsCertificate: boolean;
  storeOAuth2Credentials: boolean;
  preferredMethod: TechUserAuthMethod;
  mtlsCertificateRef: string;
  oauthClientIdRef: string;
  oauthClientSecretRef: string;
  openIdConfigurationEndpoint: string;
  tokenEndpoint: string;
  kafkaClientId: string;
  kafkaBrokers: string;
  kafkaSecurityProtocol: KafkaSecurityProtocol;
  kafkaSslEnabled: boolean;
  kafkaSaslMechanism: '' | 'plain' | 'scram-sha-256' | 'scram-sha-512';
  kafkaInputTopic: string;
  kafkaOutputTopicOverride: string;
  kafkaOutputTopicPattern: string;
  kafkaConsumerGroupId: string;
  kafkaCredentialsRef: string;
  encryptionKeyPairRef: string;
  encryptionPublicKeyRef: string;
  encryptionPrivateKeyRef: string;
  encryptionPublicKeyId: string;
  signingKeyPairRef: string;
  signingPublicKeyRef: string;
  signingPrivateKeyRef: string;
  signingPublicKeyId: string;
};

const profileEnvironments: ProfileEnvironment[] = ['prod', 'iat', 'test', 'dev'];
const profileTypes: ServiceProfileType[] = ['consumer', 'provider'];
const securityProtocols: KafkaSecurityProtocol[] = ['PLAINTEXT', 'SSL', 'SASL_SSL'];
const authMethods: TechUserAuthMethod[] = ['mtls', 'oauth2'];

export function ProfileEditor({
  profile,
  kafkaConfig,
  onCancel,
  onDelete,
  onSave,
}: ProfileEditorProps) {
  const initialState = useMemo(() => createFormState(profile, kafkaConfig), [profile, kafkaConfig]);
  const [formState, setFormState] = useState<ProfileFormState>(initialState);
  const [enrollmentResponse, setEnrollmentResponse] = useState<TechUserEnrollmentResponse | undefined>();
  const [enrollmentError, setEnrollmentError] = useState<string | undefined>();

  useEffect(() => {
    setFormState(initialState);
    setEnrollmentResponse(undefined);
    setEnrollmentError(undefined);
  }, [initialState]);

  const handleChange = (field: keyof ProfileFormState, value: string | boolean) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const canSaveTechUserAuth = formState.storeMtlsCertificate || formState.storeOAuth2Credentials;
  const canRunEnrollment =
    Boolean(formState.techUserIdpNumber.trim()) &&
    Boolean(formState.enrollmentPassword.trim()) &&
    Boolean(formState.identificationCode.trim());

  const handleRunEnrollment = async () => {
    if (!canRunEnrollment) {
      setEnrollmentError('TechUser IDP Number, Password und Identification Code sind erforderlich.');
      return;
    }

    setEnrollmentError(undefined);
    const response = await techUserEnrollmentService.enrollTechUser({
      profileId: formState.id,
      techUserIdpNumber: formState.techUserIdpNumber,
      password: formState.enrollmentPassword,
      identificationCode: formState.identificationCode,
    });

    setEnrollmentResponse(response);
    setFormState((current) => ({
      ...current,
      enrollmentPassword: '',
      identificationCode: '',
      storeMtlsCertificate: Boolean(response.mtlsCertificate),
      storeOAuth2Credentials: Boolean(response.oauth2Credentials),
      preferredMethod: response.mtlsCertificate ? 'mtls' : 'oauth2',
      openIdConfigurationEndpoint: response.oauth2Credentials?.openIdConfigurationEndpoint ?? '',
      tokenEndpoint: response.oauth2Credentials?.tokenEndpoint ?? '',
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSaveTechUserAuth) {
      return;
    }

    const now = new Date().toISOString();
    const kafkaConfigId = formState.id;
    const kafkaCredentialsRef = formState.kafkaCredentialsRef.trim() || `ref://tech-users/${formState.id}`;
    const storedMtlsCertificateRef =
      formState.storeMtlsCertificate && enrollmentResponse?.mtlsCertificate
        ? localMockSecretStore.setSecret(formState.id, 'mtls-certificate', enrollmentResponse.mtlsCertificate.certificateBase64)
        : profile?.techUserAuth.mtlsCertificateRef;
    const storedOAuthClientIdRef =
      formState.storeOAuth2Credentials && enrollmentResponse?.oauth2Credentials
        ? localMockSecretStore.setSecret(formState.id, 'oauth-client-id', enrollmentResponse.oauth2Credentials.clientId)
        : profile?.techUserAuth.oauthClientIdRef;
    const storedOAuthClientSecretRef =
      formState.storeOAuth2Credentials && enrollmentResponse?.oauth2Credentials
        ? localMockSecretStore.setSecret(formState.id, 'oauth-client-secret', enrollmentResponse.oauth2Credentials.clientSecret)
        : profile?.techUserAuth.oauthClientSecretRef;
    const availableMethods = authMethods.filter((method) =>
      method === 'mtls'
        ? formState.storeMtlsCertificate
        : formState.storeOAuth2Credentials,
    );
    const preferredMethod: TechUserAuthMethod = availableMethods.includes(formState.preferredMethod)
      ? formState.preferredMethod
      : availableMethods[0] ?? 'oauth2';
    const kafkaConfigToSave: KafkaConfig = {
      clientId: formState.kafkaClientId.trim(),
      brokers: toList(formState.kafkaBrokers),
      securityProtocol: formState.kafkaSecurityProtocol,
      sslEnabled: formState.kafkaSslEnabled,
      topics: {
        inputTopic: optionalValue(formState.kafkaInputTopic),
        outputTopicOverride: optionalValue(formState.kafkaOutputTopicOverride),
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
      licenceKey: optionalValue(formState.licenceKey),
      standard: formState.standard.trim(),
      receiver: {
        ecoHubId: formState.receiverEcoHubId.trim(),
        standard: formState.receiverStandard.trim(),
        displayName: formState.receiverDisplayName.trim(),
      },
      kafkaConfigId,
      techUserAuth: {
        availableMethods,
        preferredMethod,
        techUserIdpNumber: formState.techUserIdpNumber.trim(),
        mtlsCertificateRef: formState.storeMtlsCertificate ? storedMtlsCertificateRef : undefined,
        oauthClientIdRef: formState.storeOAuth2Credentials ? storedOAuthClientIdRef : undefined,
        oauthClientSecretRef: formState.storeOAuth2Credentials ? storedOAuthClientSecretRef : undefined,
        openIdConfigurationEndpoint: formState.storeOAuth2Credentials
          ? optionalValue(formState.openIdConfigurationEndpoint)
          : undefined,
        tokenEndpoint: formState.storeOAuth2Credentials ? optionalValue(formState.tokenEndpoint) : undefined,
        enrollmentStatus: enrollmentResponse || availableMethods.length > 0 ? 'enrolled' : 'not-enrolled',
        lastEnrollmentAt: enrollmentResponse?.enrolledAt ?? profile?.techUserAuth.lastEnrollmentAt,
      },
      keyReferences: {
        encryption: {
          usage: 'encryption',
          keyPairRef: formState.encryptionKeyPairRef.trim(),
          publicKeyRef: formState.encryptionPublicKeyRef.trim(),
          privateKeyRef: formState.encryptionPrivateKeyRef.trim(),
          publicKeyId: optionalValue(formState.encryptionPublicKeyId),
        },
        signing: {
          usage: 'signing',
          keyPairRef: formState.signingKeyPairRef.trim(),
          publicKeyRef: formState.signingPublicKeyRef.trim(),
          privateKeyRef: formState.signingPrivateKeyRef.trim(),
          publicKeyId: optionalValue(formState.signingPublicKeyId),
        },
      },
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
          <button className="button button--primary" disabled={!canSaveTechUserAuth} type="submit">
            Speichern
          </button>
        </div>
      </div>

      <section className="form-section">
        <h3>SAF Identity</h3>
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
          <TextField label="Licence Key" value={formState.licenceKey} onChange={(value) => handleChange('licenceKey', value)} />
          <TextField label="Standard" required value={formState.standard} onChange={(value) => handleChange('standard', value)} />
          <TextAreaField label="Beschreibung" value={formState.description} onChange={(value) => handleChange('description', value)} />
        </div>
      </section>

      <section className="form-section">
        <h3>General API Receiver</h3>
        <div className="form-grid">
          <TextField label="Receiver EcoHub ID" required value={formState.receiverEcoHubId} onChange={(value) => handleChange('receiverEcoHubId', value)} />
          <TextField label="Receiver Standard" required value={formState.receiverStandard} onChange={(value) => handleChange('receiverStandard', value)} />
          <TextField label="Anzeigename" required value={formState.receiverDisplayName} onChange={(value) => handleChange('receiverDisplayName', value)} />
        </div>
      </section>

      <section className="form-section">
        <h3>Tech User Enrollment</h3>
        <div className="form-grid">
          <TextField label="TechUser IDP Number" required value={formState.techUserIdpNumber} onChange={(value) => handleChange('techUserIdpNumber', value)} />
          <TextField label="Password" type="password" value={formState.enrollmentPassword} onChange={(value) => handleChange('enrollmentPassword', value)} />
          <TextField label="Identification Code" type="password" value={formState.identificationCode} onChange={(value) => handleChange('identificationCode', value)} />
          <div className="field field--actions">
            <span>Enrollment</span>
            <button className="button button--secondary" disabled={!canRunEnrollment} type="button" onClick={handleRunEnrollment}>
              Run Enrollment
            </button>
          </div>
          <StatusField label="mTLS certificate available" active={Boolean(enrollmentResponse?.mtlsCertificate || formState.mtlsCertificateRef)} />
          <StatusField label="OAuth2 credentials available" active={Boolean(enrollmentResponse?.oauth2Credentials || formState.oauthClientIdRef)} />
          <CheckboxField label="Store mTLS certificate" checked={formState.storeMtlsCertificate} onChange={(value) => handleChange('storeMtlsCertificate', value)} />
          <CheckboxField label="Store OAuth2 credentials" checked={formState.storeOAuth2Credentials} onChange={(value) => handleChange('storeOAuth2Credentials', value)} />
          <SelectField
            label="Preferred authentication method"
            value={formState.preferredMethod}
            options={authMethods}
            onChange={(value) => handleChange('preferredMethod', value as TechUserAuthMethod)}
          />
          <TextField label="mTLS Certificate Ref" disabled value={formState.mtlsCertificateRef} onChange={(value) => handleChange('mtlsCertificateRef', value)} />
          <TextField label="OAuth2 Client ID Ref" disabled value={formState.oauthClientIdRef} onChange={(value) => handleChange('oauthClientIdRef', value)} />
          <TextField label="OAuth2 Client Secret Ref" disabled value={formState.oauthClientSecretRef} onChange={(value) => handleChange('oauthClientSecretRef', value)} />
          <TextField label="OpenID Configuration Endpoint" value={formState.openIdConfigurationEndpoint} onChange={(value) => handleChange('openIdConfigurationEndpoint', value)} />
          <TextField label="OAuth2 Token Endpoint" value={formState.tokenEndpoint} onChange={(value) => handleChange('tokenEndpoint', value)} />
        </div>
        {!canSaveTechUserAuth && <p className="form-message form-message--error">Mindestens eine Authentifizierungsmethode muss gespeichert werden.</p>}
        {enrollmentError && <p className="form-message form-message--error">{enrollmentError}</p>}
      </section>

      <section className="form-section">
        <h3>Kafka Topics</h3>
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
          <TextField label="Output Topic Override" value={formState.kafkaOutputTopicOverride} onChange={(value) => handleChange('kafkaOutputTopicOverride', value)} />
          <TextField label="Output Topic Pattern" value={formState.kafkaOutputTopicPattern} onChange={(value) => handleChange('kafkaOutputTopicPattern', value)} />
          <TextField label="Kafka Credentials Ref" value={formState.kafkaCredentialsRef} onChange={(value) => handleChange('kafkaCredentialsRef', value)} />
        </div>
      </section>

      <section className="form-section">
        <h3>Key References</h3>
        <div className="form-grid">
          <TextField label="Encryption Keypair Ref" required value={formState.encryptionKeyPairRef} onChange={(value) => handleChange('encryptionKeyPairRef', value)} />
          <TextField label="Encryption Public Key Ref" required value={formState.encryptionPublicKeyRef} onChange={(value) => handleChange('encryptionPublicKeyRef', value)} />
          <TextField label="Encryption Private Key Ref" required value={formState.encryptionPrivateKeyRef} onChange={(value) => handleChange('encryptionPrivateKeyRef', value)} />
          <TextField label="Encryption Public Key ID" value={formState.encryptionPublicKeyId} onChange={(value) => handleChange('encryptionPublicKeyId', value)} />
          <TextField label="Signing Keypair Ref" required value={formState.signingKeyPairRef} onChange={(value) => handleChange('signingKeyPairRef', value)} />
          <TextField label="Signing Public Key Ref" required value={formState.signingPublicKeyRef} onChange={(value) => handleChange('signingPublicKeyRef', value)} />
          <TextField label="Signing Private Key Ref" required value={formState.signingPrivateKeyRef} onChange={(value) => handleChange('signingPrivateKeyRef', value)} />
          <TextField label="Signing Public Key ID" value={formState.signingPublicKeyId} onChange={(value) => handleChange('signingPublicKeyId', value)} />
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

function StatusField({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="field tech-user-status">
      <span>{label}</span>
      <strong>{active ? 'available' : 'not available'}</strong>
    </div>
  );
}

function createFormState(profile?: SafProfile, kafkaConfig?: KafkaConfig): ProfileFormState {
  const id = profile?.id ?? `profile-${Date.now()}`;
  const legacyKafkaConfig = kafkaConfig as
    | (KafkaConfig & { topics: KafkaConfig['topics'] & { outputTopic?: string } })
    | undefined;
  const legacyProfile = profile as
    | (SafProfile & {
        credentialsRef?: { id?: string };
        licenceKey?: string;
        generalApiConfig?: { baseUrl?: string; timeoutMs?: number };
        publicKeyStoreApiConfig?: { baseUrl?: string; timeoutMs?: number };
        techUserAuth?: SafProfile['techUserAuth'] & {
          authMode?: TechUserAuthMethod;
          techUserRef?: string;
          certificateRef?: string;
          bearerTokenRef?: string;
        };
        apiConfig?: SafProfile['apiConfig'];
        keyReferences?: SafProfile['keyReferences'];
      })
    | undefined;
  const legacyPreferredMethod = legacyProfile?.techUserAuth?.authMode;
  const preferredMethod =
    legacyProfile?.techUserAuth?.preferredMethod ?? legacyPreferredMethod ?? 'oauth2';
  const mtlsCertificateRef =
    legacyProfile?.techUserAuth?.mtlsCertificateRef?.id ??
    legacyProfile?.techUserAuth?.certificateRef ??
    '';
  const oauthClientIdRef = legacyProfile?.techUserAuth?.oauthClientIdRef?.id ?? '';
  const oauthClientSecretRef =
    legacyProfile?.techUserAuth?.oauthClientSecretRef?.id ??
    legacyProfile?.techUserAuth?.bearerTokenRef ??
    '';
  const techUserIdpNumber =
    legacyProfile?.techUserAuth?.techUserIdpNumber ??
    legacyProfile?.techUserAuth?.techUserRef ??
    legacyProfile?.credentialsRef?.id ??
    '';

  return {
    id,
    name: profile?.name ?? '',
    type: profile?.type ?? 'consumer',
    environment: profile?.environment ?? 'prod',
    description: profile?.description ?? '',
    ecoHubId: profile?.ecoHubId ?? '',
    licenceKey: legacyProfile?.licenceKey ?? '',
    standard: profile?.standard ?? 'saf',
    receiverEcoHubId: profile?.receiver.ecoHubId ?? '',
    receiverStandard: profile?.receiver.standard ?? 'saf',
    receiverDisplayName: profile?.receiver.displayName ?? '',
    techUserIdpNumber,
    enrollmentPassword: '',
    identificationCode: '',
    storeMtlsCertificate: Boolean(mtlsCertificateRef),
    storeOAuth2Credentials: Boolean(oauthClientIdRef || oauthClientSecretRef),
    preferredMethod,
    mtlsCertificateRef,
    oauthClientIdRef,
    oauthClientSecretRef,
    openIdConfigurationEndpoint: legacyProfile?.techUserAuth?.openIdConfigurationEndpoint ?? '',
    tokenEndpoint: legacyProfile?.techUserAuth?.tokenEndpoint ?? '',
    kafkaClientId: kafkaConfig?.clientId ?? `ecohub-saf-client-${id}`,
    kafkaBrokers: kafkaConfig?.brokers.join(', ') ?? 'localhost:9092',
    kafkaSecurityProtocol: kafkaConfig?.securityProtocol ?? 'PLAINTEXT',
    kafkaSslEnabled: kafkaConfig?.sslEnabled ?? false,
    kafkaSaslMechanism: kafkaConfig?.saslMechanism ?? '',
    kafkaInputTopic: kafkaConfig?.topics.inputTopic ?? DEFAULT_INPUT_TOPIC,
    kafkaOutputTopicOverride: legacyKafkaConfig?.topics.outputTopicOverride ?? legacyKafkaConfig?.topics.outputTopic ?? '',
    kafkaOutputTopicPattern: kafkaConfig?.topics.outputTopicPattern ?? DEFAULT_OUTPUT_TOPIC_PATTERN,
    kafkaConsumerGroupId: kafkaConfig?.consumerGroupId ?? '',
    kafkaCredentialsRef: kafkaConfig?.credentialsRef ?? `ref://tech-users/${id}`,
    encryptionKeyPairRef: legacyProfile?.keyReferences?.encryption.keyPairRef ?? `ref://keys/${id}/encryption`,
    encryptionPublicKeyRef: legacyProfile?.keyReferences?.encryption.publicKeyRef ?? `ref://keys/${id}/encryption/public`,
    encryptionPrivateKeyRef: legacyProfile?.keyReferences?.encryption.privateKeyRef ?? `ref://keys/${id}/encryption/private`,
    encryptionPublicKeyId: legacyProfile?.keyReferences?.encryption.publicKeyId ?? '',
    signingKeyPairRef: legacyProfile?.keyReferences?.signing.keyPairRef ?? `ref://keys/${id}/signing`,
    signingPublicKeyRef: legacyProfile?.keyReferences?.signing.publicKeyRef ?? `ref://keys/${id}/signing/public`,
    signingPrivateKeyRef: legacyProfile?.keyReferences?.signing.privateKeyRef ?? `ref://keys/${id}/signing/private`,
    signingPublicKeyId: legacyProfile?.keyReferences?.signing.publicKeyId ?? '',
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

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
