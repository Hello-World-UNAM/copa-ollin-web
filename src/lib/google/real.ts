import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { google } from 'googleapis';
import {
  GoogleAdapterConfigurationError,
  GoogleAdapterRecoveryError,
  GoogleAdapterTemporaryError,
} from './errors';
import type { GoogleAdapter, RegistrationData } from './types';

export interface GoogleSandboxConfig {
  credentialsPath?: string;
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
  'credentialsPath',
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
    credentialsPath: readRuntimeValue('GOOGLE_APPLICATION_CREDENTIALS'),
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
  try {
    await access(config.credentialsPath, constants.R_OK);
  } catch (error) {
    throw new GoogleAdapterConfigurationError(
      'No se puede leer la credencial local de Google Sandbox.',
      { cause: error },
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: config.credentialsPath,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

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
  ];
}

function escapeDriveFileNamePart(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80);
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

export function createGoogleSandboxAdapter(
  options: {
    config?: GoogleSandboxConfig;
    createServices?: GoogleServicesFactory;
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
          isDuplicate: true,
        };
      }

      const uploadedFiles: Array<{ id: string; webViewLink: string }> = [];
      let appendAttempted = false;
      let duplicateFoundAfterAppendError = false;
      let driveUploadOutcomeUnknown = false;
      let fileLinks: string[] = [];
      try {
        for (const [documentName, file] of getRegistrationFiles(data)) {
          const fileName = `copa-ollin-${escapeDriveFileNamePart(data.transactionId)}-${documentName}.pdf`;
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
            };
          }

          if (rowWithTheseFiles || rowsAfterAppendError.length > 1) {
            throw new GoogleAdapterRecoveryError(
              'sheets-row-state-ambiguous',
              undefined,
              { cause: error },
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
          );
        }

        if (driveUploadOutcomeUnknown) {
          throw new GoogleAdapterRecoveryError(
            'drive-upload-outcome-unknown',
            getProviderHttpStatus(error),
            { cause: error },
          );
        }

        if (duplicateFoundAfterAppendError) {
          return {
            success: true,
            message: 'Registro duplicado omitido en Google Sandbox',
            isDuplicate: true,
          };
        }

        throw new GoogleAdapterTemporaryError(undefined, { cause: error });
      }

      return {
        success: true,
        message: 'Registro guardado en Google Sandbox',
      };
    },
  };
}

export const realGoogleAdapter = createGoogleSandboxAdapter();
