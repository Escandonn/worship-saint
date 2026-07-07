// ─────────────────────────────────────────────────────────────────────────────
// Lógica de canvas: render loop, rascado, partículas
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useEffect } from 'react';
import { drawBrush } from '../Brush';
import { ParticleSystem } from '../Particles';
import { usePointer } from '../usePointer';
import type { PointerState } from '../usePointer';
import {
  getTransform,
  drawSideColumns,
  computeAverageColor,
  TIMING,
} from './types';

interface CanvasRendererOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  bgCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  scratchCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  particlesCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  foreground: string;
  midground: string;
  background: string;
  brushSize: number;
  isRevealed: boolean;
  finalApplied: boolean;
  onRevealComplete: () => void;
  onFinalApplied: () => void;
}

export function useCanvasRenderer({
  containerRef,
  bgCanvasRef,
  scratchCanvasRef,
  particlesCanvasRef,
  foreground,
  midground,
  background,
  brushSize,
  isRevealed,
  finalApplied,
  onRevealComplete,
  onFinalApplied,
}: CanvasRendererOptions) {
  const pointerState = usePointer(scratchCanvasRef);
  const rafIdRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const scratchProgressRef = useRef<number>(0);
  const isRevealedRef = useRef<boolean>(false);
  const finalBgAppliedRef = useRef<boolean>(false);
  const needsRedrawRef = useRef<boolean>(false);
  const userInteractedRef = useRef<boolean>(false);
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const avgColorRef = useRef<{ r: number; g: number; b: number } | null>(null);
  const imgBoundsRef = useRef({ x: 0, right: 0, w: 0, h: 0 });
  const imgsRef = useRef<{
    bg: HTMLImageElement | null;
    fg: HTMLImageElement | null;
    mid: HTMLImageElement | null;
  }>({ bg: null, fg: null, mid: null });

  // Sincronizar isRevealedRef con la prop
  useEffect(() => {
    isRevealedRef.current = isRevealed;
  }, [isRevealed]);

  // Cuando se aplica el fondo final, marcar flag
  useEffect(() => {
    if (finalApplied) {
      finalBgAppliedRef.current = true;
      needsRedrawRef.current = true;
    }
  }, [finalApplied]);

  useEffect(() => {
    const container = containerRef.current;
    const bgCanvas = bgCanvasRef.current;
    const scratchCanvas = scratchCanvasRef.current;
    const particlesCanvas = particlesCanvasRef.current;
    if (!container || !bgCanvas || !scratchCanvas || !particlesCanvas) return;

    const bgCtx = bgCanvas.getContext('2d', { alpha: false });
    const scratchCtx = scratchCanvas.getContext('2d', { alpha: true });
    const particlesCtx = particlesCanvas.getContext('2d', { alpha: true });
    if (!bgCtx || !scratchCtx || !particlesCtx) return;

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded === 3) initCanvas();
    };

    const bgImg = new Image(); bgImg.crossOrigin = 'anonymous';
    const fgImg = new Image(); fgImg.crossOrigin = 'anonymous';
    const midImg = new Image(); midImg.crossOrigin = 'anonymous';

    bgImg.onload = () => {
      imgsRef.current.bg = bgImg;
      try { avgColorRef.current = computeAverageColor(bgImg); } catch { avgColorRef.current = null; }
      onLoad();
    };
    fgImg.onload = () => { imgsRef.current.fg = fgImg; onLoad(); };
    midImg.onload = () => { imgsRef.current.mid = midImg; onLoad(); };

    bgImg.src = background;
    fgImg.src = foreground;
    midImg.src = midground;

    const initCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const mobile = window.innerWidth < 768;

      [bgCanvas, scratchCanvas, particlesCanvas].forEach(c => {
        c.width = rect.width * dpr;
        c.height = rect.height * dpr;
      });
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scratchCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { bg, fg } = imgsRef.current;

      if (fg) {
        const t = getTransform(fg.width, fg.height, rect.width, rect.height, mobile);
        imgBoundsRef.current = {
          x: t.x,
          right: t.x + fg.width * t.scale,
          w: rect.width,
          h: rect.height,
        };
      }

      bgCtx.fillStyle = isRevealedRef.current ? '#3a0808' : '#030a03';
      bgCtx.fillRect(0, 0, rect.width, rect.height);
      if (bg) {
        const t = getTransform(bg.width, bg.height, rect.width, rect.height, mobile);
        bgCtx.drawImage(bg, t.x, t.y, bg.width * t.scale, bg.height * t.scale);
      }

      if (!mobile && imgBoundsRef.current.right > 0) {
        const b = imgBoundsRef.current;
        drawSideColumns(bgCtx, rect.width, rect.height, b.x, b.right, isRevealedRef.current, performance.now() - startTimeRef.current, avgColorRef.current);
      }

      scratchCtx.clearRect(0, 0, rect.width, rect.height);
      if (!finalBgAppliedRef.current && fg) {
        scratchCtx.globalCompositeOperation = 'source-over';
        scratchCtx.globalAlpha = 1;
        const t = getTransform(fg.width, fg.height, rect.width, rect.height, mobile);
        scratchCtx.drawImage(fg, t.x, t.y, fg.width * t.scale, fg.height * t.scale);
      }
    };

    startTimeRef.current = performance.now();
    lastTimeRef.current = startTimeRef.current;

    let needsRedraw = true;
    let lastColDraw = 0;

    const renderLoop = (time: number) => {
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const state = pointerState.current;
      const rect = container.getBoundingClientRect();
      const mobile = window.innerWidth < 768;
      const { fg, mid } = imgsRef.current;
      const dpr = window.devicePixelRatio || 1;

      const hasParticles = particleSystemRef.current.particles.length > 0;
      const x = state.x ?? 0;
      const y = state.y ?? 0;
      const lastX = state.lastX ?? 0;
      const lastY = state.lastY ?? 0;
      const speed = state.speed ?? 0;
      const drawing = state.isDrawing && state.x !== null && state.y !== null;

      // ── 1. Rascado ───────────────────────────────────────────────────────
      if (drawing) {
        const dist = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);

        scratchProgressRef.current = Math.min(1, scratchProgressRef.current + dist / TIMING.SCRATCH_TOTAL_DIST);

        if (scratchProgressRef.current >= 1 && userInteractedRef.current && !isRevealedRef.current) {
          isRevealedRef.current = true;
          onRevealComplete();
        }

        const prog = scratchProgressRef.current;

        if (prog < 0.5 && mid && fg) {
          const alpha = prog / 0.5;
          scratchCtx.globalCompositeOperation = 'source-over';
          scratchCtx.globalAlpha = alpha;
          const t = getTransform(mid.width, mid.height, rect.width, rect.height, mobile);
          scratchCtx.drawImage(mid, t.x, t.y, mid.width * t.scale, mid.height * t.scale);
          scratchCtx.globalAlpha = 1;
        }

        drawBrush(scratchCtx, state, brushSize);

        const n = Math.max(0, Math.floor(speed / 6));
        if (n > 0 || Math.random() > 0.7) {
          particleSystemRef.current.emit(x, y, speed, Math.min(n || 1, 3));
        }
        if (dist > 2) userInteractedRef.current = true;
        needsRedraw = true;
      }

      // ── 2. Redibujar columnas laterales ──────────────────────────────────
      const forceCols = finalBgAppliedRef.current || needsRedrawRef.current;
      if (imgsRef.current.bg && (needsRedraw || forceCols)) {
        const shouldDrawCols = !mobile && (time - lastColDraw > TIMING.COL_THROTTLE);
        if (shouldDrawCols || drawing || forceCols) {
          lastColDraw = time;
          const bg = imgsRef.current.bg;
          bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

          bgCtx.fillStyle = isRevealedRef.current ? '#3a0808' : '#030a03';
          bgCtx.fillRect(0, 0, rect.width, rect.height);

          const t = getTransform(bg.width, bg.height, rect.width, rect.height, mobile);
          bgCtx.drawImage(bg, t.x, t.y, bg.width * t.scale, bg.height * t.scale);

          if (!mobile) {
            const b = imgBoundsRef.current;
            drawSideColumns(bgCtx, rect.width, rect.height, b.x, b.right, isRevealedRef.current, elapsed, avgColorRef.current);
          }
        }
      }

      // ── 3. Partículas ───────────────────────────────────────────────────
      if (hasParticles || drawing) {
        particleSystemRef.current.updateAndDraw(particlesCtx, dt);
      } else if (needsRedraw) {
        particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
      }

      if (state.isDrawing) {
        state.lastX = state.x;
        state.lastY = state.y;
      }

      if (!drawing && !hasParticles && !finalBgAppliedRef.current) {
        needsRedraw = false;
      }
      needsRedrawRef.current = false;

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    let resizeTimer: number;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(initCanvas, 150); };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [foreground, midground, background, brushSize, pointerState, onRevealComplete]);

  return { pointerState };
}