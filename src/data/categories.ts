import type { ImageMetadata } from 'astro';

import carreraDeInsectosImage from '../../assets/categories/carrera-de-insectos.png';
import micromouseAmateurImage from '../../assets/categories/micromouse-amateur.png';
import minisumoAmateurImage from '../../assets/categories/minisumo-amateur.png';
import minisumoProfesionalImage from '../../assets/categories/minisumo-profesional.png';
import seguidorAmateurImage from '../../assets/categories/seguidor-de-linea-amateur.png';
import seguidorProfesionalImage from '../../assets/categories/seguidor-de-linea-profesional.png';

export type CategoryNameStatus = 'confirmed' | 'pending-confirmation';

export interface CategoryDefinition {
  slug: string;
  workingName: string;
  nameStatus: CategoryNameStatus;
  image: ImageMetadata;
  imageAlt: string;
  regulationMarkdownPath: string;
  regulationPdfUrl: string;
}

export const categories: readonly CategoryDefinition[] = [
  {
    slug: 'carrera-de-insectos',
    workingName: 'Carrera de insectos',
    nameStatus: 'confirmed',
    image: carreraDeInsectosImage,
    imageAlt: 'Robot articulado para la categoría Carrera de insectos',
    regulationMarkdownPath: 'docs/regulations/carrera-de-insectos.md',
    regulationPdfUrl: '/regulations/carrera-de-insectos.pdf',
  },
  {
    slug: 'micromouse-amateur',
    workingName: 'Micromouse amateur',
    nameStatus: 'confirmed',
    image: micromouseAmateurImage,
    imageAlt: 'Robot móvil para la categoría Micromouse amateur',
    regulationMarkdownPath: 'docs/regulations/micromouse-amateur.md',
    regulationPdfUrl: '/regulations/micromouse-amateur.pdf',
  },
  {
    slug: 'minisumo-amateur',
    workingName: 'Minisumo amateur',
    nameStatus: 'pending-confirmation',
    image: minisumoAmateurImage,
    imageAlt: 'Robot de la categoría Minisumo amateur',
    regulationMarkdownPath: 'docs/regulations/minisumo-amateur.md',
    regulationPdfUrl: '/regulations/minisumo-amateur.pdf',
  },
  {
    slug: 'minisumo-profesional',
    workingName: 'Minisumo profesional',
    nameStatus: 'pending-confirmation',
    image: minisumoProfesionalImage,
    imageAlt: 'Robot de la categoría Minisumo profesional',
    regulationMarkdownPath: 'docs/regulations/minisumo-profesional.md',
    regulationPdfUrl: '/regulations/minisumo-profesional.pdf',
  },
  {
    slug: 'seguidor-de-linea-amateur',
    workingName: 'Seguidor de línea amateur',
    nameStatus: 'confirmed',
    image: seguidorAmateurImage,
    imageAlt: 'Robot de la categoría Seguidor de línea amateur',
    regulationMarkdownPath: 'docs/regulations/seguidor-de-linea-amateur.md',
    regulationPdfUrl: '/regulations/seguidor-de-linea-amateur.pdf',
  },
  {
    slug: 'seguidor-de-linea-profesional',
    workingName: 'Seguidor de línea profesional',
    nameStatus: 'confirmed',
    image: seguidorProfesionalImage,
    imageAlt: 'Robot de la categoría Seguidor de línea profesional',
    regulationMarkdownPath: 'docs/regulations/seguidor-de-linea-profesional.md',
    regulationPdfUrl: '/regulations/seguidor-de-linea-profesional.pdf',
  },
];

export function getCategoryBySlug(
  slug: string,
): CategoryDefinition | undefined {
  return categories.find((category) => category.slug === slug);
}
