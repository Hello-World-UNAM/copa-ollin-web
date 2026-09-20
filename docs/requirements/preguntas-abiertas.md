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

## Decisión operativa para el Sprint 2

El 20 de septiembre de 2026, Hello World decidió continuar el desarrollo técnico del flujo completo de registro mientras CROFI prepara y aprueba el aviso de privacidad. Esta decisión permite construir y probar desde el Sprint 2 el formulario, el endpoint, la validación y la carga a recursos separados de Google Sheets y Drive, siempre que:

- sólo se utilicen datos, documentos e identidades claramente ficticios;
- el ambiente sea un sandbox restringido y esté separado de los recursos de producción;
- no se habilite el formulario al público ni se procesen datos personales reales;
- los textos y reglas todavía no confirmados se mantengan identificados como provisionales;
- el registro permanezca sujeto a un **no-go** hasta que CROFI entregue y apruebe el aviso de privacidad, el responsable del tratamiento y el canal para ejercer derechos ARCO.

Por tanto, [P2-04](#privacidad-y-conservación) ya no bloquea la construcción técnica en sandbox, pero continúa siendo un requisito obligatorio para publicar o entregar el registro productivo. Esta excepción no autoriza a inventar consentimientos, políticas de retención ni reglas de negocio pendientes.

## Información ya recibida

Los siguientes puntos ya aparecen en los documentos entregados. No es necesario volver a preguntar por ellos, salvo las confirmaciones expresamente indicadas más adelante.

### Respuestas de la Semana 0 recibidas el 18 de septiembre de 2026

- **Publicación del sitio:** 15 de octubre de 2026 a las 8:00 a.m., hora de Ciudad de México.
- **Cierre de inscripciones:** 30 de octubre de 2026 a las 23:59, hora de Ciudad de México.
- **Nombre oficial:** la categoría se publica como **Minisumo Autónomo**; sus divisiones se muestran como Minisumo Autónomo amateur y Minisumo Autónomo profesional.
- **Contenido autorizado:** CROFI confirmó la fecha del evento, los nombres actuales de las categorías y los recursos de marca enviados previamente por correo.
- **Sede:** continúa pendiente de confirmación por parte de la Facultad.
- **Reglamentos y categorías:** CROFI está modificando los reglamentos y añadirá categorías. Se comprometió a entregar la información actualizada en un plazo máximo de dos semanas, a más tardar el 2 de octubre de 2026.
- **Propiedad de Google Workspace:** los recursos se administran desde la cuenta oficial de correo de CROFI, aunque no es una cuenta institucional. CROFI solicita que Hello World especifique los recursos requeridos y la estructura del ambiente de pruebas antes de separar prueba y producción.
- **Sandbox de Google:** Hello World creará y administrará los recursos aislados de prueba. No se requiere que CROFI prepare la hoja o carpeta del Sprint 2; esta decisión no define la propiedad ni los permisos de producción.
- **Documentos del registro:** se confirman como obligatorios el comprobante de pago, la identificación y la carta responsiva.
- **Pago:** $100 MXN por robot mediante transferencia bancaria, con el concepto `CopaOlín_Equipo_Institución`. La Mesa Directiva será responsable de validarlo.
- **Capacidad del registro:** el sistema debe soportar 100 envíos concurrentes del formulario.

### Evento y contenido

- El evento está previsto del **5 al 7 de noviembre de 2026**. El kit propone el **Edificio X del Anexo de Ingeniería, Ciudad Universitaria, Ciudad de México**, pero la sede definitiva continúa pendiente de confirmación por parte de la Facultad ([kit de inicio](kit-de-inicio.md#fecha-y-lugar)).
- La landing debe mostrar las categorías, permitir consultar o descargar sus reglamentos y contener una sección de premiación actualizable, inicialmente con el estado "Por confirmar" ([SRS](especificaciones-tecnicas.md#21-módulo-informativo-y-categorías)).
- Se entregaron seis categorías, cada una con imagen y reglamento, y CROFI confirmó sus nombres actuales:
  1. Seguidor de línea amateur.
  2. Seguidor de línea profesional.
  3. Minisumo autónomo amateur.
  4. Minisumo autónomo profesional.
  5. Carrera de insectos.
  6. Micromouse amateur.
- CROFI anunció modificaciones a los reglamentos y categorías adicionales, previstas a más tardar el 2 de octubre de 2026. Hasta recibir y validar esos materiales, las versiones actuales se conservan como referencia y no deben presentarse como definitivas.
- El sitio debe ser mobile-first y contempla un objetivo de hasta 500 usuarios concurrentes ([SRS](especificaciones-tecnicas.md#32-rendimiento-y-tráfico)).
- Para el flujo de registro, CROFI precisó un objetivo de **100 envíos concurrentes del formulario**. Este objetivo complementa el de visitantes generales y deberá usarse para definir las pruebas de carga del registro.

### Datos iniciales del registro

El [kit de inicio](kit-de-inicio.md#especificaciones-del-registro) solicita:

- **Equipo:** nombre, categoría, institución educativa y estado o ciudad de procedencia.
- **Capitán:** nombre completo, correo electrónico, teléfono y número de identificación institucional; este último se marca como opcional para universitarios.
- **Integrantes:** cantidad, nombre completo de cada persona y correo electrónico opcional.
- **Robot:** nombre y descripción de máximo 300 palabras.
- **Confirmaciones:** aceptación del reglamento, aceptación del uso de fotografías y material audiovisual, y confirmación de cumplimiento de las restricciones de la categoría.
- **Archivos obligatorios confirmados por CROFI:** comprobante de pago, identificación y carta responsiva. Los formatos, tamaños y condiciones de cada archivo continúan pendientes.

### Pago confirmado

- **Monto confirmado:** $100 MXN por robot.
- **Método:** transferencia bancaria.
- **Concepto:** `CopaOlín_Equipo_Institución`.
- **Responsable de validación:** Mesa Directiva de CROFI.

Los datos bancarios y el procedimiento para corregir o rechazar comprobantes deben administrarse por un canal seguro y todavía requieren definición operativa.

### Destino operativo solicitado

- El SRS solicita que los datos capturados lleguen como filas a Google Sheets y que los archivos se almacenen en una carpeta de Google Drive, conservando sus enlaces en la hoja ([SRS](especificaciones-tecnicas.md#31-gestión-de-datos-backend-serverless)).
- No se solicitó un panel de administración interno y no se requiere una base de datos SQL. Esto no impide que el equipo adopte componentes técnicos auxiliares si fueran necesarios para cumplir seguridad, integridad o capacidad.
- CROFI entregó una hoja de cálculo y una carpeta de Drive; sus accesos operativos deben mantenerse fuera del repositorio público ([kit de inicio](kit-de-inicio.md#google-workspace)). Los recursos se administran desde la cuenta oficial de correo de CROFI, que no es institucional.
- Para preparar recursos separados y restringidos de prueba y producción, Hello World debe entregar a CROFI una propuesta concreta de recursos, permisos, datos ficticios y estructura del ambiente de pruebas.
- La Presidencia de CROFI ya designó un enlace oficial para dar seguimiento al desarrollo; sus datos de contacto se administran por canales privados ([kit de inicio](kit-de-inicio.md#validación-y-seguimiento)).

## Inconsistencias o ambigüedades detectadas

Estos puntos aparecen de forma distinta entre documentos y necesitan una respuesta explícita; no deben resolverse por interpretación del equipo.

1. **Identificación opcional frente a archivo obligatorio:** el número de identificación institucional se marca como opcional para universitarios, pero CROFI confirmó que el archivo de identificación es obligatorio. Falta definir a quién aplica, qué documento se acepta y si puede minimizarse o verificarse presencialmente.
2. **Evidencias adicionales:** CROFI confirmó únicamente comprobante de pago, identificación y carta responsiva. Las bitácoras y fotografías del robot mencionadas como ejemplos en el SRS no forman parte del contrato confirmado mientras CROFI no indique lo contrario.
3. **Reglamentos fuente frente a nombre público:** la decisión recibida fija el nombre público como “Minisumo Autónomo”, pero los PDF fuente todavía titulan las divisiones como “Minisumo Amateur” y “Minisumo Profesional”. CROFI anunció nuevas versiones en un máximo de dos semanas; hasta recibirlas, el PDF actual conserva precedencia normativa y el nombre confirmado se usa en la presentación pública.
4. **Acceso actual a Google Workspace:** de acuerdo con la información proporcionada por Hello World, los recursos compartidos actualmente son accesibles mediante enlace. Esa configuración no es adecuada cuando contengan datos o documentos reales y debe sustituirse por acceso restringido antes de producción.
5. **Sede:** el kit señala el Edificio X del Anexo de Ingeniería, pero CROFI indicó que la sede todavía espera confirmación de la Facultad. No debe presentarse públicamente como definitiva.

## P0 — Preguntas para la reunión inicial

Estas siete respuestas son las únicas que se necesitan para distribuir el trabajo de la primera semana y ejecutar el experimento técnico de Google. Las reglas de negocio detalladas se resolverán de forma escalonada en P1 y P2.

| ID | Pregunta para CROFI | Decisión que habilita esta semana |
|---|---|---|
| P0-01 | ¿El enlace oficial ya designado será el **Product Owner** facultado para priorizar requisitos y aprobar entregables en nombre de CROFI? ¿Quién lo sustituirá si no está disponible? | Establecer una sola autoridad de producto y el proceso de aceptación. |
| P0-02 | ¿La apertura del registro coincide con la publicación del sitio el 15 de octubre de 2026 a las 8:00 a.m., hora de Ciudad de México? | CROFI confirmó la publicación del sitio y el cierre de inscripciones del 30 de octubre a las 23:59, pero no indicó expresamente si el formulario abrirá al mismo tiempo que el sitio. |
| P0-03 | ¿Cuál será la sede definitiva y cuándo la confirmará la Facultad? | La fecha, los nombres actuales de las categorías, los recursos de marca y el nombre **Minisumo Autónomo** están confirmados. Sólo la sede continúa pendiente en este punto. |
| P0-04 | **Resuelta para el sandbox del Sprint 2:** Hello World creará y administrará una hoja y una carpeta aisladas para pruebas ficticias. Los recursos, responsables y permisos de producción se resolverán con P2-06. | Permite desarrollar y verificar la integración sin pedir a CROFI que prepare el ambiente de pruebas. |
| P0-05 | **Resuelta:** CROFI confirmó comprobante de pago, identificación y carta responsiva. El pago será de $100 MXN por robot mediante transferencia, con concepto `CopaOlín_Equipo_Institución`, y lo validará la Mesa Directiva. | Cierra el inventario inicial de documentos y la regla básica de pago; formatos, límites, minimización de la identificación y operación de incidencias se resuelven en preguntas posteriores. |
| P0-06 | Para cada documento confirmado, ¿cuántos archivos se admitirán y cuáles serán sus formatos y tamaño máximo? ¿Se aceptarán PDF protegidos con contraseña? | Elegir y probar una estrategia de carga compatible con el hosting y con Drive. |
| P0-07 | ¿Cuántos equipos totales se esperan y durante cuánto tiempo debe sostenerse el pico? | Resuelta parcialmente: CROFI requiere soportar **100 envíos concurrentes** del formulario. Falta precisar volumen total y duración del pico para completar el escenario de carga. |

### Decisión de ambiente para P0-04

Hello World preparará y administrará para el Sprint 2:

- una hoja exclusiva de sandbox para registros ficticios;
- una carpeta exclusiva de Drive para documentos ficticios;
- propiedad de ambos recursos bajo una cuenta de pruebas controlada por Hello World, cuya identidad concreta se conserva fuera del repositorio;
- acceso únicamente para las identidades técnicas mínimas necesarias, sin enlaces públicos;
- secretos e identificadores operativos sólo en los entornos protegidos correspondientes, nunca en el repositorio o el cliente;
- revisión de permisos, limpieza de filas y archivos, y revocación al terminar las pruebas.

Hello World documentará por roles la creación, los accesos, la limpieza y la revocación sin publicar IDs, enlaces ni credenciales. La prueba no utilizará datos ni documentos reales y no convierte estos recursos en producción. CROFI deberá definir posteriormente los responsables y accesos de producción mediante P2-06.

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
| P3-02 | **Adelantar al Sprint 2:** ¿Quién operará el registro, atenderá dudas y decidirá ante una caída o inscripción incompleta? Indiquen un canal público de soporte para mostrar en el footer y uno privado para incidentes. | Permite completar el footer sin inventar contactos y hace operable el sistema una vez lanzado. |
| P3-03 | ¿Quién puede actualizar fechas, premios, reglamentos y demás contenido, y quién aprueba cada cambio? | Define el flujo editorial. |
| P3-04 | ¿Se requiere respaldo periódico adicional a Sheets y Drive? ¿Qué información mínima debe poder recuperarse después de una falla? | Permite acordar recuperación y continuidad. |
| P3-05 | ¿Qué dominio o subdominio utilizará el sitio, quién controla el DNS y cuándo dará acceso al equipo? | Evita un bloqueo administrativo de lanzamiento. |

### Aceptación final

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P3-06 | Cuando CROFI entregue los reglamentos modificados y las categorías adicionales anunciadas, ¿cuáles serán las versiones finales, su vigencia y responsable de aprobación, y cómo se comunicarán cambios a equipos ya registrados? | CROFI prevé entregarlos a más tardar el 2 de octubre de 2026; deben validarse antes de sustituir las fuentes actuales o publicarlos como definitivos. |
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
