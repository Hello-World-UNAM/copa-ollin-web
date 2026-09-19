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
- Los PDF se importan con `?url` para que Vite emita una URL pública durante el build sin mantener una segunda copia manual.
- `src/content.config.ts` declara la colección `regulations` mediante el loader `glob` de Astro sobre `docs/regulations/**/*.md`. El `id` de cada entrada es el nombre de archivo sin extensión, idéntico al `slug` de la categoría. La página dinámica `src/pages/categorias/[slug].astro` resuelve la entrada con `getEntry('regulations', slug)` y la renderiza con `render()`; no se copian ni transforman los archivos fuente.
- `astro.config.mjs` aplica dos ajustes al HTML generado, sin modificar los archivos Markdown:
  1. Desplaza en un nivel los encabezados renderizados (`shiftMarkdownHeadings`) para que el `h1` de la página siga siendo el único de nivel 1, ya que los seis reglamentos repiten el mismo encabezado de nivel 1.
  2. Quita el bloque de cita editorial inicial ("Transcripción normalizada. Consulta el PDF fuente...") (`stripTranscriptionNotice`), porque su enlace es relativo a `docs/` y queda roto al servirse en `/categorias/<slug>`. La página ya repite esa misma información con un botón "Descargar reglamento... (PDF)" que enlaza a la URL correcta. Ningún ajuste toca medidas, fechas, consentimientos ni reglas de competencia.

## Nombres pendientes

Los nombres de Minisumo están marcados como `pending-confirmation` porque el kit utiliza “Minisumo autónomo” y los reglamentos usan “Minisumo”. No se debe eliminar esa marca hasta registrar la respuesta de CROFI en los requisitos. Este estado se muestra tanto en la tarjeta de la landing como en la página de la categoría.
