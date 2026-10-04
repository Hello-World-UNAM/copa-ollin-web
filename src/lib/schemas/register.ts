import { z } from 'zod';

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

const sandboxPdfSchema = z
  .instanceof(File, { error: 'Se requiere un archivo PDF ficticio' })
  .superRefine(async (file, ctx) => {
    const mensaje = await validarArchivoPdf(file);
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
    categoria: z.string().trim().min(1, 'La categoría es obligatoria'),
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
    telefonoCapitan: z.string().trim().min(1, 'El teléfono es obligatorio'),
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
    comprobantePago: sandboxPdfSchema,
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
