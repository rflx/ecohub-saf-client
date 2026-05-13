import { apiManagementConfig } from '../../data/apiManagement';
import type {
  ApiId,
  ApiManagementConfig,
  ApiOperationDefinition,
  ApiSpecDefinition,
  ApiVersion,
  ProfileEnvironment,
  SafEnvironment,
  SafProfile,
} from '../../models';

export type ApiRuntimeResolverInput = {
  profileId?: string;
  environmentId?: ProfileEnvironment;
  apiId: ApiId;
  operationId: string;
};

export type ApiRuntimeResolution = {
  baseUrl: string;
  apiVersion: ApiVersion;
  apiBasePath: string;
  operationPath: string;
  resolvedUrl: string;
};

export class ApiRuntimeResolver {
  constructor(
    private readonly environments: Record<ProfileEnvironment, SafEnvironment>,
    private readonly profiles: SafProfile[],
    private readonly config: ApiManagementConfig = apiManagementConfig,
  ) {}

  resolve(input: ApiRuntimeResolverInput): ApiRuntimeResolution {
    const environment = this.resolveEnvironment(input);
    const activeVersion = this.resolveActiveVersion(environment, input.apiId);
    const apiVersion = this.resolveApiVersion(input.apiId, activeVersion);
    const operation = this.resolveOperation(apiVersion, input.operationId);
    const baseUrl = environment.baseUrl;

    return {
      baseUrl,
      apiVersion: apiVersion.version,
      apiBasePath: apiVersion.basePath,
      operationPath: operation.path,
      resolvedUrl: joinUrl(baseUrl, apiVersion.basePath, operation.path),
    };
  }

  private resolveEnvironment(input: ApiRuntimeResolverInput): SafEnvironment {
    if (input.environmentId) {
      const environment = this.environments[input.environmentId];

      if (!environment) {
        throw new Error(`Environment not found: ${input.environmentId}`);
      }

      return environment;
    }

    if (input.profileId) {
      const profile = this.profiles.find((item) => item.id === input.profileId);

      if (!profile) {
        throw new Error(`Profile not found: ${input.profileId}`);
      }

      const environment = this.environments[profile.environment];

      if (!environment) {
        throw new Error(`Environment not found: ${profile.environment}`);
      }

      return environment;
    }

    throw new Error('ApiRuntimeResolver requires profileId or environmentId.');
  }

  private resolveActiveVersion(environment: SafEnvironment, apiId: ApiId): ApiVersion {
    const version = environment.activeApiVersions[apiId];

    if (!version) {
      throw new Error(`No active API version configured for ${apiId} in ${environment.id}.`);
    }

    return version;
  }

  private resolveApiVersion(apiId: ApiId, version: ApiVersion): ApiSpecDefinition {
    const api = this.config.apis.find((item) => item.id === apiId);
    const apiVersion = api?.versions.find((item) => item.version === version);

    if (!apiVersion) {
      throw new Error(`API spec not found for ${apiId} ${version}.`);
    }

    return apiVersion;
  }

  private resolveOperation(apiVersion: ApiSpecDefinition, operationId: string): ApiOperationDefinition {
    const operation = apiVersion.operations.find(
      (item) => item.id === operationId || item.operationId === operationId || getPathOperationId(item.path) === operationId,
    );

    if (!operation) {
      throw new Error(`Operation not found for ${apiVersion.apiId} ${apiVersion.version}: ${operationId}`);
    }

    return operation;
  }
}

function joinUrl(...parts: string[]): string {
  return parts
    .map((part, index) => (index === 0 ? part.replace(/\/+$/, '') : part.replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/');
}

function getPathOperationId(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/+$/g, '');
}
