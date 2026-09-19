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

  it('usa el nombre oficial confirmado para las categorías de Minisumo', () => {
    const minisumoCategories = categories.filter(({ slug }) =>
      slug.startsWith('minisumo-'),
    );

    expect(
      minisumoCategories.map(({ workingName, nameStatus }) => [
        workingName,
        nameStatus,
      ]),
    ).toEqual([
      ['Minisumo Autónomo amateur', 'confirmed'],
      ['Minisumo Autónomo profesional', 'confirmed'],
    ]);
  });

  it('resuelve una categoría conocida y rechaza una desconocida', () => {
    expect(getCategoryBySlug('micromouse-amateur')?.workingName).toBe(
      'Micromouse amateur',
    );
    expect(getCategoryBySlug('categoria-inexistente')).toBeUndefined();
  });
});
