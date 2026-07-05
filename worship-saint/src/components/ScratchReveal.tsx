import React, { useEffect, useRef, useState } from 'react';
import { usePointer } from './usePointer';
import { drawBrush } from './Brush';
import { ParticleSystem } from './Particles';
import TypewriterText from './TypewriterText';

interface ScratchRevealProps {
  foreground: string;       // Doom ojos abiertos
  midground: string;        // Doom ojos cerrados (transición)
  background: string;       // Tony / Iron Man
  afterReveal?: string;     // opcional: imagen a mostrar después del texto de rostro
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
  t: number,          // tiempo animación 0-∞
  avgColor?: { r: number; g: number; b: number } | null
) {
  const colW = Math.max(0, imgX); // ancho de cada columna lateral
  if (colW < 2) return;           // en móvil no hay espacio

  // Colores temáticos (restaurados a valores originales)
  const primary   = isRevealed ? '#8B0000' : '#0a2a0a';
  const secondary = isRevealed ? '#D4AF37' : '#2a6a2a';
  const accent    = isRevealed ? '#FF4500' : '#00ff88';

  // vividez: animación de la superposición dorada será calculada más abajo

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
  // Overlay sutil de dorado/amarillo para dar vividez (se mueve con pulse)
  const yellow = { r: 255, g: 213, b: 74 }; // amarillo
  const gold   = { r: 212, g: 175, b: 55 }; // dorado
  const mix = (c1: any, c2: any, f: number) => `rgb(${Math.round(c1.r * (1 - f) + c2.r * f)}, ${Math.round(c1.g * (1 - f) + c2.g * f)}, ${Math.round(c1.b * (1 - f) + c2.b * f)})`;
  const shimmerF = 0.5 + 0.5 * Math.sin(t * 0.002);
  const shimmerStart = mix(yellow, gold, Math.max(0, shimmerF));
  const shimmerEnd = mix(gold, yellow, Math.max(0, 1 - shimmerF));
  const overlay = ctx.createLinearGradient(0, 0, colW, 0);
  overlay.addColorStop(0,   shimmerStart);
  overlay.addColorStop(0.5, shimmerEnd);
  overlay.addColorStop(1,   'transparent');
  ctx.globalAlpha = 0.06 + 0.06 * Math.abs(Math.sin(t * 0.004));
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, colW, h);
  ctx.fillRect(imgRight, 0, w - imgRight, h);

  ctx.globalAlpha = 1; // reset
}

export default function ScratchReveal({
  foreground,
  midground,
  background,
  afterReveal,
  brushSize = 140,
}: ScratchRevealProps) {
  const containerRef     = useRef<HTMLDivElement>(null);
  const bgCanvasRef      = useRef<HTMLCanvasElement>(null);  // Tony (fondo fijo)
  const scratchCanvasRef = useRef<HTMLCanvasElement>(null);  // Doom (se raspa)
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);

  const pointerState   = usePointer(containerRef);
  const particleSystem = useRef(new ParticleSystem());
  const avgColorRef = useRef<{ r: number; g: number; b: number } | null>(null);
  const rafId          = useRef<number | null>(null);
  const startTime      = useRef<number>(0); // para animación columnas
  const lastTime       = useRef<number>(0);

  // Distancia rascada — porcentaje de revelación 0..1
  const scratchProgress = useRef(0);       // 0 = Doom abierto, 1 = Tony
  const isRevealedRef   = useRef(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [textComplete, setTextComplete] = useState(false);
  const [finalApplied, setFinalApplied] = useState(false);
  const timersRef = useRef<number[]>([]);
  const finalBgAppliedRef = useRef(false);
  const userInteractedRef = useRef(false);
  const finalRevealRunningRef = useRef(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [mobileHeader, setMobileHeader] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updateMobile = () => setMobileHeader(window.innerWidth < 768);
    updateMobile();
    window.addEventListener('resize', updateMobile);

    const headerTimeout = window.setTimeout(() => setHeaderVisible(true), 1700);

    return () => {
      window.removeEventListener('resize', updateMobile);
      window.clearTimeout(headerTimeout);
    };
  }, []);

  // Secuencia de overlays al completarse la revelación:
  // 1) mostrar overlay central (Arioman) breve
  // 2) mostrar overlay de marketing (Typewriter)
  // 3) ocultar overlay de marketing automáticamente (fallback)
  useEffect(() => {
    // limpiar timers previos
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];

    if (!isRevealed) return;

    setTextComplete(false);
    setShowNextOverlay(false);

    // Mostrar el overlay de marketing tras un breve retardo (sin el título central)
    const t1 = window.setTimeout(() => {
      setShowNextOverlay(true);

      // Fallback: ocultar el overlay de marketing si no se cierra por Typewriter
      const t2 = window.setTimeout(() => setShowNextOverlay(false), 9000);
      timersRef.current.push(t2);
    }, 600);

    timersRef.current.push(t1);

    return () => {
      timersRef.current.forEach(id => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [isRevealed]);

  useEffect(() => {
    if (!textComplete || !afterReveal) return;
    if (finalRevealRunningRef.current) return; // already animating

    const newBg = new Image();
    newBg.crossOrigin = 'anonymous';
    newBg.onload = () => {
      // Start final reveal animation that uses destination-out strokes to reveal the new background
      const bgCanvas = bgCanvasRef.current;
      const scratchCanvas = scratchCanvasRef.current;
      if (!bgCanvas || !scratchCanvas) {
          imgsRef.current.bg = newBg;
          finalBgAppliedRef.current = true;
          try { initCanvasRef.current && initCanvasRef.current(); } catch (e) { /* noop */ }
          setFinalApplied(true);
          return;
        }

      // Draw new background immediately underneath
      imgsRef.current.bg = newBg;
      try { initCanvasRef.current && initCanvasRef.current(); } catch (e) { /* noop */ }

      // Animate programmatic scratching to reveal the new bg
      if (finalRevealRunningRef.current) return;
      finalRevealRunningRef.current = true;

      const scratchCtx = scratchCanvas.getContext('2d', { alpha: true });
      if (!scratchCtx) {
        finalBgAppliedRef.current = true;
        finalRevealRunningRef.current = false;
        return;
      }

      const duration = 2600; // longer reveal animation for smoother transition
      const start = performance.now();
      let rafIdLocal: number;

      const step = () => {
        const now = performance.now();
        const elapsed = now - start;
        const p = Math.min(1, elapsed / duration);

        // emit several synthetic brush strokes per frame, increasing with progress
        const strokes = Math.floor(6 + p * 40);
        for (let i = 0; i < strokes; i++) {
          const rect = bgCanvas.getBoundingClientRect();
          const x = Math.random() * rect.width;
          const y = Math.random() * rect.height;
          const lastX = x + (Math.random() - 0.5) * 40;
          const lastY = y + (Math.random() - 0.5) * 40;
          const fakeState = { x, y, lastX, lastY, speed: 120, isDrawing: true } as any;
          // use existing drawBrush which uses destination-out
          drawBrush(scratchCtx, fakeState, brushSize);
        }

        if (p < 1) {
          rafIdLocal = requestAnimationFrame(step);
        } else {
          // finish: ensure canvas is cleared (fully reveal)
          scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
          finalBgAppliedRef.current = true;
          setFinalApplied(true);
          finalRevealRunningRef.current = false;
        }
      };

      rafIdLocal = requestAnimationFrame(step);
    };
    newBg.src = afterReveal;
  }, [textComplete, afterReveal]);
  const imgsRef = useRef<{
    bg: HTMLImageElement | null;
    fg: HTMLImageElement | null;
    mid: HTMLImageElement | null;
  }>({ bg: null, fg: null, mid: null });

  // Bounding box de la imagen (para columnas)
  const imgBoundsRef = useRef({ x: 0, right: 0, w: 0, h: 0 });
  const initCanvasRef = useRef<(() => void) | null>(null);

  // compute average color of an image for lively side columns
  const computeAverageColor = (img: HTMLImageElement | null) => {
    try {
      if (!img) return null;
      const cw = 32, ch = 32;
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, cw, ch);
      const data = ctx.getImageData(0, 0, cw, ch).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) continue;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
      if (count === 0) return null;
      return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
    } catch (e) {
      return null;
    }
  };

  const renderPerLetter = (text: string) => {
    return text.split('').map((ch, i) => (
      <span key={`${text}-${i}`} className="sweep-letter" style={{ position: 'relative', display: 'inline-block', overflow: 'visible', marginRight: ch === ' ' ? '0.18em' : undefined }}>
        <span style={{ position: 'relative', zIndex: 1 }}>{ch}</span>
        <span className="sweep-bar" style={{ animationDelay: `${i * 0.07}s` }} />
      </span>
    ));
  };

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

    bgImg.onload = () => {
      imgsRef.current.bg = bgImg;
      try { avgColorRef.current = computeAverageColor(bgImg); } catch (e) { avgColorRef.current = null; }
      onLoad();
    };
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

      // Si la imagen final ya se aplicó, no redibujamos el foreground (evita volver a cubrir)
      scratchCtx.clearRect(0, 0, rect.width, rect.height);
      if (!finalBgAppliedRef.current && fg) {
        scratchCtx.globalCompositeOperation = 'source-over';
        scratchCtx.globalAlpha = 1;
        const t = getTransform(fg.width, fg.height, rect.width, rect.height, mobile);
        scratchCtx.drawImage(fg, t.x, t.y, fg.width * t.scale, fg.height * t.scale);
      }
    };

    initCanvasRef.current = initCanvas;

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

        // Progreso total: 0 → 1 (4500px de recorrido total para mayor sensibilidad)
        scratchProgress.current = Math.min(1, scratchProgress.current + dist / 4500);

        // Revelar Iron Man al 100% — sólo si el usuario realmente interactuó
        if (scratchProgress.current >= 1 && userInteractedRef.current && !isRevealedRef.current) {
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
        // marcar que el usuario ha interactuado (evita reveals automáticos)
        if (dist > 2) userInteractedRef.current = true;
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
          drawSideColumns(bgCtx, rect.width, rect.height, b.x, b.right, isRevealedRef.current, elapsed, avgColorRef.current);
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
  const accentColor  = isRevealed ? '#D4AF37' : '#00ff88';
  const textColor    = isRevealed ? '#F5E2A0' : '#C7FFCD';
  const linkColor    = isRevealed ? '#F7E18C' : '#D4FFD6';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden touch-none"
      style={{ touchAction: 'none', background: 'transparent' }}
    >
      {showNextOverlay && (
        <div style={{
          position: 'absolute', top: '16%', right: '4%', zIndex: 54,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
          pointerEvents: 'none', width: mobileHeader ? '86vw' : '32vw',
          maxWidth: '420px',
        }}>
          <div style={{
            width: '100%', padding: '1rem 1.2rem',
            background: 'rgba(5, 12, 18, 0.88)',
            border: `1px solid ${accentColor}`,
            borderRadius: '24px',
            boxShadow: '0 24px 90px rgba(0,0,0,0.55)',
            backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          }}>
            <TypewriterText
              text="Hora de descubrir la verdad: desliza y revela quién está detrás de la máscara."
              speed={80}
              readDelay={8000}
              onComplete={() => {
                if (!textComplete && showNextOverlay) {
                  setTextComplete(true);
                  // ocultar overlay de marketing tras completar para evitar replays
                  setShowNextOverlay(false);
                }
              }}
              className="marketing-reveal"
              style={{
                position: 'static',
                width: '100%',
                minHeight: 'auto',
                margin: 0,
                fontFamily: "'Cinzel', serif",
                fontSize: mobileHeader ? '0.95rem' : '1.05rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textAlign: 'left',
                background: 'transparent',
                padding: 0,
                border: 'none',
                boxShadow: 'none',
                color: '#f5f5f5',
              }}
            />
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      
      <header style={{
        position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 50,
        padding: mobileHeader ? '14px 18px' : '12px 20px',
        display: 'flex', flexDirection: 'column', gap: mobileHeader ? '0.85rem' : '0.75rem',
        alignItems: 'center',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: headerBg,
        borderBottom: `1px solid ${headerBorder}`,
        boxShadow: headerGlow,
        transition: 'background-color 1.2s ease, box-shadow 1.2s ease, border-color 1.2s ease, padding 0.3s ease',
        // sweep colors: --sweep-color-1 (accent), --sweep-color-2 (highlight)
        ...(finalApplied ? { ['--sweep-color-1' as any]: '#FFD27A', ['--sweep-color-2' as any]: '#FFFFFF' } as React.CSSProperties : { ['--sweep-color-1' as any]: '#9CFFB8', ['--sweep-color-2' as any]: '#FFFFFF' } as React.CSSProperties),
      }}>
          <div style={{
            width: '100%', maxWidth: '1260px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(-12px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.72rem' }}>
            <span aria-hidden="true" style={{
              display: 'inline-block', width: '16px', height: '16px', background: accentColor,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', transform: 'translateY(-1px)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
              <style>{`
                .sweep-text { position: relative; display: inline-block; overflow: hidden; }
                .sweep-text .sweep-bar { position: absolute; left: -160%; top: -10%; height: 120%; width: 160%;
                  background: linear-gradient(90deg, transparent 0%, var(--sweep-color-1, rgba(255,255,255,0.95)) 45%, var(--sweep-color-2, rgba(255,255,255,0.6)) 55%, transparent 100%);
                  transform: skewX(-18deg);
                  pointer-events: none; opacity: 0.95; }
                @keyframes sweepLR { from { left: -160%; } to { left: 160%; } }
                .sweep-on .sweep-bar { animation: sweepLR 1.6s ease-in-out forwards; }
              `}</style>
              <span className={headerVisible ? 'sweep-text sweep-on' : 'sweep-text'} style={{ color: textColor, fontFamily: "'Cinzel', serif", fontSize: mobileHeader ? '0.82rem' : '0.8rem', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                Worship-Saint
                <span className="sweep-bar" />
              </span>
              <span className={headerVisible ? 'sweep-text sweep-on' : 'sweep-text'} style={{ color: accentColor, fontFamily: "'Cinzel', serif", fontSize: mobileHeader ? '0.62rem' : '0.64rem', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                Estudio de impacto
                <span className="sweep-bar" />
              </span>
            </div>
          </div>

          {mobileHeader ? (
            <button
              type="button"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(prev => !prev)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '42px', height: '42px', borderRadius: '999px',
                border: `1px solid ${linkColor}`, background: 'rgba(255,255,255,0.06)',
                color: linkColor, cursor: 'pointer', transition: 'transform 0.2s ease',
              }}
            >
              <span style={{
                width: '20px', height: '2px', background: linkColor, display: 'block',
                boxShadow: `0 -6px 0 ${linkColor}, 0 6px 0 ${linkColor}`,
                transform: menuOpen ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s ease',
              }} />
            </button>
          ) : (
            <nav aria-label="Navegación principal" style={{
              display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center',
            }}>
              {[
                { label: 'Inicio', href: '#inicio' },
                { label: 'Nuestras obras', href: '#nuestras-obras' },
                { label: 'Quiénes somos', href: '#quienes-somos' },
                { label: 'Servicios', href: '#servicios' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    color: linkColor,
                    fontFamily: "'Cinzel', serif",
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'color 0.25s ease',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = linkColor; }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>

      </header>

      {mobileHeader && menuOpen && headerVisible && (
        <nav aria-label="Menú móvil" style={{
          position: 'absolute', top: mobileHeader ? '72px' : '60px', right: 18, left: 18,
          zIndex: 51, display: 'flex', flexDirection: 'column', gap: '0.75rem',
          padding: '1rem', background: 'rgba(0,0,0,0.72)', borderRadius: '18px',
          border: `1px solid ${linkColor}`, backdropFilter: 'blur(14px)',
          boxShadow: '0 18px 50px rgba(0,0,0,0.25)',
          transition: 'opacity 0.25s ease',
        }}>
          {[
            { label: 'Inicio', href: '#inicio' },
            { label: 'Nuestras obras', href: '#nuestras-obras' },
            { label: 'Quiénes somos', href: '#quienes-somos' },
            { label: 'Servicios', href: '#servicios' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: linkColor,
                fontFamily: "'Cinzel', serif",
                fontSize: '0.96rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '0.9rem 1rem',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)',
                transition: 'background 0.25s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}

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
