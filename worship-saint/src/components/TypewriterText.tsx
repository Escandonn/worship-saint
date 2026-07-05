import React, { useEffect, useRef, useState } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Tiempo en ms que el texto permanece visible DESPUÉS de terminar de escribirse. Default: 6000ms */
  readDelay?: number;
  onComplete?: () => void;
  autoHide?: boolean;
}

export default function TypewriterText({
  text,
  speed = 38,
  readDelay = 6000,
  className,
  style,
  onComplete,
  autoHide = true,
}: TypewriterProps) {
  const textRef    = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const typeTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!textRef.current || !wrapperRef.current) return;
    textRef.current.textContent = '';
    wrapperRef.current.style.opacity = '1';
    wrapperRef.current.style.transition = '';
    let i = 0;

    // Escribe letra a letra sin re-renders de React
    typeTimerRef.current = window.setInterval(() => {
      if (textRef.current) textRef.current.textContent = text.slice(0, i + 1);
      i += 1;
      if (i >= text.length) {
        if (typeTimerRef.current) {
          window.clearInterval(typeTimerRef.current);
          typeTimerRef.current = null;
        }
        if (onComplete) onComplete();

        if (autoHide) {
          fadeTimerRef.current = window.setTimeout(() => {
            if (wrapperRef.current) {
              wrapperRef.current.style.transition = 'opacity 2s ease';
              wrapperRef.current.style.opacity = '0';
            }

            fadeTimerRef.current = window.setTimeout(() => {
              setVisible(false);
              fadeTimerRef.current = null;
            }, 2200);
          }, readDelay);
        }
      }
    }, speed);

    return () => {
      if (typeTimerRef.current) {
        window.clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
      }
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [text, speed, readDelay, onComplete]);

  if (!visible) return null;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: 'absolute',
        bottom: '2rem',
        left: '2rem',
        zIndex: 50,
        pointerEvents: 'none',
        width: 'min(340px, calc(100vw - 4rem))',
        minHeight: '10rem',   // reserva espacio fijo → CLS = 0
        opacity: 1,
        ...style,
      }}
    >
      <p
        style={{
          fontFamily: "'Lora', Georgia, serif",
          fontStyle: 'italic',
          fontSize: 'clamp(0.82rem, 1.5vw, 1rem)',
          lineHeight: 1.75,
          color: '#e8e8e8',
          background: 'rgba(0,0,0,0.55)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          margin: 0,
          minHeight: '10rem',
          boxSizing: 'border-box',
        }}
      >
        <span ref={textRef} />
        {/* Cursor dorado parpadea mientras escribe */}
        <span style={{
          display: 'inline-block', width: '2px', height: '1em',
          background: '#D4AF37', marginLeft: '2px',
          verticalAlign: 'text-bottom',
          animation: 'tw-blink 1s step-start infinite',
        }} />
      </p>

      <style>{`@keyframes tw-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
