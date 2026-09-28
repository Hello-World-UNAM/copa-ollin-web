import { describe, expect, it, vi } from 'vitest';
import {
  GoogleAdapterConfigurationError,
  GoogleAdapterRecoveryError,
  GoogleAdapterTemporaryError,
} from './errors';
import { createGoogleSandboxAdapter } from './real';
import type { GoogleSandboxConfig, GoogleSandboxServices } from './real';
import { createFakeRegistrationData } from './mock';

const config: Required<GoogleSandboxConfig> = {
  credentialsPath: '/tmp/fake-service-account.json',
  spreadsheetId: 'fake-spreadsheet-id',
  sheetRange: 'Registros!A:R',
  driveFolderId: 'fake-drive-folder-id',
};

const pdfBytes = new Uint8Array([
  37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 37, 69, 79, 70,
]);

function createTestData(transactionId = 'real-adapter-test-001') {
  const createPdf = (name: string) =>
    new File([pdfBytes], name, { type: 'application/pdf' });

  return createFakeRegistrationData(transactionId, {
    archivoIdentificacion: createPdf('identificacion-ficticia.pdf'),
    comprobantePago: createPdf('comprobante-ficticio.pdf'),
    cartaResponsiva: createPdf('carta-ficticia.pdf'),
  });
}

function createServices(initialRows: unknown[][] = []) {
  const state = {
    rows: [...initialRows],
    uploadedNames: [] as string[],
    deletedIds: [] as string[],
  };

  const services: GoogleSandboxServices = {
    sheets: {
      spreadsheets: {
        values: {
          async get() {
            return { data: { values: state.rows } };
          },
          async append({ requestBody }) {
            state.rows.push(...requestBody.values);
          },
        },
      },
    },
    drive: {
      files: {
        async create({ requestBody }) {
          state.uploadedNames.push(requestBody.name);
          const id = `fake-file-${state.uploadedNames.length}`;
          return {
            data: {
              id,
              webViewLink: `https://drive.google.invalid/file/d/${id}/view`,
            },
          };
        },
        async delete({ fileId }) {
          state.deletedIds.push(fileId);
        },
      },
    },
  };

  return { services, state };
}

describe('adapter real con servicios Google simulados', () => {
  it('carga tres archivos y escribe exactamente una fila con sus enlaces', async () => {
    const { services, state } = createServices();
    const adapter = createGoogleSandboxAdapter({
      config,
      createServices: () => services,
    });

    const result = await adapter.saveRegistration(createTestData());

    expect(result.isDuplicate).toBeUndefined();
    expect(state.uploadedNames).toHaveLength(3);
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0]).toHaveLength(18);
    expect(state.rows[0]?.[0]).toBe('real-adapter-test-001');
    expect(state.rows[0]?.slice(15, 18)).toEqual([
      'https://drive.google.invalid/file/d/fake-file-1/view',
      'https://drive.google.invalid/file/d/fake-file-2/view',
      'https://drive.google.invalid/file/d/fake-file-3/view',
    ]);
  });

  it('reconoce el transactionId repetido antes de subir archivos o añadir filas', async () => {
    const registration = createTestData();
    const { services, state } = createServices([['real-adapter-test-001']]);
    const adapter = createGoogleSandboxAdapter({
      config,
      createServices: () => services,
    });

    const result = await adapter.saveRegistration(registration);

    expect(result.isDuplicate).toBe(true);
    expect(state.rows).toHaveLength(1);
    expect(state.uploadedNames).toHaveLength(0);
  });

  it('elimina todos los archivos subidos si falla la escritura de la fila', async () => {
    const { services, state } = createServices();
    vi.spyOn(services.sheets.spreadsheets.values, 'append').mockRejectedValue(
      new Error('Error ficticio de Sheets'),
    );
    const adapter = createGoogleSandboxAdapter({
      config,
      createServices: () => services,
    });

    await expect(
      adapter.saveRegistration(createTestData()),
    ).rejects.toBeInstanceOf(GoogleAdapterTemporaryError);
    expect(state.uploadedNames).toHaveLength(3);
    expect(state.deletedIds).toEqual([
      'fake-file-1',
      'fake-file-2',
      'fake-file-3',
    ]);
    expect(state.rows).toHaveLength(0);
  });

  it('conserva los PDFs si Sheets guardó la fila pero la respuesta se perdió', async () => {
    const { services, state } = createServices();
    vi.spyOn(services.sheets.spreadsheets.values, 'append').mockImplementation(
      async ({ requestBody }) => {
        state.rows.push(...requestBody.values);
        throw new Error('Timeout ficticio después de persistir');
      },
    );
    const adapter = createGoogleSandboxAdapter({
      config,
      createServices: () => services,
    });

    const result = await adapter.saveRegistration(createTestData());

    expect(result.isDuplicate).toBeUndefined();
    expect(state.rows).toHaveLength(1);
    expect(state.deletedIds).toHaveLength(0);
  });

  it('requiere recuperación si Drive falla con resultado de subida ambiguo', async () => {
    const { services, state } = createServices();
    const createFile = services.drive.files.create;
    let createCount = 0;
    vi.spyOn(services.drive.files, 'create').mockImplementation(
      async (args) => {
        createCount += 1;
        if (createCount === 2) throw new Error('Timeout ficticio de Drive');
        return createFile(args);
      },
    );
    const adapter = createGoogleSandboxAdapter({
      config,
      createServices: () => services,
    });

    await expect(
      adapter.saveRegistration(createTestData()),
    ).rejects.toBeInstanceOf(GoogleAdapterRecoveryError);
    expect(state.deletedIds).toEqual(['fake-file-1']);
    expect(state.rows).toHaveLength(0);
  });

  it('marca como recuperable el fallo si alguna eliminación de Drive falla', async () => {
    const { services, state } = createServices();
    const deleteFile = services.drive.files.delete;
    vi.spyOn(services.sheets.spreadsheets.values, 'append').mockRejectedValue(
      new Error('Error ficticio de Sheets'),
    );
    vi.spyOn(services.drive.files, 'delete')
      .mockRejectedValueOnce(new Error('Error ficticio de limpieza'))
      .mockImplementation(deleteFile);
    const adapter = createGoogleSandboxAdapter({
      config,
      createServices: () => services,
    });

    await expect(
      adapter.saveRegistration(createTestData()),
    ).rejects.toBeInstanceOf(GoogleAdapterRecoveryError);
    expect(state.deletedIds).toHaveLength(2);
  });

  it('falla cerrada si falta la configuración requerida', async () => {
    const createServicesSpy = vi.fn();
    const adapter = createGoogleSandboxAdapter({
      config: { ...config, spreadsheetId: '' },
      createServices: createServicesSpy,
    });

    await expect(
      adapter.saveRegistration(createTestData()),
    ).rejects.toBeInstanceOf(GoogleAdapterConfigurationError);
    expect(createServicesSpy).not.toHaveBeenCalled();
  });
});
