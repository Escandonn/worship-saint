import type { PointerState } from './usePointer';

export function drawBrush(ctx: CanvasRenderingContext2D, state: PointerState, brushSize: number) {
  if (state.x === null || state.y === null || state.lastX === null || state.lastY === null) return;

  const dist = Math.sqrt(
    Math.pow(state.x - state.lastX, 2) + Math.pow(state.y - state.lastY, 2)
  );
  
  const angle = Math.atan2(state.y - state.lastY, state.x - state.lastX);

  // Modo destination-out borra los píxeles donde dibujamos, dejando ver la imagen inferior
  ctx.globalCompositeOperation = 'destination-out';

  // Interpolación para no dejar huecos si el usuario mueve el dedo muy rápido
  const step = Math.max(1, brushSize / 6);
  for (let i = 0; i <= dist; i += step) {
    const drawX = state.lastX + Math.cos(angle) * i;
    const drawY = state.lastY + Math.sin(angle) * i;

    // Gradiente radial para lograr el borde suave (soft-edge) luminoso
    const gradient = ctx.createRadialGradient(
      drawX, drawY, 0,
      drawX, drawY, brushSize / 2
    );
    // Un núcleo fuerte que se difumina progresivamente
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(drawX, drawY, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
