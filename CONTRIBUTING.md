# Contribuir a Copa Ollin

Gracias por colaborar. El repositorio contiene la fuente documental y la fundación técnica aprobada del proyecto.

## Preparar el entorno

El repositorio fija Node.js 22.23.2 y pnpm 11.3.0. Prepara el entorno con nvm y Corepack antes de instalar:

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.3.0 --activate
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

Las versiones esperadas son `v22.23.2` y `11.3.0`. pnpm conserva además un runtime local de Node para ejecutar scripts con la versión correcta, aunque el host tenga otra versión. Si un intento anterior dejó `node_modules` incompleto, selecciona primero Node 22 y ejecuta `pnpm install --force --frozen-lockfile`. No agregues `node-addon-api` ante un error de `sharp`: ese mensaje indica un intento de compilación contra el `libvips` del sistema; actualiza el repositorio y reinstala.

Antes de abrir un pull request ejecuta `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm test` y `pnpm build`. CI repite exactamente estos comandos en el check `quality`.

## Flujo de trabajo

1. Busca un issue existente antes de abrir uno nuevo y lee completo su objetivo, criterios, fuera de alcance, dependencias, responsable y reviewer sugerido.
2. Mantén una sola tarea principal activa. Si falta una decisión o dependencia, explica el bloqueo y su impacto antes de cambiar código.
3. Comprueba el worktree y crea una rama corta desde `main` actualizado:
   ```bash
   git status --short --branch
   git fetch origin
   git switch main
   git pull --ff-only origin main
   git switch -c feat/123-nombre-corto
   ```

   Usa el prefijo que corresponda al cambio:
   - `docs/nombre-corto` para documentación;
   - `feat/nombre-corto` para funcionalidad futura;
   - `fix/nombre-corto` para correcciones futuras;
   - `chore/nombre-corto` para mantenimiento.
4. Realiza commits claros siguiendo Conventional Commits, preferentemente en español, y comprueba el diff antes de publicarlos:
   ```bash
   git diff --check
   git add <archivos-del-issue>
   git diff --cached --check
   git commit -m "docs(flujo): actualizar guía operativa"
   git push --set-upstream origin feat/123-nombre-corto
   ```
5. Abre temprano el pull request. Usa `Refs #123`, no `Closes #123`, porque Sebastián hace QA después del merge:
   ```bash
   gh pr create --base main --head feat/123-nombre-corto \
     --title "docs(flujo): actualizar guía operativa" \
     --body-file .github/PULL_REQUEST_TEMPLATE.md
   ```
   Sustituye el cuerpo por el resumen real del cambio, las dependencias, la evidencia y los comandos ejecutados; la plantilla sirve como lista de comprobación.
6. Espera el check `quality`, solicita la revisión de un developer distinto y resuelve todas las conversaciones:
   ```bash
   gh pr checks 123 --watch
   gh pr review 123 --approve
   ```
7. Cano hace *squash merge* normalmente; Sebastián lo sustituye sólo si Cano no está disponible. Después, el issue pasa a `QA` y permanece abierto hasta probar el staging integrado.

No hagas push directo a `main` ni reescribas su historial.

### Comandos de referencia para issues y sincronización

Usa el repositorio explícito para evitar crear el issue en otro proyecto:

```bash
REPO=Hello-World-UNAM/copa-ollin-web
gh issue list --repo "$REPO" --state open
gh issue create --repo "$REPO" --template task.yml --title "[Tarea]: objetivo breve"
```

Después de un squash merge:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git branch -d feat/123-nombre-corto
```

No uses `git reset --hard`, `git checkout --` ni force-push para resolver una diferencia sin revisar antes el trabajo existente y acordar la recuperación.

## Requisitos y decisiones

- Cita el documento fuente y la sección afectada.
- No conviertas una pregunta abierta en requisito sin registrar la decisión de la mesa directiva.
- Si el Markdown y el PDF difieren, conserva el PDF, abre un issue de aclaración y no adivines la intención.
- Las decisiones de arquitectura deben quedar documentadas en `docs/architecture/decisions/` cuando esa fase comience.
- Las preguntas sobre Google Sheets/Drive, el formulario y archivos siguen pendientes hasta que exista una respuesta aprobada; el Sprint 1 sólo puede usar datos ficticios.

## Convenciones de commits

Ejemplos:

```text
docs(reglamentos): corregir medidas de minisumo amateur
docs(requisitos): registrar decisión sobre tamaño de archivos
feat(registro): validar integrantes por categoría
fix(formulario): conservar archivos al corregir un campo
```

## Antes de solicitar revisión

- Revisa ortografía, enlaces relativos y formato Markdown.
- Confirma que las imágenes y documentos referenciados existen.
- Describe cualquier cambio visible y adjunta capturas cuando exista interfaz.
- Verifica que no incluyes secretos ni datos personales.
- Mantén el PR dentro del alcance del issue; separa cambios no relacionados.
- Incluye el commit y el despliegue de staging que Sebastián deberá probar después del merge; registra el resultado esperado y real, no sólo una captura de que compiló.

## Información que nunca debe publicarse

No agregues al repositorio, issues ni pull requests:

- credenciales, tokens, secretos o archivos `.env`;
- identificaciones, comprobantes, teléfonos o datos de participantes;
- enlaces operativos de Google Drive o Sheets;
- datos internos de acceso o información recibida por canales privados.

Ante una duda de privacidad o seguridad, detén la publicación y sigue [SECURITY.md](SECURITY.md).
