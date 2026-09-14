# Flujo de trabajo ligero para Copa Ollin

## Propósito

Este documento es la guía operativa canónica para el desarrollo de Copa Ollin.
Adopta un Scrum ligero con ejecución Kanban: se planifica una iteración
semanal, pero el trabajo avanza mediante tareas pequeñas, revisión temprana e
integración continua.

La guía no sustituye los requisitos ni las decisiones de arquitectura. Cuando
una tarea dependa de una respuesta de CROFI, debe consultarse
[`docs/requirements/preguntas-abiertas.md`](requirements/preguntas-abiertas.md)
y hacer visible el bloqueo antes de implementar.

## Roles y capacidad

- Cada sprint semanal inicia con **cuatro issues principales**, uno por
  developer.
- **Cano** facilita, desbloquea y coordina la integración; no ocupa una de las
  cuatro tareas principales.
- Cada developer mantiene normalmente una sola tarea principal activa.
- Un developer distinto del autor revisa cada pull request. Para el Sprint 1
  se proponen las parejas Dev A ↔ Dev B y Dev C ↔ Dev D; las cuentas reales se
  asignan durante el kickoff.
- Cano realiza normalmente el _squash merge_. Sebastián es el respaldo si Cano
  no está disponible.
- Sebastián prueba el `main` integrado en staging, registra la evidencia y
  cierra los issues aceptados.

Terminar una tarea antes de tiempo significa revisar, ayudar o corregir. No se
asigna automáticamente una quinta tarea.

## Tablero de GitHub Projects

Crear el proyecto de organización **`Copa Ollin · Desarrollo 2026`** con una
iteración semanal y estos cinco valores de `Status`, en este orden:

1. `Lista`
2. `En curso`
3. `En revisión`
4. `QA`
5. `Hecha`

Configurar las vistas siguientes:

- **`Sprint actual`**: layout Kanban/board, agrupado por `Status` y filtrado
  por la iteración vigente (`iteration:@current`).
- **`Backlog`**: layout table, sin filtro de iteración para conservar las
  tareas futuras.

No usar story points, estimaciones complejas ni milestones duplicados. La
capacidad se acuerda cada domingo a partir de la disponibilidad real.

## Ciclo de una tarea

### 1. Issue listo

Antes de comenzar, el issue debe explicar:

- objetivo y contexto;
- criterios de aceptación observables;
- fuera de alcance;
- dependencias y preguntas abiertas;
- responsable y reviewer sugerido;
- evidencia que deberá conservarse para la aceptación.

Si falta una decisión, no se convierte la pregunta en requisito por
interpretación. Se explica el impacto, se proponen opciones y se registra la
decisión aprobada en `docs/`.

### 2. Rama y trabajo

Partir de `main` actualizado y comprobar el worktree antes de editar:

```bash
git status --short --branch
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feat/<issue>-<nombre>
```

Usar el prefijo que corresponda al cambio: `feat/`, `fix/`, `docs/` o
`chore/`. Mantener la rama enfocada en un solo issue; separar cambios no
relacionados.

### 3. Pull request temprano

Abrir el pull request cuando exista un cambio revisable, aunque la tarea aún
requiera ajustes. En el cuerpo usar `Refs #<issue>` (o `Ref #<issue>`), nunca
`Closes #<issue>`: la aceptación ocurre después del merge y de la prueba en
staging.

El PR debe incluir alcance, dependencias, comandos ejecutados, resultados de
CI, evidencia visual cuando aplique y el plan de QA posterior al merge.

### 4. Revisión e integración

Un developer distinto revisa código, alcance, accesibilidad, privacidad y
pruebas. El PR sólo se integra cuando cumple simultáneamente:

- el check `quality` está verde;
- existe una aprobación de otra persona;
- las conversaciones están resueltas;
- no se amplió el alcance del issue.

Cano hace _squash merge_ y elimina la rama cuando GitHub lo permita. Sebastián
lo sustituye sólo por indisponibilidad de Cano.

### 5. QA posterior al merge

Después del merge:

1. el issue pasa a `QA`;
2. el workflow de staging despliega el commit exacto de `main` después del CI
   verde;
3. Sebastián prueba ese snapshot y registra commit, URL o identificador del
   despliegue, pasos, resultado esperado y resultado real;
4. si pasa, cierra el issue y lo mueve a `Hecha`;
5. si falla, documenta severidad y pasos de reproducción, vuelve el issue a
   `En curso` y corrige mediante una rama `fix/`.

Cualquier merge posterior al snapshot probado queda fuera del incremento
aceptado hasta que Sebastián vuelva a probarlo.

## Cadencia estudiantil

- **Domingo:** review, retrospectiva breve, capacidad real y asignación de las
  siguientes cuatro tareas.
- **Durante la semana:** cada developer comenta avances cuando tenga actividad.
- **Al detectar un bloqueo:** se notifica de inmediato; Cano debe conocerlo
  antes de que transcurran 24 horas.
- **Sábado:** Sebastián prueba el último snapshot disponible en staging.
- **Domingo:** comunica resultados, defectos y tareas no aceptadas.

No hay dailies, checkpoints ni una hora límite rígida. El objetivo es mantener
trazabilidad y desbloquear, no medir presencia.

## Sprint 1

Al activar el proyecto se crean únicamente estos cuatro issues principales;
las cuentas pueden quedar sin asignar hasta el kickoff:

1. **Landing informativa, contenido confirmado y responsive.** Presentar el
   evento y la navegación con contenido aprobado, respetando `DESIGN.md`, sin
   publicar preguntas abiertas.
2. **Seis categorías, reglamentos Markdown y descargas PDF.** Conservar una
   imagen, un Markdown y un PDF por categoría, con precedencia del PDF si
   existe una discrepancia.
3. **Spike restringido de Google Sheets/Drive con datos ficticios y ADR.**
   Probar sólo viabilidad técnica, autenticación, permisos y continuidad con
   recursos de prueba; no usar credenciales, datos reales ni cargas de
   participantes.
4. **Playwright, mocks, smoke tests y contrato inicial del registro.** Definir
   pruebas y un contrato provisional explícitamente no productivo; no habilitar
   el registro real ni implementar carga de archivos hasta resolver las
   preguntas pendientes.

Cada issue debe completar todos los campos de la plantilla antes de iniciar.
El reviewer sugerido se asigna durante el kickoff y no puede ser el autor del
PR.

## CI de calidad

`.github/workflows/quality.yml` publica un único check llamado `quality` para
pull requests y para cada push a `main`. Ejecuta con Node.js 22 y pnpm 11:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm check
pnpm test
pnpm build
```

El workflow no recibe secretos y sólo solicita `contents: read`. La
concurrencia cancela ejecuciones obsoletas del mismo ref.

## Staging central

El staging es un único proyecto de Vercel administrado por Hello World. Se
mantiene sin dominio público final y la aplicación conserva `noindex` hasta
que CROFI apruebe la publicación. Aunque Vercel denomine el entorno
`production`, operativamente es staging hasta el lanzamiento.

El workflow separado
`.github/workflows/staging.yml` se activa sólo después de un `quality` verde
originado por un push a `main`, y ejecuta con la CLI fijada en el lockfile:

```bash
pnpm exec vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
pnpm exec vercel build --prod --token="$VERCEL_TOKEN"
pnpm exec vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
```

Los tres secretos se configuran exclusivamente en el Environment protegido
`staging` de GitHub:

- `VERCEL_TOKEN`;
- `VERCEL_ORG_ID`;
- `VERCEL_PROJECT_ID`.

El repositorio nunca contiene sus valores. El proyecto usa únicamente datos
ficticios y no se implementa ninguna credencial, carga de archivos o contrato
definitivo del formulario como parte de este bootstrap.

## Protección de `main`

Después de la primera ejecución verde de `quality`, una persona con permisos
administrativos configura una regla para `main` con:

- pull request obligatorio;
- una aprobación de una persona distinta del autor;
- aprobación de la revisión más reciente después del último cambio revisable;
- check `quality` obligatorio;
- conversaciones resueltas;
- force-push y eliminación de la rama deshabilitados;
- sólo _squash merge_ y borrado automático de la rama;
- sin exigir que cada rama se actualice después de todos los merges.

La responsabilidad operativa inicial queda en Cano y Sebastián, sin restringir
técnicamente actores hasta confirmar sus usernames. El detalle de protección
se activa en GitHub; no se simula en archivos del repositorio. Consulta la
[guía oficial de ramas protegidas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
para aplicar la regla y la [documentación de filtros de
Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects)
para la vista de la iteración actual.

## Bootstrap único y límites

El bootstrap inicial puede integrar la fundación F0–F5 y este flujo en dos
commits, hacer un push fast-forward a `main`, comprobar CI/staging y activar
después las protecciones. Una vez protegida la rama, todo cambio sigue:

`issue → rama → PR → revisión → squash merge → QA`.

La creación del Project, sus iteraciones, los cuatro issues y los secrets de
Vercel requieren una cuenta con permisos externos. Si no están disponibles,
se deja el checklist pendiente y se informa el bloqueo; no se inventan
usernames, IDs, URLs operativas ni credenciales. El flujo de CLI sigue la
[guía oficial de Vercel para GitHub Actions](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).
