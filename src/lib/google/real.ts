import { generarFolio } from './folio';
import { calcularHuella } from './huella';
import { Readable } from 'node:stream';
import { google } from 'googleapis';
import {
  GoogleAdapterConfigurationError,
  GoogleAdapterConflictError,
  GoogleAdapterRecoveryError,
  GoogleAdapterTemporaryError,
} from './errors';
import type {
  GoogleAdapter,
  RegistrationData,
  RegistrationResult,
} from './types';
import {
  getRuntimeRegistrationReservationStore,
  type RegistrationReservationStore,
} from './reservations';

export interface GoogleSandboxConfig {
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthRefreshToken?: string;
  spreadsheetId?: string;
  sheetRange?: string;
  driveFolderId?: string;
}

interface GoogleSheetsPort {
  spreadsheets: {
    values: {
      get(args: {
        spreadsheetId: string;
        range: string;
        majorDimension: 'ROWS';
      }): Promise<{ data: { values?: unknown[][] } }>;
      append(args: {
        spreadsheetId: string;
        range: string;
        valueInputOption: 'RAW';
        insertDataOption: 'INSERT_ROWS';
        requestBody: { values: Array<Array<string | boolean>> };
      }): Promise<unknown>;
    };
  };
}

interface GoogleDrivePort {
  files: {
    create(args: {
      supportsAllDrives: true;
      requestBody: { name: string; mimeType: string; parents: string[] };
      media: { mimeType: string; body: Readable };
      fields: 'id,webViewLink';
    }): Promise<{ data: { id?: string | null; webViewLink?: string | null } }>;
    delete(args: { fileId: string; supportsAllDrives: true }): Promise<unknown>;
  };
}

export interface GoogleSandboxServices {
  sheets: GoogleSheetsPort;
  drive: GoogleDrivePort;
}

type GoogleServicesFactory = (
  config: Required<GoogleSandboxConfig>,
) => GoogleSandboxServices | Promise<GoogleSandboxServices>;

const requiredConfigKeys = [
  'oauthClientId',
  'oauthClientSecret',
  'oauthRefreshToken',
  'spreadsheetId',
  'sheetRange',
  'driveFolderId',
] as const;

function readRuntimeValue(name: string): string | undefined {
  const runtimeValue = process.env[name];
  if (runtimeValue) return runtimeValue;
  return import.meta.env[name] || undefined;
}

function getRuntimeConfig(): GoogleSandboxConfig {
  return {
    oauthClientId: readRuntimeValue('SANDBOX_GOOGLE_OAUTH_CLIENT_ID'),
    oauthClientSecret: readRuntimeValue('SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET'),
    oauthRefreshToken: readRuntimeValue('SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN'),
    spreadsheetId: readRuntimeValue('SANDBOX_GOOGLE_SPREADSHEET_ID'),
    sheetRange: readRuntimeValue('SANDBOX_GOOGLE_SHEET_RANGE'),
    driveFolderId: readRuntimeValue('SANDBOX_GOOGLE_DRIVE_FOLDER_ID'),
  };
}

function validateConfig(
  config: GoogleSandboxConfig,
): asserts config is Required<GoogleSandboxConfig> {
  const missingKeys = requiredConfigKeys.filter((key) => !config[key]?.trim());
  if (missingKeys.length > 0 || !config.sheetRange?.trim().endsWith('!A:R')) {
    throw new GoogleAdapterConfigurationError();
  }
}

async function createGoogleServices(
  config: Required<GoogleSandboxConfig>,
): Promise<GoogleSandboxServices> {
  const auth = new google.auth.OAuth2(
    config.oauthClientId,
    config.oauthClientSecret,
  );
  auth.setCredentials({ refresh_token: config.oauthRefreshToken });

  return {
    sheets: google.sheets({
      version: 'v4',
      auth,
    }) as unknown as GoogleSheetsPort,
    drive: google.drive({ version: 'v3', auth }) as unknown as GoogleDrivePort,
  };
}

function getRegistrationFiles(data: RegistrationData) {
  return [
    ['identificacion', data.archivoIdentificacion],
    ['comprobante-pago', data.comprobantePago],
    ['carta-responsiva', data.cartaResponsiva],
  ] as const;
}

function createSheetRow(
  data: RegistrationData,
  fileLinks: string[],
): Array<string | boolean> {
  return [
    data.transactionId,
    data.nombreEquipo,
    data.categoria,
    data.institucion,
    data.estadoCiudadProcedencia,
    data.nombreCapitan,
    data.correoCapitan,
    data.telefonoCapitan,
    data.identificacionInstitucional ?? '',
    JSON.stringify(data.integrantes),
    data.nombreRobot,
    data.descripcionRobot,
    data.aceptaReglamento,
    data.aceptaUsoImagen,
    data.confirmaRestriccionesCategoria,
    fileLinks[0] ?? '',
    fileLinks[1] ?? '',
    fileLinks[2] ?? '',
    generarFolio(data.transactionId),
  ];
}

function extensionForMime(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg') return 'jpg';
  return 'pdf';
}

function escapeDriveFileNamePart(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80);
}

// Prefijo común de los nombres de archivo de una transacción; sirve para
// localizar archivos huérfanos en Drive aunque no se conozca su ID.
export function prefijoArchivosDrive(transactionId: string): string {
  return `copa-ollin-${escapeDriveFileNamePart(transactionId)}-`;
}

function getProviderHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }

  const response = error.response;
  if (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    typeof response.status === 'number'
  ) {
    return response.status;
  }

  return undefined;
}

async function saveRegistrationToGoogle(
  data: RegistrationData,
  config: Required<GoogleSandboxConfig>,
  services: GoogleSandboxServices,
): Promise<RegistrationResult> {
  let existingRows: unknown[][];
  try {
    const response = await services.sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: config.sheetRange,
      majorDimension: 'ROWS',
    });
    existingRows = response.data.values ?? [];
  } catch (error) {
    throw new GoogleAdapterTemporaryError(undefined, { cause: error });
  }

  if (existingRows.some((row) => row[0] === data.transactionId)) {
    return {
      success: true,
      message: 'Registro duplicado omitido en Google Sandbox',
      folio: generarFolio(data.transactionId),
      isDuplicate: true,
    };
  }

  const uploadedFiles: Array<{ id: string; webViewLink: string }> = [];
  let appendAttempted = false;
  let duplicateFoundAfterAppendError = false;
  let driveUploadOutcomeUnknown = false;
  let fileLinks: string[] = [];
  const idsSubidos = () => uploadedFiles.map(({ id }) => id);
  try {
    for (const [documentName, file] of getRegistrationFiles(data)) {
      const fileName = `${prefijoArchivosDrive(data.transactionId)}${documentName}.${extensionForMime(file.type)}`;
      driveUploadOutcomeUnknown = true;
      const response = await services.drive.files.create({
        supportsAllDrives: true,
        requestBody: {
          name: fileName,
          mimeType: file.type,
          parents: [config.driveFolderId],
        },
        media: {
          mimeType: file.type,
          body: Readable.from([Buffer.from(await file.arrayBuffer())]),
        },
        fields: 'id,webViewLink',
      });

      const id = response.data.id;
      if (!id)
        throw new Error('Google Drive no devolvió un ID para el archivo.');
      uploadedFiles.push({
        id,
        webViewLink:
          response.data.webViewLink ??
          `https://drive.google.com/file/d/${id}/view`,
      });
      driveUploadOutcomeUnknown = false;
    }

    fileLinks = uploadedFiles.map(({ webViewLink }) => webViewLink);
    appendAttempted = true;
    await services.sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: config.sheetRange,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [createSheetRow(data, fileLinks)],
      },
    });
  } catch (error) {
    if (appendAttempted) {
      let rowsAfterAppendError: unknown[][];
      try {
        const response = await services.sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: config.sheetRange,
          majorDimension: 'ROWS',
        });
        rowsAfterAppendError = (response.data.values ?? []).filter(
          (row) => row[0] === data.transactionId,
        );
      } catch (verificationError) {
        throw new GoogleAdapterRecoveryError(
          'sheets-reconciliation-failed',
          undefined,
          { cause: verificationError },
          idsSubidos(),
        );
      }

      const rowWithTheseFiles = rowsAfterAppendError.find(
        (row) =>
          JSON.stringify(row.slice(15, 18)) === JSON.stringify(fileLinks),
      );
      if (rowWithTheseFiles && rowsAfterAppendError.length === 1) {
        return {
          success: true,
          message: 'Registro guardado en Google Sandbox',
          folio: generarFolio(data.transactionId),
        };
      }

      if (rowWithTheseFiles || rowsAfterAppendError.length > 1) {
        throw new GoogleAdapterRecoveryError(
          'sheets-row-state-ambiguous',
          undefined,
          { cause: error },
          idsSubidos(),
        );
      }
      duplicateFoundAfterAppendError = rowsAfterAppendError.length === 1;
    }

    const cleanupResults = await Promise.allSettled(
      uploadedFiles.map(({ id }) =>
        services.drive.files.delete({
          fileId: id,
          supportsAllDrives: true,
        }),
      ),
    );

    if (cleanupResults.some((result) => result.status === 'rejected')) {
      throw new GoogleAdapterRecoveryError(
        'drive-cleanup-failed',
        undefined,
        { cause: error },
        idsSubidos(),
      );
    }

    if (driveUploadOutcomeUnknown) {
      throw new GoogleAdapterRecoveryError(
        'drive-upload-outcome-unknown',
        getProviderHttpStatus(error),
        { cause: error },
        idsSubidos(),
      );
    }

    if (duplicateFoundAfterAppendError) {
      return {
        success: true,
        message: 'Registro duplicado omitido en Google Sandbox',
        folio: generarFolio(data.transactionId),
        isDuplicate: true,
      };
    }

    throw new GoogleAdapterTemporaryError(undefined, { cause: error });
  }

  return {
    success: true,
    message: 'Registro guardado en Google Sandbox',
    folio: generarFolio(data.transactionId),
  };
}

export function createGoogleSandboxAdapter(
  options: {
    config?: GoogleSandboxConfig;
    createServices?: GoogleServicesFactory;
    reservationStore?: RegistrationReservationStore;
  } = {},
): GoogleAdapter {
  return {
    async saveRegistration(data) {
      const config = options.config ?? getRuntimeConfig();
      validateConfig(config);

      let services: GoogleSandboxServices;
      try {
        services = await (options.createServices ?? createGoogleServices)(
          config,
        );
      } catch (error) {
        if (error instanceof GoogleAdapterConfigurationError) throw error;
        throw new GoogleAdapterTemporaryError(undefined, { cause: error });
      }

      let reservationStore: RegistrationReservationStore;
      try {
        reservationStore =
          options.reservationStore ?? getRuntimeRegistrationReservationStore();
      } catch (error) {
        if (error instanceof GoogleAdapterConfigurationError) throw error;
        throw new GoogleAdapterTemporaryError(undefined, { cause: error });
      }

      let reservationState;
      try {
        reservationState = await reservationStore.reserve(
          data.transactionId,
          await calcularHuella(data),
        );
      } catch (error) {
        throw new GoogleAdapterTemporaryError(undefined, { cause: error });
      }

      if (reservationState === 'conflict') {
        throw new GoogleAdapterConflictError();
      }
      if (reservationState === 'completed') {
        return {
          success: true,
          message: 'Registro duplicado omitido en Google Sandbox',
          folio: generarFolio(data.transactionId),
          isDuplicate: true,
        };
      }
      if (reservationState === 'processing') {
        throw new GoogleAdapterTemporaryError(
          'Ya hay una solicitud con este identificador en proceso.',
        );
      }
      if (reservationState === 'recovery-required') {
        throw new GoogleAdapterRecoveryError(
          'idempotency-reservation-recovery-required',
        );
      }

      let result: RegistrationResult;
      try {
        result = await saveRegistrationToGoogle(data, config, services);
      } catch (error) {
        if (error instanceof GoogleAdapterRecoveryError) {
          try {
            await reservationStore.markRecoveryRequired(
              data.transactionId,
              error.recoveryStage,
              error.driveFileIds,
            );
          } catch (reservationError) {
            throw new GoogleAdapterRecoveryError(
              'idempotency-reservation-state-unknown',
              undefined,
              { cause: reservationError },
            );
          }
        } else {
          try {
            await reservationStore.release(data.transactionId);
          } catch (reservationError) {
            throw new GoogleAdapterRecoveryError(
              'idempotency-reservation-state-unknown',
              undefined,
              { cause: reservationError },
            );
          }
        }

        throw error;
      }

      try {
        await reservationStore.complete(data.transactionId);
      } catch (error) {
        throw new GoogleAdapterRecoveryError(
          'idempotency-reservation-state-unknown',
          undefined,
          { cause: error },
        );
      }

      return result;
    },
  };
}

export const realGoogleAdapter = createGoogleSandboxAdapter();
