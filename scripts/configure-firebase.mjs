import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const secret = process.env.FIREBASE_CONFIG_JSON;
const outputPath = fileURLToPath(
  new URL('../src/environments/firebase-config.ts', import.meta.url),
);
const instructions = [
  "import { FirebaseEnvironmentConfig } from './environment.model';",
  '',
  '// Local Firebase configuration. Do not commit this file.',
  '// In PowerShell, from the repository folder, set your Firebase Web app config:',
  `// $env:FIREBASE_CONFIG_JSON = '{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"...","measurementId":"..."}'`,
  '// Then run:',
  '// node scripts/configure-firebase.mjs',
  '// npm start',
  '// Firebase Web config is visible in browser apps; never put service-account keys here.',
  '',
];

if (!secret && process.argv.includes('--allow-unconfigured')) {
  if (!existsSync(outputPath)) {
    writeFileSync(
      outputPath,
      [...instructions, 'export const firebaseConfig: FirebaseEnvironmentConfig | undefined = undefined;', ''].join('\n'),
      'utf8',
    );
  }
  process.exit(0);
}

if (!secret) {
  throw new Error('The FIREBASE_CONFIG_JSON secret is required to configure this build.');
}

let config;
try {
  config = JSON.parse(secret);
} catch {
  throw new Error('FIREBASE_CONFIG_JSON must contain valid JSON.');
}

const requiredFields = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];
const allowedFields = new Set([...requiredFields, 'measurementId']);

if (
  typeof config !== 'object'
  || config === null
  || Array.isArray(config)
  || Object.keys(config).some((field) => !allowedFields.has(field))
  || requiredFields.some((field) => typeof config[field] !== 'string' || !config[field].trim())
  || (config.measurementId !== undefined && typeof config.measurementId !== 'string')
) {
  throw new Error(
    'FIREBASE_CONFIG_JSON must contain only the Firebase web app configuration fields.',
  );
}

const output = [
  ...instructions,
  `export const firebaseConfig: FirebaseEnvironmentConfig = ${JSON.stringify(config, null, 2)};`,
  '',
].join('\n');

writeFileSync(outputPath, output, 'utf8');
