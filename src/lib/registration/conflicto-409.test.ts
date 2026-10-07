import { beforeEach, describe, expect, it } from 'vitest';

import { crearMultipartSprint04 } from '../../../tests/fixtures/sprint04/registro';
import {
  mockGoogleAdapter,
  resetMockRegistrationSnapshot,
  getMockRegistrationSnapshot,
} from '../google/mock';
import { createRegistrationHandler } from './handler';

const TOKEN = 'token-unitario-ficticio';

async function enviar(form: FormData) {
  const handler = createRegistrationHandler({
    sandboxEnabled: true,
    sandboxAccessToken: TOKEN,
    adapter: mockGoogleAdapter,
  });
  const response = await handler(
    new Request('http://localhost/api/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: form,
    }),
  );
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

describe('409 IDEMPOTENCY_CONFLICT (adapter mock, mismo contrato HTTP)', () => {
  beforeEach(() => resetMockRegistrationSnapshot());

  it('mismo ID y mismo contenido: SAVED y luego DUPLICATE', async () => {
    expect((await enviar(await crearMultipartSprint04())).body.code).toBe(
      'SAVED',
    );
    const segundo = await enviar(await crearMultipartSprint04());
    expect(segundo.status).toBe(200);
    expect(segundo.body.code).toBe('DUPLICATE');
  });

  it('mismo ID con datos distintos: 409 y no se confirma el contenido nuevo', async () => {
    await enviar(await crearMultipartSprint04());
    const distinto = await crearMultipartSprint04();
    distinto.set('nombreEquipo', 'Equipo Ficticio Distinto');
    const respuesta = await enviar(distinto);
    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('IDEMPOTENCY_CONFLICT');
    expect(respuesta.body).not.toHaveProperty('folio');
    expect(getMockRegistrationSnapshot()).toHaveLength(1);
    expect(getMockRegistrationSnapshot()[0]?.teamName).not.toBe(
      'Equipo Ficticio Distinto',
    );
  });

  it('mismo ID con distinto formato de comprobante: 409', async () => {
    await enviar(await crearMultipartSprint04('pdf'));
    const respuesta = await enviar(await crearMultipartSprint04('png'));
    expect(respuesta.status).toBe(409);
  });
});
