# CONTEXT.md — Worship-Saint

> Documento de contexto técnico para IAs y desarrolladores. Léelo completo antes de modificar el hero.

## Qué es este proyecto
Landing page con un **hero interactivo de scratch reveal**. El usuario rasca una capa (Doctor Doom) para descubrir otra imagen (Tony Stark), ve un mensaje de marketing, y finalmente se revela una tercera imagen (rostro verdadero) con una transición animada. Todo sincrónico: **una sola cosa a la vez**.

## Stack
- **Astro** (páginas) + **React** (componentes interactivos) + **TypeScript**
- **Canvas 2D** para scratch, partículas y columnas laterales animadas
- **Tailwind** vía Astro/Vite para estilos base
- Sin frameworks de animación; se usa `requestAnimationFrame` + `setInterval` + CSS

## Estructura de archivos clave
```
src/
├── pages/index.astro                          # entrada, monta InicioSection
├── components/
│   ├── ScratchReveal.tsx                      # ⭐ componente principal del hero
│   ├── TypewriterText.tsx                     # texto tipo máquina de escribir
│   ├── Brush.ts                               # trazo destination-out (borrado)
│   ├── usePointer.ts                          # estado del puntero (drag real vs hover)
│   ├── Particles.ts                           # sistema de partículas del scratch
│   └── sections/inicio/InicioSection.astro    # composición del hero, pasa imágenes
├── assets/
│   ├── doctor-doom.jpg                        # foreground (capa superior, se raspa)
│   ├── doctor-doom-ojos-cerrados.jpg          # midground (transición 0-50%)
│   ├── tony.jpg                               # background (se revela al rascar)
│   └── rostro-verdadero.jpg                   # afterReveal (imagen final)
└── styles/global.css                          # tailwind + body bg #000
```

## Flujo de fases (sincrónico, una a la vez)
El componente `ScratchReveal` usa un estado `phase` (0-4) que controla toda la secuencia:

| Fase | Estado | Qué pasa | Duración |
|------|--------|----------|----------|
| 0 | `showHint` | Texto central "Rasca la imagen" con pulso | 2600ms → desaparece |
| 1 | scratch activo | Usuario rasca; `scratchProgress` 0→1 | hasta que progreso = 1 |
| 2 | `showMarketing` | Typewriter escribe mensaje de marketing | ~texto + 1800ms post-complete |
| 3 | transición final | Scratch programático revela `afterReveal` | 4200ms |
| 4 | `finalApplied` | Imagen final visible, experiencia completa | — |

**SKIP**: botón abajo-derecha (zIndex 60) que fuerza `phase=3`, `scratchProgress=1`, `isRevealed=true` y salta todo.

## Sistema de canvas (3 capas)
`ScratchReveal` maneja 3 canvases apilados:

1. **bgCanvasRef** — Tony (fondo fijo) + columnas laterales animadas (solo PC)
   - `drawSideColumns()`: gradientes rojo/dorado post-reveal, verde pre-reveal
   - Throttle ~30fps para columnas; solo redibuja cuando hay actividad
2. **scratchCanvasRef** — Doctor Doom (se borra con `destination-out`)
   - `drawBrush()` de `Brush.ts` hace el borrado con gradiente radial soft-edge
   - Entre 0-50% del progreso se superpone `midground` (ojos cerrados) con alpha creciente
3. **particlesCanvasRef** — partículas del scratch
   - `ParticleSystem` de `Particles.ts`; emite según velocidad del puntero
   - Early-return si no hay partículas (optimización INP)

## Optimizaciones de rendimiento (INP)
El render loop (`renderLoop` en ScratchReveal) está optimizado para no redibujar en idle:
- **Skip en idle**: si no hay dibujo, partículas ni necesidad de redraw, el frame se salta
- **Throttle de columnas**: ~30fps (33ms) en vez de 60fps
- **Partículas reducidas**: `speed/6`, máx 3 por emisión, probabilidad 0.7
- **`Particles.updateAndDraw`**: early-return si `particles.length === 0`, usa `clientWidth/clientHeight`
- **Clear condicional** del canvas de partículas

## Paleta de colores
**Pre-reveal (verde Doom):**
- Fondo: `#030a03` · Columnas: `#0a2a2a` / `#2a6a2a` · Accent: `#00ff88`

**Post-reveal (rojo/dorado Iron Man):**
- Fondo: `#3a0808` · Columnas: `#5C0000` / `#D4AF37` · Accent: `#FFD700`
- Overlay dorado con shimmer animado (opacidad 0.12 + pulse)

## Tipografía
- **Cinzel** (serif) — títulos, labels, hint, marketing, skip
- **Lora** (serif italic) — texto del typewriter

## Props de ScratchReveal
```tsx
<ScratchReveal
  foreground={doctorDoom.src}        // capa superior (se raspa)
  midground={doctorDoomClosed.src}   // transición ojos (0-50% progreso)
  background={tony.src}              // imagen revelada al rascar
  afterReveal={rostroVerdadero.src} // imagen final (transición programática)
  brushSize={140}                    // tamaño del pincel
/>
```

## Parámetros ajustables (ubicaciones exactas)
| Parámetro | Archivo | Qué buscar |
|-----------|---------|------------|
| Duración hint inicial | `ScratchReveal.tsx` | `setTimeout(..., 2600)` en fase 0 |
| Sensibilidad scratch | `ScratchReveal.tsx` | `dist / 4500` (divisor mayor = más lento) |
| Delay marketing | `ScratchReveal.tsx` | `setTimeout(() => setShowMarketing(true), 400)` |
| Speed typewriter | `ScratchReveal.tsx` | `speed={42}` en TypewriterText |
| Read delay typewriter | `ScratchReveal.tsx` | `readDelay={6500}` |
| Delay post-complete | `ScratchReveal.tsx` | `setTimeout(..., 1800)` en onComplete |
| Duración transición final | `ScratchReveal.tsx` | `const duration = 4200` |
| Tamaño pincel | `InicioSection.astro` | `brushSize={140}` |
| Colores columnas | `ScratchReveal.tsx` | `drawSideColumns()` líneas ~30-40 |
| Throttle columnas | `ScratchReveal.tsx` | `COL_THROTTLE = 33` |

## Cómo probar
```bash
cd worship-saint
npm install
npm run dev
# → http://localhost:4321
```
Interactuar: clic + arrastrar para rascar. Botón "Saltar" abajo-derecha para skip.

## Reglas críticas para modificaciones
1. **No redibujar en idle** — el render loop debe respetar el flag `needsRedraw` y los early-returns
2. **Una fase a la vez** — no mostrar hint + marketing + scratch simultáneamente
3. **`userInteractedRef`** debe ser true antes de revelar (evita reveals automáticos por hover)
4. **Limpiar timers** en `handleSkip` y en cleanup de effects (`timersRef.current`)
5. **`finalRevealRunningRef`** previene que la transición final se dispare dos veces
6. **`finalBgAppliedRef`** evita redibujar el foreground tras aplicar la imagen final
7. **DPR** — los canvases usan `devicePixelRatio`; respetar `setTransform(dpr,...)` al dibujar
8. **Móvil** — sin columnas laterales (`if (!mobile)`); hint/marketing usan `mobileHeader`

## Estado actual
✅ Funcional: fases sincrónicas, skip, hint, marketing, transición final, columnas rojo-dorado, optimización INP
🔄 Pendiente: validar INP tras optimizaciones (<304ms objetivo)
