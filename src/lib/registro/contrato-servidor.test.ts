import { beforeEach, describe, expect, it } from 'vitest';
import { getMockRegistrationSnapshot, mockGoogleAdapter, resetMockRegistrationSnapshot } from '../google/mock';
import { createRegistrationHandler } from '../registration/handler';
import { MAX_ARCHIVO_BYTES, validarArchivoPdf } from './contract';
import { archivosFicticios, crearPdfFicticio, payloadFicticio } from './fixtures';
import { construirFormData } from './formData';

const handler = createRegistrationHandler({ adapter: mockGoogleAdapter, sandboxEnabled: true });
const enviar = (formData: FormData) =>
  handler(new Request('http://localhost/api/register', { method: 'POST', body: formData }));

describe('contrato cliente ↔ servidor', () => {
  beforeEach(() => resetMockRegistrationSnapshot());

  it('el servidor acepta lo que construye el cliente (integrante sin correo incluido)', async () => {
    const respuesta = await enviar(construirFormData(payloadFicticio, archivosFicticios(), 'reg-rt-001'));
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({ code: 'SAVED' });
    expect(getMockRegistrationSnapshot()).toHaveLength(1);
  });

  it('un PDF de 1 MiB + 1 byte es inválido en cliente y servidor', async () => {
    const grande = crearPdfFicticio('grande.pdf', MAX_ARCHIVO_BYTES + 1);
    expect(await validarArchivoPdf(grande)).not.toBeNull();

    const respuesta = await enviar(
      construirFormData(payloadFicticio, { ...archivosFicticios(), comprobantePago: grande }, 'reg-rt-002'),
    );
    expect(respuesta.status).toBe(400);
    const cuerpo = (await respuesta.json()) as { code: string; details: { field: string }[] };
    expect(cuerpo.code).toBe('VALIDATION_ERROR');
    expect(cuerpo.details.map((d) => d.field)).toContain('comprobantePago');
    expect(getMockRegistrationSnapshot()).toHaveLength(0);
  });

  it('tres PDF de exactamente 1 MiB (3 MiB en total) son aceptados', async () => {
    const mib = () => crearPdfFicticio('mib.pdf', MAX_ARCHIVO_BYTES);
    const respuesta = await enviar(
      construirFormData(
        payloadFicticio,
        { archivoIdentificacion: mib(), comprobantePago: mib(), cartaResponsiva: mib() },
        'reg-rt-003',
      ),
    );
    expect(respuesta.status).toBe(200);
  });
});