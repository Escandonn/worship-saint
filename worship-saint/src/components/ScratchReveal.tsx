import React, { useEffect, useRef, useState } from 'react';
import { usePointer } from './usePointer';
import { drawBrush } from './Brush';
import { ParticleSystem } from './Particles';

interface ScratchRevealProps {
  foreground: string;
  background: string;
  brushSize?: number;
}

// Calcula escala tipo object-contain usando el mismo algoritmo para ambas imágenes
function getContainTransform(imgW: number, imgH: number, rectW: number, rectH: number, isMobile: boolean) {
  const scale = isMobile
    ? Math.max(rectW / imgW, rectH / imgH)   // cover en móvil
    : Math.min(rectW / imgW, rectH / imgH);  // contain en PC
  return {
    scale,
    x: (rectW / 2) - (imgW / 2) * scale,
    y: (rectH / 2) - (imgH / 2) * scale,
  };
}

export default function ScratchReveal({ foreground, background, brushSize = 140 }: ScratchRevealProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const bgCanvasRef     = useRef<HTMLCanvasElement>(null);   // ← canvas fondo (Tony)
  const scratchCanvasRef = useRef<HTMLCanvasElement>(null);  // ← canvas que se borra (Doom)
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);

  const pointerState    = usePointer(containerRef);
  const particleSystem  = useRef(new ParticleSystem());
  const rafId           = useRef<number | null>(null);
  const lastTime        = useRef<number>(typeof performance !== 'undefined' ? performance.now() : 0);
  const scratchedDist   = useRef(0);
  const isRevealedRef   = useRef(false);

  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const container     = containerRef.current;
    const bgCanvas      = bgCanvasRef.current;
    const scratchCanvas = scratchCanvasRef.current;
    const particlesCanvas = particlesCanvasRef.current;
    if (!container || !bgCanvas || !scratchCanvas || !particlesCanvas) return;

    const bgCtx       = bgCanvas.getContext('2d',      { alpha: false }); // opaco — no transparente
    const scratchCtx  = scratchCanvas.getContext('2d', { alpha: true  });
    const particlesCtx= particlesCanvas.getContext('2d',{ alpha: true  });
    if (!bgCtx || !scratchCtx || !particlesCtx) return;

    // Pre-carga ambas imágenes en paralelo antes de initCanvas
    const bgImg  = new Image();
    const fgImg  = new Image();
    bgImg.crossOrigin  = 'anonymous';
    fgImg.crossOrigin  = 'anonymous';

    let bgLoaded = false;
    let fgLoaded = false;

    const initCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr  = window.devicePixelRatio || 1;
      const isMobile = window.innerWidth < 768;

      // Redimensionar los tres canvas
      [bgCanvas, scratchCanvas, particlesCanvas].forEach(c => {
        c.width  = rect.width  * dpr;
        c.height = rect.height * dpr;
      });
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scratchCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Pintar el fondo (Tony) — sin transparencia, cubre los bordes laterales
      if (bgLoaded) {
        bgCtx.fillStyle = '#030a03'; // color lateral antes de la imagen
        bgCtx.fillRect(0, 0, rect.width, rect.height);
        const t = getContainTransform(bgImg.width, bgImg.height, rect.width, rect.height, isMobile);
        bgCtx.drawImage(bgImg, t.x, t.y, bgImg.width * t.scale, bgImg.height * t.scale);
      }

      // Pintar el foreground (Doom) encima — con alpha para poder borrar
      if (fgLoaded) {
        scratchCtx.globalCompositeOperation = 'source-over';
        const t = getContainTransform(fgImg.width, fgImg.height, rect.width, rect.height, isMobile);
        scratchCtx.drawImage(fgImg, t.x, t.y, fgImg.width * t.scale, fgImg.height * t.scale);
      }
    };

    bgImg.onload = () => { bgLoaded = true; if (fgLoaded) initCanvas(); };
    fgImg.onload = () => { fgLoaded = true; if (bgLoaded) initCanvas(); };
    bgImg.src = background;
    fgImg.src = foreground;

    // ── RENDER LOOP ──────────────────────────────────────────
    const renderLoop = (time: number) => {
      const dt    = time - lastTime.current;
      lastTime.current = time;
      const state = pointerState.current;

      if (state.isDrawing && state.x !== null && state.y !== null && state.lastX !== null && state.lastY !== null) {
        const dist = Math.sqrt((state.x - state.lastX) ** 2 + (state.y - state.lastY) ** 2);
        scratchedDist.current += dist;

        if (scratchedDist.current > 4000 && !isRevealedRef.current) {
          isRevealedRef.current = true;
          setIsRevealed(true);
        }

        drawBrush(scratchCtx, state, brushSize);

        const n = Math.max(0, Math.floor(state.speed / 4));
        if (n > 0 || Math.random() > 0.5) {
          particleSystem.current.emit(state.x, state.y, state.speed, n || 1);
        }
      }

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
  }, [foreground, background, brushSize, pointerState]);

  const headerBg     = isRevealed ? 'rgba(120,8,8,0.88)'  : 'rgba(4,28,4,0.88)';
  const headerBorder = isRevealed ? 'rgba(212,175,55,0.45)' : 'rgba(80,200,80,0.25)';
  const headerGlow   = isRevealed ? '0 4px 32px rgba(200,0,0,0.35)' : '0 4px 32px rgba(0,100,0,0.3)';
  const titleColor   = isRevealed ? '#D4AF37' : '#88C888';
  const titleText    = isRevealed ? '⚙ Iron Man — El Vengador de Acero' : '⚗ Doctor Doom — El Monarca del Caos';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden touch-none"
      style={{ touchAction: 'none', backgroundColor: isRevealed ? '#1a0505' : '#030a03', transition: 'background-color 1.2s ease' }}
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

      {/* ── CANVAS FONDO (Tony) — MISMO ALGORITMO que el foreground ── */}
      <canvas
        ref={bgCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 1 }}
      />

      {/* ── CANVAS DOOM (se borra al raspar) ── */}
      <canvas
        ref={scratchCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 10, pointerEvents: 'none' }}
      />

      {/* ── CANVAS PARTÍCULAS ── */}
      <canvas
        ref={particlesCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 20, pointerEvents: 'none' }}
      />
    </div>
  );
}
