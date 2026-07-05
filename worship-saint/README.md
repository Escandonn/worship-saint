# Worship-Saint

Worship-Saint es un sitio web interactivo construido con Astro y componentes React. El hero principal usa un efecto de scratch reveal para que el usuario descubra una imagen oculta al rascar la capa superior.

## Características principales

- Hero interactivo con canvas y scratch reveal
- Carga condicional de imagen final después de completar el texto del overlay
- Overlay de marketing estilizado en la esquina superior derecha
- Navegación responsive con menú móvil
- Lógica de revelado sensible a clic/arrastre

## Estructura del proyecto

- `src/components/ScratchReveal.tsx` — componente principal del efecto scratch y los overlays
- `src/components/TypewriterText.tsx` — animación de texto tipo máquina de escribir
- `src/components/usePointer.ts` — gestión de puntero para el scratch
- `src/components/sections/inicio/InicioSection.astro` — sección hero configurada con las imágenes y props
- `src/assets/rostro-verdadero.jpg` — imagen final que aparece tras completar el texto

## Cómo ejecutar

```bash
cd c:\Users\ADMINSTRADOR\Documents\worship-saint\worship-saint
npm install
npm run dev
```

Abre `http://localhost:4321` en tu navegador.

## Cómo probar la interacción

1. Ve al hero principal.
2. Rasca la imagen con el cursor o el dedo (si usas pantalla táctil).
3. Espera a que aparezca el overlay de texto en la esquina superior derecha.
4. Una vez que el texto termine de escribirse, se cargará la imagen final `rostro-verdadero.jpg`.

## Scripts útiles

- `npm run dev` — iniciar servidor de desarrollo
- `npm run build` — generar build de producción
- `npm run preview` — previsualizar el build

## Nota

El proyecto ya está configurado para que la imagen final solo se reemplace cuando el texto persuasivo del overlay ha terminado de escribirse, evitando cambios de imagen prematuros.
