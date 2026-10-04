import {
  ENDPOINT_REGISTRO,
  MAX_ARCHIVO_BYTES,
  MAX_TOTAL_ARCHIVOS_BYTES,
  formatearBytes,
} from './contract';

export type ResultadoEnvio =
  | { tipo: 'exito' }
  | { tipo: 'duplicado' }
  | { tipo: 'validacion'; campos: string[] }
  | { tipo: 'temporal' }
  | { tipo: 'recuperacion' }
  | { tipo: 'configuracion' }
  | { tipo: 'demasiado_grande' }
  | { tipo: 'solicitud' }
  | { tipo: 'red' }
  | { tipo: 'interno' };

export type TipoResultado = ResultadoEnvio['tipo'];

export const MENSAJES_ENVIO: Record<
  TipoResultado,
  { titulo: string; detalle: string }
> = {
  exito: {
    titulo: 'Registro de prueba recibido',
    detalle:
      'Se guardó en el sandbox de pruebas con datos ficticios. Esto no representa una inscripción aceptada ni un lugar confirmado en Copa Ollin.',
  },
  duplicado: {
    titulo: 'Este registro de prueba ya se había recibido',
    detalle:
      'No se creó una fila nueva. Esto no representa una inscripción aceptada.',
  },
  validacion: {
    titulo: 'Hay datos o archivos que revisar',
    detalle:
      'El servidor no aceptó algunos datos. Corrígelos: tus respuestas y archivos siguen aquí.',
  },
  temporal: {
    titulo: 'El almacenamiento de pruebas no respondió',
    detalle:
      'Fue un fallo temporal, no necesariamente de tus datos. Conservamos tu información y tus archivos; puedes reintentar en unos minutos.',
  },
  recuperacion: {
    titulo: 'No pudimos confirmar el guardado',
    detalle:
      'El envío falló y el entorno de pruebas podría necesitar limpieza manual. Conservamos tus datos y archivos; reintenta una vez y, si persiste, avisa al equipo técnico.',
  },
  configuracion: {
    titulo: 'El registro de pruebas no está disponible',
    detalle:
      'El entorno de pruebas está deshabilitado o sin configurar. No es un problema de tus datos; avisa al equipo técnico.',
  },
  demasiado_grande: {
    titulo: 'Los archivos son demasiado grandes',
    detalle: `Cada PDF puede pesar hasta ${formatearBytes(MAX_ARCHIVO_BYTES)} y los tres juntos hasta ${formatearBytes(MAX_TOTAL_ARCHIVOS_BYTES)}. Reemplaza los más pesados.`,
  },
  solicitud: {
    titulo: 'No pudimos preparar el envío',
    detalle:
      'La solicitud no tiene el formato esperado. Es un error de la aplicación, no tuyo; avisa al equipo técnico.',
  },
  red: {
    titulo: 'No se pudo conectar con el servidor',
    detalle:
      'Revisa tu conexión e inténtalo de nuevo. Conservamos tus datos y archivos.',
  },
  interno: {
    titulo: 'Ocurrió un error inesperado',
    detalle:
      'No se confirmó el envío. Conservamos tus datos y archivos; puedes reintentar o avisar al equipo técnico.',
  },
};

function leerCodigo(cuerpo: unknown): string | undefined {
  if (typeof cuerpo === 'object' && cuerpo !== null && 'code' in cuerpo) {
    return typeof cuerpo.code === 'string' ? cuerpo.code : undefined;
  }
  return undefined;
}

function leerCampos(cuerpo: unknown): string[] {
  if (typeof cuerpo !== 'object' || cuerpo === null || !('details' in cuerpo)) {
    return [];
  }
  if (!Array.isArray(cuerpo.details)) return [];
  const raices = cuerpo.details.flatMap((detalle: unknown) => {
    if (
      typeof detalle === 'object' &&
      detalle !== null &&
      'field' in detalle &&
      typeof detalle.field === 'string'
    ) {
      return [detalle.field.split('.')[0] ?? detalle.field];
    }
    return [];
  });
  return [...new Set(raices)];
}

/** Sólo SAVED/DUPLICATE con HTTP 200 cuentan como éxito; todo lo demás es error. */
export function interpretarRespuesta(
  status: number,
  cuerpo: unknown,
): ResultadoEnvio {
  const code = leerCodigo(cuerpo);
  if (status === 200) {
    if (code === 'SAVED') return { tipo: 'exito' };
    if (code === 'DUPLICATE') return { tipo: 'duplicado' };
    return { tipo: 'interno' };
  }
  if (status === 400) {
    return code === 'VALIDATION_ERROR'
      ? { tipo: 'validacion', campos: leerCampos(cuerpo) }
      : { tipo: 'solicitud' };
  }
  if (status === 413) return { tipo: 'demasiado_grande' };
  if (status === 502) {
    return { tipo: code === 'RECOVERY_REQUIRED' ? 'recuperacion' : 'temporal' };
  }
  if (status === 503) return { tipo: 'configuracion' };
  return { tipo: 'interno' };
}

export async function enviarRegistro(
  formData: FormData,
  opciones: { fetchFn?: typeof fetch; endpoint?: string } = {},
): Promise<ResultadoEnvio> {
  const { fetchFn = fetch, endpoint = ENDPOINT_REGISTRO } = opciones;
  let respuesta: Response;
  try {
    respuesta = await fetchFn(endpoint, { method: 'POST', body: formData });
  } catch {
    return { tipo: 'red' };
  }
  let cuerpo: unknown = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    // cuerpo no JSON (p. ej. 413 de la plataforma): se decide por status.
  }
  return interpretarRespuesta(respuesta.status, cuerpo);
}

export function generarTransactionId(): string {
  const aleatorio =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `reg-${aleatorio}`; // cumple /^[A-Za-z0-9_-]{1,80}$/
}

/** El id se crea una vez y se reutiliza en cada reintento hasta `reiniciar()`. */
export function crearSesionEnvio(generarId: () => string = generarTransactionId) {
  let id: string | null = null;
  return {
    obtenerTransactionId(): string {
      id ??= generarId();
      return id;
    },
    reiniciar(): void {
      id = null;
    },
  };
}