import { useEffect, useRef } from 'react';

export interface PointerState {
  x: number | null;
  y: number | null;
  lastX: number | null;
  lastY: number | null;
  isDrawing: boolean;
  speed: number;
}

export function usePointer(containerRef: React.RefObject<HTMLElement | null>) {
  const state = useRef<PointerState>({
    x: null,
    y: null,
    lastX: null,
    lastY: null,
    isDrawing: false,
    speed: 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updatePoint = (clientX: number, clientY: number, drawing: boolean) => {
      const rect = el.getBoundingClientRect();
      const newX = clientX - rect.left;
      const newY = clientY - rect.top;

      const current = state.current;
      
      // Update last position
      if (!current.isDrawing && drawing) {
         current.lastX = newX;
         current.lastY = newY;
      } else {
         current.lastX = current.x !== null ? current.x : newX;
         current.lastY = current.y !== null ? current.y : newY;
      }
      
      current.x = newX;
      current.y = newY;
      current.isDrawing = drawing;

      // Calculate instant speed (distance between last and current point)
      if (current.lastX !== null && current.lastY !== null) {
        const dx = newX - current.lastX;
        const dy = newY - current.lastY;
        current.speed = Math.sqrt(dx * dx + dy * dy);
      } else {
        current.speed = 0;
      }
    };

    const handlePointerDown = (e: Event) => {
      const pe = e as PointerEvent;
      pe.preventDefault();
      updatePoint(pe.clientX, pe.clientY, true);
    };

    const handlePointerMove = (e: Event) => {
      const pe = e as PointerEvent;
      if (!state.current.isDrawing) return;
      pe.preventDefault();
      updatePoint(pe.clientX, pe.clientY, true);
    };

    const handlePointerUp = () => {
      const current = state.current;
      current.isDrawing = false;
      current.speed = 0;
      current.lastX = null;
      current.lastY = null;
    };

    const handlePointerEnter = (e: Event) => {
      const pe = e as PointerEvent;
      if (state.current.isDrawing) {
        updatePoint(pe.clientX, pe.clientY, true);
      }
    };

    const handlePointerLeave = () => {
      state.current.isDrawing = false;
      state.current.speed = 0;
      state.current.lastX = null;
      state.current.lastY = null;
    };

    // Use passive: false so we can preventDefault and stop scroll on touch
    el.addEventListener('pointerdown', handlePointerDown as EventListener, { passive: false });
    el.addEventListener('pointermove', handlePointerMove as EventListener, { passive: false });
    el.addEventListener('pointerup', handlePointerUp as EventListener, { passive: true });
    el.addEventListener('pointercancel', handlePointerUp as EventListener, { passive: true });
    el.addEventListener('pointerenter', handlePointerEnter as EventListener, { passive: true });
    el.addEventListener('pointerleave', handlePointerLeave as EventListener, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown as EventListener);
      el.removeEventListener('pointermove', handlePointerMove as EventListener);
      el.removeEventListener('pointerup', handlePointerUp as EventListener);
      el.removeEventListener('pointercancel', handlePointerUp as EventListener);
      el.removeEventListener('pointerenter', handlePointerEnter as EventListener);
      el.removeEventListener('pointerleave', handlePointerLeave as EventListener);
    };
  }, [containerRef]);

  return state;
}
