export class GoogleCallTimeoutError extends Error {
  constructor(operacion: string, timeoutMs: number) {
    super(`La llamada ${operacion} superó ${timeoutMs} ms.`);
    this.name = 'GoogleCallTimeoutError';
  }
}

export interface PoliticaLlamadas {
  /** Tiempo máximo por intento, en ms. */
  timeoutMs: number;
  /** Reintentos adicionales, sólo para operaciones seguras de repetir. */
  maxReintentos: number;
  /** Espera base del retroceso exponencial, en ms. */
  esperaBaseMs: number;
  dormir: (ms: number) => Promise<void>;
}

export const POLITICA_POR_DEFECTO: PoliticaLlamadas = {
  timeoutMs: 10_000,
  maxReintentos: 2,
  esperaBaseMs: 300,
  dormir: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export type ResultadoLlamada =
  'ok' | 'error' | 'timeout' | 'cuota' | 'reintento';

// Sólo contadores por servicio, operación y resultado: nunca IDs ni datos.
const contadores = new Map<string, number>();

function contar(
  servicio: string,
  operacion: string,
  resultado: ResultadoLlamada,
) {
  const clave = `${servicio}.${operacion}.${resultado}`;
  contadores.set(clave, (contadores.get(clave) ?? 0) + 1);
}

export function obtenerMetricasGoogle(): Record<string, number> {
  return Object.fromEntries(contadores);
}

export function reiniciarMetricasGoogle(): void {
  contadores.clear();
}

export function estadoHttpDeError(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const e = error as {
    code?: unknown;
    status?: unknown;
    response?: { status?: unknown };
  };
  const candidato = e.response?.status ?? e.status ?? e.code;
  return typeof candidato === 'number' ? candidato : undefined;
}

const MOTIVOS_CUOTA = [
  'ratelimitexceeded',
  'userratelimitexceeded',
  'quotaexceeded',
  'dailylimitexceeded',
];

export function esErrorDeCuota(error: unknown): boolean {
  if (estadoHttpDeError(error) === 429) return true;
  if (typeof error !== 'object' || error === null) return false;
  const e = error as {
    errors?: { reason?: unknown }[];
    response?: { data?: { error?: { errors?: { reason?: unknown }[] } } };
  };
  const motivos = e.errors ?? e.response?.data?.error?.errors ?? [];
  return motivos.some(
    (m) =>
      typeof m.reason === 'string' &&
      MOTIVOS_CUOTA.includes(m.reason.toLowerCase()),
  );
}

const CODIGOS_RED = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED'];

function esReintentable(error: unknown): boolean {
  if (error instanceof GoogleCallTimeoutError) return true;
  if (esErrorDeCuota(error)) return true;
  const estado = estadoHttpDeError(error);
  if (estado !== undefined && [500, 502, 503, 504].includes(estado)) {
    return true;
  }
  const codigo = (error as { code?: unknown } | null)?.code;
  return typeof codigo === 'string' && CODIGOS_RED.includes(codigo);
}

function conTimeout<T>(
  operacion: string,
  timeoutMs: number,
  llamada: () => Promise<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const temporizador = setTimeout(
      () => reject(new GoogleCallTimeoutError(operacion, timeoutMs)),
      timeoutMs,
    );
    llamada().then(
      (valor) => {
        clearTimeout(temporizador);
        resolve(valor);
      },
      (error) => {
        clearTimeout(temporizador);
        reject(error);
      },
    );
  });
}

/**
 * Ejecuta una llamada a Google con tiempo máximo. Reintenta únicamente si la
 * operación es segura de repetir (`reintentable`): lecturas y borrados.
 * Un timeout en una escritura deja el resultado incierto y no se repite; lo
 * resuelve la reconciliación existente.
 */
export async function ejecutarConPolitica<T>(
  servicio: string,
  operacion: string,
  llamada: () => Promise<T>,
  opciones: { reintentable: boolean; politica?: Partial<PoliticaLlamadas> },
): Promise<T> {
  const politica = { ...POLITICA_POR_DEFECTO, ...opciones.politica };
  const intentos = opciones.reintentable ? politica.maxReintentos + 1 : 1;

  for (let intento = 1; ; intento += 1) {
    try {
      const valor = await conTimeout(
        `${servicio}.${operacion}`,
        politica.timeoutMs,
        llamada,
      );
      contar(servicio, operacion, 'ok');
      return valor;
    } catch (error) {
      const cuota = esErrorDeCuota(error);
      const resultado: ResultadoLlamada =
        error instanceof GoogleCallTimeoutError
          ? 'timeout'
          : cuota
            ? 'cuota'
            : 'error';
      contar(servicio, operacion, resultado);

      if (intento >= intentos || !esReintentable(error)) throw error;
      contar(servicio, operacion, 'reintento');
      await politica.dormir(politica.esperaBaseMs * 2 ** (intento - 1));
    }
  }
}
