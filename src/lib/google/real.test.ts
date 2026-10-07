import { GoogleAdapterConflictError } from './errors';
import { generarFolio } from './folio';
import { describe, expect, it, vi } from 'vitest';
import {
  GoogleAdapterConfigurationError,
  GoogleAdapterRecoveryError,
  GoogleAdapterTemporaryError,
} from './errors';
import { createGoogleSandboxAdapter } from './real';
import type { GoogleSandboxConfig, GoogleSandboxServices } from './real';
import type { RegistrationReservationStore } from './reservations';
import { createFakeRegistrationData } from './mock';

const config: Required<GoogleSandboxConfig> = {
  oauthClientId: 'fictitious-oauth-client-id',
  oauthClientSecret: 'fictitious-oauth-client-secret',
  oauthRefreshToken: 'fictitious-oauth-refresh-token',
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

const referenciasRecuperacion = new Map<
  string,
  { etapa: string; driveFileIds: readonly string[] }
>();

function createReservationStore(): RegistrationReservationStore {
  const states = new Map<
    string,
    'processing' | 'completed' | 'recovery-required'
  >();

  const fingerprints = new Map<string, string>();

  return {
    async reserve(transactionId, fingerprint) {
      const current = states.get(transactionId);
      if (current) {
        const stored = fingerprints.get(transactionId);
        if (fingerprint && stored && stored !== fingerprint) return 'conflict';
        return current;
      }
      if (fingerprint) fingerprints.set(transactionId, fingerprint);
      states.set(transactionId, 'processing');
      return 'acquired';
    },
    async complete(transactionId) {
      states.set(transactionId, 'completed');
    },
    async release(transactionId) {
      if (states.get(transactionId) === 'processing') {
        states.delete(transactionId);
        fingerprints.delete(transactionId);
      }
    },
    async markRecoveryRequired(transactionId, etapa, driveFileIds = []) {
      states.set(transactionId, 'recovery-required');
      referenciasRecuperacion.set(transactionId, { etapa, driveFileIds });
    },
    async cleanup(transactionId) {
      states.delete(transactionId);
    },
  };
}

function createAdapter(
  services: GoogleSandboxServices,
  reservationStore = createReservationStore(),
) {
  return createGoogleSandboxAdapter({
    config,
    createServices: () => services,
    reservationStore,
  });
}

describe('adapter real con servicios Google simulados', () => {
  it.each([
    ['image/png', 'png', [137, 80, 78, 71, 13, 10, 26, 10]],
    ['image/jpeg', 'jpg', [255, 216, 255]],
  ])(
    'sube el comprobante %s a Drive con extensión .%s y el resto como PDF',
    async (mime, extension, firma) => {
      const { services, state } = createServices();
      const datos = createTestData('real-adapter-imagen-001');
      datos.comprobantePago = new File(
        [new Uint8Array(firma)],
        'comprobante-ficticio',
        { type: mime },
      );

      await createAdapter(services).saveRegistration(datos);

      expect(state.uploadedNames).toHaveLength(3);
      expect(
        state.uploadedNames.map((nombre) => nombre.split('.').pop()),
      ).toEqual(['pdf', extension, 'pdf']);
    },
  );

  it('carga tres archivos y escribe exactamente una fila con sus enlaces', async () => {
    const { services, state } = createServices();
    const adapter = createAdapter(services);

    const result = await adapter.saveRegistration(createTestData());

    expect(result.isDuplicate).toBeUndefined();
    expect(state.uploadedNames).toHaveLength(3);
    expect(state.rows).toHaveLength(1);
    // Columnas 0-17 sin cambios; el folio es la nueva columna 18 al final.
    expect(state.rows[0]).toHaveLength(19);
    expect(state.rows[0]?.[18]).toBe(generarFolio('real-adapter-test-001'));
    expect(result.folio).toBe(state.rows[0]?.[18]);
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
    const adapter = createAdapter(services);

    const result = await adapter.saveRegistration(registration);

    expect(result.isDuplicate).toBe(true);
    expect(state.rows).toHaveLength(1);
    expect(state.uploadedNames).toHaveLength(0);
  });

  it('reconoce un retry después de completar la reserva sin repetir archivos', async () => {
    const { services, state } = createServices();
    const adapter = createAdapter(services);
    const registration = createTestData('completed-reservation-id');

    const firstResult = await adapter.saveRegistration(registration);
    const retryResult = await adapter.saveRegistration(registration);

    expect(firstResult.isDuplicate).toBeUndefined();
    expect(retryResult.isDuplicate).toBe(true);
    expect(state.rows).toHaveLength(1);
    expect(state.uploadedNames).toHaveLength(3);
  });

  it('rechaza el mismo ID con datos distintos sin escribir filas ni archivos nuevos', async () => {
    const { services, state } = createServices();
    const adapter = createAdapter(services);
    await adapter.saveRegistration(createTestData());

    const distinto = { ...createTestData(), nombreEquipo: 'Equipo distinto' };
    await expect(adapter.saveRegistration(distinto)).rejects.toBeInstanceOf(
      GoogleAdapterConflictError,
    );
    expect(state.rows).toHaveLength(1);
    expect(state.uploadedNames).toHaveLength(3);
  });

  it('comparte la reserva entre dos adapters (instancias) con el mismo store', async () => {
    const reservationStore = createReservationStore();
    const a = createServices();
    const b = createServices();
    const registro = createTestData();
    const [r1, r2] = await Promise.allSettled([
      createAdapter(a.services, reservationStore).saveRegistration(registro),
      createAdapter(b.services, reservationStore).saveRegistration({
        ...registro,
        nombreRobot: 'Robot distinto',
      }),
    ]);
    const ok = [r1, r2].filter((r) => r.status === 'fulfilled');
    expect(ok).toHaveLength(1);
    expect(a.state.rows.length + b.state.rows.length).toBe(1);
  });

  it('elimina todos los archivos subidos si falla la escritura de la fila', async () => {
    const { services, state } = createServices();
    const reservationStore = createReservationStore();
    const append = vi
      .spyOn(services.sheets.spreadsheets.values, 'append')
      .mockRejectedValue(new Error('Error ficticio de Sheets'));
    const adapter = createAdapter(services, reservationStore);
    const registration = createTestData();

    await expect(adapter.saveRegistration(registration)).rejects.toBeInstanceOf(
      GoogleAdapterTemporaryError,
    );
    expect(state.uploadedNames).toHaveLength(3);
    expect(state.deletedIds).toEqual([
      'fake-file-1',
      'fake-file-2',
      'fake-file-3',
    ]);
    expect(state.rows).toHaveLength(0);

    append.mockImplementation(async ({ requestBody }) => {
      state.rows.push(...requestBody.values);
    });
    const retryResult = await adapter.saveRegistration(registration);

    expect(retryResult.isDuplicate).toBeUndefined();
    expect(state.rows).toHaveLength(1);
    expect(state.uploadedNames).toHaveLength(6);
  });

  it('conserva los PDFs si Sheets guardó la fila pero la respuesta se perdió', async () => {
    const { services, state } = createServices();
    vi.spyOn(services.sheets.spreadsheets.values, 'append').mockImplementation(
      async ({ requestBody }) => {
        state.rows.push(...requestBody.values);
        throw new Error('Timeout ficticio después de persistir');
      },
    );
    const adapter = createAdapter(services);

    const result = await adapter.saveRegistration(createTestData());

    expect(result.isDuplicate).toBeUndefined();
    expect(state.rows).toHaveLength(1);
    expect(state.deletedIds).toHaveLength(0);
  });

  it('requiere recuperación si Drive falla con resultado de subida ambiguo', async () => {
    const { services, state } = createServices();
    const reservationStore = createReservationStore();
    const createFile = services.drive.files.create;
    let createCount = 0;
    vi.spyOn(services.drive.files, 'create').mockImplementation(
      async (args) => {
        createCount += 1;
        if (createCount === 2) throw new Error('Timeout ficticio de Drive');
        return createFile(args);
      },
    );
    const adapter = createAdapter(services, reservationStore);
    const registration = createTestData();

    await expect(adapter.saveRegistration(registration)).rejects.toBeInstanceOf(
      GoogleAdapterRecoveryError,
    );
    expect(state.deletedIds).toEqual(['fake-file-1']);
    expect(state.rows).toHaveLength(0);

    await expect(adapter.saveRegistration(registration)).rejects.toBeInstanceOf(
      GoogleAdapterRecoveryError,
    );
    expect(state.uploadedNames).toHaveLength(1);
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
    const adapter = createAdapter(services);

    await expect(
      adapter.saveRegistration(createTestData()),
    ).rejects.toBeInstanceOf(GoogleAdapterRecoveryError);
    expect(state.deletedIds).toHaveLength(2);
  });

  it('conserva etapa e IDs de Drive en la reserva cuando falla la limpieza', async () => {
    const { services } = createServices();
    const reservationStore = createReservationStore();
    vi.spyOn(services.sheets.spreadsheets.values, 'append').mockRejectedValue(
      new Error('Error ficticio de Sheets'),
    );
    vi.spyOn(services.drive.files, 'delete').mockRejectedValue(
      new Error('Error ficticio de limpieza'),
    );
    const adapter = createAdapter(services, reservationStore);

    await expect(
      adapter.saveRegistration(createTestData('ref-recuperacion-001')),
    ).rejects.toBeInstanceOf(GoogleAdapterRecoveryError);

    expect(referenciasRecuperacion.get('ref-recuperacion-001')).toEqual({
      etapa: 'drive-cleanup-failed',
      driveFileIds: ['fake-file-1', 'fake-file-2', 'fake-file-3'],
    });
  });

  it('el error de recuperación expone IDs de Drive sin datos personales', async () => {
    const error = new GoogleAdapterRecoveryError(
      'drive-cleanup-failed',
      undefined,
      undefined,
      ['fake-file-1'],
    );
    expect(error.driveFileIds).toEqual(['fake-file-1']);
    expect(
      new GoogleAdapterRecoveryError('drive-cleanup-failed').driveFileIds,
    ).toEqual([]);
  });

  it('se recupera de una lectura de Sheets con 503 transitorio y guarda una sola fila', async () => {
    const { services, state } = createServices();
    const get = services.sheets.spreadsheets.values.get;
    vi.spyOn(services.sheets.spreadsheets.values, 'get')
      .mockImplementationOnce(async () => {
        throw Object.assign(new Error('503 ficticio'), {
          response: { status: 503 },
        });
      })
      .mockImplementation(get);
    const adapter = createGoogleSandboxAdapter({
      config,
      createServices: () => services,
      reservationStore: createReservationStore(),
      politica: { esperaBaseMs: 1, dormir: async () => undefined },
    });

    const result = await adapter.saveRegistration(
      createTestData('reintento-001'),
    );

    expect(result.success).toBe(true);
    expect(state.rows).toHaveLength(1);
  });

  it('no repite la subida a Drive tras un timeout: queda como recuperación', async () => {
    const { services, state } = createServices();
    const create = vi
      .spyOn(services.drive.files, 'create')
      .mockImplementation(() => new Promise(() => {}));
    const adapter = createGoogleSandboxAdapter({
      config,
      createServices: () => services,
      reservationStore: createReservationStore(),
      politica: { timeoutMs: 20, dormir: async () => undefined },
    });

    await expect(
      adapter.saveRegistration(createTestData('timeout-subida-001')),
    ).rejects.toBeInstanceOf(GoogleAdapterRecoveryError);
    expect(create).toHaveBeenCalledTimes(1);
    expect(state.rows).toHaveLength(0);
  });

  it('falla cerrada si falta la configuración requerida', async () => {
    const createServicesSpy = vi.fn();
    const adapter = createGoogleSandboxAdapter({
      config: { ...config, oauthRefreshToken: '' },
      createServices: createServicesSpy,
      reservationStore: createReservationStore(),
    });

    await expect(
      adapter.saveRegistration(createTestData()),
    ).rejects.toBeInstanceOf(GoogleAdapterConfigurationError);
    expect(createServicesSpy).not.toHaveBeenCalled();
  });

  it('sólo permite procesar una solicitud cuando el mismo ID llega simultáneamente', async () => {
    const registration = createTestData('same-registration-id');
    const { services, state } = createServices();
    const adapter = createAdapter(services);

    const attempts = await Promise.allSettled([
      adapter.saveRegistration(registration),
      adapter.saveRegistration(registration),
    ]);
    const successfulAttempts = attempts.filter(
      (attempt) => attempt.status === 'fulfilled',
    );
    const rejectedAttempts = attempts.filter(
      (attempt) => attempt.status === 'rejected',
    );

    expect(successfulAttempts).toHaveLength(1);
    expect(rejectedAttempts).toHaveLength(1);
    expect(rejectedAttempts[0]).toMatchObject({
      status: 'rejected',
      reason: expect.any(GoogleAdapterTemporaryError),
    });
    expect(state.rows).toHaveLength(1);
    expect(state.uploadedNames).toHaveLength(3);
  });
});
