# ADR-0001: stack y fundación inicial

- **Estado:** aceptada.
- **Fecha:** 13 de septiembre de 2026.
- **Alcance:** fundación técnica F0–F5.

## Contexto

Copa Ollin necesita una plataforma mayormente informativa, mobile-first y de carga rápida, con una isla interactiva para el futuro formulario y una ruta de servidor para integrar Google Sheets y Drive. El equipo dispone de cuatro developers estudiantes y debe reducir coordinación, dependencias y costo operativo.

El repositorio ya contiene requisitos, reglamentos, recursos y un [sistema de diseño](../../../DESIGN.md), pero no contenía aplicación ni comandos reproducibles.

## Decisión

- **Runtime:** Node.js 22.23.2, fijado mediante `.nvmrc`, `engines` y `devEngines.runtime`; pnpm descarga este runtime para los scripts del proyecto si el host usa otra versión.
- **Paquetes:** pnpm 11.3.0, fijado mediante `packageManager`, con lockfile versionado e instalación reproducible mediante `--frozen-lockfile`.
- **Framework:** Astro 7.2.8 y TypeScript 5.9 en modo estricto.
- **Interactividad:** React 19 únicamente para islas que justifiquen estado complejo; el contenido permanece en Astro y HTML.
- **Estilos:** Tailwind CSS 4 mediante su plugin oficial de Vite (`@tailwindcss/vite`), junto con los tokens de `DESIGN.md` en CSS global.
- **Tipografía pública provisional:** Orbitron autohospedada mediante Fontsource, con licencia OFL-1.1. Robotic no se sirve mientras no exista autorización de redistribución.
- **Despliegue previsto:** Vercel. El adaptador queda instalado, pero la conexión remota, previews y CI pertenecen a F6.
- **Render inicial:** estático. Cuando exista el endpoint de registro se habilitará render bajo demanda sólo donde sea necesario.
- **Calidad:** Astro Check, ESLint, Prettier y Vitest. Playwright y los escenarios E2E se incorporarán durante el Sprint 1.
- **Dependencias nativas:** se impide el script de instalación de `sharp` y se usan sus binarios opcionales precompilados fijados en el lockfile; así un `libvips` global no fuerza una compilación distinta por máquina.
- **Datos:** `src/data/categories.ts` es el registro tipado de categorías; los documentos de `docs/` conservan precedencia.

Las versiones exactas quedan registradas en `package.json` y `pnpm-lock.yaml`. No se actualizan durante los cuatro sprints salvo corrección crítica aprobada.

## Consecuencias

### Positivas

- La mayor parte del sitio puede entregarse como archivos estáticos y distribuirse mediante CDN.
- React no aumenta el JavaScript de páginas que no necesitan interacción.
- Un solo contrato de categorías evita nombres, slugs y recursos divergentes.
- El equipo puede ejecutar las mismas verificaciones localmente y, más adelante, en CI.

### Costos y límites

- Tailwind 4 requiere navegadores modernos; el alcance definitivo de compatibilidad continúa en preguntas abiertas.
- El endpoint futuro necesitará límites, idempotencia, autorización y pruebas específicas.
- La integración con Google no queda aprobada por instalar un adaptador; debe validarse mediante el spike del Sprint 1.
- Robotic permanece como recurso local no publicable hasta aclarar su licencia.

## Fuera de esta decisión

- Configuración de Vercel y GitHub Actions.
- Secretos o recursos de Google Workspace.
- Contrato definitivo del formulario.
- Estrategia final de carga de archivos.
- Issues y asignaciones del Sprint 1.
