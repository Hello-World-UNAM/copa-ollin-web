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
- Los PDF se sirven mediante rutas estables `/regulations/<slug>.pdf` desde `src/pages/regulations/[slug].pdf.ts`, leyendo los originales de `docs/sources/regulations/`.
- La presentación completa del Markdown y los enlaces de descarga pertenecen al Sprint 1.

Si la estrategia de build cambia, debe conservarse esta relación y añadirse una verificación automática que garantice una imagen, un Markdown y un PDF para cada categoría.

## Nombres confirmados

El nombre público confirmado es “Minisumo Autónomo”. Las divisiones se muestran como “Minisumo Autónomo amateur” y “Minisumo Autónomo profesional”; el registro tipado conserva esa decisión en `src/data/categories.ts`.
