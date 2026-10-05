import { describe, expect, it } from 'vitest';

import {
  crearMultipartSprint04,
  formatosSprint04,
  payloadSprint04,
  respuestasSprint04,
} from '../../../tests/fixtures/sprint04/registro';
import { createRegistrationHandler } from '../registration/handler';
import {
  CAMPOS_ARCHIVO,
  CAMPOS_ESCALARES,
  MAX_ARCHIVO_BYTES,
  MAX_TOTAL_ARCHIVOS_BYTES,
} from './contract';

describe('Paquete común Sprint04 (no certifica funciones objetivo)', () => {
  it.each(['pdf', 'png', 'jpeg'] as const)(
    'multipart reproducible con comprobante %s',
    async (formato) => {
      const form = await crearMultipartSprint04(formato);
      expect([...form.keys()].sort()).toEqual(
        [...CAMPOS_ESCALARES, ...CAMPOS_ARCHIVO].sort(),
      );
      expect(form.get('integrantes')).toBe(
        JSON.stringify(payloadSprint04.integrantes),
      );
      expect(form.get('aceptaReglamento')).toBe('true');
      expect(form.get('telefonoCapitan')).toBe('0012345678');
      let total = 0;
      for (const campo of CAMPOS_ARCHIVO) {
        const file = form.get(campo) as File;
        expect(file).toBeInstanceOf(File);
        expect(file.size).toBeGreaterThan(0);
        expect(file.size).toBeLessThanOrEqual(MAX_ARCHIVO_BYTES);
        expect([...formatosSprint04[campo]]).toContain(file.type);
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (file.type === 'application/pdf')
          expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
        if (file.type === 'image/png')
          expect([...bytes.slice(0, 8)]).toEqual([
            137, 80, 78, 71, 13, 10, 26, 10,
          ]);
        if (file.type === 'image/jpeg')
          expect([...bytes.slice(0, 3)]).toEqual([255, 216, 255]);
        total += file.size;
      }
      expect(total).toBeLessThanOrEqual(MAX_TOTAL_ARCHIVOS_BYTES);
    },
  );

  it('SAVED y DUPLICATE simulados conservan el folio; conflicto no promete éxito', () => {
    expect(respuestasSprint04[0].body.folio).toBe(
      respuestasSprint04[1].body.folio,
    );
    expect(respuestasSprint04.find((r) => r.status === 409)?.body.code).toBe(
      'IDEMPOTENCY_CONFLICT',
    );
    expect(JSON.stringify(respuestasSprint04)).not.toMatch(
      /Bearer|refresh_token|client_secret/,
    );
  });

  it('el payload PDF es compatible con el handler actual usando adapter sólo ficticio', async () => {
    let escriturasMock = 0;
    const handler = createRegistrationHandler({
      sandboxEnabled: true,
      sandboxAccessToken: 'token-paquete-ficticio',
      adapter: {
        async saveRegistration() {
          escriturasMock++;
          return { success: true, message: 'Sólo mock.' };
        },
      },
    });
    const response = await handler(
      new Request('http://localhost/api/register', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-paquete-ficticio' },
        body: await crearMultipartSprint04(),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).code).toBe('SAVED');
    expect(escriturasMock).toBe(1);
  });
});
