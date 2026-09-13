# Preguntas para validación con CROFI

Este documento concentra únicamente las decisiones que todavía requieren respuesta o confirmación de CROFI. Su propósito es evitar que el equipo de desarrollo convierta supuestos en reglas del producto, especialmente al diseñar el registro y el tratamiento de documentos personales.

Para que una respuesta se considere aprobada debe incluir, cuando corresponda, una persona responsable y una fecha de validación. Si una pregunta no aplica, conviene indicarlo expresamente.

## Prioridades

- **P0 — bloqueante:** debe resolverse antes de implementar el formulario, la integración con Google o el manejo de archivos reales. Una respuesta tardía puede provocar retrabajo o impedir un lanzamiento seguro.
- **P1 — necesaria antes de publicar:** puede avanzarse temporalmente con contenido de prueba, pero debe cerrarse antes de abrir el registro al público.
- **P2 — importante, no bloqueante:** mejora la operación o comunicación del sitio y puede resolverse después del flujo principal.

## Información ya recibida

Los siguientes puntos ya aparecen en los documentos entregados. No es necesario volver a preguntar por ellos, salvo las confirmaciones expresamente indicadas más adelante.

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
4. **Nombre público de Minisumo:** el kit utiliza "Minisumo autónomo amateur/profesional", mientras los títulos de los reglamentos utilizan "Minisumo amateur/profesional". Los reglamentos sí describen robots autónomos.
5. **Fecha y sede frente a autorización de publicación:** el kit proporciona fecha y lugar, pero no identifica si ya cuentan con aprobación final para anunciarse públicamente.
6. **Acceso actual a Google Workspace:** de acuerdo con la información proporcionada por Hello World, los recursos compartidos actualmente son accesibles mediante enlace. Esa configuración no es adecuada cuando contengan datos o documentos reales y debe sustituirse por acceso restringido antes de producción.

## P0 — Respuestas bloqueantes

### Gobierno y alcance del registro

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P0-01 | ¿El enlace oficial ya designado está facultado para responder requisitos, priorizar cambios y aprobar formalmente el formulario y el aviso de privacidad en nombre de CROFI? ¿Quién lo sustituirá si no está disponible? | Confirma el alcance de una responsabilidad ya asignada y evita respuestas contradictorias o bloqueos de aceptación. |
| P0-02 | ¿Quién puede participar: sólo estudiantes activos, egresados, público general o equipos mixtos? ¿Se admitirán menores de edad, asesores o coaches y deben registrarse? | Cambia los datos, consentimientos y documentos legales requeridos. |
| P0-03 | ¿La unidad de inscripción es un equipo, un robot o la participación en una categoría? ¿Un equipo, persona o robot puede registrarse en varias categorías? | Define el modelo de datos y las reglas para detectar duplicados. |
| P0-04 | ¿Cuál es el mínimo y máximo de integrantes por categoría? ¿Debe existir exactamente un capitán y puede una misma persona ser capitán o integrante de varios equipos? | Define validaciones y campos dinámicos. Los reglamentos no especifican tamaños de equipo. |
| P0-05 | ¿Cuál es el cupo total y por categoría? ¿El sistema debe impedir nuevos registros, crear lista de espera o aceptar solicitudes para revisión cuando se alcance el cupo? | Determina si se necesita control de capacidad y concurrencia. |

### Campos, pago y archivos

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P0-06 | ¿Existe una cuota económica? Si existe, ¿se paga por equipo, robot, categoría o integrante, cuál es el monto, a quién y por qué medio, qué referencia debe utilizarse y quién valida o corrige el pago? Si no existe, ¿qué significa "comprobante de inscripción" y debe eliminarse el comprobante de pago? | Resuelve la contradicción principal del formulario y evita pedir documentos innecesarios. |
| P0-07 | Tomando como base la lista de campos ya recibida, ¿cuáles son obligatorios, opcionales, condicionales o únicos? ¿Alguna categoría requiere información adicional? | Permite cerrar el contrato y los schemas de validación sin volver a preguntar por cada campo ya listado. |
| P0-08 | ¿Es indispensable pedir el número y una copia completa de la identificación del capitán? ¿A qué participantes aplica y puede sustituirse por una versión redactada, una verificación presencial o un dato menos sensible? | Existe una contradicción documental y debe aplicarse minimización de datos. |
| P0-09 | Además de los tres archivos del kit, ¿se requieren bitácora o fotografías del robot? Para cada archivo, indiquen si es obligatorio o condicional, formatos admitidos, tamaño máximo, cantidad, resolución y si se aceptan PDF protegidos con contraseña. | Define la arquitectura de carga, almacenamiento y validación. |
| P0-10 | ¿Cuál es el formato definitivo de la carta responsiva, quién lo proporcionará, quién debe firmarla y se requiere una firma adicional para participantes menores de edad? | Sin la plantilla y los firmantes no puede cerrarse el flujo documental. |
| P0-11 | ¿La aceptación del reglamento y del uso de imagen la realiza sólo el capitán en nombre del equipo o cada integrante debe consentir individualmente? ¿Cómo cambia el proceso para menores de edad? | Define checkboxes, carta responsiva y evidencia del consentimiento. |

### Ciclo de vida de la inscripción

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P0-12 | Después de enviar el formulario, ¿el registro queda recibido, pendiente de revisión, aceptado o rechazado? ¿Quién cambia ese estado y qué condiciones provocan rechazo? | Define la confirmación que puede mostrarse sin prometer aceptación automática. |
| P0-13 | ¿Se generará folio y se enviará confirmación por correo? ¿Qué dato identifica un duplicado y qué debe ocurrir ante doble envío o reintento por falla de red? | Evita registros duplicados y mensajes engañosos. |
| P0-14 | ¿Cómo podrá un equipo corregir, completar o cancelar su inscripción? ¿Cuál será el canal y hasta qué fecha podrá hacerlo? | Determina si se necesita funcionalidad adicional o un proceso manual claramente comunicado. |

### Privacidad y Google Workspace

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P0-15 | ¿Qué entidad será responsable del tratamiento de los datos y quién entregará y aprobará el aviso de privacidad? ¿Cuál será el correo o canal para ejercer derechos de acceso, rectificación, cancelación u oposición y reportar incidentes? | El formulario procesará identificaciones, teléfonos, comprobantes y documentos firmados; no debe publicarse sin estas definiciones. |
| P0-16 | ¿Durante cuánto tiempo se conservarán registros, identificaciones, comprobantes y cartas? ¿Quién autorizará y ejecutará su eliminación al finalizar el evento? | Define retención, eliminación y operación posterior al torneo. |
| P0-17 | ¿Qué personas o roles podrán acceder a Sheets y Drive? ¿Los enlaces a archivos deben permanecer restringidos exclusivamente a esas personas? ¿Cómo se revocarán accesos? | Los recursos contienen información personal y no pueden depender de enlaces públicos. |
| P0-18 | ¿La cuenta propietaria de Sheets y Drive es institucional y dispone de una Unidad compartida? ¿CROFI puede proporcionar recursos separados y restringidos para pruebas y producción, compartidos únicamente con cuentas nominales y, si la integración técnica la utiliza, una cuenta de servicio? | Define propiedad, continuidad, almacenamiento y autenticación. Una cuenta personal o recursos públicos no son adecuados para producción. |
| P0-19 | El objetivo de 500 usuarios concurrentes, ¿se refiere a visitantes consultando la landing o a envíos simultáneos del formulario? ¿Cuántos equipos y cuántas inscripciones por minuto esperan en el pico de apertura o cierre? | Define la prueba de carga y permite validar las cuotas de Google. |

## P1 — Respuestas necesarias antes de abrir el registro

### Calendario, publicación y operación

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P1-01 | ¿Cuáles son la fecha y hora exactas de apertura y cierre del registro y se interpretan en la zona horaria de Ciudad de México? | Permite comunicar y aplicar el periodo correcto. |
| P1-02 | ¿La fecha del 5 al 7 de noviembre de 2026 y el Edificio X del Anexo de Ingeniería cuentan ya con autorización final para publicarse? Si cambian, ¿quién notificará al equipo? | Evita publicar información todavía provisional. |
| P1-03 | ¿Quién operará el registro durante su vigencia, atenderá dudas de participantes y tomará decisiones ante una caída o inscripción incompleta? Indiquen un canal público de soporte y uno privado para incidentes. | Hace operable el sistema una vez lanzado. |
| P1-04 | ¿Quién puede actualizar fechas, premios, reglamentos y demás contenido, y quién debe aprobar cada cambio antes de publicarlo? | Define permisos y el flujo de cambios. |
| P1-05 | ¿Se requiere una exportación o respaldo periódico adicional a Sheets y Drive? ¿Qué información mínima debe poder recuperarse después de una falla? | Permite acordar respaldo y recuperación sin asumir herramientas específicas. |
| P1-06 | ¿Qué dominio o subdominio utilizará el sitio, quién controla su DNS y en qué fecha podrá dar acceso al equipo para configurarlo? | Evita que una dependencia administrativa bloquee el lanzamiento. |

### Reglamentos, marca y contenido

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P1-07 | ¿Los seis reglamentos entregados son las versiones finales? Indiquen fecha de vigencia, responsable de aprobación y cómo se comunicarán futuras modificaciones a participantes ya registrados. | Evita publicar o aceptar reglamentos obsoletos. |
| P1-08 | ¿Cuál debe ser el nombre público definitivo de las categorías de Minisumo: con o sin la palabra "autónomo"? | Mantiene consistencia entre landing, formulario, reglamentos y Sheets. |
| P1-09 | ¿CROFI autoriza expresamente el uso público de los logotipos e imágenes entregados para este sitio? ¿Existen restricciones de proporción, fondos, separación o convivencia con las marcas de UNAM, Facultad de Ingeniería y Hello World? | Evita uso incorrecto de identidad institucional. |
| P1-10 | ¿Pueden proporcionar el archivo y licencia de la tipografía Robotic? ¿"Times Roman" se refiere a Times New Roman? Si Robotic no está disponible o no es accesible, ¿autorizan una alternativa visualmente compatible? | Permite implementar fuentes publicables y legibles. |
| P1-11 | ¿La paleta entregada tiene roles aprobados —primario, acento, éxito, advertencia y error— o puede el equipo asignarlos respetando contraste accesible? | Evita interpretar colores institucionales como estados de interfaz sin aprobación. |

### Compatibilidad y aceptación

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P1-12 | Proponemos soporte para las dos versiones recientes de Chrome, Firefox, Edge y Safari, diseño mobile-first y nivel WCAG 2.1 AA. ¿Existe algún dispositivo, navegador o necesidad de accesibilidad adicional indispensable para participantes? | Permite establecer una línea de aceptación concreta sin trasladar decisiones técnicas a CROFI. |
| P1-13 | ¿Quién participará en la prueba de aceptación y emitirá el visto bueno final para abrir el registro? ¿Con cuánta anticipación necesita recibir el ambiente de pruebas? | Evita que la aprobación aparezca como bloqueo el día del lanzamiento. |

## P2 — Respuestas importantes, no bloqueantes

| ID | Pregunta para CROFI | Por qué se necesita |
|---|---|---|
| P2-01 | Además del texto de bienvenida, ¿qué agenda, premios, patrocinadores, contacto y preguntas frecuentes desean publicar, y en qué fecha podrán entregar ese contenido? | Mejora la información pública; la sección de premios puede permanecer "Por confirmar". |
| P2-02 | ¿Necesitan métricas de visitas o conversiones? Si es así, ¿qué preguntas concretas desean responder y quién tendrá acceso a los reportes? | Permite decidir si la analítica aporta valor y si requiere consentimiento adicional. |
| P2-03 | ¿Qué información o documentos desean conservar como archivo histórico después del evento y qué contenido debe retirarse del sitio? | Define el cierre del producto sin bloquear el registro inicial. |
| P2-04 | ¿Necesitan reportes o exportaciones adicionales a la hoja operativa, por ejemplo por categoría, procedencia, estado de revisión o pagos? | Ayuda a preparar la operación sin asumir un panel administrativo. |
| P2-05 | ¿Desean anunciar cambios de reglamento, cierre de cupo o incidencias mediante algún canal externo específico, como correo o redes sociales? | Coordina comunicación, pero puede ejecutarse manualmente. |

## Decisiones internas del equipo técnico

Salvo que CROFI tenga una restricción institucional que deba comunicar, las siguientes decisiones corresponden a Hello World y no requieren una respuesta técnica de CROFI:

La restricción presupuestaria actual es operar sin servicios pagados por CROFI ni Hello World. Cualquier componente con costo deberá sustituirse por una alternativa gratuita o recibir aprobación expresa antes de contratarse.

- Framework, librerías, lenguaje y organización del código.
- Uso interno de una base de datos, cola o almacenamiento temporal para garantizar integridad, siempre que Sheets y Drive conserven la función operativa acordada.
- Proveedor de hosting dentro del presupuesto disponible y estrategia de despliegue.
- Implementación de validación, rate limiting, protección contra automatización, CSP y demás controles de seguridad.
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
