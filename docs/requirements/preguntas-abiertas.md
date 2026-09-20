# Preguntas para validación con CROFI

Este documento concentra las decisiones que todavía requieren respuesta o confirmación de CROFI. Las preguntas están ordenadas por la fecha en que el equipo necesita la respuesta, no sólo por su importancia general.

Para que una respuesta se considere aprobada debe incluir, cuando corresponda, una persona responsable y una fecha de validación. Si una pregunta no aplica, conviene indicarlo expresamente.

## Calendario de prioridades

| Prioridad | Momento para resolver | Consecuencia de no responder |
|---|---|---|
| **P0 — para el arranque** | Reunión inicial del **13 de septiembre de 2026** | Impide planear la primera semana o validar la viabilidad de Google Workspace. |
| **P1 — durante el Sprint 1** | A más tardar el **20 de septiembre** | Impide cerrar el contrato del formulario y genera retrabajo en el Sprint 2. |
| **P2 — durante el Sprint 2** | A más tardar el **27 de septiembre** | Impide cerrar el ciclo de la inscripción y preparar una versión candidata segura. |
| **P3 — durante el Sprint 3** | A más tardar el **4 de octubre** | Puede bloquear la aceptación, la operación o el lanzamiento del Sprint 4. |
| **P4 — Sprint 4 o después** | Desde el **5 de octubre** | No bloquea el flujo principal; mejora comunicación, medición o cierre del producto. |

Las fechas corresponden al plan interno de cuatro sprints. Si cambia el calendario, debe conservarse la relación entre cada pregunta y el sprint que depende de ella.

## Información ya recibida

Los siguientes puntos ya aparecen en los documentos entregados. No es necesario volver a preguntar por ellos, salvo las confirmaciones expresamente indicadas más adelante.

### Decisiones recibidas el 18 de septiembre de 2026

- **Publicación del sitio:** 15 de octubre de 2026 a las 8:00 a.m., hora de Ciudad de México.
- **Cierre de inscripciones:** 30 de octubre de 2026 a las 23:59, hora de Ciudad de México.
- **Nombre oficial:** la categoría se publica como **Minisumo Autónomo**; sus divisiones se muestran como Minisumo Autónomo amateur y Minisumo Autónomo profesional.

### Evento y contenido

- El evento está previsto del **5 al 7 de noviembre de 2026** en el **Edificio X del Anexo de Ingeniería, Ciudad Universitaria, Ciudad de México** ([kit de inicio](kit-de-inicio.md#fecha-y-lugar)).
- La landing debe mostrar las categorías, permitir consultar o descargar sus reglamentos y contener una sección de premiación actualizable, inicialmente con el estado "Por confirmar" ([SRS](especificaciones-tecnicas.md#21-módulo-informativo-y-categorías)).
- Se entregaron seis categorías, cada una con imagen y reglamento:
  1. Seguidor de línea amateur.
  2. Seguidor de línea profesional.
  3. Minisumo autónomo amateur.
  4. Minisumo autónomo profesional.
  5. Carrera de insectos.
  6. Micromouse amateur.
- El sitio debe ser mobile-first y contempla un objetivo de hasta 500 usuarios concurrentes ([SRS](especificaciones-tecnicas.md#32-rendimiento-y-tráfico)).

### Datos iniciales del registro

El [kit de inicio](kit-de-inicio.md#especificaciones-del-registro) solicita:

- **Equipo:** nombre, categoría, institución educativa y estado o ciudad de procedencia.
- **Capitán:** nombre completo, correo electrónico, teléfono y número de identificación institucional; este último se marca como opcional para universitarios.
- **Integrantes:** cantidad, nombre completo de cada persona y correo electrónico opcional.
- **Robot:** nombre y descripción de máximo 300 palabras.
- **Confirmaciones:** aceptación del reglamento, aceptación del uso de fotografías y material audiovisual, y confirmación de cumplimiento de las restricciones de la categoría.
- **Archivos señalados como obligatorios en el kit:** comprobante de pago en PDF o imagen, identificación del capitán y carta responsiva firmada.

### Destino operativo solicitado

- El SRS solicita que los datos capturados lleguen como filas a Google Sheets y que los archivos se almacenen en una carpeta de Google Drive, conservando sus enlaces en la hoja ([SRS](especificaciones-tecnicas.md#31-gestión-de-datos-backend-serverless)).
- No se solicitó un panel de administración interno y no se requiere una base de datos SQL. Esto no impide que el equipo adopte componentes técnicos auxiliares si fueran necesarios para cumplir seguridad, integridad o capacidad.
- CROFI entregó una hoja de cálculo y una carpeta de Drive; sus accesos operativos deben mantenerse fuera del repositorio público ([kit de inicio](kit-de-inicio.md#google-workspace)).
- La Presidencia de CROFI ya designó un enlace oficial para dar seguimiento al desarrollo; sus datos de contacto se administran por canales privados ([kit de inicio](kit-de-inicio.md#validación-y-seguimiento)).

## Inconsistencias o ambigüedades detectadas

Estos puntos aparecen de forma distinta entre documentos y necesitan una respuesta explícita; no deben resolverse por interpretación del equipo.

1. **Pago frente a inscripción:** el kit solicita un "comprobante de pago", pero el SRS sólo menciona como ejemplo un "comprobante de inscripción". Ningún documento incluye monto, cuenta, método o proceso de validación.
2. **Identificación opcional frente a archivo obligatorio:** el número de identificación institucional se marca como opcional para universitarios, pero el archivo de identificación del capitán aparece como obligatorio para todos.
3. **Evidencias adicionales:** el SRS menciona bitácoras y fotografías del robot como ejemplos de archivos obligatorios o condicionales; el kit sólo enumera comprobante, identificación y carta responsiva.
4. **Reglamentos fuente frente a nombre público:** la decisión recibida fija el nombre público como “Minisumo Autónomo”, pero los PDF fuente todavía titulan las divisiones como “Minisumo Amateur” y “Minisumo Profesional”. El PDF conserva precedencia hasta que CROFI entregue una versión actualizada o confirme que el nombre público puede diferir del título normativo.
5. **Acceso actual a Google Workspace:** de acuerdo con la información proporcionada por Hello World, los recursos compartidos actualmente son accesibles mediante enlace. Esa configuración no es adecuada cuando contengan datos o documentos reales y debe sustituirse por acceso restringido antes de producción.

## P0 — Preguntas para la reunión inicial

Estas siete respuestas son las únicas que se necesitan para distribuir el trabajo de la primera semana y ejecutar el experimento técnico de Google. Las reglas de negocio detalladas se resolverán de forma escalonada en P1 y P2.

| ID | Pregunta para CROFI | Decisión que habilita esta semana |
|---|---|---|
| P0-01 | ¿El enlace oficial ya designado será el **Product Owner** facultado para priorizar requisitos y aprobar entregables en nombre de CROFI? ¿Quién lo sustituirá si no está disponible? | Establecer una sola autoridad de producto y el proceso de aceptación. |
| P0-02 | ¿Cuál es la fecha y hora límite real para publicar el sitio y cuál es la fecha y hora de apertura del registro, en horario de Ciudad de México? | Resuelta parcialmente: el sitio abrirá el 15 de octubre a las 8:00 a.m. y las inscripciones cerrarán el 30 de octubre a las 23:59. |
| P0-03 | ¿CROFI autoriza publicar desde el primer prototipo la fecha, sede, nombres de categorías y recursos de marca entregados? Confirmen además el nombre público de Minisumo —con o sin "autónomo"— y cualquier restricción de uso de logotipos. | Resuelta en el nombre público y los datos entregados: se usará **Minisumo Autónomo**. La autorización de marcas continúa pendiente si no existe confirmación específica. |
| P0-04 | ¿La cuenta propietaria de Sheets y Drive es institucional y puede proporcionar recursos **separados y restringidos** para pruebas y producción? ¿Dispone de una Unidad compartida o qué mecanismo autoriza para que la integración escriba sin hacer públicos los recursos? | Probar durante el Sprint 1 autenticación, propiedad, permisos y continuidad de Google Workspace. |
| P0-05 | ¿Qué documentos se pedirán realmente: comprobante de pago o de inscripción, identificación, carta responsiva, bitácora y/o fotografías? Si existe pago, indiquen concepto, unidad de cobro, monto, medio, referencia y responsable de validarlo. | Definir el alcance real de datos y cargas, y resolver las contradicciones entre el kit y el SRS. |
| P0-06 | Para cada documento confirmado, ¿cuántos archivos se admitirán y cuáles serán sus formatos y tamaño máximo? ¿Se aceptarán PDF protegidos con contraseña? | Elegir y probar una estrategia de carga compatible con el hosting y con Drive. |
| P0-07 | El objetivo de 500 usuarios concurrentes, ¿se refiere a visitantes de la landing o a envíos simultáneos? ¿Cuántos equipos, inscripciones por minuto y archivos por inscripción esperan en el pico? | Definir escenarios de carga realistas y comprobar cuotas y límites antes de comprometer la arquitectura. |

## P1 — Resolver durante el Sprint 1

Fecha objetivo: **20 de septiembre de 2026**, antes de implementar el formulario completo.

### Participación y modelo del registro

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P1-01 | ¿Quién puede participar: estudiantes activos, egresados, público general o equipos mixtos? ¿Se admitirán menores de edad, asesores o coaches y deben registrarse? | Cambia los datos, consentimientos y documentos legales requeridos. |
| P1-02 | ¿La unidad de inscripción es un equipo, un robot o la participación en una categoría? ¿Un equipo, persona o robot puede registrarse en varias categorías? | Define el modelo de datos y las reglas para detectar duplicados. |
| P1-03 | ¿Cuál es el mínimo y máximo de integrantes por categoría? ¿Debe existir exactamente un capitán y puede una persona participar en varios equipos? | Define campos dinámicos y validaciones. Los reglamentos no especifican tamaños de equipo. |
| P1-04 | ¿Cuál es el cupo total y por categoría? Al alcanzarlo, ¿el sistema debe cerrar, crear una lista de espera o aceptar solicitudes para revisión? | Determina si el flujo necesita control de capacidad. |

### Contrato del formulario y presentación

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P1-05 | Sobre la lista de campos ya entregada, ¿cuáles son obligatorios, opcionales, condicionales o únicos? ¿Alguna categoría requiere información adicional? | Permite cerrar los esquemas de validación sin volver a preguntar por cada campo ya conocido. |
| P1-06 | ¿Es indispensable pedir el número y una copia completa de la identificación del capitán? ¿A quién aplica y puede sustituirse por una versión redactada, verificación presencial o dato menos sensible? | Resuelve una contradicción documental y permite minimizar datos personales. |
| P1-07 | ¿Cuál es el formato definitivo de la carta responsiva, quién lo proporcionará y quién debe firmarla? ¿Cambia para participantes menores de edad? | Define la carga documental y sus firmantes. |
| P1-08 | ¿La aceptación del reglamento y el uso de imagen la realiza sólo el capitán o cada integrante? ¿Cómo cambia para menores de edad? | Define consentimientos y su evidencia. |
| P1-09 | Los archivos de Robotic ya fueron entregados, pero sus metadatos indican “All Rights Reserved” y no incluyen licencia. ¿CROFI confirma por escrito que puede autorizar su uso y redistribución pública en el sitio? | Evita publicar una fuente sin derechos suficientes. Mientras se resuelve se utilizará el fallback definido en `DESIGN.md`. |

## P2 — Resolver durante el Sprint 2

Fecha objetivo: **27 de septiembre de 2026**, antes de cerrar el ciclo completo de la inscripción.

### Estado, confirmación y correcciones

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P2-01 | Después del envío, ¿la inscripción queda recibida, pendiente, aceptada o rechazada? ¿Quién cambia el estado y qué condiciones provocan rechazo? | Evita prometer aceptación automática y define la confirmación. |
| P2-02 | ¿Se generará folio y se enviará confirmación por correo? ¿Qué datos identifican un duplicado y qué debe ocurrir ante doble envío o reintento? | Define idempotencia, comunicación y manejo de duplicados. |
| P2-03 | ¿Cómo podrá un equipo corregir, completar o cancelar su inscripción y hasta qué fecha? | Determina si se requiere funcionalidad adicional o un proceso manual comunicado. |

### Privacidad y conservación

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P2-04 | ¿Qué entidad será responsable del tratamiento de datos y quién entregará y aprobará el aviso de privacidad? ¿Cuál será el canal para ejercer derechos ARCO y reportar incidentes? | El registro manejará teléfonos, identificaciones, comprobantes y documentos firmados. |
| P2-05 | ¿Durante cuánto tiempo se conservarán registros y documentos? ¿Quién autorizará y ejecutará su eliminación? | Define retención y cierre operativo. |
| P2-06 | ¿Qué personas o roles podrán acceder a Sheets y Drive y cómo se autorizarán y revocarán accesos? | Permite aplicar mínimo privilegio y evitar enlaces públicos. |

## P3 — Resolver durante el Sprint 3

Fecha objetivo: **4 de octubre de 2026**, antes de la aceptación y preparación de producción.

### Operación, publicación y continuidad

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P3-01 | ¿Cuál es la fecha y hora exactas de cierre del registro, en horario de Ciudad de México? | Resuelta: las inscripciones cerrarán el 30 de octubre de 2026 a las 23:59, hora de Ciudad de México. |
| P3-02 | ¿Quién operará el registro, atenderá dudas y decidirá ante una caída o inscripción incompleta? Indiquen un canal público de soporte y uno privado para incidentes. | Hace operable el sistema una vez lanzado. |
| P3-03 | ¿Quién puede actualizar fechas, premios, reglamentos y demás contenido, y quién aprueba cada cambio? | Define el flujo editorial. |
| P3-04 | ¿Se requiere respaldo periódico adicional a Sheets y Drive? ¿Qué información mínima debe poder recuperarse después de una falla? | Permite acordar recuperación y continuidad. |
| P3-05 | ¿Qué dominio o subdominio utilizará el sitio, quién controla el DNS y cuándo dará acceso al equipo? | Evita un bloqueo administrativo de lanzamiento. |

### Aceptación final

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P3-06 | ¿Los seis reglamentos entregados son las versiones finales? Indiquen vigencia, responsable de aprobación y cómo se comunicarán cambios a equipos ya registrados. | Evita aceptar reglamentos obsoletos. |
| P3-07 | Proponemos las dos versiones recientes de Chrome, Firefox, Edge y Safari, diseño mobile-first y WCAG 2.1 AA. ¿Existe algún dispositivo, navegador o necesidad adicional indispensable? | Establece una línea verificable de compatibilidad y accesibilidad. |
| P3-08 | ¿Quién participará en la prueba de aceptación y emitirá el visto bueno para abrir el registro? ¿Con cuánta anticipación necesita el ambiente de pruebas? | Evita que la aprobación aparezca como bloqueo el día del lanzamiento. |

## P4 — Sprint 4 o después

Estas respuestas mejoran el producto, pero no deben desplazar el flujo principal ni bloquear una salida condicionada.

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P4-01 | Además del texto de bienvenida, ¿qué agenda, premios, patrocinadores, contacto y preguntas frecuentes desean publicar y cuándo entregarán el contenido? | La premiación puede permanecer "Por confirmar" sin bloquear el registro. |
| P4-02 | ¿Necesitan métricas de visitas o conversiones? ¿Qué preguntas desean responder y quién accederá a los reportes? | Permite evaluar valor, privacidad y consentimiento de analítica. |
| P4-03 | ¿Qué información o documentos desean conservar como archivo histórico y qué contenido debe retirarse después del evento? | Define el cierre del producto. |
| P4-04 | ¿Necesitan reportes o exportaciones adicionales a la hoja operativa, por ejemplo por categoría, procedencia, estado o pagos? | Ayuda a la operación sin asumir un panel administrativo. |
| P4-05 | ¿Desean anunciar cambios de reglamento, cierre de cupo o incidencias por algún canal externo, como correo o redes sociales? | Coordina comunicaciones que pueden ejecutarse manualmente. |

## Decisiones internas del equipo técnico

Salvo que CROFI tenga una restricción institucional, estas decisiones corresponden a Hello World y no requieren que CROFI elija tecnología.

La restricción presupuestaria actual es operar sin servicios pagados por CROFI ni Hello World. Cualquier componente con costo deberá sustituirse por una alternativa gratuita o recibir aprobación expresa antes de contratarse.

- Framework, librerías, lenguaje y organización del código.
- Uso interno de una base de datos, cola o almacenamiento temporal para garantizar integridad, siempre que Sheets y Drive conserven la función operativa acordada.
- Proveedor de hosting dentro del presupuesto disponible y estrategia de despliegue.
- Validación, rate limiting, protección contra automatización, CSP y demás controles de seguridad.
- Herramientas de CI, pruebas, monitoreo técnico y registro de errores.
- Estrategia concreta de carga, reintentos, idempotencia y limpieza de archivos incompletos, una vez que CROFI confirme tamaños, formatos y reglas de negocio.

El equipo debe documentar estas decisiones y demostrar que cumplen los requisitos confirmados, el aviso de privacidad y la operación esperada.

## Formato sugerido de respuesta

Para mantener trazabilidad, CROFI puede responder cada punto con esta estructura:

```text
ID de la pregunta:
Respuesta o decisión:
Responsable que aprueba:
Fecha de aprobación:
Documento o enlace de respaldo, si aplica:
```

Las respuestas aprobadas deben incorporarse posteriormente a los documentos de requisitos correspondientes; este archivo conservará únicamente asuntos pendientes o que requieran reconfirmación.
