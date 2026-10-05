import { spawn } from 'node:child_process';

const config = {
  ASTRO_DEV_BACKGROUND: '0',
  REGISTRO_SANDBOX_MODE: 'true',
  ENABLE_SANDBOX_REGISTRATION: 'true',
  USE_MOCK_GOOGLE: 'true',
  ENABLE_REAL_GOOGLE_SANDBOX: 'false',
  LOCAL_SANDBOX_BROWSER_AUTH: 'true',
  SANDBOX_REGISTRATION_TOKEN: 'token-desarrollo-ficticio-no-secreto',
};

if (process.argv.includes('--print-config')) {
  console.log(JSON.stringify(config, null, 2));
} else {
  // Nunca exportar credenciales Google/Firestore personales al proceso de prueba.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !key.startsWith('SANDBOX_GOOGLE_') &&
        !key.startsWith('SANDBOX_FIRESTORE_'),
    ),
  );
  const child = spawn(
    'pnpm',
    ['dev', '--host', '127.0.0.1', '--port', '4337'],
    {
      stdio: 'inherit',
      env: { ...env, ...config },
    },
  );
  child.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => child.kill(signal));
}
