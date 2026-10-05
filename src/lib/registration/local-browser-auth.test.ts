import { describe, expect, it } from 'vitest';
import { authorizeLocalSandboxRequest } from './local-browser-auth';

const options = {
  development: true,
  enabled: true,
  clientAddress: '127.0.0.1',
  serverToken: 'token-ficticio-servidor',
};
const request = (headers: Record<string, string> = {}) =>
  new Request('http://127.0.0.1:4321/api/register', {
    method: 'POST',
    headers: { origin: 'http://127.0.0.1:4321', ...headers },
    body: 'cuerpo ficticio',
  });

describe('autorización opt-in del navegador local', () => {
  it('añade autorización sólo dentro del servidor y conserva el cuerpo', async () => {
    const original = request();
    const authorized = authorizeLocalSandboxRequest(original, options);
    expect(original.headers.has('authorization')).toBe(false);
    expect(authorized.headers.get('authorization')).toBe(
      'Bearer token-ficticio-servidor',
    );
    expect(await authorized.text()).toBe('cuerpo ficticio');
  });

  it.each([
    { development: false },
    { enabled: false },
    { clientAddress: '192.0.2.10' },
    { serverToken: undefined },
  ])('no autoriza con restricciones incumplidas: %j', (override) => {
    const original = request();
    expect(
      authorizeLocalSandboxRequest(original, { ...options, ...override }),
    ).toBe(original);
  });

  it.each<Record<string, string>>([
    { origin: 'https://sitio-ajeno.invalid' },
    { origin: '' },
    { forwarded: 'for=127.0.0.1' },
    { 'x-forwarded-for': '127.0.0.1' },
    { 'x-forwarded-host': 'localhost' },
    { 'x-forwarded-proto': 'http' },
    { authorization: 'Bearer incorrecto' },
  ])(
    'no autoriza peticiones ajenas/proxy ni reemplaza tokens: %j',
    (headers) => {
      const original = request(headers);
      expect(authorizeLocalSandboxRequest(original, options)).toBe(original);
    },
  );

  it('no autoriza un host remoto aunque el peer sea local', () => {
    const original = new Request('https://staging.invalid/api/register', {
      method: 'POST',
      headers: { origin: 'https://staging.invalid' },
    });
    expect(authorizeLocalSandboxRequest(original, options)).toBe(original);
  });
});
