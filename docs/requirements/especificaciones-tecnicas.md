# Documento de Especificaciones Técnicas (SRS)

## Landing page y sistema de registro para torneo de robótica

> Transcripción normalizada del documento elaborado por la Vicepresidencia de CROFI el 12 de abril de 2026. Consulta el [PDF fuente](../sources/requirements/especificaciones-tecnicas-srs.pdf).

## 1. Descripción general del proyecto

El presente documento establece los requerimientos para el desarrollo de una página web informativa y de registro para una competencia de robótica. El sistema está diseñado para soportar picos de tráfico de hasta 500 usuarios concurrentes.

El enfoque principal del sitio es fungir como un portal informativo —landing page— que muestre las categorías de la competencia y centralice la recepción de inscripciones y evidencias documentales, enviando los datos directamente a herramientas de Google Workspace.

## 2. Requerimientos funcionales

### 2.1. Módulo informativo y categorías

- **Sección de categorías:** la página principal debe mostrar una cuadrícula o lista visual con imágenes representativas de cada categoría de la competencia.
- **Descarga de reglamentos:** al hacer clic sobre la imagen o tarjeta de una categoría, el sistema debe iniciar automáticamente la descarga del reglamento en formato PDF o redirigir a una subpágina exclusiva de la categoría con el enlace de descarga.
- **Sección de premiación escalable:** debe existir un espacio reservado y ocultable que informe sobre los premios. Inicialmente puede indicar que los premios están "Por confirmar", pero la estructura debe permitir actualizar esta información fácilmente.

### 2.2. Módulo de registro de participantes

- **Formulario de inscripción:** formulario integrado en la página para capturar los datos de los equipos, incluidos nombre, integrantes y categoría.
- **Carga de evidencias:** debe permitir subir múltiples archivos de manera obligatoria o condicional, incluidos:
  - archivos PDF, como comprobantes de inscripción o bitácoras;
  - fotografías o imágenes, como fotos del robot o credenciales.

## 3. Requerimientos no funcionales

### 3.1. Gestión de datos: backend serverless

- **Integración con Google Sheets:** no se requiere el desarrollo de un panel de administración interno ni una base de datos relacional SQL. Toda la información capturada en el formulario debe enviarse automáticamente como nuevas filas a una hoja de cálculo de Google Sheets.
- **Almacenamiento de archivos:** los PDF y fotografías cargados deben guardarse automáticamente en una carpeta designada de Google Drive. El enlace directo de cada archivo debe guardarse en la columna correspondiente de Google Sheets.
- El documento fuente sugiere Google Apps Script o servicios de integración mediante webhooks, como Make, Zapier o SheetDB.

> Estas indicaciones son requisitos y alternativas recibidas de CROFI. No constituyen una decisión de arquitectura aprobada por el equipo de desarrollo.

### 3.2. Rendimiento y tráfico

- La página debe estar optimizada para cargar rápidamente y soportar hasta 500 usuarios concurrentes.
- El documento fuente recomienda una CDN, como Cloudflare, y alojamiento de sitios estáticos, como GitHub Pages, Vercel o Netlify, para evitar caídas del servidor.

## 4. Requerimientos de diseño

- **Identidad visual:** la paleta, las tipografías y el estilo general deben alinearse con el logotipo y la identidad institucional de CROFI.
- **Mobile-first:** el sitio debe ser completamente responsivo y garantizar el funcionamiento del formulario y la descarga de reglamentos desde dispositivos móviles.

## Observacion de alcance

El SRS define la intención inicial del producto, pero no resuelve seguridad, privacidad, operación ni criterios de aceptación. Esos vacíos están registrados en [preguntas abiertas](preguntas-abiertas.md) y deben cerrarse antes de comprometer una arquitectura.
