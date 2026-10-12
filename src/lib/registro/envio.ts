import {
  ENDPOINT_REGISTRO,
  MAX_ARCHIVO_BYTES,
  MAX_TOTAL_ARCHIVOS_BYTES,
  formatearBytes,
} from './contract';

export type ResultadoEnvio =
  | { tipo: 'exito'; folio?: string }
  | { tipo: 'duplicado'; folio?: string }
  | { tipo: 'conflicto' }
  | { tipo: 'datos_modificados' }
  | { tipo: 'validacion'; campos: string[] }
  | { tipo: 'temporal' }
  | { tipo: 'recuperacion' }
  | { tipo: 'autorizacion' }
  | { tipo: 'configuracion' }
  | { tipo: 'demasiado_grande' }
  | { tipo: 'solicitud' }
  | { tipo: 'red' }
  | { tipo: 'interno' };

export type TipoResultado = ResultadoEnvio['tipo'];

export const TIPOS_INCIERTOS: ReadonlySet<TipoResultado> = new Set([
  'red',
  'recuperacion',
  'interno',
  'conflicto',
]);

export const MENSAJES_ENVIO: Record<
  TipoResultado,
  { titulo: string; detalle: string }
> = {
  exito: {
    titulo: 'Registro de prueba recibido',
    detalle: 'Inscripción ha sido guardada exitosamente, ¡Mucha suerte!',
  },
  duplicado: {
    titulo: 'Este registro ya se ha recibido',
    detalle: 'Revisa tus credenciales.',
  },
  conflicto: {
    titulo: 'Este identificador ya corresponde a otros datos',
    detalle:
      'El servidor ya recibió un envío con este identificador y datos o documentos distintos; no se guardó un registro nuevo. Conservamos lo que capturaste. No lo reenvíes con otro identificador sin avisar al equipo técnico: podrías duplicar la inscripción.',
  },
  datos_modificados: {
    titulo: 'Cambiaste datos después de un envío incierto',
    detalle:
      'No sabemos si el envío anterior se guardó. Para evitar un registro duplicado o contradictorio no enviaremos datos distintos con el mismo identificador. Restaura los datos y documentos originales para reintentar o avisa al equipo técnico.',
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
  autorizacion: {
    titulo: 'Falta autorización para enviar la prueba',
    detalle:
      'El servidor no autorizó este envío. Conservamos tus datos y archivos; solicita al equipo técnico que prepare el acceso al sandbox. No compartas tokens ni contraseñas.',
  },
  configuracion: {
    titulo: 'El registro de pruebas no está disponible',
    detalle:
      'El entorno de pruebas está deshabilitado o sin configurar. No es un problema de tus datos; avisa al equipo técnico.',
  },
  demasiado_grande: {
    titulo: 'Los archivos son demasiado grandes',
    detalle: `Cada archivo puede pesar hasta ${formatearBytes(MAX_ARCHIVO_BYTES)} y los tres juntos hasta ${formatearBytes(MAX_TOTAL_ARCHIVOS_BYTES)}. Reemplaza los más pesados.`,
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

/** El folio es opaco: se muestra tal cual y nunca se inventa. */
function leerFolio(cuerpo: unknown): string | undefined {
  if (
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    'folio' in cuerpo &&
    typeof cuerpo.folio === 'string' &&
    cuerpo.folio.trim() !== ''
  ) {
    return cuerpo.folio.trim();
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
    const folio = leerFolio(cuerpo);
    if (code === 'SAVED') {
      return folio ? { tipo: 'exito', folio } : { tipo: 'exito' };
    }
    if (code === 'DUPLICATE') {
      return folio ? { tipo: 'duplicado', folio } : { tipo: 'duplicado' };
    }
    return { tipo: 'interno' };
  }
  if (status === 400) {
    return code === 'VALIDATION_ERROR'
      ? { tipo: 'validacion', campos: leerCampos(cuerpo) }
      : { tipo: 'solicitud' };
  }
  if (status === 409) {
    return code === 'IDEMPOTENCY_CONFLICT'
      ? { tipo: 'conflicto' }
      : { tipo: 'interno' };
  }
  if (status === 413) return { tipo: 'demasiado_grande' };
  if (status === 502) {
    return { tipo: code === 'RECOVERY_REQUIRED' ? 'recuperacion' : 'temporal' };
  }
  if (status === 401) return { tipo: 'autorizacion' };
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
export function crearSesionEnvio(
  generarId: () => string = generarTransactionId,
) {
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
