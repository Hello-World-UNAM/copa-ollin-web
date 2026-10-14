import { describe, expect, it } from 'vitest';

import { PATRON_FOLIO, generarFolio } from './folio';

describe('generarFolio', () => {
  it('es estable para el mismo transactionId', () => {
    expect(generarFolio('reg-ficticio-0001')).toBe(
      generarFolio('reg-ficticio-0001'),
    );
  });

  it('tiene formato corto y legible sin caracteres ambiguos', () => {
    for (let i = 0; i < 500; i++) {
      const folio = generarFolio(`reg-ficticio-${i}`);
      expect(folio).toMatch(PATRON_FOLIO);
      expect(folio).toHaveLength(12);
      expect(folio.slice(3)).not.toMatch(/[01OIL]/);
    }
  });

  it('no repite folios en una muestra de 5000 identificadores', () => {
    const folios = new Set(
      Array.from({ length: 5000 }, (_, i) => generarFolio(`reg-${i}`)),
    );
    expect(folios.size).toBe(5000);
  });
});
