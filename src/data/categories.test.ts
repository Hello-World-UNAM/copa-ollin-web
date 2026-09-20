import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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

describe('activos por categoría', () => {
  // src/data/categories.test.ts -> src/data/ -> src/ -> raíz del repositorio
  const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

  it('conserva un Markdown en docs/regulations/ y un PDF fuente en docs/sources/regulations/ para cada categoría', () => {
    for (const category of categories) {
      const markdownPath = `${repoRoot}${category.regulationMarkdownPath}`;
      const pdfSourcePath = `${repoRoot}docs/sources/regulations/${category.slug}.pdf`;

      expect(existsSync(markdownPath), markdownPath).toBe(true);
      expect(existsSync(pdfSourcePath), pdfSourcePath).toBe(true);
    }
  });
});
