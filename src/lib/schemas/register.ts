import { z } from 'zod';

import { categories } from '../../data/categories';
import {
  MAX_ARCHIVO_BYTES,
  MAX_TOTAL_ARCHIVOS_BYTES,
  MAX_PALABRAS_DESCRIPCION,
  MIME_PDF,
  contarPalabras,
  validarArchivoPdf,
  validarTotalArchivos,
} from '../registro/contract';

// Se conservan los nombres exportados: handler.test.ts los importa.
export const MAX_SANDBOX_FILE_SIZE = MAX_ARCHIVO_BYTES;
export const MAX_SANDBOX_TOTAL_FILE_SIZE = MAX_TOTAL_ARCHIVOS_BYTES;
export const MAX_SANDBOX_MULTIPART_OVERHEAD = 64 * 1024;
export const MAX_SANDBOX_REQUEST_BODY_SIZE =
  MAX_SANDBOX_TOTAL_FILE_SIZE + MAX_SANDBOX_MULTIPART_OVERHEAD;
export const SANDBOX_FILE_MIME_TYPE = MIME_PDF;

const categorySlugs = categories.map((c) => c.slug) as [string, ...string[]];

const MIME_PNG = 'image/png';
const MIME_JPEG = 'image/jpeg';
const FIRMA_PNG = [137, 80, 78, 71, 13, 10, 26, 10];
const FIRMA_JPEG = [255, 216, 255];

const sandboxPdfSchema = z
  .instanceof(File, { error: 'Se requiere un archivo PDF ficticio' })
  .superRefine(async (file, ctx) => {
    const mensaje = await validarArchivoPdf(file);
    if (mensaje) ctx.addIssue({ code: 'custom', message: mensaje });
  });

// El comprobante admite PDF, PNG o JPEG; se valida MIME declarado y firma real.
async function validarComprobante(file: File): Promise<string | null> {
  if (file.type === MIME_PDF) return validarArchivoPdf(file);
  const firma =
    file.type === MIME_PNG
      ? FIRMA_PNG
      : file.type === MIME_JPEG
        ? FIRMA_JPEG
        : null;
  if (!firma) return 'El comprobante debe ser PDF, PNG o JPEG';
  if (file.size === 0) return 'El archivo no puede estar vacío';
  if (file.size > MAX_ARCHIVO_BYTES) {
    return `El archivo no debe superar ${MAX_ARCHIVO_BYTES / 1024 / 1024} MiB`;
  }
  const bytes = new Uint8Array(await file.slice(0, firma.length).arrayBuffer());
  return firma.every((byte, i) => bytes[i] === byte)
    ? null
    : 'El contenido del archivo no coincide con su tipo';
}

const comprobanteSchema = z
  .instanceof(File, { error: 'Se requiere el comprobante (PDF, PNG o JPEG)' })
  .superRefine(async (file, ctx) => {
    const mensaje = await validarComprobante(file);
    if (mensaje) ctx.addIssue({ code: 'custom', message: mensaje });
  });

const memberSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre del integrante es obligatorio'),
    correo: z.email({ error: 'Correo de integrante inválido' }).optional(),
  })
  .strict();

export const registerSchema = z
  .object({
    transactionId: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z0-9_-]{1,80}$/,
        'El identificador de prueba solo admite letras, números, guion y guion bajo (máximo 80 caracteres)',
      ),
    nombreEquipo: z
      .string()
      .trim()
      .min(2, 'El nombre del equipo es obligatorio'),
    categoria: z.enum(categorySlugs, {
      error: 'La categoría no está en el catálogo vigente',
    }),
    institucion: z.string().trim().min(1, 'La institución es obligatoria'),
    estadoCiudadProcedencia: z
      .string()
      .trim()
      .min(1, 'El estado o ciudad es obligatorio'),
    nombreCapitan: z
      .string()
      .trim()
      .min(1, 'El nombre del capitán es obligatorio'),
    correoCapitan: z.email({ error: 'Correo de capitán inválido' }),
    telefonoCapitan: z
      .string()
      .trim()
      .min(1, 'El teléfono es obligatorio')
      .regex(/^\d+$/, 'El teléfono solo admite dígitos'),
    identificacionInstitucional: z.string().trim().optional(),
    integrantes: z.array(memberSchema),
    nombreRobot: z.string().trim().min(1, 'El nombre del robot es obligatorio'),
    descripcionRobot: z
      .string()
      .refine(
        (descripcion) =>
          contarPalabras(descripcion) <= MAX_PALABRAS_DESCRIPCION,
        'La descripción no puede superar 300 palabras',
      ),
    aceptaReglamento: z.boolean(),
    aceptaUsoImagen: z.boolean(),
    confirmaRestriccionesCategoria: z.boolean(),
    archivoIdentificacion: sandboxPdfSchema,
    comprobantePago: comprobanteSchema,
    cartaResponsiva: sandboxPdfSchema,
  })
  .strict()
  .superRefine((datos, ctx) => {
    if (
      ![
        datos.archivoIdentificacion,
        datos.comprobantePago,
        datos.cartaResponsiva,
      ].every((file) => file instanceof File)
    )
      return;
    const mensaje = validarTotalArchivos([
      datos.archivoIdentificacion,
      datos.comprobantePago,
      datos.cartaResponsiva,
    ]);
    if (mensaje) {
      ctx.addIssue({ code: 'custom', message: mensaje, path: ['archivos'] });
    }
  });
