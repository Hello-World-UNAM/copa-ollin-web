import { describe, expect, it, vi } from 'vitest';

import { crearMultipartSprint04 } from '../../../tests/fixtures/sprint04/registro';
import type { GoogleAdapter } from '../google/types';
import { createRegistrationHandler } from './handler';

const TOKEN = 'token-unitario-ficticio';

function preparar() {
  const saveRegistration = vi.fn<GoogleAdapter['saveRegistration']>(
    async () => ({ success: true, message: 'Sólo adapter de prueba.' }),
  );
  const handler = createRegistrationHandler({
    sandboxEnabled: true,
    sandboxAccessToken: TOKEN,
    adapter: { saveRegistration },
  });
  const enviar = (body: FormData, token: string | null = TOKEN) =>
    handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      }),
    );
  return { saveRegistration, enviar };
}

async function conCambio(cambio: (form: FormData) => void) {
  const form = await crearMultipartSprint04();
  cambio(form);
  return form;
}

describe('validación de servidor Sprint04 (adapter falso, cero escrituras)', () => {
  it.each(['pdf', 'png', 'jpeg'] as const)(
    'acepta comprobante %s y llega una sola vez al adapter',
    async (formato) => {
      const { saveRegistration, enviar } = preparar();
      const response = await enviar(await crearMultipartSprint04(formato));
      expect(response.status).toBe(200);
      expect(saveRegistration).toHaveBeenCalledTimes(1);
    },
  );

  it('rechaza sin autorización antes de escribir', async () => {
    const { saveRegistration, enviar } = preparar();
    expect((await enviar(await crearMultipartSprint04(), null)).status).toBe(
      401,
    );
    expect(saveRegistration).not.toHaveBeenCalled();
  });

  it('conserva ceros iniciales del teléfono', async () => {
    const { saveRegistration, enviar } = preparar();
    await enviar(await crearMultipartSprint04());
    expect(saveRegistration.mock.calls[0]?.[0].telefonoCapitan).toBe(
      '0012345678',
    );
  });

  it.each([
    ['categoria', 'categoria-inventada'],
    ['telefonoCapitan', '55abc12345'],
    ['telefonoCapitan', '+52 5555555555'],
    ['correoCapitan', 'no-es-correo'],
    ['descripcionRobot', Array(301).fill('palabra').join(' ')],
    ['integrantes', JSON.stringify([{ nombre: '' }])],
    ['integrantes', JSON.stringify([{ nombre: 'Ficticio', correo: 'malo' }])],
  ])('rechaza %s inválido sin escribir', async (campo, valor) => {
    const { saveRegistration, enviar } = preparar();
    const response = await enviar(await conCambio((f) => f.set(campo, valor)));
    expect(response.status).toBe(400);
    expect(saveRegistration).not.toHaveBeenCalled();
  });

  it('acepta exactamente 300 palabras', async () => {
    const { enviar } = preparar();
    const form = await conCambio((f) =>
      f.set('descripcionRobot', Array(300).fill('palabra').join(' ')),
    );
    expect((await enviar(form)).status).toBe(200);
  });

  it.each([
    ['vacío', new File([], 'c.png', { type: 'image/png' })],
    [
      'MIME falso (PNG declarado, bytes de texto)',
      new File(['texto plano'], 'c.png', { type: 'image/png' }),
    ],
    [
      'tipo no admitido (WebP)',
      new File([new Uint8Array(20)], 'c.webp', { type: 'image/webp' }),
    ],
    [
      'imagen sobre 1 MiB',
      new File(
        [new Uint8Array([255, 216, 255]), new Uint8Array(1024 * 1024)],
        'c.jpg',
        { type: 'image/jpeg' },
      ),
    ],
  ])('rechaza comprobante %s sin escribir', async (_n, archivo) => {
    const { saveRegistration, enviar } = preparar();
    const response = await enviar(
      await conCambio((f) => f.set('comprobantePago', archivo)),
    );
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(saveRegistration).not.toHaveBeenCalled();
  });

  it('la identificación no admite imágenes (sólo PDF)', async () => {
    const { saveRegistration, enviar } = preparar();
    const png = (await crearMultipartSprint04('png')).get(
      'comprobantePago',
    ) as File;
    const response = await enviar(
      await conCambio((f) => f.set('archivoIdentificacion', png)),
    );
    expect(response.status).toBe(400);
    expect(saveRegistration).not.toHaveBeenCalled();
  });
});
