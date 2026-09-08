# Reglamento técnico y de competencia

## Categoría: Micromouse — División Amateur

**Comité Organizador CROFI**
Ciudad Universitaria, CDMX, 2026 · Edición 2026

> Transcripción normalizada. Consulta el [PDF fuente](../sources/regulations/micromouse-amateur.pdf).

## 1. Objetivo de la categoría amateur

La categoría de Micromouse Amateur está focalizada en resolver laberintos mediante algoritmos de exploración y mapeo espacial. Al tratarse de una división amateur orientada a estudiantes de ingeniería en formación, el reglamento busca disipar la frustración y abrir paso a la experimentación algorítmica elemental, permitiendo el uso de plataformas comerciales y otorgando facilidades de rescate.

## 2. Especificaciones técnicas del robot

- **Dimensiones estructurales:** el tamaño máximo del robot en su base es de 25 × 25 cm. No existe límite de altura. Este tamaño extendido —mayor al estándar profesional— tiene como fin permitir el alojamiento de placas de desarrollo comunes como Arduino Uno, ESP32 o Raspberry Pi de tamaño completo.
- **Procesamiento y autonomía:** el robot debe ser completamente autónomo e inalámbrico durante la ejecución en pista. Todo el procesamiento de datos y algoritmos debe realizarse a bordo.
- **Sensores permitidos:** no hay restricciones en la tecnología de detección ambiental. Se permite y recomienda el uso de sensores ultrasónicos, infrarrojos, sensores de distancia por tiempo de vuelo —ToF— o LiDAR 2D.

## 3. Especificaciones del laberinto reducido

- **Dimensiones de la cuadrícula:** en lugar del estándar internacional de 16 × 16, la competencia se desarrollará en un formato reducido de 10 × 10 celdas totales. Esta reducción disminuye significativamente la carga de memoria requerida en los microcontroladores para el mapeo.
- **Módulos de celda:** cada celda unitaria mide 16,8 × 16,8 cm.
- **Paredes y suelo:** las paredes tienen 5 cm de altura y 1,2 cm de grosor. Sus superficies laterales son de color blanco mate con el lomo superior pintado de rojo. El suelo del laberinto es de color negro mate con un nivel alto de fricción.
- **Ubicación de metas:** la celda de inicio se ubica siempre en una de las cuatro esquinas perimetrales del laberinto. La zona de meta estará compuesta por un área central de 2 × 2 celdas libres de paredes internas.

## 4. Dinámica de exploración, algoritmos y rescates

1. **Tiempo global de laberinto:** cada equipo dispone de un tiempo global máximo de cinco minutos dentro de la zona de pista. Durante este lapso, el robot puede entrar, mapear, salir, reprogramarse de forma rápida y ejecutar múltiples intentos de carrera rápida —*speed run*—.
2. **Condición de victoria:** gana el equipo cuyo robot registre el menor tiempo de tránsito desde la celda de salida hasta la zona de meta de manera ininterrumpida.
3. **Libertad algorítmica:** no se exige la implementación obligatoria de algoritmos matemáticos complejos de optimización topológica, como Flood Fill, A* o Dijkstra. Los algoritmos empíricos de navegación básica, como la regla de la mano izquierda o derecha —*Wall Follower*—, son válidos y competitivos.
4. **Regla del rescate manual —enfoque formativo—:**
   - Si el robot choca directamente contra una pared y traba sus motores, o entra en un bucle infinito de movimientos erróneos por un fallo en las lecturas de los sensores, el operador tiene derecho a intervenir físicamente.
   - El participante podrá levantar el robot y regresarlo a la celda de inicio del laberinto.
   - **Penalización por intervención:** esta acción no cancela el intento global ni detiene el cronómetro general de cinco minutos. Añade una penalización fija de 10 segundos al tiempo final de la siguiente carrera rápida que se complete exitosamente.

## 5. Homologación y arbitraje

Durante la homologación se validará que las dimensiones no excedan los 25 × 25 cm empleando un marco calibrado.

Las decisiones del juez relativas a los tiempos de carrera, el cruce de celdas y la aplicación de las penalizaciones por rescate manual son definitivas.
