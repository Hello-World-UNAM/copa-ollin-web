import { describe, expect, it } from 'vitest';
import { MAX_ARCHIVO_BYTES, validarArchivoDocumento } from './contract';

const PNG = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0];
const JPEG = [255, 216, 255, 224, 0, 16];
const PDF = new TextEncoder().encode('%PDF-1.4\n%%EOF\n');

const archivo = (bytes: ArrayLike<number>, nombre: string, tipo: string) =>
  new File([new Uint8Array(Array.from(bytes))], nombre, { type: tipo });

describe('validarArchivoDocumento', () => {
  it('el comprobante acepta PDF, PNG y JPEG válidos', async () => {
    expect(
      await validarArchivoDocumento(
        'comprobantePago',
        archivo(PDF, 'c.pdf', 'application/pdf'),
      ),
    ).toBeNull();
    expect(
      await validarArchivoDocumento(
        'comprobantePago',
        archivo(PNG, 'c.png', 'image/png'),
      ),
    ).toBeNull();
    expect(
      await validarArchivoDocumento(
        'comprobantePago',
        archivo(JPEG, 'c.jpg', 'image/jpeg'),
      ),
    ).toBeNull();
  });

  it('identificación y responsiva sólo aceptan PDF', async () => {
    for (const campo of ['archivoIdentificacion', 'cartaResponsiva'] as const) {
      expect(
        await validarArchivoDocumento(
          campo,
          archivo(PDF, 'x.pdf', 'application/pdf'),
        ),
      ).toBeNull();
      expect(
        await validarArchivoDocumento(
          campo,
          archivo(PNG, 'x.png', 'image/png'),
        ),
      ).toMatch(/Solo se aceptan archivos PDF/);
    }
  });

  it('rechaza imágenes disfrazadas, SVG, HEIC, WebP, vacíos y excesivos', async () => {
    const texto = new TextEncoder().encode('no soy una imagen');
    expect(
      await validarArchivoDocumento(
        'comprobantePago',
        archivo(texto, 'falso.png', 'image/png'),
      ),
    ).toBe('El contenido del archivo no coincide con su formato');
    expect(
      await validarArchivoDocumento(
        'comprobantePago',
        archivo(texto, 'falso.jpg', 'image/jpeg'),
      ),
    ).toBe('El contenido del archivo no coincide con su formato');
    for (const tipo of ['image/svg+xml', 'image/heic', 'image/webp']) {
      expect(
        await validarArchivoDocumento(
          'comprobantePago',
          archivo(texto, 'x', tipo),
        ),
      ).toMatch(/PDF, JPG o PNG/);
    }
    expect(
      await validarArchivoDocumento(
        'comprobantePago',
        archivo([], 'vacio.png', 'image/png'),
      ),
    ).toBe('El archivo no puede estar vacío');
    const grande = new Uint8Array(MAX_ARCHIVO_BYTES + 1);
    grande.set(PNG);
    expect(
      await validarArchivoDocumento(
        'comprobantePago',
        archivo(grande, 'grande.png', 'image/png'),
      ),
    ).toMatch(/no debe superar/);
  });
});
