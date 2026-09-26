import { z } from 'zod';

export const MAX_SANDBOX_FILE_SIZE = 5 * 1024 * 1024;
export const SANDBOX_FILE_MIME_TYPE = 'application/pdf';

const sandboxPdfSchema = z
  .instanceof(File, { error: 'Se requiere un archivo PDF ficticio' })
  .refine((file) => file.size > 0, 'El archivo no puede estar vacío')
  .refine(
    (file) => file.size <= MAX_SANDBOX_FILE_SIZE,
    'El archivo no debe superar los 5 MiB',
  )
  .refine(
    (file) => file.type === SANDBOX_FILE_MIME_TYPE,
    'Solo se aceptan archivos PDF en el sandbox',
  )
  .refine(async (file) => {
    const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    return new TextDecoder().decode(header) === '%PDF-';
  }, 'El contenido del archivo no coincide con un PDF');

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
        (description) =>
          description.trim().split(/\s+/).filter(Boolean).length <= 300,
        'La descripción no puede superar 300 palabras',
      ),
    aceptaReglamento: z.boolean(),
    aceptaUsoImagen: z.boolean(),
    confirmaRestriccionesCategoria: z.boolean(),
    archivoIdentificacion: sandboxPdfSchema,
    comprobantePago: sandboxPdfSchema,
    cartaResponsiva: sandboxPdfSchema,
  })
  .strict();
