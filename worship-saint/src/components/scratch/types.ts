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
  billCentralImage2?: string;
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
  BILL_SHOW: 150,           // cuándo aparece Bill tras finalApplied
  BILL_BUBBLE: 700,         // cuándo aparece burbuja de Bill
  // Bill central
  BILL_CENTRAL_SHOW: 1000, // cuándo aparece Bill central tras burbuja Bill
  BILL_CENTRAL_BUBBLE: 2000,// cuándo aparece burbuja de Bill central
  BILL_FRAME_INTERVAL: 400,// alternancia de frames de Bill (ms)
  BILL_CENTRAL_BLINK_INTERVAL: 1500, // intervalo de parpadeo de Bill central (ms)
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
  // La imagen ocupa toda la altura (100vh), anclada arriba, sin espacio inferior
  // El espacio restante a los lados lo ocupan las paredes laterales con colores del personaje
  const scale = canvasH / imgH;
  const w = imgW * scale;
  const h = imgH * scale;
  return { x: (canvasW - w) / 2, y: 0, scale };
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
  const pulse = Math.sin(elapsed * 0.0018) * 0.18 + 0.82;
  const shimmer = Math.sin(elapsed * 0.003) * 0.12 + 0.88;

  // 2 tipos de colores acorde al personaje:
  // Pre-reveal (Doctor Doom — verde): base oscura + acento verde neón
  // Post-reveal (Iron Man — rojo/dorado): base roja + acento dorado
  const baseColor = isRevealed ? COLORS.POST_BG : COLORS.PRE_BG;
  const baseColor2 = isRevealed ? COLORS.POST_PRIMARY : COLORS.PRE_BG2;
  const accentColor = isRevealed ? COLORS.POST_ACCENT : COLORS.PRE_ACCENT;

  // Columna izquierda — ocupa todo el espacio desde el borde hasta la imagen
  if (imgLeft > 0) {
    const leftW = imgLeft;

    // Capa 1: gradiente base del personaje (2 tonos)
    const grad = ctx.createLinearGradient(0, 0, leftW, 0);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.5, baseColor2);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, leftW, canvasH);

    // Capa 2: línea de acento junto a la imagen (color del personaje)
    ctx.globalAlpha = pulse * 0.55;
    ctx.fillStyle = accentColor;
    ctx.fillRect(imgLeft - 2, 0, 2, canvasH);
    ctx.globalAlpha = 1;

    // Capa 3: gradiente de color vivo (promedio de la imagen)
    if (avgColor) {
      ctx.globalAlpha = shimmer * 0.18;
      const vividGrad = ctx.createLinearGradient(0, 0, leftW, 0);
      vividGrad.addColorStop(0, baseColor);
      vividGrad.addColorStop(1, `rgba(${avgColor.r},${avgColor.g},${avgColor.b},0.6)`);
      ctx.fillStyle = vividGrad;
      ctx.fillRect(0, 0, leftW, canvasH);
      ctx.globalAlpha = 1;
    }
  }

  // Columna derecha — ocupa todo el espacio desde la imagen hasta el borde
  if (imgRight < canvasW) {
    const rightW = canvasW - imgRight;

    // Capa 1: gradiente base del personaje (2 tonos)
    const grad = ctx.createLinearGradient(canvasW, 0, canvasW - rightW, 0);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.5, baseColor2);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(imgRight, 0, rightW, canvasH);

    // Capa 2: línea de acento junto a la imagen (color del personaje)
    ctx.globalAlpha = pulse * 0.55;
    ctx.fillStyle = accentColor;
    ctx.fillRect(imgRight, 0, 2, canvasH);
    ctx.globalAlpha = 1;

    // Capa 3: gradiente de color vivo (promedio de la imagen)
    if (avgColor) {
      ctx.globalAlpha = shimmer * 0.18;
      const vividGrad = ctx.createLinearGradient(canvasW, 0, canvasW - rightW, 0);
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