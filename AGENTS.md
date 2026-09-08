# Instrucciones para agentes de IA

## Alcance

Este archivo aplica a todo el repositorio. Si en el futuro aparece un `AGENTS.md` dentro de un subdirectorio, sus instrucciones complementan estas reglas y tienen prioridad únicamente dentro de ese árbol.

Lee este archivo completo antes de modificar el proyecto. Las solicitudes explícitas de la persona usuaria tienen prioridad, pero no amplían por sí solas permisos, acceso a datos privados ni alcance técnico.

## Contexto del proyecto

Copa Ollin es un torneo de robótica organizado por el Club de Robótica de la Facultad de Ingeniería (CROFI), en colaboración con Club Hello World, ambos vinculados a la UNAM.

- Evento previsto: 5–7 de noviembre de 2026.
- Sede prevista: Edificio X del Anexo de Ingeniería, Ciudad Universitaria, CDMX.
- Estado actual: pre-planeación y consolidación de requisitos.
- Audiencia del repositorio: mesa directiva, futuro equipo de desarrollo y colaboradores técnicos.
- Repositorio público: `Hello-World-UNAM/copa-ollin-web`.

El producto previsto es una plataforma web informativa y de registro para seis categorías:

1. Carrera de insectos.
2. Micromouse amateur.
3. Minisumo amateur.
4. Minisumo profesional.
5. Seguidor de línea amateur.
6. Seguidor de línea profesional.

La plataforma deberá mostrar categorías y reglamentos, recibir registros de equipos y manejar evidencias documentales. Existe un objetivo de hasta 500 usuarios concurrentes y una preferencia inicial por herramientas de Google Workspace.

## Estado técnico: no inventar decisiones

Todavía no existe aplicación, `package.json`, stack, arquitectura, modelo de datos, proveedor de despliegue ni suite de pruebas. No agregues un framework, backend, base de datos, servicio externo, CI o estructura de aplicación salvo que una tarea aprobada lo solicite explícitamente.

Las menciones de Google Sheets, Google Drive, Apps Script, webhooks, CDN, hosting estático y ausencia de SQL provienen de documentos iniciales. Son requisitos o propuestas por validar, no decisiones arquitectónicas definitivas.

Antes de diseñar o implementar funcionalidad, revisa `docs/requirements/preguntas-abiertas.md`. Si una tarea depende de una respuesta pendiente:

- no supongas silenciosamente;
- explica qué decisión falta y su impacto;
- propone opciones concretas y una recomendación;
- registra la decisión aprobada en la documentación correspondiente.

## Fuentes de verdad

Consulta los archivos en este orden:

1. La solicitud explícita y actual de la persona usuaria.
2. Decisiones aprobadas y documentadas en el repositorio.
3. `docs/requirements/` para alcance, requisitos y preguntas abiertas.
4. `docs/regulations/` para las versiones legibles de los reglamentos.
5. `docs/sources/` para comprobar los PDF originales publicables.
6. `README.md`, como resumen y navegación, no como sustituto de los documentos detallados.

Si una transcripción Markdown contradice su PDF, el PDF conserva precedencia hasta que CROFI aclare el requisito. No alteres requisitos, medidas, fechas, consentimientos ni reglas de competencia por criterio propio.

## Mapa del repositorio

- `README.md`: resumen público, estado y enlaces principales.
- `docs/requirements/`: SRS normalizado, kit sanitizado y decisiones pendientes.
- `docs/regulations/`: seis reglamentos en Markdown.
- `docs/sources/`: PDF originales aptos para publicación.
- `assets/brand/`: identidad institucional entregada.
- `assets/categories/`: una imagen por categoría.
- `.github/`: plantillas de issues y pull requests.
- `.private/`: fuentes y enlaces operativos locales; está ignorado por Git.

## Privacidad y seguridad

El sistema futuro podría procesar nombres, correos, teléfonos, identificaciones, comprobantes de pago y cartas firmadas. Trátalos como datos protegidos.

- Nunca uses datos reales de participantes en código, pruebas, fixtures, capturas, commits, issues o pull requests.
- Nunca publiques el contenido de `.private/`, enlaces operativos, credenciales, tokens ni identificadores de recursos internos.
- No leas `.private/` salvo que la tarea lo requiera expresamente; aun entonces, no copies sus valores a archivos versionados ni a la respuesta.
- Usa ejemplos claramente ficticios.
- No diseñes almacenamiento o carga de archivos sin abordar autenticación, autorización, validación, mínimo privilegio, retención y eliminación.
- Si detectas una exposición, no la repitas en texto: detén la publicación y sigue `SECURITY.md`.

## Trabajo con documentación y recursos

- Escribe documentación y commits en español claro, conservando nombres técnicos cuando ayuden a la precisión.
- Usa Markdown estándar, encabezados descriptivos, listas breves y enlaces relativos.
- Usa nombres de archivo en minúsculas y `kebab-case`, salvo convenciones reconocidas como `README.md`, `AGENTS.md` o `LICENSE`.
- Al modificar un reglamento, compara el cambio con su PDF y cita la sección afectada.
- No modifiques ni recomprimas imágenes o PDF originales sin una solicitud explícita.
- No presentes una pregunta abierta como requisito confirmado.
- Mantén el `README.md` como resumen; coloca el detalle durable en `docs/` y enlázalo.
- Actualiza este archivo cuando se aprueben comandos, arquitectura o convenciones que todo agente deba conocer.

## Licencias y atribución

La licencia MIT se aplica únicamente al código fuente futuro. Los logotipos, imágenes, reglamentos, requisitos y textos institucionales están excluidos conforme a `NOTICE.md`.

No cambies licencias, atribuciones, marcas o avisos de propiedad sin aprobación explícita. No incorpores recursos externos sin confirmar su procedencia y licencia.

## Flujo Git y colaboración

Sigue `CONTRIBUTING.md`:

- parte de un issue acotado con criterios de aceptación;
- crea ramas cortas `docs/`, `feat/`, `fix/` o `chore/` desde `main`;
- usa Conventional Commits, preferentemente en español;
- mantén cambios no relacionados en commits o PR separados;
- integra mediante pull request, una revisión y squash merge;
- no hagas push directo a `main`, force-push ni reescritura del historial;
- no hagas commit, push, release ni cambios de configuración remota salvo petición explícita.

Preserva cambios existentes que no pertenezcan a tu tarea. Antes de editar, ejecuta `git status --short` y revisa el diff al terminar.

## Validación actual

Todavía no hay comandos de build, lint o tests. No inventes ni declares que ejecutaste validaciones inexistentes.

Para cambios documentales ejecuta, como mínimo:

```bash
git diff --check
git status --short
```

Además:

- comprueba todos los enlaces relativos modificados;
- verifica que Markdown y YAML sean legibles y válidos;
- confirma que `.private/` y cualquier secreto sigan fuera del staging;
- comprueba que cada categoría conserve imagen, Markdown y PDF si cambias el inventario;
- revisa el diff completo por cambios semánticos accidentales.

Cuando exista una aplicación, sustituye esta sección por los comandos exactos de instalación, desarrollo, lint, typecheck, pruebas y build definidos en el proyecto.

## Definición de terminado

Una tarea está terminada sólo cuando:

- satisface los criterios de aceptación sin ampliar el alcance;
- respeta las fuentes y deja visibles los supuestos o bloqueos;
- actualiza la documentación afectada;
- no expone datos ni materiales privados;
- ejecuta las validaciones disponibles y reporta sus resultados reales;
- deja un diff enfocado y explica cualquier trabajo pendiente.
