import { randomUUID } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import { describe, expect, it } from 'vitest';
import { google } from 'googleapis';
import { createFakeRegistrationData } from './mock';
import { createGoogleSandboxAdapter } from './real';
import { createRegistrationHandler } from '../registration/handler';

loadEnv({ quiet: true });
const integrationEnabled =
  process.env.RUN_GOOGLE_SANDBOX_INTEGRATION === 'true';
const fileTestAuthorized =
  process.env.SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED === 'true';
const requiredEnvironmentNames = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'SANDBOX_GOOGLE_SPREADSHEET_ID',
  'SANDBOX_GOOGLE_SHEET_RANGE',
  'SANDBOX_GOOGLE_DRIVE_FOLDER_ID',
] as const;

function readEnvironment(name: string): string | undefined {
  return process.env[name];
}

function readGoogleConfig() {
  const credentialsPath = readEnvironment('GOOGLE_APPLICATION_CREDENTIALS');
  const spreadsheetId = readEnvironment('SANDBOX_GOOGLE_SPREADSHEET_ID');
  const sheetRange = readEnvironment('SANDBOX_GOOGLE_SHEET_RANGE');
  const driveFolderId = readEnvironment('SANDBOX_GOOGLE_DRIVE_FOLDER_ID');
  if (!credentialsPath || !spreadsheetId || !sheetRange || !driveFolderId) {
    const missingValues = requiredEnvironmentNames.filter((name) => {
      const key = {
        GOOGLE_APPLICATION_CREDENTIALS: credentialsPath,
        SANDBOX_GOOGLE_SPREADSHEET_ID: spreadsheetId,
        SANDBOX_GOOGLE_SHEET_RANGE: sheetRange,
        SANDBOX_GOOGLE_DRIVE_FOLDER_ID: driveFolderId,
      }[name];
      return !key?.trim();
    });
    throw new Error(
      `Falta configuración local para la prueba: ${missingValues.join(', ')}`,
    );
  }
  return { credentialsPath, spreadsheetId, sheetRange, driveFolderId };
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
        'No se ejecutará la subida real sin SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED=true, después de resolver P0-06.',
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

    const auth = new google.auth.GoogleAuth({
      keyFile: config.credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
      ],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: config.sheetRange,
        majorDimension: 'ROWS',
      });
      const folder = await drive.files.get({
        fileId: config.driveFolderId,
        fields: 'mimeType,driveId',
        supportsAllDrives: true,
      });
      if (
        folder.data.mimeType !== 'application/vnd.google-apps.folder' ||
        !folder.data.driveId
      ) {
        throw new Error(
          'El destino configurado no es una carpeta de Unidad compartida.',
        );
      }
    } catch {
      throw new Error(
        'Preflight de Google Sandbox falló. Verifica APIs, acceso a la hoja y que la carpeta sea visible dentro de una Unidad compartida; no se iniciaron escrituras.',
      );
    }

    const adapter = createGoogleSandboxAdapter({ config });
    const handleRegistration = createRegistrationHandler({
      adapter,
      sandboxEnabled: true,
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
      const firstResponse = await handleRegistration(
        new Request('http://localhost/api/register', {
          method: 'POST',
          body: createRegistrationFormData(registration),
        }),
      );
      const duplicateResponse = await handleRegistration(
        new Request('http://localhost/api/register', {
          method: 'POST',
          body: createRegistrationFormData(registration),
        }),
      );
      const firstResult = await firstResponse.json();
      const duplicateResult = await duplicateResponse.json();
      const rowsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: config.sheetRange,
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

      expect(firstResponse.status, JSON.stringify(firstResult)).toBe(200);
      expect(firstResult).toMatchObject({ code: 'SAVED', isDuplicate: false });
      expect(duplicateResponse.status).toBe(200);
      expect(duplicateResult).toMatchObject({
        code: 'DUPLICATE',
        isDuplicate: true,
      });
      expect(matchingRows).toHaveLength(1);
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
      const rowsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: config.sheetRange,
        majorDimension: 'ROWS',
      });
      const matchingRowIndexes = (rowsResponse.data.values ?? [])
        .map((row, index) => (row[0] === transactionId ? index + 1 : -1))
        .filter((index) => index > 0);

      await Promise.all(
        matchingRowIndexes.map((rowIndex) =>
          sheets.spreadsheets.values.clear({
            spreadsheetId: config.spreadsheetId,
            range: `${spreadsheetTab}!A${rowIndex}:R${rowIndex}`,
          }),
        ),
      );

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
            ? [drive.files.delete({ fileId: file.id, supportsAllDrives: true })]
            : [],
        ),
      );
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
