## Objetivo

<!-- ¿Qué problema resuelve este cambio? Enlaza con "Refs #..."; no uses "Closes" porque QA ocurre después del merge. -->

Refs #

## Alcance y dependencias

<!-- Explica cómo coincide con el issue y qué queda expresamente fuera. -->

- Alcance:
- Fuera de alcance:
- Dependencias o bloqueos:
- Reviewer sugerido (distinto del autor):

## Cambios

<!-- Resume únicamente los cambios incluidos en este PR. -->

## Verificación

<!-- Indica comandos reales y sus resultados. Añade capturas si existe un cambio visual. -->

```text
pnpm format:check: pendiente
pnpm lint: pendiente
pnpm check: pendiente
pnpm test: pendiente
pnpm build: pendiente
```

## CI

- [ ] El check `quality` está verde.
- [ ] El check volvió a ejecutarse después del último cambio revisable.

## Staging y QA posterior al merge

<!-- Se completa después del squash merge por Sebastián; el issue permanece abierto hasta entonces. -->

- Commit de `main` que se probará:
- Despliegue/URL de staging:
- Pasos de prueba:
- Resultado esperado:
- Resultado real:
- Severidad si falla: `bloqueante` / `alta` / `media` / `baja` / `no aplica`

## Lista de revisión

- [ ] El alcance coincide con el issue y tiene criterios de aceptación.
- [ ] Revisé enlaces, ortografía y archivos afectados.
- [ ] No incluí secretos, datos personales ni enlaces operativos.
- [ ] Actualicé la documentación relacionada cuando fue necesario.
- [ ] Un developer distinto del autor revisará código, alcance y pruebas.
- [ ] El issue no se cerrará automáticamente; seguirá abierto hasta QA en staging.
