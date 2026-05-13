import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

import { safOpenApiSpecs, type SafOpenApiSpecConfig } from '../src/saf/specs';

const rootDir = resolve(__dirname, '..');

async function generateTypes(spec: SafOpenApiSpecConfig): Promise<void> {
  const specPath = resolve(rootDir, spec.outputPath);
  const generatedTypesPath = resolve(rootDir, spec.generatedTypesPath);

  await mkdir(dirname(generatedTypesPath), { recursive: true });

  console.log(`Generating ${spec.name}`);
  console.log(`Spec Path: ${spec.outputPath}`);
  console.log(`Types Path: ${spec.generatedTypesPath}`);

  await runOpenApiTypescript(specPath, generatedTypesPath);
}

function runOpenApiTypescript(specPath: string, generatedTypesPath: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      'openapi-typescript',
      [specPath, '-o', generatedTypesPath],
      {
        cwd: rootDir,
        shell: process.platform === 'win32',
        stdio: 'inherit',
      },
    );

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`openapi-typescript exited with code ${code ?? 'unknown'}.`));
    });
  });
}

async function main() {
  for (const spec of safOpenApiSpecs) {
    await generateTypes(spec);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
