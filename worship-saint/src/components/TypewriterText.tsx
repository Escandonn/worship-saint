import React, { useEffect, useRef, useState } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Si es false, no dibuja recuadro de fondo sobre el texto. */
  bubble?: boolean;
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
  bubble = true,
  onComplete,
  autoHide = true,
}: TypewriterProps) {
  const textRef    = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef<(() => void) | undefined>(onComplete);
  const typeTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!textRef.current || !wrapperRef.current) return;
    textRef.current.textContent = '';
    wrapperRef.current.style.opacity = '1';
    wrapperRef.current.style.transition = '';
    completedRef.current = false;
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
        if (!completedRef.current) {
          completedRef.current = true;
          if (onCompleteRef.current) onCompleteRef.current();
        }

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
  }, [text, speed, readDelay, autoHide]);

  if (!visible) return null;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: bubble ? 'absolute' : 'static',
        bottom: bubble ? '2rem' : undefined,
        left: bubble ? '2rem' : undefined,
        zIndex: bubble ? 50 : undefined,
        pointerEvents: 'none',
        width: bubble ? 'min(340px, calc(100vw - 4rem))' : 'auto',
        minHeight: bubble ? '10rem' : '0',
        opacity: 1,
        background: 'transparent',
        display: bubble ? 'block' : 'inline-block',
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
          background: 'transparent',
          padding: 0,
          borderRadius: 0,
          border: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          margin: 0,
          minHeight: 'auto',
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
