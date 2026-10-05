import { readFile } from 'node:fs/promises';

import {
  CAMPOS_ARCHIVO,
  CAMPOS_ESCALARES,
} from '../../../src/lib/registro/contract';

/** Acuerdo objetivo Sprint04; no habilita formatos ni folio en el servidor actual. */
export const formatosSprint04 = {
  archivoIdentificacion: ['application/pdf'],
  comprobantePago: ['application/pdf', 'image/jpeg', 'image/png'],
  cartaResponsiva: ['application/pdf'],
} as const;

export const payloadSprint04 = {
  transactionId: 'reg-prueba-sprint04-0001',
  nombreEquipo: 'Equipo Ficticio Sprint04',
  categoria: 'carrera-de-insectos',
  institucion: 'Institución Ficticia de Pruebas',
  estadoCiudadProcedencia: 'Ciudad Ficticia',
  nombreCapitan: 'Capitán Ficticio',
  correoCapitan: 'capitan@example.invalid',
  telefonoCapitan: '0012345678',
  identificacionInstitucional: '',
  integrantes: [{ nombre: 'Integrante Ficticio' }],
  nombreRobot: 'Robot Ficticio',
  descripcionRobot: 'Robot ficticio utilizado sólo para verificar el contrato.',
  aceptaReglamento: true,
  aceptaUsoImagen: true,
  confirmaRestriccionesCategoria: true,
};

const folio = 'PRUEBA-FOLIO-0001';
const message =
  'Prueba guardada en sandbox; no constituye una inscripción aceptada.';

export const respuestasSprint04 = [
  { status: 200, body: { code: 'SAVED', message, isDuplicate: false, folio } },
  {
    status: 200,
    body: { code: 'DUPLICATE', message, isDuplicate: true, folio },
  },
  {
    status: 400,
    body: {
      code: 'VALIDATION_ERROR',
      error: 'Revisa el correo del integrante.',
      details: [
        { field: 'integrantes.0.correo', message: 'Escribe un correo válido.' },
      ],
    },
  },
  {
    status: 400,
    body: { code: 'INVALID_MULTIPART', error: 'Multipart inválido.' },
  },
  {
    status: 400,
    body: { code: 'UNEXPECTED_FIELD', error: 'Campo desconocido.' },
  },
  { status: 400, body: { code: 'REPEATED_FIELD', error: 'Campo repetido.' } },
  {
    status: 401,
    body: { code: 'SANDBOX_UNAUTHORIZED', error: 'Acceso rechazado.' },
  },
  {
    status: 409,
    body: {
      code: 'IDEMPOTENCY_CONFLICT',
      error: 'El identificador ya corresponde a datos o documentos diferentes.',
    },
  },
  {
    status: 413,
    body: { code: 'PAYLOAD_TOO_LARGE', error: 'Solicitud demasiado grande.' },
  },
  {
    status: 502,
    body: {
      code: 'TEMPORARY_STORAGE_ERROR',
      error: 'Fallo temporal.',
      recoverable: true,
    },
  },
  {
    status: 502,
    body: {
      code: 'RECOVERY_REQUIRED',
      error: 'Guardado no confirmado.',
      recoverable: true,
    },
  },
  {
    status: 503,
    body: { code: 'SANDBOX_DISABLED', error: 'Sandbox apagado.' },
  },
  {
    status: 503,
    body: {
      code: 'SANDBOX_AUTH_NOT_CONFIGURED',
      error: 'Falta configuración.',
    },
  },
  {
    status: 503,
    body: {
      code: 'SANDBOX_CONFIGURATION_ERROR',
      error: 'Falta configuración Google.',
    },
  },
  { status: 500, body: { code: 'INTERNAL_ERROR', error: 'Error interno.' } },
] as const;

/** Construye el multipart sin credenciales ni llamadas de red. No fijar Content-Type a mano. */
export async function crearMultipartSprint04(
  comprobante: 'pdf' | 'png' | 'jpeg' = 'pdf',
): Promise<FormData> {
  const form = new FormData();
  for (const campo of CAMPOS_ESCALARES) {
    const valor = payloadSprint04[campo];
    form.set(
      campo,
      campo === 'integrantes' ? JSON.stringify(valor) : String(valor),
    );
  }
  for (const campo of CAMPOS_ARCHIVO) {
    const extension = campo === 'comprobantePago' ? comprobante : 'pdf';
    const nombre = `${campo === 'comprobantePago' ? 'comprobante' : campo === 'cartaResponsiva' ? 'carta' : 'identificacion'}-ficticio.${extension}`;
    const mime = extension === 'pdf' ? 'application/pdf' : `image/${extension}`;
    const bytes = await readFile(new URL(nombre, import.meta.url));
    form.set(campo, new File([new Uint8Array(bytes)], nombre, { type: mime }));
  }
  return form;
}
