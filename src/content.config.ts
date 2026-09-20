import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Fuente única de los seis reglamentos legibles. El `id` de cada entrada es
 * el nombre de archivo sin extensión (p. ej. "carrera-de-insectos"), que
 * coincide con `slug` en `src/data/categories.ts`. El PDF original en
 * `docs/sources/regulations/` conserva precedencia normativa; esta colección
 * sólo lee `docs/regulations/` para renderizar la transcripción legible, sin
 * copiar ni transformar los archivos fuente.
 */
const regulations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './docs/regulations' }),
});

export const collections = { regulations };
