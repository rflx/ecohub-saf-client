import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { DEFAULT_INPUT_TOPIC, DEFAULT_OUTPUT_TOPIC_PATTERN } from '../../domain/saf';
import type {
  KafkaConfig,
  KafkaSecurityProtocol,
  ProfileEnvironment,
  SafProfile,
  SecretRef,
  ServiceProfileType,
  TechUserAuthMethod,
  TechUserEnrollmentResponse,
} from '../../models';
import { localSecretStore, techUserEnrollmentService } from '../../services';

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

type StoredEnrollmentRefs = {
  mtlsCertificateRef?: SecretRef;
  oauthClientIdRef?: SecretRef;
  oauthClientSecretRef?: SecretRef;
};

type ProfileSavePayload = {
  profile: SafProfile;
  kafkaConfig: KafkaConfig;
};

const profileEnvironments: ProfileEnvironment[] = ['prod', 'iat', 'test', 'dev'];
const profileTypes: ServiceProfileType[] = ['consumer', 'provider'];
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

  const handleNameChange = (name: string) => {
    setFormState((current) => ({
      ...current,
      name,
      id: profile ? current.id : createProfileId(name, current.environment),
    }));
  };

  const handleEnvironmentChange = (environment: ProfileEnvironment) => {
    setFormState((current) => ({
      ...current,
      environment,
      id: profile ? current.id : createProfileId(current.name, environment),
    }));
  };

  const canSaveProfile =
    Boolean(formState.id.trim()) &&
    Boolean(formState.name.trim());
  const canRunEnrollment =
    canSaveProfile &&
    Boolean(formState.licenceKey.trim()) &&
    Boolean(formState.techUserIdpNumber.trim()) &&
    Boolean(formState.enrollmentPassword.trim()) &&
    Boolean(formState.identificationCode.trim());

  const handleRunEnrollment = async () => {
    if (!canRunEnrollment) {
      setEnrollmentError('Profilname, Licence Key, TechUser IDP Number, Password und Identification Code sind erforderlich.');
      return;
    }

    setEnrollmentError(undefined);

    try {
      const response = await techUserEnrollmentService.enrollTechUser({
        profileId: formState.id,
        environmentId: formState.environment,
        techUserIdpNumber: formState.techUserIdpNumber,
        password: formState.enrollmentPassword,
        identificationCode: formState.identificationCode,
        licenceKey: formState.licenceKey,
      });
      const profileId = formState.id.trim();
      const mtlsCertificateRef = response.mtlsCertificate
        ? localSecretStore.setSecret(profileId, 'mtls-certificate', response.mtlsCertificate.certificateBase64)
        : undefined;
      const oauthClientIdRef = response.oauth2Credentials
        ? localSecretStore.setSecret(profileId, 'oauth-client-id', response.oauth2Credentials.clientId)
        : undefined;
      const oauthClientSecretRef = response.oauth2Credentials
        ? localSecretStore.setSecret(profileId, 'oauth-client-secret', response.oauth2Credentials.clientSecret)
        : undefined;
      const enrolledFormState: ProfileFormState = {
        ...formState,
        enrollmentPassword: '',
        identificationCode: '',
        storeMtlsCertificate: Boolean(response.mtlsCertificate),
        storeOAuth2Credentials: Boolean(response.oauth2Credentials),
        preferredMethod: response.mtlsCertificate ? 'mtls' : 'oauth2',
        mtlsCertificateRef: mtlsCertificateRef?.id ?? '',
        oauthClientIdRef: oauthClientIdRef?.id ?? '',
        oauthClientSecretRef: oauthClientSecretRef?.id ?? '',
        openIdConfigurationEndpoint: response.oauth2Credentials?.openIdConfigurationEndpoint ?? '',
        tokenEndpoint: response.oauth2Credentials?.tokenEndpoint ?? '',
      };
      const savePayload = createProfileSavePayload({
        formState: enrolledFormState,
        profile,
        kafkaConfig,
        enrollmentResponse: response,
        storedEnrollmentRefs: {
          mtlsCertificateRef,
          oauthClientIdRef,
          oauthClientSecretRef,
        },
      });

      setEnrollmentResponse(response);
      setFormState(enrolledFormState);
      onSave(savePayload.profile, savePayload.kafkaConfig);
    } catch (error) {
      setEnrollmentResponse(undefined);
      setEnrollmentError(error instanceof Error ? error.message : 'Tech User Enrollment ist fehlgeschlagen.');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSaveProfile) {
      return;
    }

    const savePayload = createProfileSavePayload({
      formState,
      profile,
      kafkaConfig,
      enrollmentResponse,
    });

    onSave(savePayload.profile, savePayload.kafkaConfig);
  };

  return (
    <form className="placeholder-panel placeholder-panel--large profile-editor" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <h2>{profile ? 'Profil bearbeiten' : 'Profil anlegen'}</h2>
          <p>SAF Identity und Tech User Enrollment mit lokaler Secret-Ablage konfigurieren.</p>
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
          <button className="button button--primary" disabled={!canSaveProfile} type="submit">
            Speichern
          </button>
        </div>
      </div>

      <FormSection number="01" title="SAF Identity">
        <div className="form-grid">
          <TextField label="Name" required value={formState.name} onChange={handleNameChange} />
          <TextField
            label="Profil-ID"
            required
            value={formState.id}
            onChange={(value) => handleChange('id', toSlug(value))}
            disabled
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
            onChange={(value) => handleEnvironmentChange(value as ProfileEnvironment)}
          />
          <TextField label="Licence Key" wide value={formState.licenceKey} onChange={(value) => handleChange('licenceKey', value)} />
          <TextAreaField label="Beschreibung" value={formState.description} onChange={(value) => handleChange('description', value)} />
        </div>
      </FormSection>

      <FormSection number="02" title="Tech User Enrollment">
        <div className="form-grid">
          <TextField label="Tech User IDP Number" value={formState.techUserIdpNumber} onChange={(value) => handleChange('techUserIdpNumber', value)} />
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
        {enrollmentError && <p className="form-message form-message--error">{enrollmentError}</p>}
      </FormSection>

    </form>
  );
}

function createProfileSavePayload({
  enrollmentResponse,
  formState,
  kafkaConfig: _kafkaConfig,
  profile,
  storedEnrollmentRefs,
}: {
  enrollmentResponse?: TechUserEnrollmentResponse;
  formState: ProfileFormState;
  kafkaConfig?: KafkaConfig;
  profile?: SafProfile;
  storedEnrollmentRefs?: StoredEnrollmentRefs;
}): ProfileSavePayload {
  const now = new Date().toISOString();
  const profileId = formState.id.trim();
  const ecoHubId = optionalValue(formState.ecoHubId) ?? `local-${profileId}`;
  const standard = optionalValue(formState.standard) ?? 'saf';
  const kafkaConfigId = profileId;
  const kafkaClientId =
    profile && formState.kafkaClientId.trim()
      ? formState.kafkaClientId.trim()
      : `ecohub-saf-client-${profileId}`;
  const kafkaCredentialsRef =
    profile && formState.kafkaCredentialsRef.trim()
      ? formState.kafkaCredentialsRef.trim()
      : `ref://tech-users/${profileId}`;
  const encryptionKeyPairRef =
    profile && optionalValue(formState.encryptionKeyPairRef)
      ? formState.encryptionKeyPairRef.trim()
      : `ref://keys/${profileId}/encryption`;
  const encryptionPublicKeyRef =
    profile && optionalValue(formState.encryptionPublicKeyRef)
      ? formState.encryptionPublicKeyRef.trim()
      : `ref://keys/${profileId}/encryption/public`;
  const encryptionPrivateKeyRef =
    profile && optionalValue(formState.encryptionPrivateKeyRef)
      ? formState.encryptionPrivateKeyRef.trim()
      : `ref://keys/${profileId}/encryption/private`;
  const signingKeyPairRef =
    profile && optionalValue(formState.signingKeyPairRef)
      ? formState.signingKeyPairRef.trim()
      : `ref://keys/${profileId}/signing`;
  const signingPublicKeyRef =
    profile && optionalValue(formState.signingPublicKeyRef)
      ? formState.signingPublicKeyRef.trim()
      : `ref://keys/${profileId}/signing/public`;
  const signingPrivateKeyRef =
    profile && optionalValue(formState.signingPrivateKeyRef)
      ? formState.signingPrivateKeyRef.trim()
      : `ref://keys/${profileId}/signing/private`;
  const storedMtlsCertificateRef =
    storedEnrollmentRefs?.mtlsCertificateRef ??
    (formState.storeMtlsCertificate && enrollmentResponse?.mtlsCertificate
      ? localSecretStore.setSecret(profileId, 'mtls-certificate', enrollmentResponse.mtlsCertificate.certificateBase64)
      : profile?.techUserAuth.mtlsCertificateRef);
  const storedOAuthClientIdRef =
    storedEnrollmentRefs?.oauthClientIdRef ??
    (formState.storeOAuth2Credentials && enrollmentResponse?.oauth2Credentials
      ? localSecretStore.setSecret(profileId, 'oauth-client-id', enrollmentResponse.oauth2Credentials.clientId)
      : profile?.techUserAuth.oauthClientIdRef);
  const storedOAuthClientSecretRef =
    storedEnrollmentRefs?.oauthClientSecretRef ??
    (formState.storeOAuth2Credentials && enrollmentResponse?.oauth2Credentials
      ? localSecretStore.setSecret(profileId, 'oauth-client-secret', enrollmentResponse.oauth2Credentials.clientSecret)
      : profile?.techUserAuth.oauthClientSecretRef);
  const hasMtlsCertificate = formState.storeMtlsCertificate && Boolean(storedMtlsCertificateRef);
  const hasOAuth2Credentials =
    formState.storeOAuth2Credentials && Boolean(storedOAuthClientIdRef && storedOAuthClientSecretRef);
  const availableMethods = authMethods.filter((method) =>
    method === 'mtls'
      ? hasMtlsCertificate
      : hasOAuth2Credentials,
  );
  const preferredMethod: TechUserAuthMethod = availableMethods.includes(formState.preferredMethod)
    ? formState.preferredMethod
    : availableMethods[0] ?? 'oauth2';
  const kafkaConfig: KafkaConfig = {
    clientId: kafkaClientId,
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
    kafkaConfig.saslMechanism = formState.kafkaSaslMechanism;
  }

  return {
    kafkaConfig,
    profile: {
      id: profileId,
      name: formState.name.trim(),
      type: formState.type,
      environment: formState.environment,
      description: optionalValue(formState.description),
      connectionStatus: profile?.connectionStatus ?? 'offline',
      ecoHubId,
      licenceKey: optionalValue(formState.licenceKey),
      standard,
      receiver: {
        ecoHubId: optionalValue(formState.receiverEcoHubId) ?? ecoHubId,
        standard: optionalValue(formState.receiverStandard) ?? standard,
        displayName: optionalValue(formState.receiverDisplayName) ?? formState.name.trim(),
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
          keyPairRef: encryptionKeyPairRef,
          publicKeyRef: encryptionPublicKeyRef,
          privateKeyRef: encryptionPrivateKeyRef,
          publicKeyId: optionalValue(formState.encryptionPublicKeyId),
        },
        signing: {
          usage: 'signing',
          keyPairRef: signingKeyPairRef,
          publicKeyRef: signingPublicKeyRef,
          privateKeyRef: signingPrivateKeyRef,
          publicKeyId: optionalValue(formState.signingPublicKeyId),
        },
      },
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    },
  };
}

function FormSection({
  children,
  number,
  title,
}: {
  children: ReactNode;
  number: string;
  title: string;
}) {
  return (
    <section className="form-section">
      <div className="form-section__header">
        <span className="form-section__number">{number}</span>
        <h3>{title}</h3>
      </div>
      <div className="form-section__body">{children}</div>
    </section>
  );
}

function TextField({
  disabled = false,
  label,
  onChange,
  required = false,
  type = 'text',
  value,
  wide = false,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? 'field field--wide' : 'field'}>
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
  const id = profile?.id ?? createProfileId('', 'prod');
  const preferredMethod = profile?.techUserAuth?.preferredMethod ?? 'oauth2';
  const mtlsCertificateRef = profile?.techUserAuth?.mtlsCertificateRef?.id ?? '';
  const oauthClientIdRef = profile?.techUserAuth?.oauthClientIdRef?.id ?? '';
  const oauthClientSecretRef = profile?.techUserAuth?.oauthClientSecretRef?.id ?? '';
  const techUserIdpNumber = profile?.techUserAuth?.techUserIdpNumber ?? '';

  return {
    id,
    name: profile?.name ?? '',
    type: profile?.type ?? 'consumer',
    environment: profile?.environment ?? 'prod',
    description: profile?.description ?? '',
    ecoHubId: profile?.ecoHubId ?? '',
    licenceKey: profile?.licenceKey ?? '',
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
    openIdConfigurationEndpoint: profile?.techUserAuth?.openIdConfigurationEndpoint ?? '',
    tokenEndpoint: profile?.techUserAuth?.tokenEndpoint ?? '',
    kafkaClientId: kafkaConfig?.clientId ?? `ecohub-saf-client-${id}`,
    kafkaBrokers: kafkaConfig?.brokers.join(', ') ?? 'localhost:9092',
    kafkaSecurityProtocol: kafkaConfig?.securityProtocol ?? 'PLAINTEXT',
    kafkaSslEnabled: kafkaConfig?.sslEnabled ?? false,
    kafkaSaslMechanism: kafkaConfig?.saslMechanism ?? '',
    kafkaInputTopic: kafkaConfig?.topics.inputTopic ?? DEFAULT_INPUT_TOPIC,
    kafkaOutputTopicOverride: kafkaConfig?.topics.outputTopicOverride ?? '',
    kafkaOutputTopicPattern: kafkaConfig?.topics.outputTopicPattern ?? DEFAULT_OUTPUT_TOPIC_PATTERN,
    kafkaConsumerGroupId: kafkaConfig?.consumerGroupId ?? '',
    kafkaCredentialsRef: kafkaConfig?.credentialsRef ?? `ref://tech-users/${id}`,
    encryptionKeyPairRef: profile?.keyReferences?.encryption.keyPairRef ?? `ref://keys/${id}/encryption`,
    encryptionPublicKeyRef: profile?.keyReferences?.encryption.publicKeyRef ?? `ref://keys/${id}/encryption/public`,
    encryptionPrivateKeyRef: profile?.keyReferences?.encryption.privateKeyRef ?? `ref://keys/${id}/encryption/private`,
    encryptionPublicKeyId: profile?.keyReferences?.encryption.publicKeyId ?? '',
    signingKeyPairRef: profile?.keyReferences?.signing.keyPairRef ?? `ref://keys/${id}/signing`,
    signingPublicKeyRef: profile?.keyReferences?.signing.publicKeyRef ?? `ref://keys/${id}/signing/public`,
    signingPrivateKeyRef: profile?.keyReferences?.signing.privateKeyRef ?? `ref://keys/${id}/signing/private`,
    signingPublicKeyId: profile?.keyReferences?.signing.publicKeyId ?? '',
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

function createProfileId(profileName: string, environment: ProfileEnvironment): string {
  const profileNameSlug = toSlug(profileName);
  return profileNameSlug ? `${profileNameSlug}-${environment}` : '';
}
