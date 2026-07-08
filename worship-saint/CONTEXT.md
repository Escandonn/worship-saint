# CONTEXT.md — Worship-Saint

> Documento de contexto técnico para IAs y desarrolladores. Léelo completo antes de modificar cualquier componente del hero.

---

## Qué es este proyecto

Landing page con un **hero interactivo de scratch reveal** que guía al usuario a través de una secuencia dramática de 5 fases. El usuario raspa una capa (Doctor Doom) para descubrir otra imagen (Tony Stark), ve un mensaje de marketing, y finalmente se revela una tercera imagen (rostro verdadero) con una transición animada. Al final, aparece **Bill** — un personaje guía que explica la propuesta de valor.

**Todo es sincrónico: una sola cosa a la vez.**

---

## Stack

- **Astro** (páginas) + **React** (componentes interactivos) + **TypeScript**
- **Canvas 2D** para scratch, partículas y columnas laterales animadas
- **Tailwind** vía Astro/Vite para estilos base
- Sin frameworks de animación; se usa `requestAnimationFrame` + `setInterval` + `setTimeout` + CSS

---

## Estructura de archivos

```
src/
├── pages/index.astro                              # entrada, monta InicioSection
├── components/
│   ├── ScratchReveal.tsx                          # ⭐ componente principal (ORQUESTADOR)
│   ├── TypewriterText.tsx                         # texto tipo máquina de escribir
│   ├── Brush.ts                                   # trazo destination-out (borrado)
│   ├── usePointer.ts                              # estado del puntero (drag real vs hover)
│   ├── Particles.ts                               # sistema de partículas del scratch
│   ├── NavBar.tsx                                 # navbar de la página completa
│   ├── HeroSection.astro                          # sección hero de la página
│   ├── AIServiceCard.tsx                          # tarjeta de servicio IA
│   │
│   ├── scratch/                                   # ⭐ SUB-MÓDULO: componentes internos del hero
│   │   ├── types.ts                               # tipos, constantes de timing, paleta, utilidades
│   │   ├── canvasRenderer.ts                     # hook useCanvasRenderer (canvas + render loop)
│   │   ├── Header.tsx                             # header/navbar del hero (sincronizado con tema)
│   │   ├── PhaseOverlays.tsx                      # hint, marketing typewriter, skip button
│   │   └── BillSequence.tsx                       # secuencia de Bill (personaje guía)
│   │
│   └── sections/inicio/InicioSection.astro        # composición del hero, pasa imágenes + Bill
│
├── assets/
│   ├── doctor-doom.jpg                            # foreground (capa superior, se raspa)
│   ├── doctor-doom-ojos-cerrados.jpg              # midground (transición 0-50% progreso)
│   ├── tony.jpg                                   # background (Tony Stark, se revela al rascar)
│   ├── rostro-verdadero.jpg                       # afterReveal (imagen final, transición programática)
│   ├── bill.jpg                                   # Bill frame 1 (esquina inferior derecha)
│   ├── bill-2.jpg                                 # Bill frame 2 (animación de movimiento)
│   └── bill_cetral.png                            # Bill central (centro inferior)
│
└── styles/global.css                              # tailwind + body bg #000
```

---

## Arquitectura: ScratchReveal como orquestador

`ScratchReveal.tsx` es el componente principal que orquesta todo. Delega responsabilidad a sub-componentes:

| Sub-componente | Responsabilidad |
|---|---|
| `scratch/Header` | Navbar sincronizado con tema (verde↔rojo/dorado) |
| `scratch/PhaseOverlays` | Hint, typewriter marketing, botón Saltar |
| `scratch/BillSequence` | Bill personaje + burbujas de diálogo |
| `scratch/canvasRenderer` | Hook useCanvasRenderer (canvas + render loop) |
| `Brush.ts` | Dibujar trazo de borrador con `destination-out` |
| `Particles.ts` | Sistema de partículas emitadas al rascar |
| `usePointer.ts` | Detectar drag real vs hover |

**`scratch/types.ts`** exporta `TIMING`, `COLORS`, `getColors()`, `getTransform()`, `drawSideColumns()`, `computeAverageColor()`. Se importan en los sub-componentes. `ScratchReveal.tsx` importa `drawSideColumns` directamente desde `scratch/types` (además de sus copias inline) para usarla en `handleSkip` y pintar las paredes con colores post-reveal al saltar.

### `getTransform()` — ajuste de imagen al canvas

```ts
// types.ts — la imagen llena el 100% de la altura del canvas, anclada arriba (y=0)
function getTransform(canvasW, canvasH, imgW, imgH) {
  const scale = canvasH / imgH;       // escala para cubrir toda la altura
  const w = imgW * scale;
  const h = imgH * scale;             // = canvasH
  return { x: (canvasW - w) / 2, y: 0, scale };
}
```

- **Altura completa**: `y=0`, `h=canvasH` — no queda espacio vacío en la parte inferior
- **Centrado horizontal**: `x=(canvasW-w)/2` — si la imagen es más angosta que el canvas, se centra
- **Paredes laterales**: `drawSideColumns()` rellena el espacio restante a izquierda y derecha con los colores de personaje (verde pre-reveal, rojo/dorado post-reveal)

---

## Flujo de fases (sincrónico, una a la vez)

El componente `ScratchReveal` usa un estado `phase` (0-4) que controla toda la secuencia:

| Fase | Estado | Qué pasa | Duración / Trigger |
|------|--------|----------|---------------------|
| 0 | `showHint` | Texto central "Rasca la imagen" con pulso | 2600ms → desaparece automáticamente |
| 1 | scratch activo | Usuario rasca; `scratchProgress` 0→1 | hasta que `dist / 4500 = 1` |
| 2 | `showMarketing` | Typewriter escribe mensaje de marketing | ~texto + 6500ms lectura + 1800ms fade |
| 3 | transición final | Rascado programático revela `afterReveal` | 5200ms con easing (ráfagas crecientes de trazos) |
| 4 | `finalApplied` | Imagen final visible → aparece Bill | — |

**SKIP:** botón "Saltar" aparece tras 800ms del hint, abajo-centro. Visible hasta que `finalApplied=true` (condición: `skipVisible && !skipped && !finalApplied`). Al pulsar, `handleSkip` carga `afterReveal`, dibuja fondo rojo (`#3a0808`) en toda la canvas, dibuja la imagen final centrada con `getTransform()` (100% altura, `y=0`), pinta las paredes laterales con colores post-reveal usando `drawSideColumns(ctx, w, h, imgLeft, imgRight, true, ...)` (isRevealed=true → rojo/dorado), limpia el scratch canvas y dispara `setFinalApplied(true)`. Esto garantiza que las paredes transicionen de verde a rojo/dorado instantáneamente al saltar, sin modificar el render loop.

---

## Secuencia de Bill (fase 4+)

Cuando `finalApplied=true` y hay `billImage`, se dispara una secuencia animada:

```
t=300ms   → Bill aparece (esquina inferior derecha, slide-up animado)
t=1400ms  → Burbuja de diálogo de Bill: "¡Hola! Soy Bill y soy la que te explicará todo"
t=2000ms  → Bill Central aparece (centro inferior, slide-up)
t=3700ms  → Burbuja de Bill Central: "¡Worship es una entidad de estudio que desarrolla
             páginas web y software de calidad."
```

Bill corner alterna entre `billImage` y `billImage2` cada 500ms para dar sensación de movimiento.

---

## Sistema de canvas (3 capas)

`ScratchReveal` maneja 3 canvases apilados (z-index implícito por orden):

1. **bgCanvasRef** — Tony (fondo fijo) + columnas laterales animadas (solo PC, `innerWidth >= 768`)
   - `drawSideColumns()`: gradientes rojo/dorado post-reveal, verde pre-reveal; rellena TODO el espacio restante (leftW = imgLeft, rightW = canvasW - imgRight)
   - Ornamentos verticales punteados animados con `Math.sin`
   - Overlay dorado con shimmer animado
   - Throttle ~30fps (`COL_THROTTLE = 33ms`)
   - Solo redibuja cuando hay actividad (`needsRedrawRef`)
   - **Tras `finalApplied`**: el render loop deja de redibujar el bg original (condición `!finalBgAppliedRef.current`), la imagen final queda fija
   - **En `handleSkip`**: se dibuja directamente sobre `bgCtx` — fondo rojo + imagen final + `drawSideColumns(isRevealed=true)` — sin depender del render loop

2. **scratchCanvasRef** — Doctor Doom (se borra con `destination-out`)
   - `drawBrush()` de `Brush.ts` hace el borrado con gradiente radial soft-edge
   - Entre 0-50% del progreso se superpone `midground` (ojos cerrados) con alpha creciente
   - Al final de fase 3, se usan ráfagas de trazos programáticos para revelar `afterReveal`

3. **particlesCanvasRef** — partículas del scratch
   - `ParticleSystem` de `Particles.ts`; emite según velocidad del puntero
   - Early-return si `particles.length === 0` (optimización INP)

---

## Props de ScratchReveal

```tsx
<ScratchReveal
  foreground={doctorDoom.src}        // capa superior (se raspa) — Doctor Doom ojos abiertos
  midground={doctorDoomClosed.src}   // transición ojos cerrados (0-50% progreso)
  background={tony.src}              // imagen revelada al rascar — Tony Stark
  afterReveal={rostroVerdadero.src} // imagen final (transición programática fase 3)
  billImage={bill.src}               // Bill personaje — esquina inferior derecha
  billImage2={bill2.src}            // Bill frame 2 — alternancia para animación
  billCentralImage={billCentral.src} // Bill central — centro inferior
  brushSize={140}                    // tamaño del pincel en px
/>
```

---

## Paleta de colores completa

### Pre-reveal (verde Doom)
| Token | Valor | Uso |
|-------|-------|-----|
| `PRE_BG` | `#030a03` | Fondo |
| `PRE_BG2` | `#0a2a0a` | Columnas (primary) |
| `PRE_ACCENT` | `#00ff88` | Acentos, bordes, texto glow |
| `PRE_TEXT` | `#C7FFCD` | Texto del header |
| `PRE_LINK` | `#D4FFD6` | Links del nav |
| `PRE_BORDER` | `rgba(80,200,80,0.25)` | Bordes del header |
| `PRE_GLOW` | `0 4px 32px rgba(0,100,0,0.3)` | Box-shadow del header |
| `PRE_HEADER_BG` | `rgba(4,28,4,0.88)` | Header backdrop |
| `PRE_HINT_BG` | `rgba(3,10,3,0.82)` | Hint backdrop |

### Post-reveal (rojo/dorado Iron Man)
| Token | Valor | Uso |
|-------|-------|-----|
| `POST_BG` | `#3a0808` | Fondo |
| `POST_PRIMARY` | `#5C0000` | Columnas (primary) |
| `POST_SECONDARY` | `#D4AF37` | Columnas (secondary) |
| `POST_ACCENT` | `#D4AF37` | Acentos, bordes |
| `POST_TEXT` | `#F5E2A0` | Texto del header |
| `POST_LINK` | `#F7E18C` | Links del nav |
| `POST_BORDER` | `rgba(212,175,55,0.45)` | Bordes del header |
| `POST_GLOW` | `0 4px 32px rgba(200,0,0,0.35)` | Box-shadow del header |
| `POST_HEADER_BG` | `rgba(120,8,8,0.88)` | Header backdrop |
| `POST_HINT_BG` | `rgba(26,5,5,0.88)` | Hint backdrop |

### Sweep animation
| Token | Valor |
|-------|-------|
| `SWEEP_PRE_1` | `#9CFFB8` |
| `SWEEP_PRE_2` | `#FFFFFF` |
| `SWEEP_POST_1` | `#FFD27A` |
| `SWEEP_POST_2` | `#FFFFFF` |

---

## Constantes de timing (en `scratch/types.ts`)

```ts
export const TIMING = {
  HINT_FADE: 800,            // duración del hint antes de desaparecer
  MARKETING_DELAY: 1200,      // delay antes de mostrar marketing (tras textComplete)
  MARKETING_READ: 6500,       // delay de lectura del typewriter
  MARKETING_FADE: 1800,       // fade out del texto marketing
  FINAL_ANIM: 600,            // duración de la animación final
  SKIP_FADE: 300,             // fade out del botón skip
  BILL_SHOW: 300,             // cuándo aparece Bill tras finalApplied
  BILL_BUBBLE: 1400,          // cuándo aparece burbuja de Bill
  BILL_CENTRAL_SHOW: 2000,   // cuándo aparece Bill central tras burbuja Bill
  BILL_CENTRAL_BUBBLE: 3700, // cuándo aparece burbuja de Bill central
  BILL_FRAME_INTERVAL: 500,  // alternancia de frames de Bill (ms)
  SCRATCH_TOTAL_DIST: 4500,  // distancia total para revelar (px) — divisor en scratchProgress
  COL_THROTTLE: 33,          // throttle columnas (~30fps)
} as const;
```

**Timing adicional en ScratchReveal.tsx (inline, no en types.ts):**
| Constante | Valor | Ubicación |
|-----------|-------|-----------|
| Hint duration | 2600ms | `useEffect` fase 0 |
| Marketing delay | 400ms | `useEffect` isRevealed |
| Marketing typewriter speed | 28 | `<TypewriterText speed={28}>` |
| Final reveal duration | 5200ms | `const duration = 5200` en effect textComplete (con easing `p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2`) |
| Final reveal strokes | `4 + eased*44` | `Math.floor(4 + eased * 44)` en effect textComplete |
| Header visible delay | 1700ms | `setTimeout(..., 1700)` en useEffect inicial |
| Skip button show | 800ms | `setTimeout(..., 800)` en PhaseOverlays |

---

## Parámetros ajustables (ubicaciones exactas)

| Parámetro | Archivo | Qué buscar |
|-----------|---------|------------|
| Duración hint | `ScratchReveal.tsx` | `setTimeout(..., 2600)` en fase 0 |
| Sensibilidad scratch | `scratch/types.ts` | `SCRATCH_TOTAL_DIST: 4500` (divisor mayor = más lento) |
| Delay marketing | `ScratchReveal.tsx` | `setTimeout(..., 400)` en isRevealed effect |
| Speed typewriter | `ScratchReveal.tsx` | `speed={28}` en TypewriterText |
| Read delay typewriter | `scratch/types.ts` | `MARKETING_READ: 6500` |
| Delay post-complete | `scratch/types.ts` | `MARKETING_FADE: 1800` |
| Duración transición final | `ScratchReveal.tsx` | `const duration = 5200` (con easing) |
| Strokes transición final | `ScratchReveal.tsx` | `Math.floor(4 + eased * 44)` |
| Paredes en handleSkip | `ScratchReveal.tsx` | `drawSideColumns(bgCtx, w, h, imgLeft, imgRight, true, ...)` en `newBg.onload` |
| Tamaño pincel | `InicioSection.astro` | `brushSize={140}` |
| Colores columnas | `ScratchReveal.tsx` | `drawSideColumns()` líneas ~40-100 |
| Throttle columnas | `scratch/types.ts` | `COL_THROTTLE: 33` |
| Timing Bill | `scratch/types.ts` | `TIMING.BILL_*` |
| Paleta completa | `scratch/types.ts` | `COLORS` object |

---

## Header / NavBar (scratch/Header.tsx)

El header del hero se sincroniza con el estado de reveal:

- **Pre-reveal**: fondo verde oscuro, texto verde, borde verde, glow verde
- **Post-reveal**: fondo rojo oscuro, texto dorado, borde dorado, glow rojo
- **Transición**: `transition: background-color 1.2s ease, box-shadow 1.2s ease, border-color 1.2s ease`
- **Sweep animation**: texto "Worship-Saint" y "Estudio de impacto" tienen una barra que barre de izquierda a derecha al aparecer (`sweepLR` 1.6s)
- **Mobile**: hamburger menu con estado `menuOpen`
- **Visible**: aparece tras 1700ms del mount (`headerVisible`)

Links de navegación: Inicio, Nuestras obras, Quiénes somos, Servicios.

---

## PhaseOverlays (scratch/PhaseOverlays.tsx)

Tres elementos renderizados condicionalmente:

1. **Hint** (`showHint`): texto "Rasca la imagen" + svg de estrella, centrado, `hintPulse` animation 2.4s, `pointerEvents: none`
2. **Marketing** (`showMarketing`): `<TypewriterText>` con mensaje de marketing, posicionado abajo-centro
3. **Skip button** (`skipVisible && !skipped && !finalApplied`): aparece 800ms tras hint, permanece visible hasta que `finalApplied=true`, fade-out animado al hacer skip. Recibe prop `finalApplied` desde `ScratchReveal`.

---

## BillSequence (scratch/BillSequence.tsx)

Secuencia de dos personajes Bill con burbujas de diálogo:

- **Bill corner** (esquina inferior derecha): aparece con `billSlideIn` (0.7s cubic-bezier), alterna entre `billImage` y `billImage2` cada 500ms
- **Burbuja Bill**: `bubblePopIn` + `bubbleFloat` (3s infinite), cola de nube, texto: "¡Hola! Soy Bill y soy la que te explicará todo"
- **Bill central** (centro inferior): aparece con `billSlideIn` (0.8s), más pequeño que Bill corner
- **Burbuja Bill central**: texto centrado: "¡Worship es una entidad de estudio que desarrolla páginas web y software de calidad."

Todo con `pointerEvents: none`. Requiere `finalApplied=true` y `billImage` para renderizar.

---

## Optimizaciones de rendimiento (INP)

El render loop está optimizado para no redibujar en idle:

- **Skip en idle**: si no hay dibujo, partículas ni necesidad de redraw, el frame se salta
- **Throttle de columnas**: ~30fps (`COL_THROTTLE = 33ms`)
- **Partículas reducidas**: `speed/6`, máx 3 por emisión, probabilidad 0.7
- **`Particles.updateAndDraw`**: early-return si `particles.length === 0`
- **Clear condicional** del canvas de partículas
- **DPR**: los canvases usan `devicePixelRatio`; se respeta `setTransform(dpr,...)` al dibujar

---

## Tipografía

- **Cinzel** (serif) — títulos, labels, hint, marketing, skip, header, nav, Bill bubbles
- **Lora** (serif italic) — texto del typewriter (definido en TypewriterText.tsx)

---

## Cómo probar

```bash
cd worship-saint
npm install
npm run dev
# → http://localhost:4321
```

Interactuar: clic + arrastrar para rascar. Botón "Saltar" abajo-centro para skip.

---

## Reglas críticas para modificaciones

1. **No redibujar en idle** — el render loop debe respetar `needsRedrawRef` y los early-returns
2. **Una fase a la vez** — no mostrar hint + marketing + scratch simultáneamente
3. **`userInteractedRef`** debe ser `true` antes de revelar (evita reveals automáticos por hover)
4. **Limpiar timers** en `handleSkip` y en cleanup de effects (`timersRef.current`)
5. **`finalRevealRunningRef`** previene que la transición final se dispare dos veces
6. **`finalBgAppliedRef`** evita redibujar el foreground tras aplicar la imagen final — el render loop tiene `!finalBgAppliedRef.current` en la condición de dibujo del bg
7. **`handleSkip` dibuja paredes post-reveal** — al saltar, `handleSkip` pinta fondo rojo + imagen final + `drawSideColumns(isRevealed=true)` directamente en `bgCtx` antes de `setFinalApplied(true)`. No modifica el render loop.
8. **DPR** — los canvases usan `devicePixelRatio`; respetar `setTransform(dpr,...)` al dibujar
9. **Móvil** (`innerWidth < 768`) — sin columnas laterales; hint/marketing adaptados con `mobileHeader`
10. **Bill requiere `billImage`** — `BillSequence` retorna `null` si no hay imagen
11. **Sincronización tema** — `Header` recibe `isRevealed` y `getColors()` para cambiar paleta
12. **`getTransform()` llena 100% altura** — `y=0`, `scale=canvasH/imgH`; no queda espacio vacío inferior. Las paredes laterales rellenan el resto.
13. **Skip button usa `finalApplied`** — condición `skipVisible && !skipped && !finalApplied`; el botón permanece visible hasta que la imagen final está aplicada

---

## Estado actual

✅ Funcional: 5 fases sincrónicas, skip, hint, marketing typewriter, transición final programática (5200ms con easing), columnas rojo-dorado animadas, sweep text, Bill secuencia completa (corner + central + burbujas), header sincronizado, optimización INP, mobile responsive
✅ Imagen llena 100% de la altura del canvas (`getTransform` con `y=0`, `scale=canvasH/imgH`) — sin espacio vacío inferior
✅ Imagen final permanece fija tras `finalApplied` (render loop deja de redibujar bg original vía `!finalBgAppliedRef.current`)
✅ Skip button visible hasta `finalApplied` (condición `skipVisible && !skipped && !finalApplied`)
✅ `handleSkip` dibuja paredes con colores post-reveal (rojo/dorado) directamente en canvas antes de `setFinalApplied` — transición verde→rojo instantánea al saltar
✅ `canvasRenderer.ts` sin modificaciones (estado original, sincronización intacta)
🔄 Pendiente: validar INP tras optimizaciones (<304ms objetivo)
