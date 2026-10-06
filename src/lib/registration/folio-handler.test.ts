import { beforeEach, describe, expect, it } from 'vitest';

import { crearMultipartSprint04 } from '../../../tests/fixtures/sprint04/registro';
import { PATRON_FOLIO } from '../google/folio';
import {
  mockGoogleAdapter,
  resetMockRegistrationSnapshot,
} from '../google/mock';
import { createRegistrationHandler } from './handler';

const TOKEN = 'token-unitario-ficticio';

async function enviar() {
  const handler = createRegistrationHandler({
    sandboxEnabled: true,
    sandboxAccessToken: TOKEN,
    adapter: mockGoogleAdapter,
  });
  const response = await handler(
    new Request('http://localhost/api/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: await crearMultipartSprint04(),
    }),
  );
  return (await response.json()) as Record<string, unknown>;
}

describe('folio en la respuesta (adapter mock; no prueba persistencia real)', () => {
  beforeEach(() => resetMockRegistrationSnapshot());

  it('SAVED y DUPLICATE devuelven el mismo folio', async () => {
    const primero = await enviar();
    const segundo = await enviar();
    expect(primero.code).toBe('SAVED');
    expect(segundo.code).toBe('DUPLICATE');
    expect(primero.folio).toMatch(PATRON_FOLIO);
    expect(segundo.folio).toBe(primero.folio);
  });
});
