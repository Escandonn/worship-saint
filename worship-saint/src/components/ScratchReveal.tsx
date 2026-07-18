// ─────────────────────────────────────────────────────────────────────────────
// ScratchReveal — Orchestrator delgado que compone los módulos de scratch/
//
// Estado y lógica de orquestación aquí. Canvas, Header, Overlays y Bill
// viven en sus respectivos archivos modulares.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from 'react';
import { drawBrush } from './Brush';
import { useCanvasRenderer } from './scratch/canvasRenderer';
import { Header } from './scratch/Header';
import { PhaseOverlays } from './scratch/PhaseOverlays';
import { BillSequence } from './scratch/BillSequence';
import { drawSideColumns } from './scratch/types';
import type { ScratchRevealProps, Phase } from './scratch/types';

export default function ScratchReveal({
  foreground,
  midground,
  background,
  afterReveal,
  billImage,
  billImage2,
  billCentralImage,
  billCentralImage2,
  billIzqImage,
  brushSize = 140,
}: ScratchRevealProps) {
  // ── Refs de canvas (compartidos con canvasRenderer) ────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const scratchCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Refs internos para afterReveal animation ───────────────────────────────
  const finalRevealRunningRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  // ── Estado de orquestación ─────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [finalApplied, setFinalApplied] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [showMarketing, setShowMarketing] = useState(false);
  const [textComplete, setTextComplete] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [skipFading, setSkipFading] = useState(false);
  const [cinematicComplete, setCinematicComplete] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [mobileHeader, setMobileHeader] = useState(false);

  // ── Callbacks estables (evitan re-renders del canvasRenderer) ──────────────
  const handleRevealComplete = useCallback(() => {
    setIsRevealed(true);
    setPhase(2);
  }, []);

  const handleFinalApplied = useCallback(() => {
    // canvasRenderer ya sincroniza finalBgAppliedRef internamente
  }, []);

  // ── Hook del canvas renderer ───────────────────────────────────────────────
  useCanvasRenderer({
    containerRef,
    bgCanvasRef,
    scratchCanvasRef,
    particlesCanvasRef,
    foreground,
    midground: midground ?? foreground,
    background,
    brushSize,
    isRevealed,
    finalApplied,
    onRevealComplete: handleRevealComplete,
    onFinalApplied: handleFinalApplied,
  });

  // ── Detección móvil + visibilidad del header ───────────────────────────────
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

  // ── Fase 0: hint "Rasca la imagen" → desaparece solo o al primer rascado ──
  useEffect(() => {
    if (phase !== 0) return;
    const t = window.setTimeout(() => {
      setShowHint(false);
      setPhase(1);
    }, 2600);
    timersRef.current.push(t);
    return () => { window.clearTimeout(t); };
  }, [phase]);

  // ── Ocultar hint inmediatamente al detectar el primer rascado del usuario ──
  useEffect(() => {
    const scratchCanvas = scratchCanvasRef.current;
    if (!scratchCanvas || phase !== 0) return;
    const hideHint = () => {
      setShowHint(false);
      setPhase(1);
    };
    scratchCanvas.addEventListener('pointerdown', hideHint, { once: true });
    return () => scratchCanvas.removeEventListener('pointerdown', hideHint);
  }, [phase]);

  // ── Fase 2: al revelarse, mostrar marketing tras delay ─────────────────────
  useEffect(() => {
    if (!isRevealed || skipped) return;
    setPhase(2);
    const t = window.setTimeout(() => setShowMarketing(true), 400);
    timersRef.current.push(t);
    return () => { window.clearTimeout(t); };
  }, [isRevealed, skipped]);

  // ── afterReveal: animación programática de rascado para revelar nueva img ──
  // Esta lógica vive en el orchestrator porque necesita acceso directo a los
  // canvas elements y no pertenece al render loop del canvasRenderer.
  useEffect(() => {
    if (!textComplete || !afterReveal) return;
    if (finalRevealRunningRef.current) return;

    const bgCanvas = bgCanvasRef.current;
    const scratchCanvas = scratchCanvasRef.current;
    if (!bgCanvas || !scratchCanvas) return;

    const newBg = new Image();
    newBg.crossOrigin = 'anonymous';
    newBg.onload = () => {
      const bgCtx = bgCanvas.getContext('2d', { alpha: false });
      const scratchCtx = scratchCanvas.getContext('2d', { alpha: true });
      if (!bgCtx || !scratchCtx) return;

      // Dibujar el nuevo fondo inmediatamente debajo del scratch canvas
      const rect = bgCanvas.getBoundingClientRect();
      const scale = rect.height / newBg.height;
      const w = newBg.width * scale;
      const h = newBg.height * scale;
      const x = (rect.width - w) / 2;
      const y = 0;

      bgCtx.drawImage(newBg, x, y, w, h);

      // Animar rascado programático para revelar el nuevo fondo
      finalRevealRunningRef.current = true;

      const duration = 2800;
      const start = performance.now();
      let rafIdLocal = 0;

      const step = () => {
        const now = performance.now();
        const elapsed = now - start;
        const p = Math.min(1, elapsed / duration);

        // Easing suave: empieza lento, acelera, termina suave
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const strokes = Math.floor(4 + eased * 44);
        for (let i = 0; i < strokes; i++) {
          const sx = Math.random() * rect.width;
          const sy = Math.random() * rect.height;
          const fakeState = {
            x: sx,
            y: sy,
            lastX: sx + (Math.random() - 0.5) * 40,
            lastY: sy + (Math.random() - 0.5) * 40,
            speed: 120,
            isDrawing: true,
          } as any;
          drawBrush(scratchCtx, fakeState, brushSize);
        }

        if (p < 1) {
          rafIdLocal = requestAnimationFrame(step);
        } else {
          scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
          setFinalApplied(true);
          finalRevealRunningRef.current = false;
        }
      };

      rafIdLocal = requestAnimationFrame(step);
    };
    newBg.src = afterReveal;
  }, [textComplete, afterReveal, brushSize]);

  // ── SKIP: saltar toda la experiencia a la imagen final ──────────────────────
  const handleSkip = useCallback(() => {
    if (skipped || skipFading) return;
    // Ocultar botón e hint inmediatamente, sin delay
    setSkipFading(true);
    setSkipped(true);
    setShowHint(false);
    setShowMarketing(false);
    // Limpiar todos los timers pendientes
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
    setIsRevealed(true);
    setPhase(3);
    setTextComplete(true);

      // Dibujar la imagen final con animación de rascado programático
      if (afterReveal) {
        const bgCanvas = bgCanvasRef.current;
        const scratchCanvas = scratchCanvasRef.current;
        if (bgCanvas && scratchCanvas) {
          const bgCtx = bgCanvas.getContext('2d', { alpha: false });
          const scratchCtx = scratchCanvas.getContext('2d', { alpha: true });
          if (bgCtx && scratchCtx) {
            const newBg = new Image();
            newBg.crossOrigin = 'anonymous';
            newBg.onload = () => {
              const rect = bgCanvas.getBoundingClientRect();
              const scale = rect.height / newBg.height;
              const w = newBg.width * scale;
              const h = newBg.height * scale;
              const x = (rect.width - w) / 2;
              const y = 0;

              // Pintar fondo base post-reveal (rojo) en toda el canvas
              bgCtx.fillStyle = '#3a0808';
              bgCtx.fillRect(0, 0, rect.width, rect.height);

              // Dibujar la imagen final centrada
              bgCtx.drawImage(newBg, x, y, w, h);

              // Dibujar paredes laterales con colores post-reveal (rojo/dorado)
              drawSideColumns(bgCtx, rect.width, rect.height, x, x + w, true, performance.now(), null);

              // Animación de rascado programático rápida para revelar la imagen
              const duration = 1200;
              const start = performance.now();
              let rafIdLocal = 0;

              const step = () => {
                const now = performance.now();
                const elapsed = now - start;
                const p = Math.min(1, elapsed / duration);

                // Easing brusco: rápido al inicio, termina de golpe
                const eased = p < 0.3 ? p * 3 : 1;
                const strokes = Math.floor(8 + eased * 60);
                for (let i = 0; i < strokes; i++) {
                  const sx = Math.random() * rect.width;
                  const sy = Math.random() * rect.height;
                  const fakeState = {
                    x: sx,
                    y: sy,
                    lastX: sx + (Math.random() - 0.5) * 40,
                    lastY: sy + (Math.random() - 0.5) * 40,
                    speed: 120,
                    isDrawing: true,
                  } as any;
                  drawBrush(scratchCtx, fakeState, brushSize);
                }

                if (p < 1) {
                  rafIdLocal = requestAnimationFrame(step);
                } else {
                  scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
                  setFinalApplied(true);
                }
              };

              rafIdLocal = requestAnimationFrame(step);
            };
            newBg.src = afterReveal;
          }
        }
      } else {
        setFinalApplied(true);
      }
  }, [skipped, skipFading, afterReveal, brushSize]);

  // ── onTypewriterComplete: tras marketing, esperar y avanzar a fase 3 ────────
  const handleTypewriterComplete = useCallback(() => {
    if (textComplete) return;
    const fadeT = window.setTimeout(() => {
      setTextComplete(true);
      setShowMarketing(false);
      setPhase(3);
    }, 1800);
    timersRef.current.push(fadeT);
  }, [textComplete]);

  // ── onCinematicComplete: Bill central bubble mostrada ──────────────────────
  const handleCinematicComplete = useCallback(() => {
    setCinematicComplete(true);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: isRevealed ? '#3a0808' : '#030a03',
        transition: 'background 1.2s ease',
      }}
    >
      {/* ── Canvas layers ── */}
      <canvas
        ref={bgCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
      />
      <canvas
        ref={scratchCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }}
      />
      <canvas
        ref={particlesCanvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 20, pointerEvents: 'none' }}
      />

      {/* ── Header ── */}
      <Header
        isRevealed={isRevealed}
        headerVisible={headerVisible}
        mobileHeader={mobileHeader}
      />

      {/* ── Overlays: hint, marketing, skip ── */}
      <PhaseOverlays
        phase={phase}
        showHint={showHint}
        showMarketing={showMarketing}
        textComplete={textComplete}
        mobileHeader={mobileHeader}
        isRevealed={isRevealed}
        skipped={skipped}
        skipFading={skipFading}
        cinematicComplete={cinematicComplete}
        finalApplied={finalApplied}
        handleSkip={handleSkip}
        onTypewriterComplete={handleTypewriterComplete}
      />

      {/* ── Bill Sequence ── */}
      <BillSequence
        finalApplied={finalApplied}
        billImage={billImage}
        billImage2={billImage2}
        billCentralImage={billCentralImage}
        billCentralImage2={billCentralImage2}
        billIzqImage={billIzqImage}
        mobileHeader={mobileHeader}
        onCinematicComplete={handleCinematicComplete}
      />
    </div>
  );
}
