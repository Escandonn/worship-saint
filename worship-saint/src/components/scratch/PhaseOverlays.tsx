// ─────────────────────────────────────────────────────────────────────────────
// Overlays de fase: hint, marketing typewriter, skip button
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { TypewriterText } from '../TypewriterText';
import { TIMING } from './types';

interface PhaseOverlaysProps {
  phase: number;
  showHint: boolean;
  showMarketing: boolean;
  textComplete: boolean;
  mobileHeader: boolean;
  isRevealed: boolean;
  skipped: boolean;
  skipFading: boolean;
  handleSkip: () => void;
  onTypewriterComplete?: () => void;
}

const MARKETING_TEXT = 'Donde la fe se encuentra con la innovación. Creamos experiencias digitales que honran la grandeza.';

export function PhaseOverlays({
  phase,
  showHint,
  showMarketing,
  textComplete,
  mobileHeader,
  isRevealed,
  skipped,
  skipFading,
  handleSkip,
  onTypewriterComplete,
}: PhaseOverlaysProps) {
  const [skipVisible, setSkipVisible] = useState(false);

  // Mostrar skip button tras hint
  useEffect(() => {
    if (showHint) {
      const t = window.setTimeout(() => setSkipVisible(true), 800);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [showHint]);

  // Ocultar skip button cuando se salta
  useEffect(() => {
    if (skipped) setSkipVisible(false);
  }, [skipped]);

  return (
    <>
      <style>{`
        @keyframes hintPulse {
          0%, 100% { opacity: 0.75; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
        }
        @keyframes skipFade {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(18px); }
        }
      `}</style>

      {/* ── Hint overlay ── */}
      {showHint && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem',
          pointerEvents: 'none',
          animation: 'hintPulse 2.4s ease-in-out infinite',
        }}>
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: mobileHeader ? '1.05rem' : '1.35rem',
            fontWeight: 700,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#ffffff',
            textShadow: '0 0 22px rgba(0,255,136,0.7), 0 0 44px rgba(0,255,136,0.35)',
          }}>
            Rasca la imagen
          </span>
          <svg width={mobileHeader ? '36' : '48'} height={mobileHeader ? '36' : '48'} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L8 6H4V10L0 14L4 18V22H8L12 18L16 22H20V18L24 14L20 10V6H16L12 2Z"
              fill="rgba(0,255,136,0.25)" stroke="rgba(0,255,136,0.7)" strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* ── Marketing typewriter ── */}
      {showMarketing && (
        <div style={{
          position: 'absolute',
          bottom: mobileHeader ? '12rem' : '10rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          width: '90%',
          maxWidth: mobileHeader ? '340px' : '600px',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <TypewriterText
            text={MARKETING_TEXT}
            speed={28}
            onComplete={onTypewriterComplete}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: mobileHeader ? '0.88rem' : '1.05rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#F5E2A0',
              textShadow: '0 0 18px rgba(245,226,160,0.5), 0 0 36px rgba(245,226,160,0.25)',
              lineHeight: 1.7,
            }}
          />
        </div>
      )}

      {/* ── Skip button ── */}
      {skipVisible && !skipped && (
        <button
          type="button"
          onClick={handleSkip}
          style={{
            position: 'absolute',
            bottom: mobileHeader ? '1.2rem' : '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
            padding: '0.55rem 1.6rem',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(0,255,136,0.35)',
            borderRadius: '999px',
            color: '#00ff88',
            fontFamily: "'Cinzel', serif",
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease, background 0.25s ease, border-color 0.25s ease',
            animation: skipFading ? 'skipFade 0.3s ease forwards' : 'none',
            textShadow: '0 0 10px rgba(0,255,136,0.5)',
          }}
          onMouseEnter={e => {
            if (!skipFading) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,136,0.12)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,255,136,0.7)';
            }
          }}
          onMouseLeave={e => {
            if (!skipFading) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,255,136,0.35)';
            }
          }}
        >
          Saltar
        </button>
      )}
    </>
  );
}