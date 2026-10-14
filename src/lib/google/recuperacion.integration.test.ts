import { config as loadEnv } from 'dotenv';
import { google } from 'googleapis';
import { describe, it } from 'vitest';

import { diagnosticarRecuperacion } from './diagnostico-recuperacion';
import { prefijoArchivosDrive } from './real';
import { createFirestoreReservationStore } from './reservations';

loadEnv({ quiet: true });

// Opt-in y sólo lectura: omitida salvo autorización explícita.
const habilitada = process.env.RUN_GOOGLE_SANDBOX_RECUPERACION === 'true';
const describeRecuperacion = habilitada ? describe : describe.skip;

describeRecuperacion('diagnóstico de recuperación en el sandbox propio', () => {
  it('diagnostica un ID sin modificar nada', async () => {
    const transactionId = process.env.SANDBOX_DIAGNOSTICO_ID?.trim();
    if (!transactionId) throw new Error('Falta SANDBOX_DIAGNOSTICO_ID.');
    const necesarias = [
      'SANDBOX_GOOGLE_OAUTH_CLIENT_ID',
      'SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET',
      'SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN',
      'SANDBOX_GOOGLE_SPREADSHEET_ID',
      'SANDBOX_GOOGLE_DRIVE_FOLDER_ID',
      'SANDBOX_GOOGLE_SHEET_RANGE',
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
    const drive = google.drive({ version: 'v3', auth });
    const store = createFirestoreReservationStore();

    try {
      const diagnostico = await diagnosticarRecuperacion(
        {
          leerReserva: async (id) => (await store.inspeccionar?.(id)) ?? null,
          contarFilas: async (id) => {
            const { data } = await sheets.spreadsheets.values.get({
              spreadsheetId: process.env
                .SANDBOX_GOOGLE_SPREADSHEET_ID as string,
              range: process.env.SANDBOX_GOOGLE_SHEET_RANGE as string,
              majorDimension: 'ROWS',
            });
            return (data.values ?? []).filter((fila) => fila[0] === id).length;
          },
          contarArchivos: async (id) => {
            const prefijo = prefijoArchivosDrive(id);
            const { data } = await drive.files.list({
              q: `'${process.env.SANDBOX_GOOGLE_DRIVE_FOLDER_ID}' in parents and name contains '${prefijo}' and trashed = false`,
              pageSize: 100,
              fields: 'files(id)',
              supportsAllDrives: true,
              includeItemsFromAllDrives: true,
            });
            return (data.files ?? []).length;
          },
        },
        transactionId,
      );
      // Sólo estado, etapa y conteos: nunca IDs, URLs ni datos de personas.
      console.log(`Diagnóstico: ${JSON.stringify(diagnostico)}`);
    } finally {
      await store.close?.();
    }
  }, 60_000);
});
