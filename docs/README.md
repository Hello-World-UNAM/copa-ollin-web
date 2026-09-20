# Índice documental

Este directorio contiene la transcripción normalizada de los materiales entregados por CROFI y conserva las fuentes publicables para consulta.

Las decisiones técnicas aprobadas y los contratos internos de la aplicación se documentan en [arquitectura](architecture/README.md).

## Requisitos

- [Documento de especificaciones técnicas](requirements/especificaciones-tecnicas.md)
- [Kit de inicio](requirements/kit-de-inicio.md)
- [Preguntas abiertas antes del desarrollo](requirements/preguntas-abiertas.md)
- [PDF fuente del SRS](sources/requirements/especificaciones-tecnicas-srs.pdf)

## Reglamentos

- [Carrera de insectos](regulations/carrera-de-insectos.md)
- [Micromouse amateur](regulations/micromouse-amateur.md)
- [Minisumo Autónomo amateur](regulations/minisumo-amateur.md)
- [Minisumo Autónomo profesional](regulations/minisumo-profesional.md)
- [Seguidor de línea amateur](regulations/seguidor-de-linea-amateur.md)
- [Seguidor de línea profesional](regulations/seguidor-de-linea-profesional.md)

Los PDF originales de los reglamentos se encuentran en [`sources/regulations`](sources/regulations/).

## Revisiones históricas

- [Revisión técnica y retroalimentación del Sprint 1 por Cano](reviews/sprint-1-revision-tecnica-cano.md)

Estas revisiones registran el estado observado en un momento concreto. No sustituyen los issues, las decisiones vigentes ni la evidencia de QA posterior al merge.

## Criterio editorial

Las versiones Markdown corrigen únicamente artefactos de extracción —saltos de línea, guiones de fin de renglón, jerarquía y listas— sin cambiar el significado técnico. En caso de discrepancia, debe consultarse el PDF fuente y abrirse un issue de aclaración antes de modificar el requisito.

El kit original contiene datos operativos que no deben publicarse. Su PDF se conserva localmente en `.private/`, excluido mediante `.gitignore`; la versión pública mantiene los requisitos y reemplaza los contactos personales por roles.
