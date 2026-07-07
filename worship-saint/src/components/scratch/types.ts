// ─────────────────────────────────────────────────────────────────────────────
// Tipos, constantes y utilidades para ScratchReveal
// ─────────────────────────────────────────────────────────────────────────────

export interface ScratchRevealProps {
  background: string;
  foreground: string;
  midground?: string;
  afterReveal: string;
  billImage?: string;
  billImage2?: string;
  billCentralImage?: string;
  brushSize?: number;
}

// ── Fases del componente ──────────────────────────────────────────────────────
export type Phase = 0 | 1 | 2 | 3 | 4;
// phase 0 = hint (rasca la imagen)
// phase 1 = scratching activo
// phase 2 = marketing typewriter
// phase 3 = reveal final
// phase 4 = completo

// ── Timing constants (ms) ─────────────────────────────────────────────────────
export const TIMING = {
  HINT_FADE: 800,          // cuánto dura el hint antes de desaparecer
  MARKETING_DELAY: 1200,   // delay antes de mostrar marketing
  MARKETING_READ: 6500,    // delay de lectura del typewriter
  MARKETING_FADE: 1800,     // fade out del texto marketing
  FINAL_ANIM: 600,          // duración de la animación final
  SKIP_FADE: 300,           // fade out del botón skip
  // Bill corner
  BILL_SHOW: 300,           // cuándo aparece Bill tras finalApplied
  BILL_BUBBLE: 1400,        // cuándo aparece burbuja de Bill
  // Bill central
  BILL_CENTRAL_SHOW: 2000, // cuándo aparece Bill central tras burbuja Bill
  BILL_CENTRAL_BUBBLE: 3700,// cuándo aparece burbuja de Bill central
  BILL_FRAME_INTERVAL: 500,// alternancia de frames de Bill (ms)
  // Scratch
  SCRATCH_TOTAL_DIST: 4500,// distancia total para revelar (px)
  COL_THROTTLE: 33,         // throttle columnas (~30fps)
} as const;

// ── Color palette ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Pre-reveal (verde)
  PRE_BG: '#030a03',
  PRE_BG2: '#0a2a0a',
  PRE_ACCENT: '#00ff88',
  PRE_TEXT: '#C7FFCD',
  PRE_LINK: '#D4FFD6',
  PRE_BORDER: 'rgba(80,200,80,0.25)',
  PRE_GLOW: '0 4px 32px rgba(0,100,0,0.3)',
  PRE_HEADER_BG: 'rgba(4,28,4,0.88)',
  PRE_HINT_BG: 'rgba(3, 10, 3, 0.82)',
  // Post-reveal (rojo/dorado)
  POST_BG: '#3a0808',
  POST_PRIMARY: '#5C0000',
  POST_SECONDARY: '#D4AF37',
  POST_ACCENT: '#D4AF37',
  POST_TEXT: '#F5E2A0',
  POST_LINK: '#F7E18C',
  POST_BORDER: 'rgba(212,175,55,0.45)',
  POST_GLOW: '0 4px 32px rgba(200,0,0,0.35)',
  POST_HEADER_BG: 'rgba(120,8,8,0.88)',
  POST_HINT_BG: 'rgba(26, 5, 5, 0.88)',
  // Sweep
  SWEEP_PRE_1: '#9CFFB8',
  SWEEP_PRE_2: '#FFFFFF',
  SWEEP_POST_1: '#FFD27A',
  SWEEP_POST_2: '#FFFFFF',
} as const;

// ── Image transform utility ───────────────────────────────────────────────────
export function getTransform(
  imgW: number,
  imgH: number,
  canvasW: number,
  canvasH: number,
  mobile: boolean
): { x: number; y: number; scale: number } {
  const targetH = mobile ? canvasH * 0.58 : canvasH * 0.82;
  const scale = targetH / imgH;
  const w = imgW * scale;
  const h = imgH * scale;
  return { x: (canvasW - w) / 2, y: (canvasH - h) / 2, scale };
}

// ── Side columns drawing ───────────────────────────────────────────────────────
export function drawSideColumns(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  imgLeft: number,
  imgRight: number,
  isRevealed: boolean,
  elapsed: number,
  avgColor: { r: number; g: number; b: number } | null
) {
  const colW = 28;
  const pulse = Math.sin(elapsed * 0.0018) * 0.18 + 0.82;
  const shimmer = Math.sin(elapsed * 0.003) * 0.12 + 0.88;

  const baseColor = isRevealed ? COLORS.POST_BG : COLORS.PRE_BG;
  const accentColor = isRevealed ? COLORS.POST_ACCENT : COLORS.PRE_ACCENT;

  // Columna izquierda
  if (imgLeft > 0) {
    const grad = ctx.createLinearGradient(0, 0, colW, 0);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, imgLeft, canvasH);

    // Línea de acento
    ctx.globalAlpha = pulse * 0.55;
    ctx.fillStyle = accentColor;
    ctx.fillRect(imgLeft - 2, 0, 2, canvasH);
    ctx.globalAlpha = 1;

    // Gradiente de color vivo
    if (avgColor) {
      ctx.globalAlpha = shimmer * 0.18;
      const vividGrad = ctx.createLinearGradient(0, 0, imgLeft, 0);
      vividGrad.addColorStop(0, baseColor);
      vividGrad.addColorStop(1, `rgba(${avgColor.r},${avgColor.g},${avgColor.b},0.6)`);
      ctx.fillStyle = vividGrad;
      ctx.fillRect(0, 0, imgLeft, canvasH);
      ctx.globalAlpha = 1;
    }
  }

  // Columna derecha
  if (imgRight < canvasW) {
    const rightW = canvasW - imgRight;
    const grad = ctx.createLinearGradient(canvasW, 0, canvasW - rightW, 0);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(imgRight, 0, rightW, canvasH);

    // Línea de acento
    ctx.globalAlpha = pulse * 0.55;
    ctx.fillStyle = accentColor;
    ctx.fillRect(imgRight, 0, 2, canvasH);
    ctx.globalAlpha = 1;

    // Gradiente de color vivo
    if (avgColor) {
      ctx.globalAlpha = shimmer * 0.18;
      const vividGrad = ctx.createLinearGradient(canvasW, 0, imgRight, 0);
      vividGrad.addColorStop(0, baseColor);
      vividGrad.addColorStop(1, `rgba(${avgColor.r},${avgColor.g},${avgColor.b},0.6)`);
      ctx.fillStyle = vividGrad;
      ctx.fillRect(imgRight, 0, rightW, canvasH);
      ctx.globalAlpha = 1;
    }
  }
}

// ── Average color computation ──────────────────────────────────────────────────
export function computeAverageColor(img: HTMLImageElement | null): { r: number; g: number; b: number } | null {
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
  } catch {
    return null;
  }
}

// ── Helper: get colors based on reveal state ───────────────────────────────────
export function getColors(isRevealed: boolean) {
  return {
    bg: isRevealed ? COLORS.POST_BG : COLORS.PRE_BG,
    accent: isRevealed ? COLORS.POST_ACCENT : COLORS.PRE_ACCENT,
    text: isRevealed ? COLORS.POST_TEXT : COLORS.PRE_TEXT,
    link: isRevealed ? COLORS.POST_LINK : COLORS.PRE_LINK,
    headerBg: isRevealed ? COLORS.POST_HEADER_BG : COLORS.PRE_HEADER_BG,
    headerBorder: isRevealed ? COLORS.POST_BORDER : COLORS.PRE_BORDER,
    headerGlow: isRevealed ? COLORS.POST_GLOW : COLORS.PRE_GLOW,
    hintBg: isRevealed ? COLORS.POST_HINT_BG : COLORS.PRE_HINT_BG,
    sweep1: isRevealed ? COLORS.SWEEP_POST_1 : COLORS.SWEEP_PRE_1,
    sweep2: isRevealed ? COLORS.SWEEP_POST_2 : COLORS.SWEEP_PRE_2,
  };
}