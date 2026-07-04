import React, { useEffect, useRef, useState } from 'react';
import { usePointer } from './usePointer';
import { drawBrush } from './Brush';
import { ParticleSystem } from './Particles';

interface ScratchRevealProps {
  foreground: string;       // Doom ojos abiertos
  midground: string;        // Doom ojos cerrados (transición)
  background: string;       // Tony / Iron Man
  brushSize?: number;
}

/** Escala identica para todas las imágenes — object-contain PC / object-cover móvil */
function getTransform(imgW: number, imgH: number, w: number, h: number, mobile: boolean) {
  const scale = mobile ? Math.max(w / imgW, h / imgH) : Math.min(w / imgW, h / imgH);
  return { scale, x: w / 2 - (imgW / 2) * scale, y: h / 2 - (imgH / 2) * scale };
}

/** Dibuja columnas laterales con gradiente temático en el bgCanvas */
function drawSideColumns(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  imgX: number,       // borde izq de la imagen
  imgRight: number,   // borde der de la imagen
  isRevealed: boolean,
  t: number           // tiempo animación 0-∞
) {
  const colW = Math.max(0, imgX); // ancho de cada columna lateral
  if (colW < 2) return;           // en móvil no hay espacio

  // Colores temáticos
  const primary   = isRevealed ? '#8B0000' : '#0a2a0a'; // rojo Doom/verde Doom
  const secondary = isRevealed ? '#D4AF37' : '#2a6a2a';
  const accent    = isRevealed ? '#FF4500' : '#00ff88';

  // Pulso animado (sin CSS, solo con Math.sin)
  const pulse = 0.15 + 0.08 * Math.sin(t * 0.002);

  // Columna IZQUIERDA
  const gl = ctx.createLinearGradient(0, 0, colW, 0);
  gl.addColorStop(0,    primary);
  gl.addColorStop(0.55, secondary);
  gl.addColorStop(1,    'transparent');
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, colW, h);

  // Línea de borde luminosa — izquierda
  const elBorder = ctx.createLinearGradient(0, 0, 0, h);
  elBorder.addColorStop(0,   'transparent');
  elBorder.addColorStop(0.5, accent);
  elBorder.addColorStop(1,   'transparent');
  ctx.globalAlpha = 0.6 + pulse;
  ctx.fillStyle = elBorder;
  ctx.fillRect(colW - 2, 0, 2, h);

  // Ornamentos verticales punteados — izquierda
  ctx.globalAlpha = 0.35 + pulse;
  ctx.fillStyle = accent;
  for (let y = 20; y < h; y += 30) {
    const r = 2 + 1.5 * Math.abs(Math.sin(y * 0.05 + t * 0.003));
    ctx.beginPath();
    ctx.arc(colW * 0.35, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Columna DERECHA (espejo)
  const gr = ctx.createLinearGradient(imgRight, 0, w, 0);
  gr.addColorStop(0,    'transparent');
  gr.addColorStop(0.45, secondary);
  gr.addColorStop(1,    primary);
  ctx.globalAlpha = 1;
  ctx.fillStyle = gr;
  ctx.fillRect(imgRight, 0, w - imgRight, h);

  // Línea de borde luminosa — derecha
  const erBorder = ctx.createLinearGradient(0, 0, 0, h);
  erBorder.addColorStop(0,   'transparent');
  erBorder.addColorStop(0.5, accent);
  erBorder.addColorStop(1,   'transparent');
  ctx.globalAlpha = 0.6 + pulse;
  ctx.fillStyle = erBorder;
  ctx.fillRect(imgRight, 0, 2, h);

  // Ornamentos verticales punteados — derecha
  ctx.globalAlpha = 0.35 + pulse;
  ctx.fillStyle = accent;
  for (let y = 20; y < h; y += 30) {
    const r = 2 + 1.5 * Math.abs(Math.sin(y * 0.05 + t * 0.003 + 1.5));
    ctx.beginPath();
    ctx.arc(imgRight + (w - imgRight) * 0.65, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1; // reset
}

export default function ScratchReveal({
  foreground,
  midground,
  background,
  brushSize = 140,
}: ScratchRevealProps) {
  const containerRef     = useRef<HTMLDivElement>(null);
  const bgCanvasRef      = useRef<HTMLCanvasElement>(null);  // Tony (fondo fijo)
  const scratchCanvasRef = useRef<HTMLCanvasElement>(null);  // Doom (se raspa)
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);

  const pointerState   = usePointer(containerRef);
  const particleSystem = useRef(new ParticleSystem());
  const rafId          = useRef<number | null>(null);
  const startTime      = useRef<number>(0); // para animación columnas
  const lastTime       = useRef<number>(0);

  // Distancia rascada — porcentaje de revelación 0..1
  const scratchProgress = useRef(0);       // 0 = Doom abierto, 1 = Tony
  const isRevealedRef   = useRef(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Imágenes pre-cargadas — guardadas en ref para acceso desde el loop
  const imgsRef = useRef<{
    bg: HTMLImageElement | null;
    fg: HTMLImageElement | null;
    mid: HTMLImageElement | null;
  }>({ bg: null, fg: null, mid: null });

  // Bounding box de la imagen (para columnas)
  const imgBoundsRef = useRef({ x: 0, right: 0, w: 0, h: 0 });

  useEffect(() => {
    const container      = containerRef.current;
    const bgCanvas       = bgCanvasRef.current;
    const scratchCanvas  = scratchCanvasRef.current;
    const particlesCanvas= particlesCanvasRef.current;
    if (!container || !bgCanvas || !scratchCanvas || !particlesCanvas) return;

    const bgCtx       = bgCanvas.getContext('2d',       { alpha: false });
    const scratchCtx  = scratchCanvas.getContext('2d',  { alpha: true  });
    const particlesCtx= particlesCanvas.getContext('2d',{ alpha: true  });
    if (!bgCtx || !scratchCtx || !particlesCtx) return;

    let loaded = 0;
    const onLoad = () => { loaded++; if (loaded === 3) initCanvas(); };

    const bgImg  = new Image(); bgImg.crossOrigin  = 'anonymous';
    const fgImg  = new Image(); fgImg.crossOrigin  = 'anonymous';
    const midImg = new Image(); midImg.crossOrigin = 'anonymous';

    bgImg.onload  = () => { imgsRef.current.bg  = bgImg;  onLoad(); };
    fgImg.onload  = () => { imgsRef.current.fg  = fgImg;  onLoad(); };
    midImg.onload = () => { imgsRef.current.mid = midImg; onLoad(); };

    bgImg.src  = background;
    fgImg.src  = foreground;
    midImg.src = midground;

    const initCanvas = () => {
      const rect   = container.getBoundingClientRect();
      const dpr    = window.devicePixelRatio || 1;
      const mobile = window.innerWidth < 768;

      [bgCanvas, scratchCanvas, particlesCanvas].forEach(c => {
        c.width  = rect.width  * dpr;
        c.height = rect.height * dpr;
      });
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scratchCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { bg, fg } = imgsRef.current;

      // Calcular bounds comunes (fg y bg comparten misma caja visual)
      if (fg) {
        const t = getTransform(fg.width, fg.height, rect.width, rect.height, mobile);
        imgBoundsRef.current = {
          x: t.x,
          right: t.x + fg.width * t.scale,
          w: rect.width,
          h: rect.height,
        };
      }

      // Pintar fondo (Tony) — la 2ª imagen siempre visible debajo
      bgCtx.fillStyle = '#030a03';
      bgCtx.fillRect(0, 0, rect.width, rect.height);
      if (bg) {
        const t = getTransform(bg.width, bg.height, rect.width, rect.height, mobile);
        bgCtx.drawImage(bg, t.x, t.y, bg.width * t.scale, bg.height * t.scale);
      }

      // Pintar Doom ojos abiertos en el scratchCanvas (siempre empieza fresco)
      scratchCtx.clearRect(0, 0, rect.width, rect.height);
      if (fg) {
        scratchCtx.globalCompositeOperation = 'source-over';
        scratchCtx.globalAlpha = 1;
        const t = getTransform(fg.width, fg.height, rect.width, rect.height, mobile);
        scratchCtx.drawImage(fg, t.x, t.y, fg.width * t.scale, fg.height * t.scale);
      }
    };

    startTime.current = performance.now();
    lastTime.current  = startTime.current;

    // ── RENDER LOOP ─────────────────────────────────────────────────────────
    const renderLoop = (time: number) => {
      const dt      = time - lastTime.current;
      lastTime.current = time;
      const elapsed = time - startTime.current;
      const state   = pointerState.current;
      const rect    = container.getBoundingClientRect();
      const mobile  = window.innerWidth < 768;
      const { fg, mid } = imgsRef.current;
      const dpr = window.devicePixelRatio || 1;

      // ── 1. Rascado + tracking de progreso ─────────────────────────────────
      if (state.isDrawing && state.x !== null && state.y !== null && state.lastX !== null && state.lastY !== null) {
        const dist = Math.sqrt((state.x - state.lastX) ** 2 + (state.y - state.lastY) ** 2);

        // Progreso total: 0 → 1 (8000px de recorrido total)
        scratchProgress.current = Math.min(1, scratchProgress.current + dist / 8000);

        // Revelar Iron Man al 100%
        if (scratchProgress.current >= 1 && !isRevealedRef.current) {
          isRevealedRef.current = true;
          setIsRevealed(true);
        }

        // ── Transición suave Doom-abierto → Doom-cerrado → (borra a Tony) ──
        // Entre 0–50%: pintamos Doom ojos cerrados con alpha creciente (midground)
        // Entre 50-100%: se aplica destination-out (borrado)
        const prog = scratchProgress.current;

        if (prog < 0.5 && mid && fg) {
          // Redibuja Doom ojos abiertos, luego fundimos encima el de ojos cerrados
          // Nota: el borrado con destination-out ya borró algo — sólo pintamos la zona
          // de ojos cerrados por encima con alpha proporcional
          const alpha = prog / 0.5;  // 0..1 conforme avanza la primera mitad
          scratchCtx.globalCompositeOperation = 'source-over';
          scratchCtx.globalAlpha = alpha;
          const t = getTransform(mid.width, mid.height, rect.width, rect.height, mobile);
          scratchCtx.drawImage(mid, t.x, t.y, mid.width * t.scale, mid.height * t.scale);
          scratchCtx.globalAlpha = 1;
        }

        // Borrado del scratchCanvas (siempre activo)
        drawBrush(scratchCtx, state, brushSize);

        const n = Math.max(0, Math.floor(state.speed / 4));
        if (n > 0 || Math.random() > 0.55) {
          particleSystem.current.emit(state.x, state.y, state.speed, n || 1);
        }
      }

      // ── 2. Redibujar columnas laterales animadas en bgCanvas ───────────────
      const bgCtx = bgCanvasRef.current?.getContext('2d', { alpha: false });
      if (bgCtx && imgsRef.current.bg) {
        const bg = imgsRef.current.bg;
        bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Fondo plano primero
        bgCtx.fillStyle = isRevealedRef.current ? '#1a0505' : '#030a03';
        bgCtx.fillRect(0, 0, rect.width, rect.height);

        // Imagen de Tony
        const t = getTransform(bg.width, bg.height, rect.width, rect.height, mobile);
        bgCtx.drawImage(bg, t.x, t.y, bg.width * t.scale, bg.height * t.scale);

        // Columnas laterales (solo en PC donde hay espacio)
        if (!mobile) {
          const b = imgBoundsRef.current;
          drawSideColumns(bgCtx, rect.width, rect.height, b.x, b.right, isRevealedRef.current, elapsed);
        }
      }

      // ── 3. Partículas ──────────────────────────────────────────────────────
      particleSystem.current.updateAndDraw(particlesCtx, dt);

      if (state.isDrawing) {
        state.lastX = state.x;
        state.lastY = state.y;
      }

      rafId.current = requestAnimationFrame(renderLoop);
    };

    rafId.current = requestAnimationFrame(renderLoop);

    let resizeTimer: number;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(initCanvas, 150); };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [foreground, midground, background, brushSize, pointerState]);

  // ── Temas visuales del header ──
  const headerBg     = isRevealed ? 'rgba(120,8,8,0.88)'    : 'rgba(4,28,4,0.88)';
  const headerBorder = isRevealed ? 'rgba(212,175,55,0.45)' : 'rgba(80,200,80,0.25)';
  const headerGlow   = isRevealed ? '0 4px 32px rgba(200,0,0,0.35)' : '0 4px 32px rgba(0,100,0,0.3)';
  const titleColor   = isRevealed ? '#D4AF37' : '#88C888';
  const titleText    = isRevealed ? '⚙ Iron Man — El Vengador de Acero' : '⚗ Doctor Doom — El Monarca del Caos';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden touch-none"
      style={{ touchAction: 'none', background: 'transparent' }}
    >
      {/* ── HEADER ── */}
      <header style={{
        position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 50,
        padding: '14px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: headerBg,
        borderBottom: `1px solid ${headerBorder}`,
        boxShadow: headerGlow,
        transition: 'background-color 1.2s ease, box-shadow 1.2s ease, border-color 1.2s ease',
      }}>
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(0.85rem, 2.5vw, 1.35rem)', fontWeight: 900,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: titleColor, transition: 'color 1.2s ease', margin: 0,
        }}>
          {titleText}
        </h1>
      </header>

      {/* ── Canvas fondo (Tony + columnas) — zIndex 1 ── */}
      <canvas ref={bgCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 1 }}
      />

      {/* ── Canvas Doom (se raspa) — zIndex 10 ── */}
      <canvas ref={scratchCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 10, pointerEvents: 'none' }}
      />

      {/* ── Canvas Partículas — zIndex 20 ── */}
      <canvas ref={particlesCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 20, pointerEvents: 'none' }}
      />
    </div>
  );
}
