import { tokenSandboxE2e } from '../tests/fixtures/registro';

const TARGET = process.env.TARGET_URL || 'http://127.0.0.1:4337';

async function correrSmoke() {
  console.log(`Iniciando Smoke Test contra: ${TARGET}`);

  const resFront = await fetch(`${TARGET}/registro`);
  console.log(
    `Frontend /registro: HTTP ${resFront.status} ${resFront.status === 200 ? 'EXITO' : 'FALLO'}`,
  );

  const resSinToken = await fetch(`${TARGET}/api/register`, { method: 'POST' });
  console.log(
    `Proteccion de API (sin token): HTTP ${resSinToken.status} (Esperado 401/403) ${[401, 403].includes(resSinToken.status) ? 'EXITO' : 'FALLO'}`,
  );

  const resConToken = await fetch(`${TARGET}/api/register`, {
    method: 'POST',
    headers: { authorization: `Bearer ${tokenSandboxE2e}` },
  });
  console.log(
    `API con token (Bad Request esperado): HTTP ${resConToken.status} ${resConToken.status === 400 ? 'EXITO' : 'FALLO'}`,
  );

  console.log(
    '\nSmoke test finalizado. Verifique que no haya evasion de acceso.',
  );
}

correrSmoke();
