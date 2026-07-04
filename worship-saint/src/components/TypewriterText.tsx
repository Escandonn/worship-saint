import React, { useEffect, useRef, useState } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Tiempo en ms que el texto permanece visible DESPUÉS de terminar de escribirse. Default: 6000ms */
  readDelay?: number;
}

export default function TypewriterText({
  text,
  speed = 38,
  readDelay = 6000,
  className,
  style,
}: TypewriterProps) {
  const textRef    = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.textContent = '';
    let i = 0;

    // Escribe letra a letra sin re-renders de React
    const typeId = setInterval(() => {
      if (textRef.current) textRef.current.textContent = text.slice(0, i + 1);
      i++;
      if (i >= text.length) {
        clearInterval(typeId);

        // Después del tiempo de lectura, fade-out suave
        const fadeId = setTimeout(() => {
          if (wrapperRef.current) {
            wrapperRef.current.style.opacity = '0';
            wrapperRef.current.style.transition = 'opacity 1.2s ease';
          }
          // Una vez invisible lo ocultamos del todo (no sigue ocupando espacio Z)
          const removeId = setTimeout(() => setVisible(false), 1300);
          return () => clearTimeout(removeId);
        }, readDelay);

        return () => clearTimeout(fadeId);
      }
    }, speed);

    return () => clearInterval(typeId);
  }, [text, speed, readDelay]);

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
