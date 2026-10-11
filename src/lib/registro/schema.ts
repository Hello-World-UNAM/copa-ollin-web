import { z } from 'zod';
import { categories } from '../../data/categories';
import { MAX_PALABRAS_DESCRIPCION, contarPalabras } from './contract';
import { ESTADOS_MX } from './estados';

const categorySlugs = categories.map((c) => c.slug) as [string, ...string[]];

export const integranteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre completo del integrante.'),
  correo: z
    .string()
    .trim()
    .refine(
      (valor) => valor === '' || z.email().safeParse(valor).success,
      'Escribe un correo válido',
    )
    .optional(),
});

export const registroSchema = z.object({
  // Equipo
  nombreEquipo: z.string().trim().min(1, 'Escribe el nombre del equipo.'),
  categoria: z.enum(categorySlugs, {
    error: 'Selecciona una categoría válida.',
  }),
  institucion: z.string().trim().min(1, 'Escribe la institución educativa.'),
  estadoCiudadProcedencia: z
    .string()
    .trim()
    .min(1, 'Escribe el estado de procedencia.')
    .refine(
      (v) => (ESTADOS_MX as readonly string[]).includes(v),
      'Elige un estado de la lista.',
    ),
  // Capitán
  nombreCapitan: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre completo del capitán o capitana.'),
  correoCapitan: z.string().trim().email('Escribe un correo válido.'),
  telefonoCapitan: z
    .string()
    .trim()
    .min(1, 'Escribe tu número de teléfono.')
    .regex(
      /^\d+$/,
      'El teléfono solo admite dígitos, sin espacios ni símbolos.',
    )
    .length(10, 'El teléfono debe tener exactamente 10 dígitos.'),
  identificacionInstitucional: z.string().trim().optional().or(z.literal('')),

  // Integrantes (sin límite fijo todavía: P1-03 pendiente)
  integrantes: z
    .array(integranteSchema)
    .min(1, 'Agrega al menos un integrante.'),

  // Robot
  nombreRobot: z.string().trim().min(1, 'Escribe el nombre del robot.'),
  descripcionRobot: z
    .string()
    .trim()
    .min(1, 'Describe brevemente el robot.')
    .refine((texto) => contarPalabras(texto) <= MAX_PALABRAS_DESCRIPCION, {
      message: `La descripción no debe superar ${MAX_PALABRAS_DESCRIPCION} palabras.`,
    }),

  // Confirmaciones (alcance/firmante exacto pendiente: P1-08)
  aceptaReglamento: z
    .boolean()
    .refine((valor) => valor === true, 'Debes aceptar el reglamento.'),
  aceptaUsoImagen: z
    .boolean()
    .refine(
      (valor) => valor === true,
      'Debes aceptar el uso de fotografías y material audiovisual.',
    ),
  confirmaRestriccionesCategoria: z
    .boolean()
    .refine(
      (valor) => valor === true,
      'Debes confirmar que el robot cumple las restricciones de su categoría.',
    ),
});

export type RegistroPayload = z.infer<typeof registroSchema>;
export type IntegrantePayload = z.infer<typeof integranteSchema>;

export const registroDefaultValues: RegistroPayload = {
  nombreEquipo: '',
  categoria: categorySlugs[0],
  institucion: '',
  estadoCiudadProcedencia: '',
  nombreCapitan: '',
  correoCapitan: '',
  telefonoCapitan: '',
  identificacionInstitucional: '',
  integrantes: [{ nombre: '', correo: '' }],
  nombreRobot: '',
  descripcionRobot: '',
  aceptaReglamento: false,
  aceptaUsoImagen: false,
  confirmaRestriccionesCategoria: false,
};
