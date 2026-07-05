# Contexto del proyecto Worship-Saint

## Resumen general
Este proyecto es un sitio web construido con Astro que usa componentes React para una experiencia de hero interactiva. El componente clave es `ScratchReveal.tsx`, que implementa un efecto de "rasca y gana" sobre una imagen de Doctor Doom / Iron Man.

## Objetivo de los cambios realizados
- Integrar un header con logo, nombre y enlaces de navegación.
- Añadir una secuencia de revelado visual donde:
  1. Aparece primero el texto del título inicial.
  2. Aparece un texto centrado sobre el rostro de Arioman.
  3. Después se muestra un segundo mensaje persuasivo.
  4. Finalmente se cambia la imagen de fondo a `rostro-verdadero.jpg`.
- Mejorar la sensibilidad del rascado para que el usuario pueda interactuar con clic/arrastre sin necesidad de arrastrar mucho.

## Archivos modificados

### `src/components/ScratchReveal.tsx`
Este archivo contiene el componente principal de scratch reveal.

Cambios principales:
- Añadida la prop opcional `afterReveal?: string` para cargar una imagen adicional luego de la secuencia de texto.
- Añadido `useRef` para exponer `initCanvas` (`initCanvasRef`) y poder redibujar el canvas cuando se reemplaza la imagen de fondo.
- Ajustada la lógica de rascado para mayor sensibilidad:
  - El progreso ahora usa `dist / 4500` en vez de `dist / 8000`.
- Añadido un efecto `useEffect` que:
  - muestra primero `Arioman` como overlay central cuando se completa la revelación,
  - luego muestra un segundo overlay con texto persuasivo,
  - y carga `afterReveal` si se pasa.
- Cambiado el texto de la segunda capa a:
  - `Descubre quién se esconde detrás del casco`.
- Implementada una animación de header con tema visual dependiente de `isRevealed`.
- Añadida lógica de menú móvil y responsive en el header.

### `src/components/usePointer.ts`
Este archivo gestiona el seguimiento del puntero.

Cambios principales:
- Ajustado `handlePointerMove` para que solo actualice cuando `isDrawing` es verdadero.
- Esto evita que el cursor se considere rascado solo por pasar encima, y mejora la interacción de clic/arrastre.

### `src/components/sections/inicio/InicioSection.astro`
Este archivo instancia el componente `ScratchReveal` y pasa las imágenes.

Cambios principales:
- Añadida la importación de `rostro-verdadero.jpg`.
- Añadida la prop `afterReveal={rostroVerdadero.src}` a `<ScratchReveal />`.
- Se mantiene la imagen inicial de fondo `tony.jpg`, el foreground `doctor-doom.jpg` y el midground `doctor-doom-ojos-cerrados.jpg`.

## Flujo de la interacción actual
1. El componente renderiza un canvas con la imagen de Doctor Doom sobre la imagen de Tony.
2. El usuario rasca con el puntero.
3. Cuando el progreso alcanza el 100%:
   - `setIsRevealed(true)` dispara la secuencia de overlays.
   - Aparece `Arioman` en el centro.
   - Tras 1.4s, aparece el mensaje persuasivo.
   - Si hay una imagen `afterReveal`, se carga y reemplaza el fondo.
4. El header cambia su estilo y aparece con la paleta de Iron Man / Doctor Doom.

## Recomendaciones para futuras actualizaciones
- Si se desea otra secuencia de mensajes, editar `showFaceOverlay` y `showNextOverlay` en `ScratchReveal.tsx`.
- Para cambiar la imagen final, actualice el valor de `afterReveal` en `InicioSection.astro`.
- Si se quiere una experiencia aún más suave, ajuste el divisor de sensibilidad (`4500`) en el cálculo del progreso.
- Si se busca un overlay con texto más largo o animado, se puede reemplazar los bloques JSX de overlay en `ScratchReveal.tsx` con componentes separados.

## Archivos relevantes
- `src/components/ScratchReveal.tsx` — componente principal de scratch reveal y overlays.
- `src/components/usePointer.ts` — gestión de puntero y detección de arrastre.
- `src/components/sections/inicio/InicioSection.astro` — configuración de imágenes y props para la sección hero.
- `src/assets/rostro-verdadero.jpg` — imagen final de revelado.

## Cómo probar
1. Iniciar el servidor de desarrollo desde el directorio raíz del proyecto:

```bash
cd c:\Users\ADMINSTRADOR\Documents\worship-saint\worship-saint
npm run dev
```

2. Abrir el navegador en `http://localhost:4321`.
3. Rascar sobre la imagen principal y observar:
   - texto central `Arioman`
   - texto posterior `Descubre quién se esconde detrás del casco`
   - carga de `rostro-verdadero.jpg` como fondo final.

---

Este archivo está pensado para que una IA pueda entender rápidamente el propósito, flujo de interacción y puntos de modificación de cada componente clave.