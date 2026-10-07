import { categories } from '../../data/categories';
import { generarFolio } from './folio';

// Posiciones de la pestaña canónica `Registros` (A:R + folio en S). No cambian.
const COL = {
  transactionId: 0,
  nombreEquipo: 1,
  categoria: 2,
  institucion: 3,
  estadoCiudad: 4,
  capitan: 5,
  correo: 6,
  telefono: 7,
  identificacion: 8,
  integrantes: 9,
  robot: 10,
  descripcion: 11,
  reglamento: 12,
  usoImagen: 13,
  restricciones: 14,
  docIdentificacion: 15,
  docComprobante: 16,
  docCarta: 17,
  folio: 18,
} as const;

export const ENCABEZADOS_VISTA_OPERATIVA = [
  'Folio',
  'Equipo',
  'Categoría',
  'Institución',
  'Procedencia',
  'Capitán(na)',
  'Correo',
  'Teléfono',
  'Robot',
  'Integrantes',
  'Descripción del robot',
  'Reglamento',
  'Uso de imagen',
  'Restricciones de categoría',
  'Identificación (enlace)',
  'Comprobante (enlace)',
  'Carta responsiva (enlace)',
  'ID técnico',
] as const;

/** Encabezados de la fila 1 de `Registros` (A1:S1), en el orden canónico de columnas. */
export const ENCABEZADOS_REGISTROS = [
  'ID técnico',
  'Equipo',
  'Categoría',
  'Institución',
  'Procedencia',
  'Capitán(na)',
  'Correo',
  'Teléfono',
  'Identificación institucional',
  'Integrantes',
  'Robot',
  'Descripción del robot',
  'Reglamento',
  'Uso de imagen',
  'Restricciones de categoría',
  'Identificación (enlace)',
  'Comprobante (enlace)',
  'Carta responsiva (enlace)',
  'Folio',
] as const;

const texto = (valor: unknown): string => (valor == null ? '' : String(valor));

// Google puede devolver booleanos como TRUE/FALSE o true/false.
const siNo = (valor: unknown): string =>
  texto(valor).toLowerCase() === 'true' ? 'Sí' : 'No';

function integrantesLegibles(crudo: unknown): string {
  try {
    const lista: unknown = JSON.parse(texto(crudo) || '[]');
    if (!Array.isArray(lista) || lista.length === 0) return '(sin integrantes)';
    return lista
      .map((item, i) => {
        const { nombre, correo } = (item ?? {}) as Record<string, unknown>;
        return `${i + 1}. ${texto(nombre)}${correo ? ` <${texto(correo)}>` : ''}`;
      })
      .join('\n');
  } catch {
    // Si el JSON no es legible se conserva tal cual, sin perder el dato.
    return texto(crudo);
  }
}

/** Fila legible derivada de una fila canónica; nunca modifica la original. */
export function crearFilaVistaOperativa(fila: readonly unknown[]): string[] {
  const idTecnico = texto(fila[COL.transactionId]);
  const slug = texto(fila[COL.categoria]);
  const nombreCategoria =
    categories.find((c) => c.slug === slug)?.workingName ?? slug;
  return [
    // Filas anteriores sin folio lo reciben por derivación determinista.
    texto(fila[COL.folio]) || generarFolio(idTecnico),
    texto(fila[COL.nombreEquipo]),
    nombreCategoria,
    texto(fila[COL.institucion]),
    texto(fila[COL.estadoCiudad]),
    texto(fila[COL.capitan]),
    texto(fila[COL.correo]),
    texto(fila[COL.telefono]),
    texto(fila[COL.robot]),
    integrantesLegibles(fila[COL.integrantes]),
    texto(fila[COL.descripcion]),
    siNo(fila[COL.reglamento]),
    siNo(fila[COL.usoImagen]),
    siNo(fila[COL.restricciones]),
    texto(fila[COL.docIdentificacion]),
    texto(fila[COL.docComprobante]),
    texto(fila[COL.docCarta]),
    idTecnico,
  ];
}

export function crearVistaOperativa(
  filasCanonicas: readonly (readonly unknown[])[],
): string[][] {
  return filasCanonicas.map(crearFilaVistaOperativa);
}
