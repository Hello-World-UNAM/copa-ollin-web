import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GoogleAdapterConfigurationError,
  GoogleAdapterRecoveryError,
} from '../google/errors';
import {
  createFakeRegistrationData,
  getMockRegistrationSnapshot,
  mockGoogleAdapter,
  resetMockRegistrationSnapshot,
} from '../google/mock';
import type { GoogleAdapter, RegistrationData } from '../google/types';
import { MAX_SANDBOX_FILE_SIZE } from '../schemas/register';
import { createRegistrationHandler } from './handler';

const pdfBytes = new Uint8Array([
  37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 37, 69, 79, 70,
]);

function createPdf(name: string, type = 'application/pdf'): File {
  return new File([pdfBytes], name, { type });
}

function createTestData(transactionId = 'test-registration-001') {
  return createFakeRegistrationData(transactionId, {
    archivoIdentificacion: createPdf('identificacion-ficticia.pdf'),
    comprobantePago: createPdf('comprobante-ficticio.pdf'),
    cartaResponsiva: createPdf('carta-ficticia.pdf'),
  });
}

function createFormData(data: RegistrationData = createTestData()): FormData {
  const formData = new FormData();
  formData.set('transactionId', data.transactionId);
  formData.set('nombreEquipo', data.nombreEquipo);
  formData.set('categoria', data.categoria);
  formData.set('institucion', data.institucion);
  formData.set('estadoCiudadProcedencia', data.estadoCiudadProcedencia);
  formData.set('nombreCapitan', data.nombreCapitan);
  formData.set('correoCapitan', data.correoCapitan);
  formData.set('telefonoCapitan', data.telefonoCapitan);
  formData.set(
    'identificacionInstitucional',
    data.identificacionInstitucional ?? '',
  );
  formData.set('integrantes', JSON.stringify(data.integrantes));
  formData.set('nombreRobot', data.nombreRobot);
  formData.set('descripcionRobot', data.descripcionRobot);
  formData.set('aceptaReglamento', String(data.aceptaReglamento));
  formData.set('aceptaUsoImagen', String(data.aceptaUsoImagen));
  formData.set(
    'confirmaRestriccionesCategoria',
    String(data.confirmaRestriccionesCategoria),
  );
  formData.set('archivoIdentificacion', data.archivoIdentificacion);
  formData.set('comprobantePago', data.comprobantePago);
  formData.set('cartaResponsiva', data.cartaResponsiva);
  return formData;
}

function createHandler(adapter: GoogleAdapter = mockGoogleAdapter) {
  return createRegistrationHandler({ adapter, sandboxEnabled: true });
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe('endpoint de registro sandbox con adapter mock', () => {
  beforeEach(() => {
    resetMockRegistrationSnapshot();
  });

  it('rechaza el endpoint si el sandbox no está habilitado', async () => {
    const saveRegistration = vi.fn();
    const handler = createRegistrationHandler({
      adapter: { saveRegistration },
      sandboxEnabled: false,
    });

    const response = await handler(
      new Request('http://localhost/api/register'),
    );

    expect(response.status).toBe(503);
    expect(await readJson(response)).toMatchObject({
      code: 'SANDBOX_DISABLED',
    });
    expect(saveRegistration).not.toHaveBeenCalled();
  });

  it('guarda una fila mock con los tres archivos ficticios', async () => {
    const response = await createHandler()(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: createFormData(),
      }),
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({
      code: 'SAVED',
      isDuplicate: false,
    });
    expect(getMockRegistrationSnapshot()).toEqual([
      {
        transactionId: 'test-registration-001',
        teamName: 'Equipo Ficticio de Prueba',
        fileNames: [
          'identificacion-ficticia.pdf',
          'comprobante-ficticio.pdf',
          'carta-ficticia.pdf',
        ],
      },
    ]);
  });

  it('omite el segundo envío del mismo identificador sin crear otra fila mock', async () => {
    const handler = createHandler();
    const firstResponse = await handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: createFormData(),
      }),
    );
    const duplicateResponse = await handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: createFormData(),
      }),
    );

    expect(firstResponse.status).toBe(200);
    expect(await readJson(duplicateResponse)).toMatchObject({
      code: 'DUPLICATE',
      isDuplicate: true,
    });
    expect(getMockRegistrationSnapshot()).toHaveLength(1);
  });

  it('rechaza campos inesperados y campos multipart repetidos', async () => {
    const unexpectedData = createFormData();
    unexpectedData.set('campoNoPermitido', 'valor-ficticio');
    const repeatedData = createFormData();
    repeatedData.append(
      'comprobantePago',
      createPdf('segundo-comprobante-ficticio.pdf'),
    );
    const handler = createHandler();

    const unexpectedResponse = await handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: unexpectedData,
      }),
    );
    const repeatedResponse = await handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: repeatedData,
      }),
    );

    expect(unexpectedResponse.status).toBe(400);
    expect(await readJson(unexpectedResponse)).toMatchObject({
      code: 'UNEXPECTED_FIELD',
    });
    expect(repeatedResponse.status).toBe(400);
    expect(await readJson(repeatedResponse)).toMatchObject({
      code: 'REPEATED_FIELD',
    });
    expect(getMockRegistrationSnapshot()).toHaveLength(0);
  });

  it('rechaza MIME incorrecto y archivos que no tienen firma PDF', async () => {
    const wrongMime = createFormData(
      createFakeRegistrationData('test-wrong-mime', {
        archivoIdentificacion: createPdf('identificacion.txt', 'text/plain'),
        comprobantePago: createPdf('comprobante.pdf'),
        cartaResponsiva: createPdf('carta.pdf'),
      }),
    );
    const wrongSignature = createFormData(
      createFakeRegistrationData('test-wrong-signature', {
        archivoIdentificacion: new File(['texto ficticio'], 'no-es-pdf.pdf', {
          type: 'application/pdf',
        }),
        comprobantePago: createPdf('comprobante.pdf'),
        cartaResponsiva: createPdf('carta.pdf'),
      }),
    );
    const handler = createHandler();

    const mimeResponse = await handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: wrongMime,
      }),
    );
    const signatureResponse = await handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: wrongSignature,
      }),
    );

    expect(mimeResponse.status).toBe(400);
    expect(signatureResponse.status).toBe(400);
    expect(getMockRegistrationSnapshot()).toHaveLength(0);
  });

  it('rechaza PDFs mayores a 5 MiB y descripciones superiores a 300 palabras', async () => {
    const oversizedBytes = new Uint8Array(MAX_SANDBOX_FILE_SIZE + 1);
    oversizedBytes.set(pdfBytes.subarray(0, 5));
    const oversizedData = createFakeRegistrationData('test-oversized-pdf', {
      archivoIdentificacion: new File(
        [oversizedBytes],
        'identificacion-grande.pdf',
        { type: 'application/pdf' },
      ),
      comprobantePago: createPdf('comprobante.pdf'),
      cartaResponsiva: createPdf('carta.pdf'),
    });
    const longDescriptionData = createTestData('test-long-description');
    longDescriptionData.descripcionRobot = Array.from(
      { length: 301 },
      () => 'ficticia',
    ).join(' ');
    const handler = createHandler();

    const oversizedResponse = await handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: createFormData(oversizedData),
      }),
    );
    const longDescriptionResponse = await handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: createFormData(longDescriptionData),
      }),
    );

    expect(oversizedResponse.status).toBe(400);
    expect(longDescriptionResponse.status).toBe(400);
    expect(getMockRegistrationSnapshot()).toHaveLength(0);
  });

  it('devuelve errores de configuración/recuperación sin incluir datos de registro', async () => {
    const registration = createTestData('test-error-no-pii');
    const configurationHandler = createHandler({
      async saveRegistration() {
        throw new GoogleAdapterConfigurationError();
      },
    });
    const recoveryHandler = createHandler({
      async saveRegistration() {
        throw new GoogleAdapterRecoveryError('drive-cleanup-failed');
      },
    });

    const configurationResponse = await configurationHandler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: createFormData(registration),
      }),
    );
    const recoveryResponse = await recoveryHandler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        body: createFormData(registration),
      }),
    );
    const configurationBody = await configurationResponse.text();
    const recoveryBody = await recoveryResponse.text();

    expect(configurationResponse.status).toBe(503);
    expect(recoveryResponse.status).toBe(502);
    expect(configurationBody).not.toContain(registration.nombreCapitan);
    expect(configurationBody).not.toContain(registration.correoCapitan);
    expect(recoveryBody).not.toContain(registration.nombreCapitan);
    expect(recoveryBody).not.toContain(registration.correoCapitan);
  });
});
