# Estrategia de contenido y recursos

## Objetivo

Mantener una sola fuente de verdad para categorías, imágenes y reglamentos sin duplicar manualmente materiales entre la documentación y la aplicación.

## Registro de categorías

`src/data/categories.ts` concentra por categoría:

- slug estable;
- nombre de trabajo y estado de confirmación;
- imagen importada desde `assets/categories/`;
- ruta del Markdown normativo;
- URL de build del PDF original.

Las páginas dinámicas se generan a partir de este registro. No deben mantener listas independientes de categorías.

## Imágenes

Los originales permanecen en `assets/categories/`. Astro los importa desde su ubicación actual y genera derivados optimizados; no deben copiarse a `public/` ni recomprimirse manualmente.

## Reglamentos

- El Markdown legible permanece en `docs/regulations/`.
- El PDF original permanece en `docs/sources/regulations/` y conserva precedencia normativa.
- Los PDF se sirven mediante rutas estables `/regulations/<slug>.pdf` generadas desde `src/pages/regulations/[slug].pdf.ts`, leyendo los originales de `docs/sources/regulations/`.
- `src/content.config.ts` declara la colección `regulations` mediante el loader `glob` de Astro sobre `docs/regulations/**/*.md`. El `id` de cada entrada es el nombre de archivo sin extensión, idéntico al `slug` de la categoría. La página dinámica `src/pages/categorias/[slug].astro` resuelve la entrada con `getEntry('regulations', slug)` y la renderiza con `render()`; no se copian ni transforman los archivos fuente.
- `astro.config.mjs` define los ajustes para desplazar encabezados (`shiftMarkdownHeadings`) y limpiar citas editoriales (`stripTranscriptionNotice`) para mantener un único `h1` y enlaces íntegros.

Si la estrategia de build cambia, debe conservarse esta relación y añadirse una verificación automática que garantice una imagen, un Markdown y un PDF para cada categoría.

## Nombres de Minisumo

El kit de inicio propone “Minisumo Autónomo” (reflejado en `src/data/categories.ts` tras la integración de la landing), mientras que los reglamentos originales conservan “Minisumo”. La decisión definitiva permanece sujeta a validación final con CROFI conforme a `docs/requirements/preguntas-abiertas.md`.
