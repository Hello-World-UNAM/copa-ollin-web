# ADR-0003: spike de Google Sheets y Drive como destino provisional

- **Estado:** Spike histórico; las pruebas remotas con Service Account no quedaron verificadas. El issue #10 define un flujo de sandbox posterior basado en OAuth, todavía pendiente de configuración y QA remoto.
- **Fecha:** 21 de septiembre de 2026

## Contexto

La plataforma de Copa Ollin requiere registrar equipos y manejar evidencias documentales. El repositorio indica que Google Sheets y Drive son una opción considerada como destino solicitado, pero no se puede implementar como solución productiva sin resolver dependencias de privacidad, permisos, retención y responsabilidades institucionales.

Se requiere validar la viabilidad técnica y operativa del uso de Google Sheets y Drive en un entorno aislado, usando únicamente recursos de prueba y datos ficticios. La decisión no habilita el formulario ni compromete una arquitectura final.

## Dependencias vigentes

- **P0-04:** resuelta para el Sprint 2. Hello World creará y administrará los recursos aislados de prueba; no se utilizarán los recursos operativos de CROFI. La propiedad y los permisos de producción siguen pendientes de P2-06.
- **P0-06:** los formatos, cantidades y tamaños productivos continúan pendientes. El issue #10 autoriza para su prueba aislada tres PDFs ficticios, de hasta 1 MiB cada uno y 3 MiB agregados; estos límites de sandbox no resuelven P0-06 para producción.
- Los resultados descritos en este ADR provienen de la contribución original y deben verificarse con evidencia sanitizada antes de considerar ejecutado el spike.

## Decisión

Se documenta un protocolo restringido de validación técnica y operativa y se conservan los resultados reportados por la contribución original. El repositorio no contiene todavía evidencia sanitizada ni constancia de autorización suficiente para aceptar esos resultados como verificados.

No se implementará todavía la integración productiva. Desde el Sprint 2 se autoriza construir y probar el contrato, el endpoint y la carga de archivos en un sandbox restringido con datos exclusivamente ficticios, mientras se evalúan viabilidad, riesgos, permisos, límites, reintentos, idempotencia y limpieza. El aviso de privacidad continúa siendo un gate obligatorio para habilitar el registro público o procesar datos reales.

### Actualización de alcance para el issue #10

El issue #10, posterior a este spike, especifica para Sprint 3 OAuth de la cuenta propietaria del sandbox, el único scope `https://www.googleapis.com/auth/drive.file` y recursos nuevos de la cuenta personal autorizada de Sebastián. La hoja y carpeta deben seleccionarse mediante Google Picker o crearse con esa misma aplicación. Esta instrucción sustituye para el sandbox los planes previos de Service Account, Unidad compartida y 5 MiB; no cambia ningún requisito de producción.

El código local actual ya prepara OAuth en el servidor mediante variables de entorno, pero todavía no implementa el flujo de autorización/callback, Google Picker ni creación/selección administrativa de recursos. Tampoco tiene exclusión persistente para solicitudes concurrentes. Por tanto, la integración remota y esos criterios del issue siguen pendientes de verificación.

El 4 de octubre de 2026, la responsable de #10 autorizó evaluar Firestore como
registro auxiliar de idempotencia únicamente para el sandbox, sin datos del
formulario y sin habilitar facturación. La reserva se identifica mediante un
hash de `transactionId` y guarda sólo estado y marcas de tiempo; OAuth
`drive.file` sigue reservado para Drive/Sheets, mientras Firestore usa una
service account separada de servidor con permiso de datos limitado al proyecto
de pruebas. El uso debe permanecer dentro de la cuota gratuita; si la consola
exige facturación o el consumo pudiera salir de esa cuota, se detendrá el spike
y se pedirá aprobación. Esta aprobación no autoriza uso pagado ni define
Firestore como arquitectura productiva.

## Alcance del spike

El protocolo del spike contempla:

- creación de un recurso de prueba separado
- prueba de escritura y lectura de una hoja de cálculo
- prueba de carga y eliminación de archivos ficticios
- revisión de permisos mínimos
- revisión de propiedad y revocación de acceso
- documentación de errores, límites y reintentos
- limpieza del entorno de prueba

El spike excluye:

- uso de datos reales
- uso de hojas o carpetas productivas
- carga de archivos reales de participantes
- implementación del formulario real
- implementación de autenticación final del participante
- decisión final de arquitectura sin aprobar privacidad y retención

## Recursos de prueba

Los recursos que se utilicen deberán estar aislados, sin relación con producción y con acceso restringido.

### Recursos previstos y resultados reportados

- Hoja de prueba: el ADR original reporta un recurso separado de producción; su nombre e identificador se omiten del repositorio.
- Carpeta de prueba: el ADR original reporta un recurso separado de producción; su nombre e identificador se omiten del repositorio.
- Propietario del sandbox: una cuenta de pruebas controlada por Hello World; la identidad concreta se documenta sólo por canal privado.
- Permisos durante la prueba: acceso restringido a las identidades autorizadas y sin enlaces públicos.
- Estado posterior reportado: el acceso de prueba fue revocado; falta verificación por un reviewer.
- Evidencia: matriz de permisos sin correos, identificadores, enlaces ni capturas sensibles.

### Datos ficticios de ejemplo

- Nombre del equipo: Equipo Prueba 01
- Correo: equipo-prueba-0001@example.invalid
- Teléfono: 1234567890
- Documento: FICTICIO-0001
- Archivo: registro-prueba.pdf

Todos los valores anteriores son ficticios y no corresponden a personas reales.

## Autenticación, permisos y continuidad

### Autenticación
El primer adapter del spike se diseñó con una **Google Service Account (Cuenta de Servicio)**; esa propuesta es histórica y no corresponde al flujo requerido por el issue #10. El adapter local del Sprint 3 usa OAuth2 server-side y variables de entorno. Aún falta generar el refresh token con el scope único `drive.file`, seleccionar/crear los recursos con la misma aplicación y verificar el acceso remoto. Ningún token, client secret, ID de carpeta o URL debe exponerse en el cliente ni en el repositorio.

### Propiedad y continuidad institucional
- **Propietario del Sandbox:** para la prueba específica del issue #10 se permite la cuenta personal autorizada de Sebastián, sólo con recursos ficticios y aislados. No se convierte en cuenta productiva ni resuelve la propiedad de producción.
- **Propietario de Producción (Pendiente):** debe definirse con CROFI mediante P2-06; no se ha aprobado ninguna cuenta productiva.
- **Procedimiento de Transferencia:** la rotación de credenciales debe definirla el administrador responsable antes de producción; no se ha probado.

### Matriz de permisos mínimos requerida (pendiente de verificación)
La siguiente matriz describe los permisos esperados; no demuestra la configuración efectiva de recursos externos:

| Rol | Hoja (Sandbox) | Carpeta (Sandbox) | Administración | Necesidad |
|---|---|---|---|---|
| OAuth de cuenta propietaria (Servidor) | Archivos seleccionados por la app con `drive.file` | No | Escribir filas y guardar PDFs ficticios en los recursos autorizados |
| Desarrolladores Autorizados | Lector, si se aprueba | Lector, si se aprueba | No | Revisar resultados de prueba |
| Público / Cliente | Sin acceso | Sin acceso | No | No aplica |

### Revocación de acceso
Antes de cerrar el spike se deberá verificar y registrar por canal privado la revocación de los accesos temporales. No se afirma que esta verificación ya ocurrió. La excepción de cuenta personal para #10 es exclusivamente temporal y de pruebas.
### Continuidad

Debe comprobarse que exista un responsable institucional alterno y un procedimiento de transferencia. Una cuenta personal como único propietario será un bloqueo para producción.

## Protocolo y resultados reportados

Los resultados siguientes provienen de la contribución original. Se conservan como reportados, no como verificados, hasta contar con autorización trazable, evidencia sanitizada y revisión de QA.

### 1. Creación de hoja de prueba

Crear una hoja aislada administrada por Hello World. No registrar su URL, ID ni nombre operativo en Git.

Resultado esperado:
- hoja creada sin utilizar producción

Resultado reportado (pendiente de verificación):
- Hoja creada correctamente en un recurso separado y restringido.

### 2. Escritura de fila ficticia

Insertar una fila con datos claramente inventados, usando un identificador de prueba único y no personal.

Resultado esperado:
- escritura exitosa

Resultado reportado (pendiente de verificación):
- Fila ficticia escrita correctamente con el identificador `SPIKE-20260918-001`.

### 3. Lectura y validación

Verificar que la fila se pueda leer sin errores ni interrupciones.

Resultado esperado:
- información legible y consistente

Resultado reportado (pendiente de verificación):
- Lectura y persistencia verificadas después de recargar y reabrir la hoja.

### 4. Subida de archivo ficticio

Subir un archivo no personal únicamente si P0-06 autoriza el formato y tamaño del experimento. El archivo debe ser generado para la prueba y no contener información de participantes.

Resultado esperado:
- archivo cargado con formato permitido y datos ficticios

Resultado reportado (pendiente de verificación):
- Archivo ficticio cargado correctamente en la carpeta restringida.

### 5. Eliminación de prueba

Se borró la fila de prueba y el archivo de ejemplo para dejar el entorno limpio.

Resultado esperado:
- limpieza completa del entorno

Resultado reportado (pendiente de verificación):
- Archivo ficticio eliminado correctamente; la carpeta quedó sin ese residuo.

### 6. Errores, reintentos e idempotencia

El ADR original reporta un reintento manual con el mismo identificador ficticio y la eliminación del duplicado generado. Si se verifica, la prueba manual no demuestra idempotencia: confirma que una hoja permite duplicados si no existe una validación externa. La aplicación futura deberá verificar el identificador antes de insertar y definir reintentos sólo después de aprobar la arquitectura.

## Resultados reportados, pendientes de verificación

- La hoja y la carpeta de prueba se crearon separadas de producción y con acceso restringido.
- La escritura ficticia, lectura y persistencia de la fila funcionaron correctamente.
- El reintento manual generó un duplicado que fue eliminado; la idempotencia automática no quedó demostrada.
- El archivo ficticio se cargó y eliminó correctamente.
- La fila original y el duplicado fueron eliminados, y el acceso de prueba fue revocado.
- No se midieron cuotas, límites de frecuencia ni errores de servicio.

## Implementación local y estado de las pruebas

### Verificado localmente

- El endpoint se habilita solo con la variable de sandbox en el servidor y pasa por validación Zod.
- El harness inicial del spike usó tres documentos PDF ficticios de hasta 5 MiB cada uno. El código actual para el issue #10 valida hasta 1 MiB por PDF y 3 MiB agregados; ambos son límites de prueba, no requisitos productivos de CROFI.
- Las pruebas del adapter con servicios Google simulados verifican una fila, tres archivos asociados, omisión de un reintento secuencial y limpieza ante fallo de escritura; también verifican la respuesta recuperable cuando falla la limpieza.
- El mock permite probar el endpoint sin credenciales ni acceso a Google.

### Pendiente de verificación contra Google Sandbox

- Históricamente, algunos preflights con Service Account permitieron leer la hoja o listar Drive, mientras otras peticiones devolvieron HTTP 403/404. Esto no verifica el flujo OAuth actual del issue #10.
- Una consulta de solo lectura con `drive.metadata.readonly` confirmó que el ID inspeccionado era una carpeta, pero no pertenecía a una Unidad compartida (`driveId` ausente); corresponde a Mi unidad.
- No se han verificado la propiedad, permisos efectivos, ausencia de enlaces públicos, cuotas ni revocación de recursos externos.
- El chequeo de duplicados en Sheets cubre reintentos secuenciales; no garantiza exclusión distribuida ante dos solicitudes simultáneas.
- La prueba remota opt-in del issue #10 está descrita en [la guía de QA](../pruebas-sandbox-google.md) y requiere autorización explícita de esa prueba, OAuth configurado y recursos seleccionados; P0-06 productivo permanece pendiente.

### Intentos autorizados del 25 de septiembre de 2026

- Un preflight permitió leer la hoja y enumerar la carpeta configurada; las lecturas posteriores de hoja y carpeta mostraron respectivamente HTTP 403 y HTTP 404.
- La creación del primer archivo en Drive respondió HTTP 403; no se alcanzó la escritura de la fila.
- Una consulta de metadatos de solo lectura confirmó que el ID de carpeta inspeccionado pertenecía a Mi unidad, no a una Unidad compartida.
- Las comprobaciones posteriores encontraron cero filas y cero archivos con el prefijo de QA del harness.
- No se declara verificada la carga real. Estos intentos pertenecen al flujo histórico de Service Account. La prueba actual requiere completar OAuth de la cuenta propietaria y comprobar acceso a la hoja y carpeta seleccionadas, además de limpieza e idempotencia.

## Riesgos

- permisos excesivos o demasiado amplios
- dependencia de una sola cuenta administrativa
- pérdida de acceso por salida de una persona
- uso accidental de una hoja de producción
- retención de documentos o archivos sin política clara
- carga de archivos no controlada
- límites de cuota y capacidad desconocidos
- errores de sincronización o escritura duplicada
- dificultad para eliminar datos de prueba en entornos compartidos

## Opciones consideradas

### Opción A: Sheets y Drive como destino directo

Es la opción solicitada y la que el ADR original reporta como probada. Tiene bajo costo y permite una operación familiar para el equipo, pero requiere verificar el experimento y resolver privacidad, permisos, retención, eliminación, cuotas, reintentos e idempotencia antes de producción.

### Opción B: capa intermedia con validación y control de duplicados

Un endpoint, cola o almacenamiento temporal recibiría el registro, validaría datos, aplicaría idempotencia y después escribiría en Sheets y Drive. Reduce el riesgo de duplicados y facilita reintentos, pero aumenta la complejidad operativa y no elimina la necesidad de resolver privacidad, permisos y retención.

### Opción C: sustituir Sheets y Drive por un servicio de datos dedicado

Un backend y almacenamiento diseñados para registros y documentos podrían ofrecer controles más específicos, pero implican mayor costo, operación y decisiones de arquitectura. Esta alternativa queda fuera del alcance del spike.

## Recomendación

Se recomienda conservar la Opción A como candidata para una prueba posterior y considerar la Opción B si el contrato de producción exige controles de idempotencia, reintentos o validación que Sheets y Drive no proporcionan por sí solos. La Opción C debe evaluarse sólo si las condiciones institucionales o de volumen descartan las anteriores.

Ninguna opción queda aprobada para producción. El flujo básico reportado debe mantenerse fuera de producción mientras se verifica y se resuelven:

- privacidad
- responsables
- retención
- eliminación
- permisos mínimos
- propiedad del recurso
- continuidad operativa
- límites de archivo y cuotas

La evidencia disponible no permite aceptar todavía la ejecución del spike. El ADR original reporta creación, escritura, lectura, carga y limpieza en un entorno de prueba, pero no demuestra por sí solo autorización, idempotencia, cuotas, estrategia de reintentos ni políticas productivas de privacidad, retención y eliminación.

## Condiciones para producción

Antes de considerar Google Sheets/Drive como destino definitivo, deben resolverse al menos:

1. cuenta institucional autorizada y separada
2. recursos separados de producción
3. acceso restringido con permisos mínimos
4. responsable institucional del recurso
5. política de retención y eliminación
6. aviso de privacidad y consentimiento aplicable
7. definición de tamaños máximos de archivo
8. flujo de reintentos, errores y limpieza
9. procedimiento de revocación de acceso
10. evidencia de continuidad ante salida de personal

## Pendientes

- confirmar tipo de cuenta autorizada
- definir propietario del recurso
- definir permisos mínimos y roles
- definir política de retención y eliminación
- cerrar requerimientos de privacidad y responsables
- validar límites en archivos y filas
- documentar procedimiento de limpieza
- decidir si Google Sheets/Drive es una opción suficiente o si se requiere otra solución

## Consecuencias

### Positivas

- bajo costo de integración en una primera etapa
- acceso familiar para el equipo
- velocidad de prueba
- fácil validación técnica en entorno no productivo

### Negativas

- dependencia de la infraestructura de Google Workspace
- riesgo de permisos mal configurados
- riesgo de dependencia de una cuenta o persona
- limitaciones de manejo documental y privacidad
- necesidad de cerrar decisiones operativas antes de producción

## Resultado

El ADR original reporta una ejecución con recursos restringidos y datos ficticios. Hasta verificar autorización, evidencia y QA, el estado se mantiene como protocolo documentado y ejecución pendiente de verificación. No se recomienda ningún uso productivo sin cerrar primero privacidad, permisos, retención, eliminación, continuidad operativa, cuotas, reintentos e idempotencia.
