# ADR-0002: flujo operativo, CI y staging

- **Estado:** aceptada.
- **Fecha:** 13 de septiembre de 2026.
- **Alcance:** F6–F7 y operación de los sprints iniciales.

## Contexto

La fundación F0–F5 dejó preparada una aplicación Astro estática, los
comandos locales de calidad y el adaptador de Vercel, pero no definió cómo
coordinar a cuatro developers, integrar cambios ni probar `main` antes de
cerrar una tarea. También faltaban CI, staging central y las reglas de
protección de la rama principal.

Las cuentas, usernames, IDs de proyecto y recursos operativos de GitHub,
Vercel y Google Workspace aún dependen de accesos administrativos y de las
respuestas de CROFI. Esta decisión fija el flujo y los contratos versionables;
no publica esos valores.

## Decisión

### Flujo de trabajo

- Se adopta Scrum ligero con ejecución Kanban semanal.
- Cada sprint inicia con cuatro issues principales, uno por developer.
- Cano facilita y normalmente integra; Sebastián prueba el staging integrado y
  cierra las tareas aceptadas.
- Cada PR requiere revisión de otro developer, CI verde y conversaciones
  resueltas. Se usa `Refs #<issue>` porque el cierre sucede después de QA.
- La integración usa squash merge. No se usan story points ni milestones
  duplicados.
- GitHub Project tendrá los estados `Lista`, `En curso`, `En revisión`, `QA` y
  `Hecha`, con vistas `Sprint actual` y `Backlog`.

### CI

`.github/workflows/quality.yml` ejecuta el único check `quality` en pull
requests y pushes a `main`, con Node.js 22, pnpm 11 y `pnpm install
--frozen-lockfile`, seguido de formato, lint, Astro Check, Vitest y build.
Solicita únicamente `contents: read`, no usa secretos y cancela ejecuciones
obsoletas del mismo ref.

### Staging

`.github/workflows/staging.yml` se activa mediante `workflow_run` sólo cuando
el workflow `quality` termina verde por un push a `main`. Usa un proyecto de
Vercel central en el Environment protegido `staging`, sin dominio público
final y con `noindex` conservado. La CLI `vercel@59.16.0` queda fijada como
devDependency exacta y en `pnpm-lock.yaml`.

El despliegue ejecuta `vercel pull`, `vercel build --prod` y
`vercel deploy --prebuilt --prod` con `VERCEL_TOKEN`, `VERCEL_ORG_ID` y
`VERCEL_PROJECT_ID`. La etiqueta `production` de Vercel no cambia el uso
operativo: el proyecto es staging hasta el lanzamiento.

### Rama principal

La política del equipo exige PR, una aprobación distinta del autor, `quality`
verde, conversaciones resueltas, squash merge y borrado automático de ramas.
Estas reglas estuvieron protegidas técnicamente mientras el repositorio fue
público. Desde el 20 de septiembre de 2026 el repositorio es privado y el plan
actual de GitHub de la organización no habilita protección de ramas privadas;
por ello, GitHub no las aplica automáticamente. Para recuperar esa garantía se
debe actualizar el plan o volver a una visibilidad compatible. No se autoriza
push directo a `main` durante este periodo.

## Consecuencias

### Positivas

- La coordinación cabe en cuatro tareas semanales y cada cambio tiene un
  responsable y un reviewer.
- El estado `QA` evita confundir merge con aceptación del producto.
- El mismo conjunto de comandos se ejecuta localmente y en CI.
- El staging central evita exigir una cuenta de Vercel a cada developer y
  permite probar exactamente el `main` integrado.

### Costos y límites

- La creación del Project, la protección de rama, el Environment y los secrets
  no se puede verificar sólo desde Git y requiere una cuenta administrativa.
- En la visibilidad privada actual, el plan de GitHub no aplica protección de
  rama; el flujo depende temporalmente del cumplimiento operativo del equipo.
- El workflow de staging no autoriza por sí mismo a usar datos reales ni
  resuelve autenticación, privacidad, retención o carga de archivos.
- Las vistas e iteraciones de GitHub deben mantenerse manualmente durante el
  kickoff semanal.

## Fuera de esta decisión

- Dominio final, publicación indexable y lanzamiento.
- Credenciales, IDs o URLs operativas de Vercel, GitHub, Sheets o Drive.
- Integración productiva de Google Workspace.
- Contrato definitivo, autenticación y carga de archivos del registro.
- Asignación de usernames concretos a Cano, Sebastián y developers.
