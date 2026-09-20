# ADR-0003: spike de Google Sheets y Drive como destino provisional

- **Estado:** Spike ejecutado; decisión productiva pendiente
- **Fecha:** 17 de septiembre de 2026

## Contexto

La plataforma de Copa Ollin requiere registrar equipos y manejar evidencias documentales. El repositorio indica que Google Sheets y Drive son una opción considerada como destino solicitado, pero no se puede implementar como solución productiva sin resolver dependencias de privacidad, permisos, retención y responsabilidades institucionales.

Se requiere validar la viabilidad técnica y operativa del uso de Google Sheets y Drive en un entorno aislado, usando únicamente recursos de prueba y datos ficticios. La decisión no habilita el formulario ni compromete una arquitectura final.

## Decisión

Se ejecutó un spike restringido de validación técnica y operativa después de confirmar P0-04 y, para la prueba de archivos, P0-06. Se usaron recursos separados de cualquier entorno productivo, permisos mínimos y datos ficticios, sin información real ni enlaces públicos.

No se implementará el contrato final del registro ni la integración productiva. El objetivo es evaluar viabilidad, riesgos, permisos, límites, reintentos, idempotencia y limpieza del entorno de prueba antes de tomar una decisión productiva.

## Alcance del spike

El spike incluye:

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

Se utilizarán recursos de prueba aislados, sin relación con producción y con acceso restringido.

### Recursos utilizados

- Hoja de prueba: recurso separado de producción; su nombre e identificador se omiten del repositorio.
- Carpeta de prueba: recurso separado de producción; su nombre e identificador se omiten del repositorio.
- Propietario: debe conservarse en la cuenta autorizada; la identidad concreta se documenta sólo por canal privado.
- Permisos durante la prueba: acceso restringido a las identidades autorizadas y sin enlaces públicos.
- Estado posterior: el acceso de prueba fue revocado.
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

Se utilizó el mecanismo autorizado para la prueba. La evidencia pública sólo debe indicar el tipo de mecanismo y sus permisos, sin guardar tokens, secretos, credenciales ni identificadores operativos.

### Propiedad

La propiedad y la continuidad institucional deben confirmarse para producción. Se documentará el rol propietario, el rol administrador y el procedimiento de transferencia sin publicar identidades ni enlaces.

### Matriz de permisos mínimos

La matriz de la evidencia deberá usar roles, no datos personales:

| Rol | Hoja | Carpeta | Administración | Necesidad |
|---|---|---|---|---|
| Identidad de prueba autorizada | lectura/escritura durante el spike | carga/eliminación durante el spike | no | ejecutar la prueba |
| Responsable institucional | lectura/escritura | lectura/escritura | sí | operar y recuperar el recurso |
| Reviewer | lectura temporal, si se autoriza | lectura temporal, si se autoriza | no | revisar evidencia |
| Público | sin acceso | sin acceso | no | no aplica |

La configuración real deberá verificarse en el recurso aislado y registrarse sin incluir correos, IDs ni enlaces.

### Revocación de acceso

Se documentará la retirada de la identidad de prueba, la revisión de accesos directos y heredados, y la confirmación de que el recurso continúa restringido. El mismo procedimiento deberá aplicarse cuando una persona salga del proyecto.

### Continuidad

Se comprobará que exista un responsable institucional alterno y un procedimiento de transferencia. Una cuenta personal como único propietario será un bloqueo para producción.

## Protocolo de pruebas autorizado

Las pruebas siguientes se ejecutaron con la autorización correspondiente y su evidencia se registra sin secretos.

### 1. Creación de hoja de prueba

Crear una hoja aislada sólo después de confirmar P0-04. No registrar su URL, ID ni nombre operativo en Git.

Resultado esperado:
- hoja creada sin utilizar producción

Resultado real:
- Hoja creada correctamente en un recurso separado y restringido.

### 2. Escritura de fila ficticia

Insertar una fila con datos claramente inventados, usando un identificador de prueba único y no personal.

Resultado esperado:
- escritura exitosa

Resultado real:
- Fila ficticia escrita correctamente con el identificador `SPIKE-20260918-001`.

### 3. Lectura y validación

Verificar que la fila se pueda leer sin errores ni interrupciones.

Resultado esperado:
- información legible y consistente

Resultado real:
- Lectura y persistencia verificadas después de recargar y reabrir la hoja.

### 4. Subida de archivo ficticio

Subir un archivo no personal únicamente si P0-06 autoriza el formato y tamaño del experimento. El archivo debe ser generado para la prueba y no contener información de participantes.

Resultado esperado:
- archivo cargado con formato permitido y datos ficticios

Resultado real:
- Archivo ficticio cargado correctamente en la carpeta restringida.

### 5. Eliminación de prueba

Se borró la fila de prueba y el archivo de ejemplo para dejar el entorno limpio.

Resultado esperado:
- limpieza completa del entorno

Resultado real:
- Archivo ficticio eliminado correctamente; la carpeta quedó sin ese residuo.

### 6. Errores, reintentos e idempotencia

Se comprobó un reintento manual con el mismo identificador ficticio y se eliminó el duplicado generado. La prueba manual no demuestra idempotencia: confirma que una hoja permite duplicados si no existe una validación externa. La aplicación futura deberá verificar el identificador antes de insertar y definir reintentos sólo después de aprobar la arquitectura.

## Resultados observados

- La hoja y la carpeta de prueba se crearon separadas de producción y con acceso restringido.
- La escritura ficticia, lectura y persistencia de la fila funcionaron correctamente.
- El reintento manual generó un duplicado que fue eliminado; la idempotencia automática no quedó demostrada.
- El archivo ficticio se cargó y eliminó correctamente.
- La fila original y el duplicado fueron eliminados, y el acceso de prueba fue revocado.
- No se midieron cuotas, límites de frecuencia ni errores de servicio.

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

Es la opción solicitada y la que se probó en este spike. Tiene bajo costo y permite una operación familiar para el equipo, pero requiere resolver privacidad, permisos, retención, eliminación, cuotas, reintentos e idempotencia antes de producción.

### Opción B: capa intermedia con validación y control de duplicados

Un endpoint, cola o almacenamiento temporal recibiría el registro, validaría datos, aplicaría idempotencia y después escribiría en Sheets y Drive. Reduce el riesgo de duplicados y facilita reintentos, pero aumenta la complejidad operativa y no elimina la necesidad de resolver privacidad, permisos y retención.

### Opción C: sustituir Sheets y Drive por un servicio de datos dedicado

Un backend y almacenamiento diseñados para registros y documentos podrían ofrecer controles más específicos, pero implican mayor costo, operación y decisiones de arquitectura. Esta alternativa queda fuera del alcance del spike.

## Recomendación

Se recomienda conservar la Opción A como candidata para una prueba posterior y considerar la Opción B si el contrato de producción exige controles de idempotencia, reintentos o validación que Sheets y Drive no proporcionan por sí solos. La Opción C debe evaluarse sólo si las condiciones institucionales o de volumen descartan las anteriores.

Ninguna opción queda aprobada para producción. El flujo básico probado debe mantenerse fuera de producción mientras se resuelven:

- privacidad
- responsables
- retención
- eliminación
- permisos mínimos
- propiedad del recurso
- continuidad operativa
- límites de archivo y cuotas

El spike valida la creación, escritura, lectura, carga y limpieza en el entorno de prueba. No valida por sí solo la idempotencia de una integración, las cuotas, la estrategia de reintentos ni las políticas productivas de privacidad, retención y eliminación.

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

El spike fue ejecutado con recursos restringidos y datos ficticios. El flujo básico resultó viable en el entorno de prueba, pero no se recomienda su uso productivo sin cerrar primero privacidad, permisos, retención, eliminación, continuidad operativa, cuotas, reintentos e idempotencia.