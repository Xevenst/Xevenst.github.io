import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const secret = process.env.FIREBASE_CONFIG_JSON;
const driveWebAppUrl = process.env.GOOGLE_DRIVE_WEB_APP_URL?.trim() || '';
const outputPath = fileURLToPath(
  new URL('../src/environments/firebase-config.ts', import.meta.url),
);
const instructions = [
  "import { FirebaseEnvironmentConfig } from './environment.model';",
  '',
  '// Local Firebase configuration. Do not commit this file.',
  '// In PowerShell, from the repository folder, set your Firebase Web app config:',
  `// $env:FIREBASE_CONFIG_JSON = '{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"...","measurementId":"..."}'`,
  "// $env:GOOGLE_DRIVE_WEB_APP_URL = 'https://script.google.com/macros/s/.../exec'",
  '// Then run:',
  '// node scripts/configure-firebase.mjs',
  '// npm start',
  '// Firebase Web config is visible in browser apps; never put service-account keys here.',
  '',
];

if (!secret && process.argv.includes('--allow-unconfigured')) {
  const existingConfig = existsSync(outputPath)
    ? readFileSync(outputPath, 'utf8')
    : [
      ...instructions,
      'export const firebaseConfig: FirebaseEnvironmentConfig | undefined = undefined;',
    ].join('\n');
  const configWithoutDriveUrl = existingConfig
    .replace(/^export const googleDriveWebAppUrl: string \| undefined = .*;\r?\n?/m, '')
    .trimEnd();
  writeFileSync(
    outputPath,
    `${configWithoutDriveUrl}\nexport const googleDriveWebAppUrl: string | undefined = ${JSON.stringify(driveWebAppUrl || undefined)};\n`,
    'utf8',
  );
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

if (driveWebAppUrl) {
  let endpoint;
  try {
    endpoint = new URL(driveWebAppUrl);
  } catch {
    throw new Error('GOOGLE_DRIVE_WEB_APP_URL must be a valid deployed Apps Script URL.');
  }
  if (
    endpoint.protocol !== 'https:'
    || endpoint.hostname !== 'script.google.com'
    || !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname)
  ) {
    throw new Error('GOOGLE_DRIVE_WEB_APP_URL must be the deployed Apps Script URL ending in /exec.');
  }
}

const output = [
  ...instructions,
  `export const firebaseConfig: FirebaseEnvironmentConfig = ${JSON.stringify(config, null, 2)};`,
  `export const googleDriveWebAppUrl: string | undefined = ${JSON.stringify(driveWebAppUrl || undefined)};`,
  '',
].join('\n');

writeFileSync(outputPath, output, 'utf8');
