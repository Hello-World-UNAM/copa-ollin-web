# Copa Ollin — Sistema de diseño

> Precisión técnica, energía competitiva y claridad institucional. La interfaz debe sentirse propia de un torneo universitario de robótica: tecnológica sin ser críptica, dinámica sin sacrificar legibilidad y confiable cuando solicita información personal.

**Tema principal:** claro

**Estado:** base de diseño para implementación

**Última actualización:** 4 de octubre de 2026

## Propósito y alcance

Este documento convierte la identidad y los requisitos entregados por CROFI en reglas aplicables a la plataforma web de Copa Ollin. Es la fuente de verdad para decisiones visuales, responsive, estados de interacción y revisión de accesibilidad.

Aplica a:

- landing page y navegación;
- presentación de las seis categorías;
- páginas o vistas de reglamentos;
- sección de premiación;
- formulario de registro, carga de archivos y confirmación;
- mensajes de estado, error y soporte;
- metadatos visuales y piezas de interfaz relacionadas con el sitio.

No modifica requisitos de negocio ni autoriza por sí mismo el uso o redistribución de marcas y fuentes. Consulta las [preguntas abiertas](docs/requirements/preguntas-abiertas.md) antes de implementar contenido que dependa de una aprobación de CROFI.

## Nivel de autoridad de las reglas

Para evitar presentar una interpretación como requisito de CROFI, cada decisión pertenece a uno de estos niveles:

| Nivel | Significado | Ejemplos |
|---|---|---|
| **Entregado por CROFI** | Dato presente en el kit o SRS. No se altera sin aprobación. | Paleta base, Robotic, Orbitron, Times Roman, mobile-first. |
| **Decisión del producto** | Convención adoptada por Hello World para poder construir una interfaz coherente. | Roles semánticos del color, escala, espaciado, componentes y estados. |
| **Pendiente externo** | Requiere autorización o material de CROFI antes de producción. | Licencia de Robotic y reglas oficiales de convivencia de logotipos. |

Las decisiones de producto aquí documentadas fueron adoptadas para reducir ambigüedad y no requieren que CROFI elija detalles técnicos. Si CROFI entrega un manual de identidad posterior, ese manual tendrá precedencia y este archivo deberá actualizarse.

## Principios

### 1. La competencia es protagonista

Robots, categorías y reglamentos llevan el peso visual. La interfaz enmarca ese contenido; no compite con él mediante efectos decorativos excesivos.

### 2. Claridad antes que espectáculo

Una persona debe poder encontrar su categoría, descargar el reglamento y completar el registro desde un teléfono sin interpretar códigos visuales ambiguos.

### 3. Tecnología con evidencia

El lenguaje visual puede usar líneas, retículas y acentos inspirados en circuitos, pero cada elemento debe tener una función: jerarquía, agrupación, foco o estado.

### 4. Institucional y accesible

Las marcas de CROFI, Facultad de Ingeniería, UNAM y Club Hello World deben conservar su integridad. El contraste, el teclado, el zoom y los lectores de pantalla tienen prioridad sobre preferencias estéticas.

### 5. Confianza durante el registro

Los formularios deben explicar qué se solicita, por qué, en qué formato y qué ocurrirá después. No se usan patrones de urgencia artificial ni confirmaciones engañosas.

## Identidad de marca

### Jerarquía institucional

1. **CROFI:** organizador y marca principal del torneo.
2. **Copa Ollin / CROFITO:** identidad del evento y recurso expresivo.
3. **Club Hello World:** colaborador de desarrollo.
4. **Facultad de Ingeniería y UNAM:** respaldo institucional, sujeto a sus propias reglas de uso.

En el encabezado principal, CROFI debe aparecer antes que las marcas colaboradoras. UNAM y Facultad de Ingeniería se reservan preferentemente para el bloque institucional o pie de página; no deben disponerse de forma que sugiera una jerarquía no confirmada.

### Recursos disponibles

| Recurso | Archivo | Uso recomendado |
|---|---|---|
| Logotipo CROFI | `assets/brand/crofi-fondo-blanco.png` | Marca principal sobre superficie blanca. |
| Mascotas CROFITO | `assets/brand/crofito.png` | Hero, bienvenida o cierre; nunca como control interactivo. |
| Hello World transparente | `assets/brand/hello-world-transparent.svg` | Marca colaboradora sobre fondo controlado. Preferir SVG. |
| Hello World con fondo | `assets/brand/hello-world-white-background.svg` | Contextos donde no pueda garantizarse el contraste. |
| Facultad de Ingeniería | `assets/brand/facultad-de-ingenieria.png` | Bloque institucional o pie de página. |
| UNAM | `assets/brand/unam.png` | Bloque institucional o pie de página. |

### Reglas de uso de logotipos

- Mantener la relación de aspecto original; usar `object-fit: contain`.
- No recortar, recolorear, rotar, reflejar ni aplicar filtros, contornos o sombras.
- No escribir texto encima de una marca ni colocarla sobre una imagen compleja.
- Usar las variantes con fondo blanco cuando el fondo pueda reducir el contraste.
- Mantener un espacio libre provisional equivalente al **25 % de la altura visible** del logotipo.
- Tamaño mínimo provisional en pantalla: **40 px de alto** para CROFI y **32 px** para marcas secundarias.
- Proporcionar texto alternativo que identifique la institución; una composición puramente decorativa puede usar `alt=""` sólo si el nombre ya aparece junto a ella.
- No crear lockups nuevos ni añadir el nombre UNAM a un logotipo existente.

El espacio libre, los tamaños mínimos y la convivencia son convenciones preventivas del producto; deberán ajustarse si CROFI proporciona reglas oficiales.

## Color

### Paleta entregada

| Nombre | Valor | Token primitivo | Función adoptada |
|---|---|---|---|
| Negro técnico | `#070707` | `--color-black` | Texto principal, navegación, bordes y superficies de alto contraste. |
| Blanco | `#ffffff` | `--color-white` | Fondo principal, texto sobre tonos oscuros y superficies limpias. |
| Cian CROFI | `#00a8e0` | `--color-cyan` | Marca primaria, CTA principal, indicadores activos y acento tecnológico. |
| Verde energía | `#6edb00` | `--color-green` | Éxito, disponibilidad, avance completado y acentos positivos. |
| Rojo profundo | `#ae0909` | `--color-red-deep` | Errores, acciones destructivas y bloqueos críticos. |
| Rojo competencia | `#e90e32` | `--color-red-bright` | Acento competitivo, avisos urgentes y badges de alta atención. |
| Gris medio | `#808080` | `--color-gray` | Bordes inactivos, metadatos sobre fondo oscuro y controles deshabilitados. |

Esta asignación semántica es una decisión interna autorizada para el producto. El color nunca es la única señal de estado: debe acompañarse de texto, icono o patrón.

### Tokens semánticos

| Token | Valor | Uso |
|---|---|---|
| `--color-text` | `#070707` | Texto principal sobre superficies claras. |
| `--color-text-inverse` | `#ffffff` | Texto sobre negro o rojo profundo. |
| `--color-text-muted` | `#595959` | Texto secundario accesible sobre blanco; derivado, no sustituir por `#808080`. |
| `--color-surface` | `#ffffff` | Canvas y tarjetas. |
| `--color-surface-subtle` | `#f5f5f5` | Alternancia ligera de secciones. |
| `--color-surface-dark` | `#070707` | Hero oscuro o banda institucional puntual. |
| `--color-primary` | `#00a8e0` | CTA principal y selección activa, siempre con texto negro. |
| `--color-success` | `#6edb00` | Confirmación y progreso completo, siempre con texto negro. |
| `--color-danger` | `#ae0909` | Error y acción destructiva, con texto blanco. |
| `--color-attention` | `#e90e32` | Atención urgente, con texto blanco y uso breve. |
| `--color-border` | `#808080` | Bordes secundarios; los límites esenciales usan negro. |
| `--color-focus-inner` | `#070707` | Primer anillo de foco. |
| `--color-focus-outer` | `#00a8e0` | Segundo anillo de foco. |

### Combinaciones de contraste

| Fondo | Texto | Contraste aproximado | Regla |
|---|---|---:|---|
| Blanco | Negro técnico | `20.14:1` | Preferida para cuerpo y UI. |
| Negro técnico | Blanco | `20.14:1` | Permitida para bandas puntuales. |
| Cian CROFI | Negro técnico | `7.36:1` | CTA principal y etiquetas activas. |
| Verde energía | Negro técnico | `11.31:1` | Confirmaciones y éxito. |
| Rojo profundo | Blanco | `7.39:1` | Error o acción destructiva. |
| Rojo competencia | Blanco | `4.59:1` | Texto normal AA; reservar para bloques breves. |
| Gris medio | Negro técnico | `5.10:1` | Controles deshabilitados o chips no interactivos. |

No usar:

- texto blanco sobre cian (`2.74:1`) o verde (`1.78:1`);
- texto gris `#808080` sobre blanco (`3.95:1`) para cuerpo normal;
- rojo profundo con texto negro (`2.73:1`);
- un anillo cian aislado sobre blanco: combinarlo con el anillo negro para que el foco siempre sea visible.

### Distribución de color

- **70 %** superficies blancas o gris muy claro.
- **20 %** negro técnico en texto, bordes y bandas.
- **10 % máximo** suma de cian, verde y rojos.
- El cian es el acento dominante del producto.
- El verde y los rojos comunican estado; no se distribuyen como decoración recurrente.
- No usar degradados multicolor, brillos neón ni transparencias que alteren el contraste de texto.

## Tipografía

### Familias

| Rol | Familia | Peso | Estado |
|---|---|---|---|
| Display y nombre del evento | `ROBOTIC`, `Orbitron`, sans-serif | 400 o 700 | Archivos recibidos; licencia de redistribución pendiente. |
| Encabezados, botones y labels | `Orbitron`, system-ui, sans-serif | 600–700 | Solicitada por CROFI. |
| Texto general y formulario | `"Times New Roman"`, Times, serif | 400–700 | Interpretación adoptada de “Times Roman”. |

Los archivos locales de Robotic están resguardados en `.private/fonts/robotic/`. Sus metadatos indican “All Rights Reserved” y no se recibió licencia. No deben moverse a un directorio público, versionarse ni servirse en producción hasta contar con autorización escrita. Cuando se autoricen, la ubicación pública prevista será `assets/fonts/robotic/` o el directorio equivalente definido por la aplicación.

### Reglas tipográficas

- Robotic se usa sólo en frases cortas: nombre del evento, hero o cifra protagonista.
- No usar variantes `Hollow`, `Inverse` o itálicas para controles, formularios o párrafos.
- Orbitron identifica secciones y acciones; evitar bloques largos en mayúsculas.
- Times New Roman se usa en lectura continua, reglamentos, ayuda y contenido del formulario.
- El cuerpo nunca baja de **16 px**; el valor preferido es **18 px**.
- Mantener un ancho de lectura de **60–72 caracteres**.
- No justificar párrafos; alinearlos a la izquierda.
- Las mayúsculas necesitan `letter-spacing` positivo y se reservan para labels breves.
- Usar cifras tabulares en resultados, fechas o folios cuando la fuente lo permita.

### Escala fluida

| Rol | Tamaño | Interlineado | Token |
|---|---|---|---|
| Display | `clamp(2.75rem, 7vw, 5.5rem)` | `0.95` | `--text-display` |
| H1 | `clamp(2.25rem, 5vw, 4rem)` | `1.05` | `--text-h1` |
| H2 | `clamp(1.75rem, 3.5vw, 2.75rem)` | `1.15` | `--text-h2` |
| H3 | `clamp(1.25rem, 2vw, 1.5rem)` | `1.25` | `--text-h3` |
| Body grande | `1.25rem` | `1.55` | `--text-body-lg` |
| Body | `1.125rem` | `1.6` | `--text-body` |
| UI | `1rem` | `1.4` | `--text-ui` |
| Caption | `0.875rem` | `1.45` | `--text-caption` |

## Espaciado y forma

**Unidad base:** 4 px

**Densidad:** cómoda

**Ritmo vertical:** múltiplos de 8 px

### Escala

| Token | Valor | Uso habitual |
|---|---:|---|
| `--space-1` | `4px` | Separación mínima o icono–texto. |
| `--space-2` | `8px` | Elementos estrechamente relacionados. |
| `--space-3` | `12px` | Labels, ayuda y campos. |
| `--space-4` | `16px` | Padding móvil y gaps pequeños. |
| `--space-6` | `24px` | Interior de tarjetas. |
| `--space-8` | `32px` | Grids y bloques. |
| `--space-12` | `48px` | Separación de secciones móvil. |
| `--space-16` | `64px` | Separación de secciones tablet. |
| `--space-24` | `96px` | Separación de secciones escritorio. |

### Radios y bordes

| Elemento | Radio | Borde |
|---|---:|---|
| Campo, botón, alerta | `8px` | `2px` en límites funcionales. |
| Tarjeta | `12px` | `1px` gris o `2px` negro si es interactiva. |
| Panel destacado | `16px` | Sin borde o `1px` sutil. |
| Badge | `999px` | `1px` sólido. |

La geometría debe sentirse precisa, no agresiva: esquinas moderadas, líneas visibles y sombras mínimas. No mezclar más de dos radios dentro de un mismo componente.

### Elevación

- Nivel 0: sin sombra para estructura y contenido estático.
- Nivel 1: `0 2px 8px rgb(7 7 7 / 0.10)` para menús o tarjetas elevadas.
- Nivel 2: `0 8px 24px rgb(7 7 7 / 0.16)` sólo para modal o diálogo.
- Un borde visible es preferible a una sombra cuando el componente es interactivo.
- No usar resplandores de color alrededor de texto o controles.

## Layout responsive

El diseño es mobile-first. Los breakpoints sirven al contenido y no deben usarse para ocultar funcionalidad esencial.

| Rango | Grid | Margen lateral | Gap |
|---|---|---:|---:|
| `< 480px` | 4 columnas | `16px` | `16px` |
| `480–767px` | 4 columnas | `24px` | `16px` |
| `768–1023px` | 8 columnas | `32px` | `24px` |
| `≥ 1024px` | 12 columnas | `48px` | `24px` |
| `≥ 1280px` | 12 columnas, centradas | automático | `24px` |

- Ancho máximo de página: `1200px`.
- Ancho máximo del formulario: `760px`.
- Ancho máximo de lectura: `72ch`.
- Touch target mínimo: `44 × 44px`.
- Separación mínima entre acciones táctiles: `8px`.
- En móvil, usar una columna salvo pares de datos cortos que sigan siendo legibles.
- El contenido esencial debe funcionar con zoom al `200 %` y sin scroll horizontal a `320px`.

## Componentes

### Navegación global

- Altura mínima: `64px` en móvil y `72px` en escritorio.
- Fondo blanco, borde inferior negro de `2px` y acento cian opcional de `4px`.
- CROFI aparece como marca primaria; las marcas secundarias no desplazan la navegación.
- En móvil, el menú debe abrirse con un botón nombrado, conservar foco y cerrarse con `Escape`.
- Hasta `1023px`, marca a la izquierda y botón de menú a la derecha en la misma fila; desde `1024px`, enlaces visibles en horizontal. Sin JavaScript, los enlaces permanecen disponibles debajo de la marca.
- La ruta activa usa peso, subrayado y color; nunca sólo color.
- Incluir un enlace “Saltar al contenido” visible al recibir foco.

### Hero del evento

- Presenta: nombre del evento, propuesta breve, fecha, sede y CTA de registro.
- Una sola acción primaria visible; los reglamentos son la acción secundaria.
- Puede usar CROFITO o una imagen de categoría sin superponer texto sobre zonas complejas.
- El título usa Robotic sólo cuando esté autorizada; mientras tanto usa Orbitron.
- Evitar sliders automáticos, video de fondo y efectos que retrasen la carga.

### Botones

**Primario:** fondo cian, texto negro, borde negro de `2px`.

**Secundario:** fondo blanco, texto negro, borde negro de `2px`.

**Oscuro:** fondo negro, texto blanco; útil en superficies claras.

**Destructivo:** fondo rojo profundo, texto blanco; nunca para el envío normal.

**Texto:** negro, subrayado persistente y flecha sólo si indica navegación.

Todos los botones:

- altura mínima `44px`;
- padding horizontal `20–24px`;
- label breve en Orbitron 700, sin depender exclusivamente de mayúsculas;
- estados `hover`, `active`, `focus-visible`, `disabled` y `loading`;
- durante `loading`, conservan ancho y muestran verbo en progreso;
- nunca deshabilitan una acción sin explicar la causa.

### Tarjeta de categoría

- Imagen en un marco consistente de relación `4:3`.
- Usar `object-fit: contain` como valor predeterminado para evitar cortar texto o robots de los recursos entregados.
- Excepción aprobada: la tarjeta de Micromouse amateur usa `object-fit: cover`, centrado, para llenar el marco sin bandas negras; no modifica la imagen original ni el encuadre de otras categorías.
- Fondo del marco negro para imágenes oscuras; blanco para imágenes transparentes o claras.
- Nombre oficial, nivel amateur/profesional cuando aplique y enlace explícito al reglamento.
- Toda la tarjeta puede ser clicable, pero el nombre del enlace debe seguir siendo descriptivo.
- Hover: borde cian y desplazamiento máximo de `2px`; no escalar la imagen.

### Sección de premiación

- Debe poder ocultarse sin dejar espacio vacío.
- Mientras no exista contenido aprobado, mostrar “Premiación por confirmar”.
- No inventar montos, premios, patrocinadores ni fechas.
- Cuando haya premios, usar listas o tarjetas comparables y no una tabla densa en móvil.

### Campo de formulario

- Label visible encima del control; placeholder sólo como ejemplo.
- Altura mínima `48px`, padding `12px 14px`, borde gris de `2px`.
- Estado activo: borde negro y doble anillo de foco negro+cian.
- Ayuda antes del campo cuando afecte la respuesta; error inmediatamente después.
- Marcar “Opcional” en el label. No llenar la vista de asteriscos sin una leyenda.
- Conservar los valores cuando falle la red o la validación del servidor.
- Usar `autocomplete`, `inputmode` y tipos HTML adecuados.

### Selector de categoría

- Mostrar las seis opciones como radios o tarjetas seleccionables, no como iconos sin texto.
- La opción seleccionada combina borde, check e indicación textual.
- Usar exactamente el mismo nombre en landing, formulario y hoja de datos.
- Usar “Minisumo Autónomo” y sus divisiones conforme a la confirmación registrada en preguntas abiertas; conservar los slugs técnicos existentes.

### Integrantes dinámicos

- Numerar cada bloque: “Integrante 1”, “Integrante 2”, etc.
- “Agregar integrante” es una acción secundaria; “Eliminar” es textual y contextual.
- Mover el foco al primer campo agregado y anunciar el cambio mediante una región de estado.
- Confirmar antes de eliminar un bloque con datos capturados.

### Carga de archivos

- Mostrar propósito, formatos y tamaño máximo antes de elegir un archivo.
- Usar selector nativo además de drag-and-drop; el flujo debe funcionar sin arrastrar.
- Mostrar nombre, tamaño, progreso, resultado y acción para reemplazar o retirar.
- Error de tipo o tamaño: rojo profundo, icono y explicación accionable.
- No mostrar miniaturas de identificaciones o comprobantes fuera del contexto estrictamente necesario.
- No afirmar que un archivo quedó guardado hasta recibir confirmación del servidor.

### Progreso del registro

- En móvil, mostrar “Paso X de Y” y el nombre del paso actual.
- En escritorio puede añadirse un stepper horizontal.
- Los pasos completados usan verde con texto negro y un check.
- Un paso con error usa rojo profundo y texto; el color solo no basta.
- Permitir volver sin borrar información.

### Alertas y confirmación

| Estado | Tratamiento |
|---|---|
| Información | Borde cian, icono y título negro. |
| Éxito | Fondo verde o tinte claro, texto negro y check. |
| Advertencia | Borde rojo competencia, icono y acción preventiva. |
| Error | Fondo rojo profundo, texto blanco y solución inmediata. |

La confirmación de envío debe decir qué se recibió y qué ocurrirá después. No debe usar “inscripción aceptada” mientras CROFI no haya definido ese estado.

### Descarga de reglamento

- El enlace debe incluir categoría y formato: “Descargar reglamento de Micromouse amateur (PDF)”.
- Mostrar tamaño del archivo cuando sea conocido.
- No iniciar descargas inesperadas desde una tarjeta sin indicar la acción.
- La subpágina puede resumir la categoría, pero el PDF conserva precedencia normativa.

### Footer

- Identifica a CROFI como organizador y a Hello World como colaborador.
- Contiene privacidad, contacto, reglamentos y atribuciones.
- Puede incorporar UNAM y Facultad de Ingeniería en un bloque institucional separado.
- Usa texto mínimo de `14px`, contraste AA y enlaces subrayados.
- Agrupa identidad y navegación en una columna móvil y dos desde `768px`; una banda inferior separa la edición del evento y el enlace «Volver arriba». Evita duplicar el espacio que ya aporta el contenido principal.

## Patrones de página

### Landing

1. Navegación.
2. Hero con fecha, sede y CTA.
3. Introducción breve de Copa Ollin.
4. Grid de seis categorías.
5. Premiación o estado “Por confirmar”.
6. Recordatorio de reglamentos y CTA de registro.
7. Bloque institucional y footer.

### Categoría

1. Breadcrumb o regreso a categorías.
2. Nombre oficial e imagen.
3. Resumen corto y datos esenciales extraídos sin contradecir el reglamento.
4. CTA de descarga del PDF.
5. CTA de registro con categoría preseleccionada, si la regla de negocio lo permite.

### Registro

1. Propósito y tiempo estimado.
2. Enlace al aviso de privacidad antes de capturar datos.
3. Progreso y agrupación lógica.
4. Equipo y categoría.
5. Capitán e integrantes.
6. Robot.
7. Documentos y consentimientos.
8. Revisión antes de enviar.
9. Confirmación o recuperación ante error.

## Imágenes e iconografía

### Imágenes de categorías

- Usar únicamente los archivos de `assets/categories/` mientras no se autoricen otros recursos.
- Conservar los originales sin recomprimir; la aplicación puede generar derivados optimizados durante build.
- No recortar por defecto: las proporciones entregadas varían y algunas composiciones contienen texto integrado.
- No añadir filtros, tintes, marcos futuristas ni texto encima de la imagen.
- Proporcionar `width` y `height` para evitar saltos de layout.
- Usar `loading="lazy"` fuera del primer viewport y formatos derivados modernos cuando el stack los soporte.
- El texto alternativo describe la categoría o el robot; no repite “imagen de”.

### Iconos

- Elegir una sola biblioteca con licencia compatible cuando se defina el stack.
- Estilo lineal, geométrico, grosor visual de `2px` y tamaño mínimo `20px`.
- No mezclar iconos outline y filled en la misma jerarquía.
- Los iconos decorativos usan `aria-hidden="true"`; los botones con sólo icono necesitan nombre accesible.
- No sustituir palabras críticas —error, descargar, eliminar— únicamente por iconos.

## Movimiento

- Duración estándar: `150–200ms`; entrada de panel: máximo `250ms`.
- Propiedades permitidas: `opacity`, `transform` y color.
- Desplazamiento máximo de hover: `2px`.
- No usar parallax, texto con glitch, destellos o fondos animados durante el registro.
- Respetar `prefers-reduced-motion: reduce` y eliminar movimiento no esencial.
- Ninguna animación debe retrasar la interacción o bloquear el envío.

## Accesibilidad

La base interna es **WCAG 2.1 AA**, salvo que CROFI apruebe un objetivo superior.

- Contraste mínimo `4.5:1` para texto normal, `3:1` para texto grande y límites esenciales de UI.
- Orden de foco equivalente al orden visual.
- Doble indicador de foco visible en fondos blancos y oscuros.
- HTML semántico antes de ARIA.
- Un `h1` por página y jerarquía sin saltos arbitrarios.
- Mensajes de error asociados mediante `aria-describedby` y resumen al inicio cuando haya varios.
- Estados dinámicos anunciados sin robar foco inesperadamente.
- Navegación completa por teclado y controles táctiles de al menos `44 × 44px`.
- Zoom al `200 %`, reflow a `320px` y texto adaptable sin pérdida de contenido.
- No usar color, posición o forma como única instrucción.
- Probar con teclado, lector de pantalla y al menos un dispositivo móvil real antes de liberar.

## Voz y contenido

### Personalidad

- Técnica y entusiasta, no infantil.
- Institucional y directa, no burocrática.
- Competitiva sin excluir a participantes amateur.
- Transparente en requisitos, privacidad y estados.

### Reglas de redacción

- Español de México, frases breves y verbos directos.
- “Registra a tu equipo”, no “Proceder al registro”.
- “Descargar reglamento”, no “Haz clic aquí”.
- Distinguir **registro recibido** de **inscripción aceptada**.
- Indicar fechas completas y zona horaria cuando afecten el registro.
- No usar tecnicismos internos como endpoint, schema, payload o bucket en mensajes públicos.
- Los errores explican cómo corregir: qué ocurrió, qué conservará el sistema y qué debe hacer la persona.
- No prometer premios, cupos, pagos o confirmaciones pendientes.

## Do / Don't

### Sí

- Usar blanco como canvas principal y negro técnico para máxima legibilidad.
- Reservar cian para identidad, acciones principales y selección activa.
- Usar verde sólo para éxito o avance confirmado.
- Usar los rojos para atención y error con texto o icono adicional.
- Dejar espacio alrededor de imágenes, marcas y formularios.
- Mantener una acción principal clara por sección.
- Verificar nombres y reglas contra los documentos de `docs/`.

### No

- No usar blanco sobre cian o verde.
- No usar gris medio como texto normal sobre blanco.
- No convertir toda la interfaz en una estética neón oscura.
- No usar Robotic en párrafos, labels pequeños o campos.
- No mezclar múltiples estilos de sombra, radio o iconografía.
- No recortar logotipos ni imágenes de categorías por conveniencia del layout.
- No esconder labels dentro de placeholders.
- No mostrar datos reales en prototipos, capturas o pruebas.
- No incorporar nuevas fuentes, ilustraciones o iconos sin revisar licencia.

## Tokens de referencia

Este bloque es neutral respecto al framework. Debe trasladarse a la solución elegida sin cambiar nombres o valores silenciosamente.

```css
:root {
  /* Paleta CROFI */
  --color-black: #070707;
  --color-white: #ffffff;
  --color-cyan: #00a8e0;
  --color-green: #6edb00;
  --color-red-deep: #ae0909;
  --color-red-bright: #e90e32;
  --color-gray: #808080;

  /* Semánticos */
  --color-text: var(--color-black);
  --color-text-inverse: var(--color-white);
  --color-text-muted: #595959;
  --color-surface: var(--color-white);
  --color-surface-subtle: #f5f5f5;
  --color-surface-dark: var(--color-black);
  --color-primary: var(--color-cyan);
  --color-success: var(--color-green);
  --color-danger: var(--color-red-deep);
  --color-attention: var(--color-red-bright);
  --color-border: var(--color-gray);

  /* Tipografía */
  --font-display: "ROBOTIC", "Orbitron", system-ui, sans-serif;
  --font-heading: "Orbitron", system-ui, sans-serif;
  --font-body: "Times New Roman", Times, serif;

  --text-display: clamp(2.75rem, 7vw, 5.5rem);
  --text-h1: clamp(2.25rem, 5vw, 4rem);
  --text-h2: clamp(1.75rem, 3.5vw, 2.75rem);
  --text-h3: clamp(1.25rem, 2vw, 1.5rem);
  --text-body-lg: 1.25rem;
  --text-body: 1.125rem;
  --text-ui: 1rem;
  --text-caption: 0.875rem;

  /* Espaciado */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  /* Forma y layout */
  --radius-control: 0.5rem;
  --radius-card: 0.75rem;
  --radius-panel: 1rem;
  --radius-pill: 999px;
  --border-functional: 2px;
  --page-max-width: 75rem;
  --form-max-width: 47.5rem;
  --reading-max-width: 72ch;
}
```

Indicador de foco recomendado:

```css
:focus-visible {
  outline: 2px solid var(--color-black);
  outline-offset: 2px;
  box-shadow: 0 0 0 5px var(--color-cyan);
}
```

## Guía para implementación y agentes

Antes de crear o modificar una vista:

1. Identifica el patrón de página y los componentes existentes que resuelven la tarea.
2. Revisa si el contenido depende de una pregunta abierta.
3. Usa primero los tokens de este documento; no añadas colores o escalas ad hoc.
4. Diseña desde `320px` y después amplía el layout.
5. Define estados vacío, carga, éxito, error, disabled y foco cuando apliquen.
6. Verifica contraste y navegación por teclado antes de considerar terminado el componente.
7. Usa recursos de `assets/` y conserva su atribución; nunca copies archivos desde `.private/` a código versionado.
8. Documenta cualquier excepción y actualiza este archivo si la excepción se vuelve una convención.

Una propuesta visual debe describirse con tokens y comportamiento, no sólo con adjetivos. Ejemplo:

> Tarjeta de categoría con superficie blanca, borde interactivo de 2 px, radio `--radius-card`, marco de imagen 4:3 con `object-fit: contain`, título Orbitron y enlace de reglamento subrayado. En hover cambia el borde a cian; en foco muestra el doble anillo negro+cian.

## Checklist de revisión visual

- [ ] CROFI conserva la jerarquía de organizador.
- [ ] Logotipos sin recorte, deformación, recolor o efectos.
- [ ] Sólo se usan colores y derivados documentados.
- [ ] Las combinaciones de texto cumplen contraste AA.
- [ ] Robotic se limita a títulos cortos y cuenta con autorización antes de publicarse.
- [ ] La vista funciona a `320px`, `768px` y `1280px`.
- [ ] No hay scroll horizontal a `320px` ni con zoom al `200 %`.
- [ ] Controles táctiles de al menos `44 × 44px`.
- [ ] Foco visible y navegación completa por teclado.
- [ ] Estados de carga, error, vacío, disabled y éxito cubiertos.
- [ ] Imágenes dimensionadas, optimizadas y con texto alternativo.
- [ ] Reglamentos y nombres cotejados contra sus fuentes.
- [ ] No se muestran datos reales, enlaces privados ni contenido no aprobado.

## Pendientes que afectan diseño

- Autorización escrita para versionar y servir la fuente Robotic.
- Reglas oficiales de convivencia y uso público de logotipos.
- Materiales oficiales de las categorías adicionales y reglamentos actualizados anunciados por CROFI.
- Contenido final de premiación.
- Aviso de privacidad, consentimientos y estados definitivos del registro.

Consulta el estado y la fecha objetivo de cada punto en [preguntas abiertas](docs/requirements/preguntas-abiertas.md).

## Fuentes

- [Kit de inicio HelloWorld–CROFI](docs/requirements/kit-de-inicio.md)
- [Documento de Especificaciones Técnicas](docs/requirements/especificaciones-tecnicas.md)
- [Preguntas para validación con CROFI](docs/requirements/preguntas-abiertas.md)
- [Inventario de recursos visuales](assets/README.md)
- Reglamentos legibles en [`docs/regulations/`](docs/regulations/)
- Fuentes PDF originales en [`docs/sources/`](docs/sources/)

Las decisiones visuales de este sistema son propias de Copa Ollin y se basan únicamente en los materiales entregados por CROFI y las decisiones internas registradas.
