export const ENDPOINT_REGISTRO = '/api/register';
export const MAX_ARCHIVO_BYTES = 1024 * 1024; // 1 MiB provisional
export const MAX_TOTAL_ARCHIVOS_BYTES = 3 * 1024 * 1024; // 3 MiB provisional
export const MIME_PDF = 'application/pdf';
export const FIRMA_PDF = '%PDF-';
export const MAX_PALABRAS_DESCRIPCION = 300;

export const CAMPOS_ESCALARES = [
  'transactionId',
  'nombreEquipo',
  'categoria',
  'institucion',
  'estadoCiudadProcedencia',
  'nombreCapitan',
  'correoCapitan',
  'telefonoCapitan',
  'identificacionInstitucional',
  'integrantes',
  'nombreRobot',
  'descripcionRobot',
  'aceptaReglamento',
  'aceptaUsoImagen',
  'confirmaRestriccionesCategoria',
] as const;

export const CAMPOS_ARCHIVO = [
  'archivoIdentificacion',
  'comprobantePago',
  'cartaResponsiva',
] as const;

export type CampoEscalar = (typeof CAMPOS_ESCALARES)[number];
export type CampoArchivo = (typeof CAMPOS_ARCHIVO)[number];

export const DOCUMENTOS: readonly { campo: CampoArchivo; etiqueta: string }[] =
  [
    { campo: 'archivoIdentificacion', etiqueta: 'Identificación del capitán' },
    { campo: 'comprobantePago', etiqueta: 'Comprobante de pago' },
    { campo: 'cartaResponsiva', etiqueta: 'Carta responsiva firmada' },
  ];

export function formatearBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Number((bytes / 1024 / 1024).toFixed(2))} MiB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KiB`;
}

export function contarPalabras(texto: string): number {
  const limpio = texto.trim();
  return limpio.length === 0 ? 0 : limpio.split(/\s+/).length;
}

/** Devuelve el mensaje del primer problema o null si el PDF es válido. */
export async function validarArchivoPdf(file: File): Promise<string | null> {
  if (file.size === 0) return 'El archivo no puede estar vacío';
  if (file.size > MAX_ARCHIVO_BYTES) {
    return `El archivo no debe superar ${formatearBytes(MAX_ARCHIVO_BYTES)}`;
  }
  if (file.type !== MIME_PDF) {
    return 'Solo se aceptan archivos PDF en el sandbox';
  }
  const cabecera = new TextDecoder().decode(
    new Uint8Array(await file.slice(0, FIRMA_PDF.length).arrayBuffer()),
  );
  return cabecera === FIRMA_PDF
    ? null
    : 'El contenido del archivo no coincide con un PDF';
}

export function validarTotalArchivos(
  archivos: readonly { size: number }[],
): string | null {
  const total = archivos.reduce((suma, { size }) => suma + size, 0);
  return total > MAX_TOTAL_ARCHIVOS_BYTES
    ? `Los archivos juntos no deben superar ${formatearBytes(MAX_TOTAL_ARCHIVOS_BYTES)}`
    : null;
}