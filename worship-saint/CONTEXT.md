# Contexto del proyecto Worship-Saint

## Resumen general
Worship-Saint es un sitio web interactivo desarrollado con Astro y componentes React para ofrecer una experiencia de hero visual y narrativa. El centro del proyecto es un efecto de scratch reveal que permite al usuario descubrir una imagen oculta al rascar una capa superior, con una secuencia de overlays, texto tipo máquina de escribir y una transición final hacia una imagen distinta.

Este documento sirve como contexto operativo para futuras IAs, desarrolladores o colaboradores. Resume qué hace el proyecto, cómo está estructurado, qué cambios ya se implementaron y cómo probar la experiencia completa.

## Objetivo del producto
- Crear un hero impactante y memorable para la marca.
- Usar interacción física (rascar) como elemento central de la experiencia.
- Guiar al usuario a través de una secuencia narrativa progresiva: imagen inicial → overlay intermedio → mensaje de marketing → imagen final.
- Mantener la experiencia visual consistente, responsive y con transiciones suaves.

## Stack técnico
- Astro como framework principal para la estructura de páginas y contenido.
- React para los componentes interactivos del hero.
- TypeScript para tipado de componentes y lógica de UI.
- Canvas 2D para el efecto scratch reveal y para las animaciones visuales.
- Tailwind CSS vía Astro / Vite para estilos base y utilidades.

## Estructura del proyecto
- [README.md](README.md) — resumen general del proyecto y comandos de uso.
- [package.json](package.json) — dependencias, scripts y versión del proyecto.
- [src/pages/index.astro](src/pages/index.astro) — punto de entrada de la página principal.
- [src/components/ScratchReveal.tsx](src/components/ScratchReveal.tsx) — componente principal del efecto scratch reveal y secuencia visual.
- [src/components/TypewriterText.tsx](src/components/TypewriterText.tsx) — animación de texto tipo máquina de escribir con callbacks de finalización.
- [src/components/Brush.ts](src/components/Brush.ts) — lógica de trazos para el efecto de borrar/rascar sobre canvas.
- [src/components/usePointer.ts](src/components/usePointer.ts) — manejo del puntero para distinguir arrastre real de simples movimientos.
- [src/components/sections/inicio/InicioSection.astro](src/components/sections/inicio/InicioSection.astro) — composición del hero y paso de imágenes/props al componente principal.
- [src/components/NavBar.tsx](src/components/NavBar.tsx) — navegación principal del sitio.
- [src/components/sections](src/components/sections) — secciones de contenido del landing.
- [src/assets](src/assets) — imágenes del proyecto, entre ellas doctor-doom.jpg, doctor-doom-ojos-cerrados.jpg, tony.jpg y rostro-verdadero.jpg.

## Estado actual del desarrollo
El proyecto ya cuenta con una implementación funcional del hero interactivo y con una secuencia de narrativa completa. La experiencia actual está enfocada en el siguiente flujo:

1. El usuario rasca una imagen con clic/arrastre.
2. El sistema mide el progreso del rascado y, al completarlo, activa la siguiente fase.
3. Se muestra un overlay intermedio visual y luego un overlay de marketing con texto.
4. Cuando el texto termina de escribirse, se dispara la transición final que revela una imagen nueva con un efecto de rascar programático.

## Cambios implementados hasta el momento

### 1. Scratch reveal robusto y controlado
Se reworked el componente principal para que la experiencia sea más estable y menos propensa a replays o repeticiones no deseadas.

Implementado en [src/components/ScratchReveal.tsx](src/components/ScratchReveal.tsx):
- Se agregó una secuencia de estados para controlar overlays y transiciones.
- Se incorporó lógica para evitar que la secuencia se dispare más de una vez.
- Se añadió control de interacción real del usuario para evitar reveals automáticos.
- Se implementó una transición final programática que revela la imagen final mediante trazos sintéticos sobre el canvas.
- Se agregó limpieza de timers y requestAnimationFrame al desmontar o reiniciar la secuencia.
- Se evitó volver a dibujar el foreground una vez que la imagen final ya fue aplicada.

### 2. Secuencia de overlays narrativos
El flujo visual ahora sigue una estructura clara:
- Se activa el overlay central con la imagen de Arioman / personaje principal.
- Luego aparece un overlay de marketing en la esquina superior derecha.
- El texto de marketing se escribe tipo máquina de escribir.
- Al completarse el texto, se inicia la transición final.

### 3. Texto tipo máquina de escribir con callback de finalización
Implementado en [src/components/TypewriterText.tsx](src/components/TypewriterText.tsx):
- Se corrigió la lógica de escritura para evitar comportamientos extra o errores.
- Se añadió callback onComplete para notificar cuando terminó el texto.
- Se incorporó un fade-out controlado con readDelay para ocultar el mensaje tras un tiempo.
- Se hizo el callback idempotente para evitar múltiples ejecuciones.

### 4. Lógica de Pointer más precisa
Implementado en [src/components/usePointer.ts](src/components/usePointer.ts):
- El estado del puntero solo se actualiza cuando hay un dibujo real en curso.
- Se reducen falsos positivos por movimientos del cursor sin arrastre.
- El sistema distingue mejor entre interacción válida y simple hover.

### 5. Pincel y efecto de borrado reutilizable
Implementado en [src/components/Brush.ts](src/components/Brush.ts):
- El brush usa composite operation destination-out para borrar la capa superior y dejar ver la imagen inferior.
- Se usa un gradiente radial para lograr bordes suaves.
- La misma lógica se reutiliza tanto para el scratch normal como para la animación final programática.

### 6. Integración del hero con imagen final
Implementado en [src/components/sections/inicio/InicioSection.astro](src/components/sections/inicio/InicioSection.astro):
- Se pasa la prop afterReveal con la imagen final a ScratchReveal.
- Esto permite cargar la imagen final solo cuando corresponde al final del flujo narrativo.

## Flujo de interacción actual
1. El usuario realiza un trazo con clic y arrastre.
2. El sistema acumula progreso de rascado según la distancia recorrida.
3. Al alcanzar el 100% y si la interacción fue real, se activa la secuencia de revelado.
4. Primero aparece un overlay intermedio visual.
5. Después aparece el mensaje persuasivo con escritura gradual.
6. Cuando el texto termina, se inicia la transición final para mostrar la imagen nueva.

## Cómo probar la experiencia
1. Instalar dependencias:
   ```bash
   cd c:\Users\ADMINSTRADOR\Documents\worship-saint\worship-saint
   npm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abrir en el navegador:
   ```text
   http://localhost:4321
   ```
4. Interactuar con el hero:
   - Rascar con clic + arrastrar.
   - Ver la secuencia: overlay intermedio → mensaje de marketing → transición final.

## Parámetros ajustables
- Sensibilidad de scratch: ajustar el divisor utilizado para calcular progreso en [src/components/ScratchReveal.tsx](src/components/ScratchReveal.tsx).
- Duración de la animación final: cambiar la variable de duración en la transición programática.
- Velocidad del typewriter: ajustar speed y readDelay en [src/components/TypewriterText.tsx](src/components/TypewriterText.tsx).
- Tamaño del pincel: modificar brushSize al pasar la prop desde [src/components/sections/inicio/InicioSection.astro](src/components/sections/inicio/InicioSection.astro).

## Notas importantes para futuras modificaciones
- Si la secuencia se repite más de una vez, revisar que el componente no esté montándose dos veces por hidratación o duplicación de layout.
- La lógica actual ya intenta prevenir replays, pero un montaje extra puede volver a disparar la experiencia.
- Para una transición final más direccional o más “barrido”, se puede modificar la generación de coordenadas en la animación programática.
- El proyecto está orientado a mantener el hero como un componente principal y modular, por lo que cualquier cambio visual nuevo debería respetar esa estructura.

## Resumen ejecutivo para IA
Este proyecto es un landing page con un hero interactivo muy específico: un scratch reveal que combina canvas, overlays, texto tipo máquina de escribir y transición final hacia una imagen distinta. El estado actual ya está funcional y representa un flujo completo de experiencia visual. El componente central es ScratchReveal, mientras que TypewriterText, Brush y usePointer son los módulos auxiliares para la interacción y la narrativa.
