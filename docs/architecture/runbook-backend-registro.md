# Runbook del backend de registro

Guía operativa del backend del registro en el **sandbox**. Sólo contiene nombres de variables y procedimientos: nunca valores de secretos, IDs de recursos ni enlaces operativos. El registro **no** está habilitado al público ni procesa datos reales.

## 1. Responsables

| Rol                          | Quién                        | Responsabilidad                                          |
| ---------------------------- | ---------------------------- | -------------------------------------------------------- |
| Backend del registro         | Paty (@patyyv)               | Endpoint, validación, adapters, reservas y este runbook. |
| Revisión                     | Cano                         | Revisa los PR.                                           |
| QA y staging compartido      | Sebastián                    | Prueba el snapshot integrado y administra su sandbox.    |
| Recursos y permisos de producción | CROFI (decisión pendiente) | No se activan sin aprobación explícita.                |

Incidentes con datos personales o secretos expuestos: seguir [SECURITY.md](../../SECURITY.md), sin repetir el dato en texto.

## 2. Entornos y banderas

Todas son de **servidor**. Nunca van al cliente, a fixtures, a CI ni a capturas. Plantilla de nombres: [.env.example](../../.env.example).

| Variable                                | Para qué sirve                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `ENABLE_SANDBOX_REGISTRATION`           | `true` habilita el endpoint; si no, responde 503.                              |
| `REGISTRO_SANDBOX_MODE`                 | `true` muestra el formulario de registro de pruebas en la página.              |
| `SANDBOX_REGISTRATION_TOKEN` | Token de servidor que autoriza las solicitudes. Sin configurarlo el endpoint responde 503; con un token ausente o incorrecto en la solicitud, 401. |
| `USE_MOCK_GOOGLE`                       | `false` desactiva el mock.                                                     |
| `ENABLE_REAL_GOOGLE_SANDBOX`            | `true` (junto con `USE_MOCK_GOOGLE=false`) activa el adapter real.             |
| `LOCAL_SANDBOX_BROWSER_AUTH`            | Puente **sólo dev/loopback**; nunca se usa en un entorno hospedado.            |
| `SANDBOX_GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN` | OAuth de Drive y Sheets, scope único `drive.file`. |
| `SANDBOX_GOOGLE_SPREADSHEET_ID`, `SANDBOX_GOOGLE_SHEET_RANGE`, `SANDBOX_GOOGLE_DRIVE_FOLDER_ID` | Recursos del sandbox. El rango debe terminar en `!A:R`. |
| `SANDBOX_FIRESTORE_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | Cuenta de servicio de Firestore, **distinta** del OAuth de Drive/Sheets. |
| `SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED`, `RUN_GOOGLE_SANDBOX_*`, `SANDBOX_VISTA_CONFIRMAR`, `SANDBOX_GOOGLE_CONSERVAR` | Interruptores de pruebas locales; nunca en CI ni en producción. |

Comportamiento cerrado: con una configuración inválida o ausente, el adapter real responde 503 y no escribe. Si el adapter real no está activado ni es modo de pruebas, tampoco escribe.

| Entorno       | Mock | Real | Datos                              |
| ------------- | ---- | ---- | ---------------------------------- |
| Local con mock | sí  | no   | Ficticios, en memoria.             |
| Sandbox propio | no  | sí   | Ficticios; recursos aislados.      |
| Staging compartido | no | sí | Ficticios; lo administra QA.       |
| Producción    | —    | —    | **No habilitado**; requiere aprobación de CROFI. |

## 3. Preflight (sin escribir)

Ejecutar antes de habilitar escrituras. Ninguno de estos comandos escribe en Google:

```bash
pnpm test:contrato:sprint04
node scripts/sandbox-google-local.mjs --preflight
SANDBOX_DIAGNOSTICO_ID=<id-inexistente> pnpm sandbox:recuperacion
pnpm sandbox:vista
```

- `--preflight` valida consentimiento `drive.file`, recursos, permisos privados (sin acceso público ni de dominio) y los 18 encabezados. Lee su configuración de `.private/google-sandbox-local.env`; sin ese archivo falla con un mensaje genérico. Su comprobación es de 18 columnas, anterior al folio de la columna 19.
- `sandbox:recuperacion` con un ID inexistente debe devolver `sin-reserva`: confirma credenciales de Firestore, Sheets y Drive.
- `sandbox:vista` sin confirmar sólo planifica.

Si algo falla, no se habilita el servidor real ni se reintenta a ciegas.

## 4. Acceso mínimo

- OAuth con **sólo** `https://www.googleapis.com/auth/drive.file`; acceso concedido únicamente a la hoja y a la carpeta de pruebas.
- Recursos privados: sin permisos `anyone` ni de dominio. Los documentos de participantes no deben abrirse sin sesión.
- Firestore: la cuenta de servicio sólo reserva `transactionId`; no se le dan roles de Drive ni de Sheets.
- Un secreto por persona y por entorno: nunca se comparte un refresh token personal con el equipo.

## 5. Renovar o revocar OAuth (Drive/Sheets)

1. Revocar el acceso anterior desde los permisos de la cuenta de Google que lo concedió (aplicaciones con acceso a la cuenta) y, si hay sospecha de exposición, también el cliente OAuth en la consola del proyecto.
2. Autorizar de nuevo con el script local (`--authorize`, ver [pruebas-sandbox-google.md](pruebas-sandbox-google.md)); el token se guarda sólo en configuración local privada.
3. Actualizar el secreto `SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN` en el entorno que corresponda y volver a desplegar.
4. Repetir el preflight (sección 3) y una prueba autorizada con datos ficticios.
5. Anotar fecha y motivo, sin valores.

## 6. Rotar la clave de Firestore

1. Crear una clave nueva para la cuenta de servicio.
2. Actualizar `SANDBOX_FIRESTORE_CLIENT_EMAIL` y `SANDBOX_FIRESTORE_PRIVATE_KEY` en el entorno y volver a desplegar.
3. Comprobar con `pnpm sandbox:recuperacion` (ID inexistente → `sin-reserva`).
4. **Después** eliminar la clave anterior.
5. Si hay sospecha de exposición, eliminar primero la clave anterior y aceptar una pausa breve.

Una rotación no borra las reservas existentes: están en Firestore, no en la clave.

## 7. Investigar y limpiar

- Un registro a medias se investiga y resuelve con [recuperacion-de-reservas.md](recuperacion-de-reservas.md): diagnóstico de sólo lectura, veredicto y acciones manuales.
- Las pruebas autorizadas limpian lo que crean. Si una corrida deja datos (por ejemplo con `SANDBOX_GOOGLE_CONSERVAR=true`), se eliminan a mano la fila, los tres archivos con el prefijo `copa-ollin-<id>-` y la reserva.
- Nunca se borran filas o archivos ajenos a la prueba, ni se limpia sin diagnóstico previo.

### Retención (propuesta, no aprobada)

Para el sandbox se propone: conservar los datos ficticios sólo mientras dura el ciclo de QA y eliminarlos al cerrarlo. La retención de datos reales es una decisión de CROFI y sigue pendiente (ver [preguntas-abiertas.md](../requirements/preguntas-abiertas.md)).

## 8. Métricas sin datos personales

- Contadores por servicio, operación y resultado, sin IDs ni contenido (ver [limites-y-cuotas-google.md](limites-y-cuotas-google.md)).
- Al reportar un caso se comparten sólo: fecha, SHA desplegado, estado y etapa de la reserva, conteos de filas y archivos, y la acción tomada.
- No hay un panel ni un endpoint de métricas.

## 9. Continuidad con CROFI

- La integración sigue siendo de **sandbox**. Para producción faltan: aviso de privacidad aprobado, recursos y permisos de CROFI, retención y reglas finales.
- No se traslada una cuenta personal a producción ni se activan costos sin aprobación explícita.
- Para entregar la operación a CROFI: recursos y OAuth/Firestore propios de CROFI, reconfiguración de los nombres de la sección 2, preflight, prueba con datos ficticios y revisión de permisos. Esos recursos los define CROFI.

## 10. Límites conocidos

- Sin protección contra abuso por solicitudes: pendiente de coordinar (requiere un código 429 que el contrato aún no incluye).
- Sin medición real de concurrencia ni de cuotas.
- La autorización del staging hospedado sigue pendiente de coordinar con Cano y Sebastián.
- El preflight del script valida 18 columnas; el folio añade la 19.
