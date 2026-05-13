export type SafApiVersion = `${number}.${number}.${number}`;

export type SafApiRegistryEntry = {
  id: string;
  apiId: string;
  apiName: string;
  version: SafApiVersion;
  basePath: string;
  sourceUrl: string;
  outputPath: string;
  localSpecPath: string;
  generatedTypesPath: string;
  supportStatus: 'supported' | 'experimental' | 'deprecated';
};

export const safApiRegistry: SafApiRegistryEntry[] = [
  {
    id: 'general-api-1.2.0',
    apiId: 'general-api',
    apiName: 'General API',
    version: '1.2.0',
    basePath: '/general/v1',
    sourceUrl:
      'https://raw.githubusercontent.com/EcoHub-AG/Api-Specs/refs/tags/saf-general-api-v1.2.0/General-Api/OAS-SAF-General-apis.yaml',
    outputPath: 'specs/general-api-1.2.0.yaml',
    localSpecPath: 'specs/general-api-1.2.0.yaml',
    generatedTypesPath: 'src/saf/generated/general-api-1.2.0.ts',
    supportStatus: 'deprecated',
  },
  {
    id: 'general-api-2.0.0',
    apiId: 'general-api',
    apiName: 'General API',
    version: '2.0.0',
    basePath: '/general/v2',
    sourceUrl:
      'https://raw.githubusercontent.com/EcoHub-AG/Api-Specs/refs/tags/saf-general-api-v2.0.0/General-Api/OAS-SAF-General-apis.yaml',
    outputPath: 'specs/general-api-2.0.0.yaml',
    localSpecPath: 'specs/general-api-2.0.0.yaml',
    generatedTypesPath: 'src/saf/generated/general-api-2.0.0.ts',
    supportStatus: 'supported',
  },
  {
    id: 'public-key-store-api-1.2.0',
    apiId: 'public-key-store-api',
    apiName: 'Public Key Store API',
    version: '1.2.0',
    basePath: '/publickeystore/v1',
    sourceUrl: 'https://raw.githubusercontent.com/EcoHub-AG/Api-Specs/refs/tags/pki-api-v1.2.0/PKI-Api/OAS-PublicKeyAPI.yaml',
    outputPath: 'specs/public-key-store-api-2.0.0.yaml',
    localSpecPath: 'specs/public-key-store-api-2.0.0.yaml',
    generatedTypesPath: 'src/saf/generated/public-key-store-api-2.0.0.ts',
    supportStatus: 'supported',
  },
  {
    id: 'public-key-store-api-2.0.0',
    apiId: 'public-key-store-api',
    apiName: 'Public Key Store API',
    version: '2.0.0',
    basePath: '/publickeystore/v2',
    sourceUrl: 'https://raw.githubusercontent.com/EcoHub-AG/Api-Specs/refs/tags/pki-api-v2.0.0/PKI-Api/OAS-PublicKeyAPI.yaml',
    outputPath: 'specs/public-key-store-api-2.0.0.yaml',
    localSpecPath: 'specs/public-key-store-api-2.0.0.yaml',
    generatedTypesPath: 'src/saf/generated/public-key-store-api-2.0.0.ts',
    supportStatus: 'supported',
  },
];
