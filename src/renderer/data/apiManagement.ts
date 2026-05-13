import { safApiRegistry } from '../../saf/apiRegistry';
import { apiOperationRegistry } from '../../saf/generated/apiOperationRegistry';
import type { ActiveApiVersionMapping, ApiManagementConfig, ProfileEnvironment, SafEnvironment } from '../models';

export const apiManagementConfig: ApiManagementConfig = {
  apis: Object.values(
    safApiRegistry.reduce<Record<string, ApiManagementConfig['apis'][number]>>((apis, registryEntry) => {
      const api = apis[registryEntry.apiId] ?? {
        id: registryEntry.apiId,
        name: registryEntry.apiName,
        versions: [],
      };

      api.versions.push({
        apiId: registryEntry.apiId,
        version: registryEntry.version,
        name: `${registryEntry.apiName} ${registryEntry.version}`,
        basePath: registryEntry.basePath,
        localSpecPath: registryEntry.localSpecPath,
        generatedTypesPath: registryEntry.generatedTypesPath,
        supportStatus: registryEntry.supportStatus,
        operations: apiOperationRegistry[registryEntry.id] ?? [],
      });

      return {
        ...apis,
        [registryEntry.apiId]: api,
      };
    }, {}),
  ).map((api) => ({
    ...api,
    versions: [...api.versions].sort((left, right) => compareApiVersionsDescending(left.version, right.version)),
  })),
};

export const defaultSafEnvironments: Record<ProfileEnvironment, SafEnvironment> = {
  prod: {
    id: 'prod',
    name: 'PROD',
    baseUrl: '',
    activeApiVersions: createDefaultActiveApiVersions(),
    timeoutMs: 10000,
  },
  iat: {
    id: 'iat',
    name: 'IAT',
    baseUrl: '',
    activeApiVersions: createDefaultActiveApiVersions(),
    timeoutMs: 8000,
  },
  test: {
    id: 'test',
    name: 'TEST',
    baseUrl: '',
    activeApiVersions: createDefaultActiveApiVersions(),
    timeoutMs: 8000,
  },
  dev: {
    id: 'dev',
    name: 'DEV',
    baseUrl: '',
    activeApiVersions: createDefaultActiveApiVersions(),
    timeoutMs: 5000,
  },
};

export function createDefaultActiveApiVersions(): ActiveApiVersionMapping {
  return Object.fromEntries(
    apiManagementConfig.apis.map((api) => [
      api.id,
      api.versions.find((version) => version.supportStatus === 'supported')?.version ?? api.versions[0]?.version,
    ]),
  );
}

function compareApiVersionsDescending(left: string, right: string): number {
  const leftParts = parseApiVersion(left);
  const rightParts = parseApiVersion(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart !== rightPart) {
      return rightPart - leftPart;
    }
  }

  return right.localeCompare(left);
}

function parseApiVersion(version: string): number[] {
  return version.split('.').map((part) => {
    const parsedPart = Number(part);
    return Number.isFinite(parsedPart) ? parsedPart : 0;
  });
}
