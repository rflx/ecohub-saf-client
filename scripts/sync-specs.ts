import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';

import { safOpenApiSpecs, type SafOpenApiSpecConfig } from '../src/saf/specs';

type SyncResult = {
  spec: SafOpenApiSpecConfig;
  status: number | 'NETWORK_ERROR';
  ok: boolean;
  message?: string;
};

const rootDir = resolve(__dirname, '..');

async function downloadSpec(spec: SafOpenApiSpecConfig): Promise<SyncResult> {
  const outputPath = resolve(rootDir, spec.outputPath);

  try {
    const response = await fetch(spec.sourceUrl);
    const text = await response.text();

    logSpec(spec, response.status);

    if (!response.ok) {
      return {
        spec,
        status: response.status,
        ok: false,
        message: `Download failed with HTTP ${response.status}. Local file was not changed.`,
      };
    }

    if (text.trim().length === 0) {
      return {
        spec,
        status: response.status,
        ok: false,
        message: 'Downloaded response was empty. Local file was not changed.',
      };
    }

    if (!isOpenApiYaml(text)) {
      return {
        spec,
        status: response.status,
        ok: false,
        message: 'Downloaded response does not look like an OpenAPI YAML document. Local file was not changed.',
      };
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, text, 'utf8');

    return {
      spec,
      status: response.status,
      ok: true,
      message: 'Spec synchronized successfully.',
    };
  } catch (error) {
    logSpec(spec, 'NETWORK_ERROR');

    return {
      spec,
      status: 'NETWORK_ERROR',
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown network error.',
    };
  }
}

function isOpenApiYaml(text: string): boolean {
  return /^openapi:\s*['"]?3\./m.test(text);
}

function logSpec(spec: SafOpenApiSpecConfig, status: number | 'NETWORK_ERROR') {
  console.log(`Spec Name: ${spec.name}`);
  console.log(`Source URL: ${spec.sourceUrl}`);
  console.log(`Output Path: ${spec.outputPath}`);
  console.log(`HTTP Status: ${status}`);
}

async function main() {
  const results = await Promise.all(safOpenApiSpecs.map(downloadSpec));
  const failedResults = results.filter((result) => !result.ok);

  results.forEach((result) => {
    console.log(`${result.spec.id}: ${result.message}`);
  });

  if (failedResults.length > 0) {
    process.exitCode = 1;
  }
}

void main();
