import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GoogleCallTimeoutError,
  ejecutarConPolitica,
  esErrorDeCuota,
  obtenerMetricasGoogle,
  reiniciarMetricasGoogle,
} from './politica-llamadas';

const dormir = vi.fn<(ms: number) => Promise<void>>(async () => undefined);
const politica = { timeoutMs: 20, maxReintentos: 2, esperaBaseMs: 100, dormir };
const errorHttp = (status: number) =>
  Object.assign(new Error('Error ficticio'), { response: { status } });

beforeEach(() => {
  dormir.mockClear();
  reiniciarMetricasGoogle();
});

describe('ejecutarConPolitica', () => {
  it('devuelve el valor y cuenta el éxito', async () => {
    const valor = await ejecutarConPolitica(
      'sheets',
      'values.get',
      async () => 7,
      {
        reintentable: true,
        politica,
      },
    );
    expect(valor).toBe(7);
    expect(obtenerMetricasGoogle()).toEqual({ 'sheets.values.get.ok': 1 });
  });

  it('reintenta lecturas ante 503 con retroceso exponencial y se recupera', async () => {
    const llamada = vi
      .fn()
      .mockRejectedValueOnce(errorHttp(503))
      .mockRejectedValueOnce(errorHttp(503))
      .mockResolvedValue('ok');
    await expect(
      ejecutarConPolitica('sheets', 'values.get', llamada, {
        reintentable: true,
        politica,
      }),
    ).resolves.toBe('ok');
    expect(llamada).toHaveBeenCalledTimes(3);
    expect(dormir.mock.calls.map(([ms]) => ms)).toEqual([100, 200]);
  });

  it('acota los reintentos y propaga el último error', async () => {
    const llamada = vi.fn().mockRejectedValue(errorHttp(503));
    await expect(
      ejecutarConPolitica('sheets', 'values.get', llamada, {
        reintentable: true,
        politica,
      }),
    ).rejects.toMatchObject({ response: { status: 503 } });
    expect(llamada).toHaveBeenCalledTimes(3);
  });

  it('no reintenta escrituras aunque el error sea temporal', async () => {
    const llamada = vi.fn().mockRejectedValue(errorHttp(503));
    await expect(
      ejecutarConPolitica('sheets', 'values.append', llamada, {
        reintentable: false,
        politica,
      }),
    ).rejects.toBeDefined();
    expect(llamada).toHaveBeenCalledTimes(1);
    expect(dormir).not.toHaveBeenCalled();
  });

  it('no reintenta errores de petición o permisos', async () => {
    const llamada = vi.fn().mockRejectedValue(errorHttp(403));
    await expect(
      ejecutarConPolitica('drive', 'files.delete', llamada, {
        reintentable: true,
        politica,
      }),
    ).rejects.toBeDefined();
    expect(llamada).toHaveBeenCalledTimes(1);
  });

  it('corta una llamada colgada con GoogleCallTimeoutError', async () => {
    await expect(
      ejecutarConPolitica(
        'drive',
        'files.create',
        () => new Promise(() => {}),
        {
          reintentable: false,
          politica,
        },
      ),
    ).rejects.toBeInstanceOf(GoogleCallTimeoutError);
    expect(obtenerMetricasGoogle()['drive.files.create.timeout']).toBe(1);
  });

  it('cuenta cuota (429) y el reintento', async () => {
    const llamada = vi
      .fn()
      .mockRejectedValueOnce(errorHttp(429))
      .mockResolvedValue('ok');
    await ejecutarConPolitica('sheets', 'values.get', llamada, {
      reintentable: true,
      politica,
    });
    expect(obtenerMetricasGoogle()).toMatchObject({
      'sheets.values.get.cuota': 1,
      'sheets.values.get.reintento': 1,
      'sheets.values.get.ok': 1,
    });
  });
});

describe('esErrorDeCuota', () => {
  it('reconoce 429 y motivos de cuota en 403', () => {
    expect(esErrorDeCuota(errorHttp(429))).toBe(true);
    expect(
      esErrorDeCuota({
        response: {
          status: 403,
          data: { error: { errors: [{ reason: 'rateLimitExceeded' }] } },
        },
      }),
    ).toBe(true);
    expect(esErrorDeCuota(errorHttp(403))).toBe(false);
    expect(esErrorDeCuota(null)).toBe(false);
  });
});
