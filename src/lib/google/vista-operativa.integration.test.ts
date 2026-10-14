import { config as loadEnv } from 'dotenv';
import { google } from 'googleapis';
import { describe, it } from 'vitest';

import { crearPuertoSheetsGoogle } from './vista-operativa-google';
import { aplicarVistaOperativa } from './vista-operativa-aplicar';

loadEnv({ quiet: true });

// Opt-in: omitida salvo autorización explícita; sin ella no toca Google ni CI.
const habilitada = process.env.RUN_GOOGLE_SANDBOX_VISTA === 'true';
const confirmar = process.env.SANDBOX_VISTA_CONFIRMAR === 'true';
const describeVista = habilitada ? describe : describe.skip;

describeVista('vista operativa en el sandbox propio autorizado', () => {
  it(
    confirmar ? 'aplica la vista' : 'sólo planifica (sin escrituras)',
    async () => {
      const necesarias = [
        'SANDBOX_GOOGLE_OAUTH_CLIENT_ID',
        'SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET',
        'SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN',
        'SANDBOX_GOOGLE_SPREADSHEET_ID',
      ] as const;
      const faltantes = necesarias.filter((n) => !process.env[n]?.trim());
      if (faltantes.length > 0) {
        throw new Error(`Falta configuración local: ${faltantes.join(', ')}`);
      }

      const auth = new google.auth.OAuth2(
        process.env.SANDBOX_GOOGLE_OAUTH_CLIENT_ID,
        process.env.SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET,
      );
      auth.setCredentials({
        refresh_token: process.env.SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN,
      });
      const sheets = google.sheets({ version: 'v4', auth });
      const puerto = crearPuertoSheetsGoogle(
        sheets as unknown as Parameters<typeof crearPuertoSheetsGoogle>[0],
        process.env.SANDBOX_GOOGLE_SPREADSHEET_ID as string,
      );

      const resultado = await aplicarVistaOperativa(puerto, { confirmar });
      // Sólo cantidades y banderas: nunca IDs, URLs ni contenido de filas.
      console.log(
        `Vista operativa: ${JSON.stringify(resultado)} (confirmar=${confirmar})`,
      );
    },
    60_000,
  );
});
