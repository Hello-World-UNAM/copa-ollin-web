import { describe, expect, it } from 'vitest';

import { categories, getCategoryBySlug } from './categories';

describe('registro de categorías', () => {
  it('contiene exactamente las seis categorías entregadas por CROFI', () => {
    expect(categories).toHaveLength(6);
  });

  it('mantiene slugs únicos y estables', () => {
    const slugs = categories.map(({ slug }) => slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual([
      'carrera-de-insectos',
      'micromouse-amateur',
      'minisumo-amateur',
      'minisumo-profesional',
      'seguidor-de-linea-amateur',
      'seguidor-de-linea-profesional',
    ]);
  });

  it('conserva visible la confirmación pendiente de los nombres de Minisumo', () => {
    const pendingNames = categories
      .filter(({ nameStatus }) => nameStatus === 'pending-confirmation')
      .map(({ slug }) => slug);

    expect(pendingNames).toEqual(['minisumo-amateur', 'minisumo-profesional']);
  });

  it('resuelve una categoría conocida y rechaza una desconocida', () => {
    expect(getCategoryBySlug('micromouse-amateur')?.workingName).toBe(
      'Micromouse amateur',
    );
    expect(getCategoryBySlug('categoria-inexistente')).toBeUndefined();
  });
});
