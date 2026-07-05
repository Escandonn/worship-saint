# Contexto del proyecto Worship-Saint

## Resumen general
Este proyecto es un sitio web construido con Astro que usa componentes React para una experiencia de hero interactiva. El componente clave es `ScratchReveal.tsx`, que implementa un efecto de "rasca y gana" sobre una imagen de Doctor Doom / Iron Man y culmina con la carga de una imagen final tras la secuencia de texto.

## Objetivo de los cambios realizados
- Integrar un header con logo, nombre y navegación responsiva.
- Crear una experiencia de scratch reveal donde el usuario descubre el rostro oculto.
- Mostrar solo un overlay de texto persuasivo cuando se completa el rasgado.
- Cargar la imagen `rostro-verdadero.jpg` únicamente después de que el texto final haya terminado de escribirse.

## Archivos modificados

### `src/components/ScratchReveal.tsx`
- Añadida la prop opcional `afterReveal?: string` para reemplazar el fondo después de completar la secuencia de texto.
- Eliminado el título fijo del hero; ahora solo se muestra la navegación y el overlay de marketing.
- Ajustada la lógica de rascado para mayor sensibilidad (`dist / 4500`).
- Añadido el overlay de texto en la esquina superior derecha, con estilo de caja semitransparente.
- `TypewriterText` ahora llama a `setTextComplete(true)` al finalizar el texto.
- El cambio de imagen final se dispara solo después de `textComplete`.

### `src/components/TypewriterText.tsx`
- Corregida la lógica de animación para que no tenga errores de sintaxis.
- Añadido soporte para `onComplete` y un desvanecimiento posterior al texto.

### `src/components/sections/inicio/InicioSection.astro`
- Importa `rostro-verdadero.jpg` y lo pasa como `afterReveal={rostroVerdadero.src}`.
- Sigue usando `doctor-doom.jpg`, `doctor-doom-ojos-cerrados.jpg` y `tony.jpg` como capas iniciales.

## Flujo de interacción actual
1. `ScratchReveal` renderiza los canvas con Doctor Doom sobre Tony.
2. El usuario rasca la imagen con clic/arrastre.
3. Al alcanzar el 100% de progreso:
   - `setIsRevealed(true)` empieza la secuencia.
   - Aparece un overlay de texto en la esquina superior derecha.
   - Al terminar el tipo de texto, `textComplete` se vuelve verdadero.
   - Si `afterReveal` existe, se carga `rostro-verdadero.jpg` y se redibuja el canvas.
4. El header mantiene solo la navegación y cambia su estilismo según el estado revelado.

## Comportamiento clave
- La imagen final solo se carga después de que el texto del overlay haya terminado.
- Ya no hay textos centrales no deseados dentro del hero.
- El overlay de marketing se muestra en una caja con fondo oscuro y borde luminoso.

## Archivos relevantes
- `src/components/ScratchReveal.tsx`
- `src/components/TypewriterText.tsx`
- `src/components/usePointer.ts`
- `src/components/sections/inicio/InicioSection.astro`
- `src/assets/rostro-verdadero.jpg`

## Cómo probar
1. Desde el directorio del proyecto:

```bash
cd c:\Users\ADMINSTRADOR\Documents\worship-saint\worship-saint
npm run dev
```

2. Abrir `http://localhost:4321`.
3. Rascar la imagen principal y comprobar:
   - el overlay de texto aparece tras la revelación
   - el texto se escribe y permanece visible
   - la imagen `rostro-verdadero.jpg` carga solo después de que el texto termine

## Notas adicionales
- El build actual funciona correctamente después de la corrección en `TypewriterText.tsx`.
- Si se desea cambiar el mensaje final o la secuencia, editar el overlay dentro de `ScratchReveal.tsx`.
