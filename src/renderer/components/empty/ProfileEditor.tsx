import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { DEFAULT_INPUT_TOPIC, DEFAULT_OUTPUT_TOPIC_PATTERN } from '../../domain/saf';
import type {
  KafkaConfig,
  ProfileEnvironment,
  SafProfile,
  SecretRef,
  ServiceProfileType,
  TechUserAuthMethod,
  TechUserEnrollmentResponse,
} from '../../models';
import { localSecretStore, techUserEnrollmentService } from '../../services';
import { GeneralApiError } from '../../../saf/services';

type ProfileEditorProps = {
  profile?: SafProfile;
  kafkaConfig?: KafkaConfig;
  onCancel: () => void;
  onDelete?: (profileId: string) => void;
  onSave: (profile: SafProfile, kafkaConfig: KafkaConfig, options?: { keepEditorOpen?: boolean }) => void;
};

type ProfileFormState = {
  id: string;
  name: string;
  type: ServiceProfileType;
  environment: ProfileEnvironment;
  description: string;
  licenceKey: string;
  techUserIdpNumber: string;
  enrollmentPassword: string;
  identificationCode: string;
  preferredMethod: TechUserAuthMethod;
  mtlsCertificateRef: string;
  oauthClientIdRef: string;
  oauthClientSecretRef: string;
  openIdConfigurationEndpoint: string;
  tokenEndpoint: string;
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

type EnrollmentConsoleState = {
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  title: string;
  timestamp?: string;
  content: unknown;
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
  const initialState = useMemo(() => createFormState(profile), [profile]);
  const [formState, setFormState] = useState<ProfileFormState>(initialState);
  const [enrollmentResponse, setEnrollmentResponse] = useState<TechUserEnrollmentResponse | undefined>();
  const [enrollmentError, setEnrollmentError] = useState<string | undefined>();
  const [isEnrollmentRunning, setIsEnrollmentRunning] = useState(false);
  const [enrollmentConsole, setEnrollmentConsole] = useState<EnrollmentConsoleState>({
    status: 'idle',
    title: 'Bereit fuer Tech User Enrollment',
    content: {
      message: 'Noch kein Enrollment ausgefuehrt.',
    },
  });
  const editorSessionKey = profile?.id ?? 'new-profile';

  useEffect(() => {
    setFormState(initialState);
    setEnrollmentResponse(undefined);
    setEnrollmentError(undefined);
    setIsEnrollmentRunning(false);
    setEnrollmentConsole({
      status: 'idle',
      title: 'Bereit fuer Tech User Enrollment',
      content: {
        message: 'Noch kein Enrollment ausgefuehrt.',
      },
    });
  }, [editorSessionKey]);

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
  const canRunEnrollment = canSaveProfile && !isEnrollmentRunning;

  const handleRunEnrollment = async () => {
    if (!canRunEnrollment) {
      const message = 'Profilname ist erforderlich, bevor Tech User Enrollment ausgefuehrt werden kann.';
      setEnrollmentError(message);
      setEnrollmentConsole(createEnrollmentConsoleState('error', 'Enrollment nicht gestartet', { error: message }));
      return;
    }

    setEnrollmentError(undefined);
    setIsEnrollmentRunning(true);
    let resolvedEnrollmentUrl: string | undefined;

    try {
      resolvedEnrollmentUrl = techUserEnrollmentService.resolveEnrollmentUrl({
        environmentId: formState.environment,
      });
      setEnrollmentConsole(createEnrollmentConsoleState('running', 'Enrollment Call laeuft', {
        profileId: formState.id,
        environment: formState.environment,
        resolvedUrl: resolvedEnrollmentUrl,
        techUserIdpNumber: formState.techUserIdpNumber || '(leer)',
        licenceKey: maskSecretValue(formState.licenceKey),
        password: maskSecretValue(formState.enrollmentPassword),
        identificationCode: maskSecretValue(formState.identificationCode),
      }));
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
      setEnrollmentConsole(createEnrollmentConsoleState('success', 'Enrollment Response', sanitizeEnrollmentResponse(response)));
      onSave(savePayload.profile, savePayload.kafkaConfig, { keepEditorOpen: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tech User Enrollment ist fehlgeschlagen.';
      setEnrollmentResponse(undefined);
      setEnrollmentError(message);
      setEnrollmentConsole(createEnrollmentConsoleState('error', 'Enrollment fehlgeschlagen', createEnrollmentErrorConsoleContent(error, message, {
        profileId: formState.id,
        environment: formState.environment,
        resolvedUrl: resolvedEnrollmentUrl,
      })));
    } finally {
      setIsEnrollmentRunning(false);
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
            <div className="button-row">
              <button className="button button--secondary" disabled={!canRunEnrollment} type="button" onClick={handleRunEnrollment}>
                {isEnrollmentRunning ? 'Running...' : 'Run Enrollment'}
              </button>
            </div>
          </div>
          <StatusField label="mTLS certificate available" active={Boolean(enrollmentResponse?.mtlsCertificate || formState.mtlsCertificateRef)} />
          <StatusField label="OAuth2 credentials available" active={Boolean(enrollmentResponse?.oauth2Credentials || formState.oauthClientIdRef)} />
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
        <EnrollmentConsole state={enrollmentConsole} />
      </FormSection>

    </form>
  );
}

function createEnrollmentConsoleState(
  status: EnrollmentConsoleState['status'],
  title: string,
  content: unknown,
): EnrollmentConsoleState {
  return {
    status,
    title,
    timestamp: new Date().toISOString(),
    content,
  };
}

function sanitizeEnrollmentResponse(response: TechUserEnrollmentResponse) {
  return {
    techUserIdpNumber: response.techUserIdpNumber,
    enrolledAt: response.enrolledAt,
    mtlsCertificate: response.mtlsCertificate
      ? {
          certificateBase64: maskSecretValue(response.mtlsCertificate.certificateBase64),
          expiresAt: response.mtlsCertificate.expiresAt,
          fingerprint: response.mtlsCertificate.fingerprint,
        }
      : undefined,
    oauth2Credentials: response.oauth2Credentials
      ? {
          clientId: maskSecretValue(response.oauth2Credentials.clientId),
          clientSecret: maskSecretValue(response.oauth2Credentials.clientSecret),
          openIdConfigurationEndpoint: response.oauth2Credentials.openIdConfigurationEndpoint,
          tokenEndpoint: response.oauth2Credentials.tokenEndpoint,
          scope: response.oauth2Credentials.scope,
        }
      : undefined,
  };
}

function createEnrollmentErrorConsoleContent(
  error: unknown,
  message: string,
  context: { profileId: string; environment: ProfileEnvironment; resolvedUrl?: string },
) {
  if (error instanceof GeneralApiError) {
    return {
      error: message,
      apiStatus: error.status,
      apiErrorCode: error.errorCode,
      apiErrorMessage: error.apiErrorMessage,
      apiResponse: error.responseBody,
      ...context,
    };
  }

  return {
    error: message,
    ...context,
  };
}

function maskSecretValue(value?: string): string {
  if (!value?.trim()) {
    return '(leer)';
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length <= 8) {
    return '***';
  }

  return `${trimmedValue.slice(0, 4)}...${trimmedValue.slice(-4)}`;
}

function EnrollmentConsole({ state }: { state: EnrollmentConsoleState }) {
  return (
    <div className={`enrollment-console enrollment-console--${state.status}`}>
      <div className="enrollment-console__header">
        <span>{state.title}</span>
        {state.timestamp && <time dateTime={state.timestamp}>{formatConsoleTimestamp(state.timestamp)}</time>}
      </div>
      <pre>{JSON.stringify(state.content, null, 2)}</pre>
    </div>
  );
}

function formatConsoleTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}

function createProfileSavePayload({
  enrollmentResponse,
  formState,
  kafkaConfig,
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
  const ecoHubId = profile?.ecoHubId ?? `local-${profileId}`;
  const standard = profile?.standard ?? 'saf';
  const kafkaConfigId = profileId;
  const storedMtlsCertificateRef =
    storedEnrollmentRefs?.mtlsCertificateRef ??
    (enrollmentResponse?.mtlsCertificate
      ? localSecretStore.setSecret(profileId, 'mtls-certificate', enrollmentResponse.mtlsCertificate.certificateBase64)
      : profile?.techUserAuth.mtlsCertificateRef);
  const storedOAuthClientIdRef =
    storedEnrollmentRefs?.oauthClientIdRef ??
    (enrollmentResponse?.oauth2Credentials
      ? localSecretStore.setSecret(profileId, 'oauth-client-id', enrollmentResponse.oauth2Credentials.clientId)
      : profile?.techUserAuth.oauthClientIdRef);
  const storedOAuthClientSecretRef =
    storedEnrollmentRefs?.oauthClientSecretRef ??
    (enrollmentResponse?.oauth2Credentials
      ? localSecretStore.setSecret(profileId, 'oauth-client-secret', enrollmentResponse.oauth2Credentials.clientSecret)
      : profile?.techUserAuth.oauthClientSecretRef);
  const hasMtlsCertificate = Boolean(storedMtlsCertificateRef);
  const hasOAuth2Credentials = Boolean(storedOAuthClientIdRef && storedOAuthClientSecretRef);
  const availableMethods = authMethods.filter((method) =>
    method === 'mtls'
      ? hasMtlsCertificate
      : hasOAuth2Credentials,
  );
  const preferredMethod: TechUserAuthMethod = availableMethods.includes(formState.preferredMethod)
    ? formState.preferredMethod
    : availableMethods[0] ?? 'oauth2';
  const savedKafkaConfig: KafkaConfig = {
    clientId: kafkaConfig?.clientId ?? `ecohub-saf-client-${profileId}`,
    brokers: kafkaConfig?.brokers ?? ['localhost:9092'],
    securityProtocol: kafkaConfig?.securityProtocol ?? 'PLAINTEXT',
    sslEnabled: kafkaConfig?.sslEnabled ?? false,
    topics: {
      inputTopic: kafkaConfig?.topics.inputTopic ?? DEFAULT_INPUT_TOPIC,
      outputTopicOverride: kafkaConfig?.topics.outputTopicOverride,
      outputTopicPattern: kafkaConfig?.topics.outputTopicPattern ?? DEFAULT_OUTPUT_TOPIC_PATTERN,
    },
    consumerGroupId: kafkaConfig?.consumerGroupId,
    credentialsRef: kafkaConfig?.credentialsRef ?? `ref://tech-users/${profileId}`,
  };

  if (kafkaConfig?.saslMechanism) {
    savedKafkaConfig.saslMechanism = kafkaConfig.saslMechanism;
  }

  return {
    kafkaConfig: savedKafkaConfig,
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
        ecoHubId: profile?.receiver.ecoHubId ?? ecoHubId,
        standard: profile?.receiver.standard ?? standard,
        displayName: profile?.receiver.displayName ?? formState.name.trim(),
      },
      kafkaConfigId,
      techUserAuth: {
        availableMethods,
        preferredMethod,
        techUserIdpNumber: formState.techUserIdpNumber.trim(),
        mtlsCertificateRef: storedMtlsCertificateRef,
        oauthClientIdRef: storedOAuthClientIdRef,
        oauthClientSecretRef: storedOAuthClientSecretRef,
        openIdConfigurationEndpoint: hasOAuth2Credentials
          ? optionalValue(formState.openIdConfigurationEndpoint)
          : undefined,
        tokenEndpoint: hasOAuth2Credentials ? optionalValue(formState.tokenEndpoint) : undefined,
        enrollmentStatus: enrollmentResponse || availableMethods.length > 0 ? 'enrolled' : 'not-enrolled',
        lastEnrollmentAt: enrollmentResponse?.enrolledAt ?? profile?.techUserAuth.lastEnrollmentAt,
      },
      keyReferences: {
        encryption: {
          usage: 'encryption',
          keyPairRef: profile?.keyReferences?.encryption.keyPairRef ?? `ref://keys/${profileId}/encryption`,
          publicKeyRef: profile?.keyReferences?.encryption.publicKeyRef ?? `ref://keys/${profileId}/encryption/public`,
          privateKeyRef: profile?.keyReferences?.encryption.privateKeyRef ?? `ref://keys/${profileId}/encryption/private`,
          publicKeyId: profile?.keyReferences?.encryption.publicKeyId,
        },
        signing: {
          usage: 'signing',
          keyPairRef: profile?.keyReferences?.signing.keyPairRef ?? `ref://keys/${profileId}/signing`,
          publicKeyRef: profile?.keyReferences?.signing.publicKeyRef ?? `ref://keys/${profileId}/signing/public`,
          privateKeyRef: profile?.keyReferences?.signing.privateKeyRef ?? `ref://keys/${profileId}/signing/private`,
          publicKeyId: profile?.keyReferences?.signing.publicKeyId,
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

function StatusField({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="field tech-user-status">
      <span>{label}</span>
      <strong>{active ? 'available' : 'not available'}</strong>
    </div>
  );
}

function createFormState(profile?: SafProfile): ProfileFormState {
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
    licenceKey: profile?.licenceKey ?? '',
    techUserIdpNumber,
    enrollmentPassword: '',
    identificationCode: '',
    preferredMethod,
    mtlsCertificateRef,
    oauthClientIdRef,
    oauthClientSecretRef,
    openIdConfigurationEndpoint: profile?.techUserAuth?.openIdConfigurationEndpoint ?? '',
    tokenEndpoint: profile?.techUserAuth?.tokenEndpoint ?? '',
  };
}

function optionalValue(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
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
