import { randomUUID } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import { describe, expect, it } from 'vitest';
import { google } from 'googleapis';
import { createFakeRegistrationData } from './mock';
import { createGoogleSandboxAdapter } from './real';
import { generarFolio } from './folio';
import { createFirestoreReservationStore } from './reservations';
import { createRegistrationHandler } from '../registration/handler';

loadEnv({ quiet: true });
const integrationEnabled =
  process.env.RUN_GOOGLE_SANDBOX_INTEGRATION === 'true';
// Conserva la fila y los archivos ficticios para inspeccionar la vista en Sheets.
const conservarDatos = process.env.SANDBOX_GOOGLE_CONSERVAR === 'true';
const fileTestAuthorized =
  process.env.SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED === 'true';
const requiredEnvironmentNames = [
  'SANDBOX_GOOGLE_OAUTH_CLIENT_ID',
  'SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET',
  'SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN',
  'SANDBOX_GOOGLE_SPREADSHEET_ID',
  'SANDBOX_GOOGLE_SHEET_RANGE',
  'SANDBOX_GOOGLE_DRIVE_FOLDER_ID',
  'SANDBOX_REGISTRATION_TOKEN',
  'SANDBOX_FIRESTORE_PROJECT_ID',
  'SANDBOX_FIRESTORE_CLIENT_EMAIL',
  'SANDBOX_FIRESTORE_PRIVATE_KEY',
] as const;

function readEnvironment(name: string): string | undefined {
  return process.env[name];
}

function readGoogleConfig() {
  const oauthClientId = readEnvironment('SANDBOX_GOOGLE_OAUTH_CLIENT_ID');
  const oauthClientSecret = readEnvironment(
    'SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET',
  );
  const oauthRefreshToken = readEnvironment(
    'SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN',
  );
  const spreadsheetId = readEnvironment('SANDBOX_GOOGLE_SPREADSHEET_ID');
  const sheetRange = readEnvironment('SANDBOX_GOOGLE_SHEET_RANGE');
  const driveFolderId = readEnvironment('SANDBOX_GOOGLE_DRIVE_FOLDER_ID');
  const registrationToken = readEnvironment('SANDBOX_REGISTRATION_TOKEN');
  const firestoreProjectId = readEnvironment('SANDBOX_FIRESTORE_PROJECT_ID');
  const firestoreClientEmail = readEnvironment(
    'SANDBOX_FIRESTORE_CLIENT_EMAIL',
  );
  const firestorePrivateKey = readEnvironment('SANDBOX_FIRESTORE_PRIVATE_KEY');
  if (
    !oauthClientId ||
    !oauthClientSecret ||
    !oauthRefreshToken ||
    !spreadsheetId ||
    !sheetRange ||
    !driveFolderId ||
    !registrationToken ||
    !firestoreProjectId ||
    !firestoreClientEmail ||
    !firestorePrivateKey
  ) {
    const missingValues = requiredEnvironmentNames.filter((name) => {
      const key = {
        SANDBOX_GOOGLE_OAUTH_CLIENT_ID: oauthClientId,
        SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET: oauthClientSecret,
        SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN: oauthRefreshToken,
        SANDBOX_GOOGLE_SPREADSHEET_ID: spreadsheetId,
        SANDBOX_GOOGLE_SHEET_RANGE: sheetRange,
        SANDBOX_GOOGLE_DRIVE_FOLDER_ID: driveFolderId,
        SANDBOX_REGISTRATION_TOKEN: registrationToken,
        SANDBOX_FIRESTORE_PROJECT_ID: firestoreProjectId,
        SANDBOX_FIRESTORE_CLIENT_EMAIL: firestoreClientEmail,
        SANDBOX_FIRESTORE_PRIVATE_KEY: firestorePrivateKey,
      }[name];
      return !key?.trim();
    });
    throw new Error(
      `Falta configuración local para la prueba: ${missingValues.join(', ')}`,
    );
  }
  return {
    oauthClientId,
    oauthClientSecret,
    oauthRefreshToken,
    spreadsheetId,
    sheetRange,
    driveFolderId,
    registrationToken,
    firestoreProjectId,
    firestoreClientEmail,
    firestorePrivateKey,
  };
}

function getSanitizedProviderReason(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }

  const response = error.response;
  if (
    typeof response !== 'object' ||
    response === null ||
    !('data' in response)
  ) {
    return undefined;
  }

  const data = response.data;
  if (
    typeof data !== 'object' ||
    data === null ||
    !('error' in data) ||
    typeof data.error !== 'object' ||
    data.error === null ||
    !('errors' in data.error) ||
    !Array.isArray(data.error.errors)
  ) {
    return undefined;
  }

  const reason = data.error.errors.find(
    (item): item is { reason: string } =>
      typeof item === 'object' &&
      item !== null &&
      'reason' in item &&
      typeof item.reason === 'string',
  )?.reason;

  return reason && /^[A-Za-z0-9_-]+$/.test(reason) ? reason : undefined;
}

const describeGoogleIntegration = integrationEnabled ? describe : describe.skip;

function createGeneratedPdf(): Uint8Array {
  const content = 'BT /F1 12 Tf 72 720 Td (Fictitious sandbox test) Tj ET\n';
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  let document = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(document));
    document += object;
  }
  const crossReferenceOffset = Buffer.byteLength(document);
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += `${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}`;
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(document));
}

function createRegistrationFormData(
  registration: ReturnType<typeof createFakeRegistrationData>,
): FormData {
  const formData = new FormData();
  formData.set('transactionId', registration.transactionId);
  formData.set('nombreEquipo', registration.nombreEquipo);
  formData.set('categoria', registration.categoria);
  formData.set('institucion', registration.institucion);
  formData.set('estadoCiudadProcedencia', registration.estadoCiudadProcedencia);
  formData.set('nombreCapitan', registration.nombreCapitan);
  formData.set('correoCapitan', registration.correoCapitan);
  formData.set('telefonoCapitan', registration.telefonoCapitan);
  formData.set(
    'identificacionInstitucional',
    registration.identificacionInstitucional ?? '',
  );
  formData.set('integrantes', JSON.stringify(registration.integrantes));
  formData.set('nombreRobot', registration.nombreRobot);
  formData.set('descripcionRobot', registration.descripcionRobot);
  formData.set('aceptaReglamento', String(registration.aceptaReglamento));
  formData.set('aceptaUsoImagen', String(registration.aceptaUsoImagen));
  formData.set(
    'confirmaRestriccionesCategoria',
    String(registration.confirmaRestriccionesCategoria),
  );
  formData.set('archivoIdentificacion', registration.archivoIdentificacion);
  formData.set('comprobantePago', registration.comprobantePago);
  formData.set('cartaResponsiva', registration.cartaResponsiva);
  return formData;
}

describeGoogleIntegration('integración autorizada de Google Sandbox', () => {
  it('escribe una fila, omite el reintento y elimina la fila y archivos ficticios', async () => {
    if (!fileTestAuthorized) {
      throw new Error(
        'No se ejecutará la subida real sin autorización explícita para esta prueba de sandbox.',
      );
    }

    const config = readGoogleConfig();
    const transactionId = `qa-${randomUUID()}`;
    const spreadsheetTab = config.sheetRange.split('!')[0];
    if (!spreadsheetTab) {
      throw new Error(
        'SANDBOX_GOOGLE_SHEET_RANGE debe incluir el nombre de la pestaña.',
      );
    }

    const auth = new google.auth.OAuth2(
      config.oauthClientId,
      config.oauthClientSecret,
    );
    auth.setCredentials({ refresh_token: config.oauthRefreshToken });
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });
    let sheetId: number;
    let preflightStage = 'obtener token OAuth';
    try {
      const { token } = await auth.getAccessToken();
      if (!token) {
        throw new Error('OAuth no devolvió un token de acceso.');
      }
      preflightStage = 'comprobar scope drive.file';
      const tokenInfo = await auth.getTokenInfo(token);
      const authorizedScopes = tokenInfo.scopes ?? [];
      if (
        authorizedScopes.length !== 1 ||
        authorizedScopes[0] !== 'https://www.googleapis.com/auth/drive.file'
      ) {
        throw new Error(
          'El token OAuth no tiene únicamente el scope drive.file.',
        );
      }

      preflightStage = 'validar el archivo seleccionado como hoja';
      const spreadsheetFile = await drive.files.get({
        fileId: config.spreadsheetId,
        fields: 'mimeType',
      });
      if (
        spreadsheetFile.data.mimeType !==
        'application/vnd.google-apps.spreadsheet'
      ) {
        throw new Error('El archivo seleccionado no es una hoja de cálculo.');
      }

      preflightStage = 'validar la carpeta seleccionada';
      const folder = await drive.files.get({
        fileId: config.driveFolderId,
        fields: 'mimeType',
      });
      if (folder.data.mimeType !== 'application/vnd.google-apps.folder') {
        throw new Error('El archivo seleccionado no es una carpeta.');
      }

      preflightStage = 'leer la pestaña Registros';
      await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: config.sheetRange,
        majorDimension: 'ROWS',
      });

      preflightStage = 'leer metadatos de la pestaña';
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: config.spreadsheetId,
        fields: 'sheets.properties(sheetId,title)',
      });
      const selectedSheet = spreadsheet.data.sheets?.find(
        (sheet) => sheet.properties?.title === spreadsheetTab,
      );
      if (typeof selectedSheet?.properties?.sheetId !== 'number') {
        throw new Error('No se encontró la pestaña configurada.');
      }
      sheetId = selectedSheet.properties.sheetId;
    } catch (error) {
      const response =
        typeof error === 'object' && error !== null && 'response' in error
          ? error.response
          : undefined;
      const providerStatus =
        typeof response === 'object' &&
        response !== null &&
        'status' in response &&
        typeof response.status === 'number'
          ? response.status
          : undefined;
      const providerReason = getSanitizedProviderReason(error);
      throw new Error(
        `Preflight de Google Sandbox falló durante: ${preflightStage}${providerStatus ? ` (HTTP ${providerStatus})` : ''}${providerReason ? ` [${providerReason}]` : ''}. No se iniciaron escrituras.`,
        { cause: error },
      );
    }

    const reservationStore = createFirestoreReservationStore({
      projectId: config.firestoreProjectId,
      clientEmail: config.firestoreClientEmail,
      privateKey: config.firestorePrivateKey,
    });
    const adapter = createGoogleSandboxAdapter({
      config,
      reservationStore,
    });
    const handleRegistration = createRegistrationHandler({
      adapter,
      sandboxEnabled: true,
      sandboxAccessToken: config.registrationToken,
    });
    const pdfContent = createGeneratedPdf();
    const createPdf = (name: string) => {
      const pdfBuffer = new ArrayBuffer(pdfContent.byteLength);
      new Uint8Array(pdfBuffer).set(pdfContent);
      return new File([pdfBuffer], name, { type: 'application/pdf' });
    };
    const registration = createFakeRegistrationData(transactionId, {
      archivoIdentificacion: createPdf('identificacion-ficticia.pdf'),
      comprobantePago: createPdf('comprobante-ficticio.pdf'),
      cartaResponsiva: createPdf('carta-ficticia.pdf'),
    });
    const driveFileNamePrefix = `copa-ollin-${transactionId}`;
    try {
      const sendRegistration = () =>
        handleRegistration(
          new Request('http://localhost/api/register', {
            method: 'POST',
            headers: {
              authorization: `Bearer ${config.registrationToken}`,
            },
            body: createRegistrationFormData(registration),
          }),
        );
      const [firstResponse, concurrentResponse] = await Promise.all([
        sendRegistration(),
        sendRegistration(),
      ]);
      const firstResult = await firstResponse.json();
      const concurrentResult = await concurrentResponse.json();
      const acceptedResponses = [firstResult, concurrentResult].filter(
        (result) => result.code === 'SAVED',
      );
      expect(acceptedResponses).toHaveLength(1);
      expect(
        [firstResult.code, concurrentResult.code].every((code) =>
          ['SAVED', 'DUPLICATE', 'TEMPORARY_STORAGE_ERROR'].includes(code),
        ),
      ).toBe(true);
      expect(
        [firstResponse.status, concurrentResponse.status].every((status) =>
          [200, 502].includes(status),
        ),
      ).toBe(true);

      const retryResponse = await sendRegistration();
      const retryResult = await retryResponse.json();
      expect(retryResponse.status).toBe(200);
      expect(retryResult).toMatchObject({
        code: 'DUPLICATE',
        isDuplicate: true,
      });

      const folioEsperado = generarFolio(transactionId);
      expect(retryResult.folio).toBe(folioEsperado);
      expect(acceptedResponses[0]?.folio).toBe(folioEsperado);

      // Mismo ID con contenido distinto: 409 y sin escrituras nuevas.
      const conflictResponse = await handleRegistration(
        new Request('http://localhost/api/register', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${config.registrationToken}`,
          },
          body: createRegistrationFormData({
            ...registration,
            nombreEquipo: 'Equipo Ficticio Distinto',
          }),
        }),
      );
      expect(conflictResponse.status).toBe(409);
      expect(await conflictResponse.json()).toMatchObject({
        code: 'IDEMPOTENCY_CONFLICT',
      });

      // Se lee A:S (no config.sheetRange) para comprobar la columna del folio.
      const rowsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: `${config.sheetRange.split('!')[0]}!A:S`,
        majorDimension: 'ROWS',
      });
      const matchingRows = (rowsResponse.data.values ?? []).filter(
        (row) => row[0] === transactionId,
      );
      const driveFilesResponse = await drive.files.list({
        q: `'${config.driveFolderId}' in parents and name contains '${driveFileNamePrefix}' and trashed = false`,
        corpora: 'allDrives',
        includeItemsFromAllDrives: true,
        pageSize: 100,
        fields: 'files(id,name)',
        supportsAllDrives: true,
      });
      const createdFiles = driveFilesResponse.data.files ?? [];

      expect(retryResponse.status).toBe(200);
      expect(matchingRows).toHaveLength(1);
      expect(matchingRows[0]?.[18]).toBe(folioEsperado);
      expect(matchingRows[0]?.[1]).toBe(registration.nombreEquipo);
      expect(createdFiles).toHaveLength(3);
      const rowFileLinks = matchingRows[0]?.slice(15, 18) ?? [];
      expect(rowFileLinks).toHaveLength(3);
      for (const file of createdFiles) {
        expect(
          rowFileLinks.some(
            (fileLink) =>
              typeof fileLink === 'string' &&
              file.id &&
              fileLink.includes(file.id),
          ),
        ).toBe(true);
      }
    } finally {
      try {
        if (!conservarDatos) {
          const rowsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: config.spreadsheetId,
            range: config.sheetRange,
            majorDimension: 'ROWS',
          });
          const matchingRowIndexes = (rowsResponse.data.values ?? [])
            .map((row, index) => (row[0] === transactionId ? index + 1 : -1))
            .filter((index) => index > 0)
            .sort((left, right) => right - left);

          if (matchingRowIndexes.length > 0) {
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId: config.spreadsheetId,
              requestBody: {
                requests: matchingRowIndexes.map((rowIndex) => ({
                  deleteDimension: {
                    range: {
                      sheetId,
                      dimension: 'ROWS',
                      startIndex: rowIndex - 1,
                      endIndex: rowIndex,
                    },
                  },
                })),
              },
            });
          }

          const driveFilesResponse = await drive.files.list({
            q: `'${config.driveFolderId}' in parents and name contains '${driveFileNamePrefix}' and trashed = false`,
            corpora: 'allDrives',
            includeItemsFromAllDrives: true,
            pageSize: 100,
            fields: 'files(id)',
            supportsAllDrives: true,
          });
          await Promise.all(
            (driveFilesResponse.data.files ?? []).flatMap((file) =>
              file.id
                ? [
                    drive.files.delete({
                      fileId: file.id,
                      supportsAllDrives: true,
                    }),
                  ]
                : [],
            ),
          );
          await reservationStore.cleanup(transactionId);
        }
      } finally {
        await reservationStore.close?.();
      }
    }

    if (conservarDatos) {
      console.log(
        'Datos ficticios conservados: 1 fila y 3 archivos; hay que borrarlos manualmente.',
      );
      return;
    }

    const remainingRowsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: config.sheetRange,
      majorDimension: 'ROWS',
    });
    const remainingDriveFilesResponse = await drive.files.list({
      q: `'${config.driveFolderId}' in parents and name contains '${driveFileNamePrefix}' and trashed = false`,
      corpora: 'allDrives',
      includeItemsFromAllDrives: true,
      pageSize: 100,
      fields: 'files(id)',
      supportsAllDrives: true,
    });

    expect(
      (remainingRowsResponse.data.values ?? []).filter(
        (row) => row[0] === transactionId,
      ),
    ).toHaveLength(0);
    expect(remainingDriveFilesResponse.data.files ?? []).toHaveLength(0);
  }, 60_000);
});
