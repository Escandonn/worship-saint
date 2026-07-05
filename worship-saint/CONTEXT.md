# Contexto del proyecto Worship-Saint

## Resumen general
Este proyecto es un sitio web construido con Astro que usa componentes React para una experiencia de hero interactiva. El componente clave es `ScratchReveal.tsx`, que implementa un efecto de "rasca y gana" (scratch-reveal) sobre una imagen y culmina con la carga de una imagen final tras una secuencia de texto.

Este documento resume los cambios recientes y describe, paso a paso por archivo, las modificaciones y cómo probar el flujo completo.

## Objetivo de los cambios realizados
- Crear una experiencia de scratch reveal más robusta y controlada.
- Evitar replays o repeticiones del overlay de marketing.
- Asegurar que la imagen final `rostro-verdadero.jpg` se muestre únicamente después de que el texto final termine de escribirse.
- Añadir una animación programática que reproduzca el efecto de rascar para la transición final cuando corresponda.

## Cambios recientes (paso a paso por archivo)

### `src/components/ScratchReveal.tsx` (cambios principales)
- Secuencia de estados y refs nuevos:
  - `showFaceOverlay`: controla el overlay central (`ARIOMAN`).
  - `showNextOverlay`: controla la caja de marketing superior derecha.
  - `textComplete`: indica que `TypewriterText` terminó de escribir.
  - `timersRef`: array para guardar timeouts y limpiarlos al desmontar o reiniciar la secuencia.
  - `finalBgAppliedRef`: evita redibujar el foreground sobre la imagen final una vez aplicada.
  - `finalRevealRunningRef`: evita ejecutar la animación final más de una vez.
  - `userInteractedRef`: marca que el usuario realmente realizó un trazo (evita reveals automáticos).

- Secuencia de overlays robusta:
  1. Cuando `scratchProgress` alcanza 100% y `userInteractedRef` es true, se activa `isRevealed`.
  2. Mostramos el overlay central `ARIOMAN` (`showFaceOverlay = true`) durante ~1400ms.
  3. Ocultamos la cara y mostramos la caja de marketing (`showNextOverlay = true`) con `TypewriterText`.
  4. `TypewriterText.onComplete` (idempotente) marca `textComplete` y oculta la caja para evitar repeticiones.

- Transición final animada:
  - Al recibir `textComplete` y existir `afterReveal`, la imagen final se carga como fondo.
  - Se ejecuta una animación programática (RAF) que llama varias veces a `drawBrush` con estados sintéticos para recrear el efecto de rascado sobre el `scratchCanvas` usando `destination-out`.
  - La animación dura ~2600ms (configurable) y al terminar limpia el `scratchCanvas` y marca `finalBgAppliedRef`.

- Correcciones de estabilidad:
  - `initCanvas` ya no forzará la variable `isRevealed` ni volverá a dibujar el foreground cuando `finalBgAppliedRef` es true.
  - Se limpian timers y RAFs en desmontaje para evitar comportamientos inesperados.

### `src/components/TypewriterText.tsx`
- Arreglo de la lógica de tipeo para evitar errores de sintaxis y comportamientos extra.
- Añadido `onComplete` callback y fade-out controlado por `readDelay`.
- El callback es tratado de forma idempotente desde `ScratchReveal` para evitar repeticiones del mensaje.

### `src/components/Brush.ts`
- `drawBrush` produce trazos con `destination-out` y un gradiente radial para bordes suaves.
- Reutilizado por la animación programática final para replicar el efecto de rascado.

### `src/components/usePointer.ts`
- Ajustado para actualizar la posición del puntero solo cuando `isDrawing` es verdadero (clic/arrastre). Esto reduce falsos positivos del rascado por simples movimientos del cursor.

### `src/components/sections/inicio/InicioSection.astro`
- Pasa la prop `afterReveal={rostroVerdadero.src}` a `ScratchReveal` para que la imagen final esté disponible al completar el texto.

## Flujo de interacción actualizado (detallado)
1. El usuario realiza un trazo (clic + arrastrar) y se marca `userInteractedRef` cuando existe un movimiento significativo.
2. `scratchProgress` aumenta proporcionalmente a la distancia del trazo (`dist / 4500`).
3. Al alcanzar 100% y si el usuario interactuó: `isRevealed` se activa → aparece `ARIOMAN` (~1.4s) → aparece overlay de marketing → `TypewriterText` escribe el mensaje.
4. Al completarse el texto (`textComplete`): comienza la animación programática que revela `rostro-verdadero.jpg` con el mismo efecto de 'rascar'.

## Cómo probar (paso a paso)
1. Iniciar servidor de desarrollo:
```bash
cd c:\Users\ADMINSTRADOR\Documents\worship-saint\worship-saint
npm run dev
```
2. En el navegador (`http://localhost:4321`):
  - Rasca con clic + arrastrar (asegúrate de arrastrar unos cuantos píxeles para contar como interacción).
  - Observa la secuencia: `ARIOMAN` → overlay de marketing con texto más lento → animación final de revelado.

## Parámetros fáciles de ajustar
- Sensibilidad del rascado: modificar divisor `4500` en `ScratchReveal.tsx`.
- Duración animación final: variable `duration` en el bloque de animación programática (ahora 2600ms).
- Velocidad y espera del `TypewriterText`: `speed` y `readDelay` (actualmente `speed=80`, `readDelay=8000`).

## Notas y recomendaciones
- Si el mensaje se reproduce más de una vez, revisar que no se monte el componente dos veces (hydration o duplicado en layout). La lógica actual evita replays desde `ScratchReveal`, pero mounts extras pueden re-ejecutar la secuencia.
- Para una animación final más direccional (barrido), modificar la generación de coordenadas en el bucle de animación programática para seguir líneas horizontales o diagonales.

## Archivos modificados (lista final)
- `src/components/ScratchReveal.tsx`
- `src/components/TypewriterText.tsx`
- `src/components/Brush.ts` (reutilizado)
- `src/components/usePointer.ts`
- `src/components/sections/inicio/InicioSection.astro`

---

¿Quieres que también genere un changelog con diffs por archivo (PARCHEs listos para commit) o prefieres que actualice el `README.md` con este paso a paso? 
