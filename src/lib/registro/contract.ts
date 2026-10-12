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

export async function validarArchivoPdf(file: File): Promise<string | null> {
  if (file.size === 0) return 'El archivo no puede estar vacío';
  if (file.size > MAX_ARCHIVO_BYTES) {
    return `El archivo no debe superar ${formatearBytes(MAX_ARCHIVO_BYTES)}`;
  }
  if (file.type !== MIME_PDF) {
    return 'Solo se aceptan archivos PDF';
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
export const FORMATOS_DOCUMENTO: Record<CampoArchivo, readonly string[]> = {
  archivoIdentificacion: ['application/pdf'],
  comprobantePago: ['application/pdf', 'image/jpeg', 'image/png'],
  cartaResponsiva: ['application/pdf'],
};

export const ACCEPT_DOCUMENTO: Record<CampoArchivo, string> = {
  archivoIdentificacion: 'application/pdf',
  comprobantePago: 'application/pdf,image/jpeg,image/png',
  cartaResponsiva: 'application/pdf',
};

const FIRMA_PNG = [137, 80, 78, 71, 13, 10, 26, 10];

export async function validarArchivoDocumento(
  campo: CampoArchivo,
  file: File,
): Promise<string | null> {
  if (file.size === 0) return 'El archivo no puede estar vacío';
  if (file.size > MAX_ARCHIVO_BYTES) {
    return `El archivo no debe superar ${formatearBytes(MAX_ARCHIVO_BYTES)}`;
  }
  const permitidos = FORMATOS_DOCUMENTO[campo];
  if (!permitidos.includes(file.type)) {
    return permitidos.length === 1
      ? 'Solo se aceptan archivos PDF.'
      : 'Solo se aceptan archivos PDF, JPG o PNG. Si tu foto es HEIC o WebP, expórtala a JPG o PNG.';
  }
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const coincide =
    file.type === MIME_PDF
      ? new TextDecoder().decode(bytes.slice(0, 5)) === FIRMA_PDF
      : file.type === 'image/png'
        ? FIRMA_PNG.every((valor, i) => bytes[i] === valor)
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return coincide
    ? null
    : 'El contenido del archivo no coincide con su formato';
}
