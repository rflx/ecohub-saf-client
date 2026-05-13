export type SafOpenApiSpecConfig = {
  id: 'general-api-v2' | 'public-key-store-api-v2';
  name: string;
  sourceUrl: string;
  outputPath: string;
  generatedTypesPath: string;
};

export const safOpenApiSpecs: SafOpenApiSpecConfig[] = [
  {
    id: 'general-api-v2',
    name: 'SAF General API v2',
    sourceUrl: 'https://raw.githubusercontent.com/EcoHub-AG/Api-Specs/saf-general-api-v2.0.0/General-Api/OAS-SAF-General-apis.yaml',
    outputPath: 'specs/general-api-v2.yaml',
    generatedTypesPath: 'src/saf/generated/general-api-v2.ts',
  },
  {
    id: 'public-key-store-api-v2',
    name: 'SAF Public Key Store API v2',
    sourceUrl: 'https://raw.githubusercontent.com/EcoHub-AG/Api-Specs/pki-api-v2.0.0/PKI-Api/OAS-PublicKeyAPI.yaml',
    outputPath: 'specs/public-key-store-api-v2.yaml',
    generatedTypesPath: 'src/saf/generated/public-key-store-api-v2.ts',
  },
];
