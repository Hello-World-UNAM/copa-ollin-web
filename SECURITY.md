# Seguridad y privacidad

## Reportar un problema

No abras un issue público para vulnerabilidades, credenciales expuestas o incidentes que involucren datos personales. Utiliza **Report a vulnerability** en la pestaña **Security** del repositorio o contacta de forma privada a las personas propietarias de la organización.

Incluye una descripción del impacto, los pasos mínimos para reproducirlo y cualquier mitigación conocida. No adjuntes datos reales de participantes.

## Datos protegidos

El proyecto prevé procesar identificaciones, comprobantes, datos de contacto y documentos firmados. Hasta que exista una arquitectura y un aviso de privacidad aprobados:

- no se usarán datos reales para desarrollo o pruebas;
- no se publicarán enlaces operativos de Drive o Sheets;
- no se almacenarán cargas de participantes en GitHub;
- todo ejemplo deberá ser ficticio y claramente identificable como tal;
- los accesos se concederán por mínimo privilegio y canales privados.

## Secretos

Los secretos futuros deberán administrarse en el proveedor de despliegue o en GitHub Actions. Nunca deben escribirse en el código, documentación, historial Git, screenshots o logs compartidos.

Si un secreto llega a publicarse, debe revocarse y rotarse inmediatamente; eliminarlo del archivo no basta porque seguirá presente en el historial.
