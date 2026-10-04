import { describe, expect, it, vi } from 'vitest';
import { archivosFicticios, payloadFicticio } from './fixtures';
import { construirFormData } from './formData';
import {
  crearSesionEnvio,
  enviarRegistro,
  interpretarRespuesta,
  MENSAJES_ENVIO,
} from './envio';

const json = (status: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status });

describe('interpretarRespuesta', () => {
  it.each([
    [200, { code: 'SAVED' }, 'exito'],
    [200, { code: 'DUPLICATE' }, 'duplicado'],
    [200, {}, 'interno'], // sin code no se simula éxito
    [400, { code: 'VALIDATION_ERROR', details: [] }, 'validacion'],
    [400, { code: 'UNEXPECTED_FIELD' }, 'solicitud'],
    [413, null, 'demasiado_grande'],
    [502, { code: 'TEMPORARY_STORAGE_ERROR' }, 'temporal'],
    [502, { code: 'RECOVERY_REQUIRED' }, 'recuperacion'],
    [503, { code: 'SANDBOX_DISABLED' }, 'configuracion'],
    [503, { code: 'SANDBOX_CONFIGURATION_ERROR' }, 'configuracion'],
    [500, { code: 'INTERNAL_ERROR' }, 'interno'],
  ])('status %i %j → %s', (status, cuerpo, tipo) => {
    expect(interpretarRespuesta(status, cuerpo).tipo).toBe(tipo);
  });

  it('extrae los campos con error sin repetirlos', () => {
    const resultado = interpretarRespuesta(400, {
      code: 'VALIDATION_ERROR',
      details: [
        { field: 'integrantes.0.correo', message: 'x' },
        { field: 'integrantes.1.nombre', message: 'x' },
        { field: 'comprobantePago', message: 'x' },
      ],
    });
    expect(resultado).toEqual({ tipo: 'validacion', campos: ['integrantes', 'comprobantePago'] });
  });

  it('cada tipo tiene un título distinto', () => {
    const titulos = Object.values(MENSAJES_ENVIO).map((m) => m.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
  });
});

describe('enviarRegistro', () => {
  it('devuelve "red" si fetch falla, sin inventar éxito', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('offline'));
    const resultado = await enviarRegistro(new FormData(), { fetchFn: fetchFn as unknown as typeof fetch });
    expect(resultado.tipo).toBe('red');
  });

  it('tras un fallo temporal reenvía el mismo transactionId y los mismos archivos', async () => {
    const sesion = crearSesionEnvio(() => 'reg-test-001');
    const archivos = archivosFicticios();
    const cuerpos: FormData[] = [];
    const fetchFn = vi
      .fn()
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        cuerpos.push(init.body as FormData);
        return json(502, { code: 'TEMPORARY_STORAGE_ERROR' });
      })
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        cuerpos.push(init.body as FormData);
        return json(200, { code: 'SAVED' });
      });
    const opciones = { fetchFn: fetchFn as unknown as typeof fetch };

    const primero = await enviarRegistro(construirFormData(payloadFicticio, archivos, sesion.obtenerTransactionId()), opciones);
    const segundo = await enviarRegistro(construirFormData(payloadFicticio, archivos, sesion.obtenerTransactionId()), opciones);

    expect(primero.tipo).toBe('temporal');
    expect(segundo.tipo).toBe('exito');
    expect(cuerpos[0]?.get('transactionId')).toBe('reg-test-001');
    expect(cuerpos[1]?.get('transactionId')).toBe('reg-test-001');
    expect((cuerpos[1]?.get('cartaResponsiva') as File).name).toBe('carta.pdf');
  });
});

describe('crearSesionEnvio', () => {
  it('conserva el id hasta reiniciar', () => {
    let n = 0;
    const sesion = crearSesionEnvio(() => `id-${++n}`);
    expect(sesion.obtenerTransactionId()).toBe('id-1');
    expect(sesion.obtenerTransactionId()).toBe('id-1');
    sesion.reiniciar();
    expect(sesion.obtenerTransactionId()).toBe('id-2');
  });
});