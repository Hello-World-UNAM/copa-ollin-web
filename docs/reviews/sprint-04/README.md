# Sprint 4 · Base común y cierre funcional

Periodo: 5–11 de octubre de 2026. Preparación aprobada por Sebastián. Los cuatro issues contienen el alcance completo, herramientas y evidencia exigida; este documento es su referencia pública común, no aceptación del producto.

## Fuentes y acuerdos

- [Requisitos CROFI](../../requirements/especificaciones-tecnicas.md), [kit](../../requirements/kit-de-inicio.md) y [preguntas pendientes](../../requirements/preguntas-abiertas.md).
- [Contrato Sprint 4](../../architecture/contrato-sprint04.md): campos, formatos, respuestas, compatibilidad y fixtures.
- [Pruebas Google](../../architecture/pruebas-sandbox-google.md), [diseño](../../../DESIGN.md) y [contribución](../../../CONTRIBUTING.md).

Los informes detallados de Sprint 3 y el PDF maestro permanecen fuera del repositorio, bajo custodia de coordinación. Sus hallazgos relevantes se resumen en cada issue; no necesitan acceder a recursos operativos privados para desarrollar.

## Distribución paralela

| Responsable | Alcance propio | Prueba independiente |
| --- | --- | --- |
| Alejandro · aleluflo06 | Formulario, correo/teléfono, archivos, folio visible, UX y recuperación cliente | UI/transportes simulados y compatibilidad actual |
| Paty · patyyv | Autorización servidor, validaciones, persistencia/folio/integridad, Sheets y runbook backend | Handler/adapter inyectado y cliente HTTP propio; sandbox Google propio autorizado o apoyo opcional de QA |
| Pastor · rodrigo-past0r77 | Regresión/CI, capacidad, móviles, smoke/monitoreo y release/rollback | Suites de main y harness con fixtures/mock, sin esperar funcionalidades nuevas |
| Alejandra · alejandramucino | Landing/categorías/reglamentos, breadcrumb/footer/marcas y contenido accesible | Páginas existentes y pruebas estáticas propias |

Asignación explícita solicitada por Sebastián. Cano revisa; Sebastián realiza QA. Ningún developer requiere el PR de otro para desarrollar y probar su capa. El hito integrado final sí reúne las entregas; cuatro mocks no equivalen a producto funcional.

Issues publicados y asignados: [#29 Alejandro](https://github.com/Hello-World-UNAM/copa-ollin-web/issues/29), [#30 Paty](https://github.com/Hello-World-UNAM/copa-ollin-web/issues/30), [#31 Pastor](https://github.com/Hello-World-UNAM/copa-ollin-web/issues/31) y [#32 Alejandra](https://github.com/Hello-World-UNAM/copa-ollin-web/issues/32). Tablero: Sprint 4, estado Lista. La base se publica mediante [PR #28](https://github.com/Hello-World-UNAM/copa-ollin-web/pull/28); antes del kickoff comprobar que esté aprobado e integrado en main.

## Paquete disponible

```bash
pnpm install --frozen-lockfile
pnpm test:contrato:sprint04
pnpm dev:sandbox:mock
```

Node 22.23.2 y pnpm 11.3.0. Detener otros Astro del repo antes de dev/E2E. Mock exclusivamente loopback en 4337, sin Google real ni credenciales personales. Fixtures en `tests/fixtures/sprint04/`; importar módulos Node sólo en tests/harness. Folio/409/comprobante JPEG/PNG son objetivos de los issues, no extensiones implementadas por los fixtures.

Formatos objetivo: identificación/responsiva PDF, comprobante PDF/JPEG/PNG; límites provisionales 1 MiB/archivo y 3 MiB/total. Preservar nombres/serialización y tratar el folio como texto opaco. Correo opcional vacío se omite; teléfono texto de dígitos. No inventar reglas de equipos/menores/consentimientos pendientes.

## Prioridades y evidencia

Cerrar primero flujo real protegido, información/documentos íntegros, errores útiles y recuperación; después presentación de Sheets/reglamentos/footer y operación. Contenido/privacidad/productivos sólo cuando sean aprobados. Parches de estilos delimitados, no reemplazar global.css ni archivos de otra capa.

Cada issue exige comandos reales, SHA, capturas ficticias, pruebas propias y limitaciones. PR con Refs, CI verde y revisión independiente; no Closes ni cierre por merge. Sebastián prueba el SHA/despliegue integrado: navegador → una fila y tres documentos privados, folio estable, retry/concurrencia/fallos, accesibilidad y capacidad. No compartir tokens/OAuth/IDs internos ni enlaces de bypass público.

## Pendientes que no se declaran aprobados

- Integrar la base mediante PR antes del kickoff; los issues indicarán el estado real de publicación.
- Sebastián coordina hoy dispositivos Android/iOS con el equipo; prueba física aún pendiente.
- Confirmar capacidad/prioridades de la semana con Cano; no fingir aprobación del equipo.
- Autorización/configuración de staging, integridad concurrente, recuperación operativa y carga real quedan en las entregas/QA del Sprint 4.
- Privacidad, reglas/contenido final, recursos/permisos productivos, retención y UAT siguen siendo gates de apertura pública.

Un sandbox propio de Paty es válido si está aislado/autorizado, con datos ficticios, mínimo privilegio e integridad verificable. No necesita migrar al de Sebastián; su evidencia local no sustituye staging. No se crean costos ni recursos nuevos por este acuerdo.
