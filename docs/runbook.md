# Runbook de Release y Operación - Sprint 04

## 1. Preflight y Checklist (Go/No-Go)
Antes de aprobar el despliegue a producción, se debe verificar:
- [ ] El flujo de CI (`quality`) del commit candidato está 100% en verde.
- [ ] La regresión E2E de Chromium y Firefox pasó exitosamente.
- [ ] Pruebas físicas en dispositivos móviles (Android/iOS) ejecutadas y validadas por QA.
- [ ] El harness de capacidad se ejecutó en entorno seguro y las métricas son aceptables.
- [ ] Autorización explícita de coordinación (Sebastián/Cano) para iniciar la ventana de despliegue.

## 2. Responsables
- **Desarrollo y Release:** Rodrigo Yael Pastor Hernández
- **Pruebas y QA:** Sebastián Vázquez / Cano

## 3. Señales, Alertas y Monitoreo (Sin PII)
Durante los primeros 30 minutos del release, monitorear los siguientes indicadores (sin registrar datos personales):
- **Tráfico normal:** Tasa constante de códigos HTTP 200/SAVED en `/api/register`.
- **Alertas críticas (requieren atención inmediata):**
  - Disparos de errores HTTP 500, 502 o 503 en el formulario.
  - Latencias sostenidas donde el percentil p95 supere los 10,000 ms.
  - Picos anómalos de errores 413 (Payload Too Large).

## 4. Procedimiento de Rollback (Reversión)
Si se detecta un fallo bloqueante, ejecutar el plan de reversión al último snapshot aprobado:

1. **Reversión de código:**
   `git revert <SHA-DEL-MERGE-FALLIDO> -m 1`
   `git push origin main`
2. **Manejo de Datos:** El rollback revierte el código, pero **NO revierte automáticamente las filas insertadas en Google Sheets ni Drive**.
3. **Reconciliación:** Cualquier inconsistencia generada durante la falla será conciliada manualmente por el backend. No ejecutar scripts destructivos.