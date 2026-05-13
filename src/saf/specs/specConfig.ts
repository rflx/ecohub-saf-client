import { safApiRegistry } from '../apiRegistry';

export const safOpenApiSpecs = safApiRegistry.map(
  ({ id, apiId, apiName, version, sourceUrl, outputPath, localSpecPath, generatedTypesPath, supportStatus }) => ({
    id,
    apiId,
    version,
    name: `${apiName} ${version}`,
    sourceUrl,
    outputPath,
    localSpecPath,
    generatedTypesPath,
    supportStatus,
  }),
);

export type SafOpenApiSpecConfig = (typeof safOpenApiSpecs)[number];
