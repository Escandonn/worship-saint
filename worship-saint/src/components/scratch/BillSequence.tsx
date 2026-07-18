// ─────────────────────────────────────────────────────────────────────────────
// Bill Sequence: Bill corner + Bill central + sus burbujas de diálogo
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { TIMING } from './types';

interface BillSequenceProps {
  finalApplied: boolean;
  billImage?: string;
  billImage2?: string;
  billCentralImage?: string;
  billCentralImage2?: string;
  billIzqImage?: string;
  mobileHeader: boolean;
  onCinematicComplete?: () => void;
}

export function BillSequence({
  finalApplied,
  billImage,
  billImage2,
  billCentralImage,
  billCentralImage2,
  billIzqImage,
  mobileHeader,
  onCinematicComplete,
}: BillSequenceProps) {
  const [showBill, setShowBill] = useState(false);
  const [showBillBubble, setShowBillBubble] = useState(false);
  const [showBillCentral, setShowBillCentral] = useState(false);
  const [showBillCentralBubble, setShowBillCentralBubble] = useState(false);
  const [showBillIzq, setShowBillIzq] = useState(false);
  const [showBillIzqBubble, setShowBillIzqBubble] = useState(false);
  const [billCentralBubbleFading, setBillCentralBubbleFading] = useState(false);
  const [billCentralFading, setBillCentralFading] = useState(false);
  const [billFrame, setBillFrame] = useState(0);
  const [billCentralFrame, setBillCentralFrame] = useState(0);
  const [billFading, setBillFading] = useState(false);
  const billFrameIntervalRef = useRef<number | null>(null);
  const billCentralBlinkRef = useRef<number | null>(null);

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE BILL CORNER (esquina inferior derecha) — Modifica estos valores
  // ══════════════════════════════════════════════════════════════════════════
  const billCornerConfig = mobileHeader
    ? {
        // ── MÓVIL ──
        width:   '160px',  // ancho de la imagen
        height:  '160px',  // alto de la imagen
        bottom:  '100px',      // posición desde el fondo
        right:   '20px',      // posición desde la derecha
      }
    : {
        // ── PC ──
        width:   '240px',  // ancho de la imagen
        height:  '240px',  // alto de la imagen
        bottom:  '0.5rem', // posición desde el fondo
        right:   '1rem',   // posición desde la derecha
      };

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE LA BURBUJA DE BILL CORNER — Modifica estos valores
  // ══════════════════════════════════════════════════════════════════════════
  const billCornerBubbleConfig = mobileHeader
    ? {
        // ── MÓVIL ──
        bottom:   '11rem',   // posición desde el fondo (encima de Bill)
        right:    '1.5rem',   // posición desde la derecha
        maxWidth: '200px',   // ancho máximo
        tailRight:'12px',    // cola de la nube: posición desde la derecha
      }
    : {
        // ── PC ──
        bottom:   '13rem',   // posición desde el fondo (encima de Bill)
        right:    '10rem',   // posición desde la derecha
        maxWidth: '280px',   // ancho máximo
        tailRight:'20px',    // cola de la nube: posición desde la derecha
      };

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE BILL CENTRAL — Modifica estos valores para reposicionar
  // ══════════════════════════════════════════════════════════════════════════
  const billCentralConfig = mobileHeader
    ? {
        // ── MÓVIL ──
        width:      '340px',  // ancho de la imagen
        height:     '280px',  // alto de la imagen
        left:       '10%',    // posición horizontal (usa % o px)
        bottom:     '10px',    // posición desde el fondo
        translateX: '-50%',   // offset horizontal (centrado con left:50%)
        translateY: '0px',    // offset vertical
      }
    : {
        // ── PC ──
        width:      '500px',  // ancho de la imagen
        height:     '500px',  // alto de la imagen
        left:       '37%',    // posición horizontal (usa % o px)
        bottom:     '-160px',    // posición desde el fondo
        translateX: '-50%',   // offset horizontal (centrado con left:50%)
        translateY: '0px',    // offset vertical
      };
  // ══════════════════════════════════════════════════════════════════════════

  // ── Secuencia Bill corner ──────────────────────────────────────────────────
  useEffect(() => {
    if (!finalApplied || !billImage) return;
    const t1 = window.setTimeout(() => setShowBill(true), TIMING.BILL_SHOW);
    const t2 = window.setTimeout(() => setShowBillBubble(true), TIMING.BILL_BUBBLE);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [finalApplied, billImage]);

  // ── Secuencia Bill central ─────────────────────────────────────────────────
  // Bill corner se desvanece cuando aparece Bill central (una a la vez)
  useEffect(() => {
    if (!showBillBubble || !billCentralImage) return;
    const t1 = window.setTimeout(() => {
      setBillFading(true);   // iniciar fade-out de Bill corner + burbuja
      setShowBillCentral(true);
    }, TIMING.BILL_CENTRAL_SHOW);
    // Tras el fade, ocultar completamente Bill corner + burbuja (sin afectar central)
    const t3 = window.setTimeout(() => {
      setShowBill(false);
      setShowBillBubble(false);
      setBillFading(false);
    }, TIMING.BILL_CENTRAL_SHOW + 600);
    return () => { window.clearTimeout(t1); window.clearTimeout(t3); };
  }, [showBillBubble, billCentralImage]);

  // ── Burbuja de Bill central (independiente para no perderse al limpiar timers) ──
  useEffect(() => {
    if (!showBillCentral || !billCentralImage) return;
    const t2 = window.setTimeout(() => {
      setShowBillCentralBubble(true);
      onCinematicComplete?.();
    }, TIMING.BILL_CENTRAL_BUBBLE - TIMING.BILL_CENTRAL_SHOW);
    return () => { window.clearTimeout(t2); };
  }, [showBillCentral, billCentralImage, onCinematicComplete]);

  // ── Alternancia de frames de Bill (animación) ──────────────────────────────
  // Bug 2b fix: usar ref dedicado para que el intervalo sobreviva a limpieza de timers del padre
  useEffect(() => {
    if (!showBill || !billImage2 || billFading) return;
    // Limpiar interval anterior si existe
    if (billFrameIntervalRef.current !== null) {
      window.clearInterval(billFrameIntervalRef.current);
      billFrameIntervalRef.current = null;
    }
    billFrameIntervalRef.current = window.setInterval(() => {
      setBillFrame(f => (f === 0 ? 1 : 0));
    }, TIMING.BILL_FRAME_INTERVAL);
    return () => {
      if (billFrameIntervalRef.current !== null) {
        window.clearInterval(billFrameIntervalRef.current);
        billFrameIntervalRef.current = null;
      }
    };
  }, [showBill, billImage2, billFading]);

  // ── Parpadeo de Bill central (alternancia entre abierto y cerrado) ──────────
  useEffect(() => {
    if (!showBillCentral || !billCentralImage2) return;
    // Limpiar interval anterior si existe
    if (billCentralBlinkRef.current !== null) {
      window.clearInterval(billCentralBlinkRef.current);
      billCentralBlinkRef.current = null;
    }
    billCentralBlinkRef.current = window.setInterval(() => {
      setBillCentralFrame(f => (f === 0 ? 1 : 0));
    }, TIMING.BILL_CENTRAL_BLINK_INTERVAL);
    return () => {
      if (billCentralBlinkRef.current !== null) {
        window.clearInterval(billCentralBlinkRef.current);
        billCentralBlinkRef.current = null;
      }
    };
  }, [showBillCentral, billCentralImage2]);

  // ── Secuencia Bill izquierda (esquina inferior izquierda) ──────────────────
  // 1) Dar tiempo para leer la burbuja central
  // 2) Desvanecer la burbuja central
  // 3) Aparece Bill izquierda con la misma transición slide-in
  useEffect(() => {
    if (!showBillCentralBubble || !billIzqImage) return;
    const base = TIMING.BILL_CENTRAL_BUBBLE;
    // Fade-out de la burbuja central
    const t0 = window.setTimeout(() => setBillCentralBubbleFading(true), TIMING.BILL_CENTRAL_BUBBLE_FADE - base);
    // Fade-out de la imagen de Bill central (ligeramente antes de que aparezca Bill izq)
    const t3 = window.setTimeout(() => setBillCentralFading(true), TIMING.BILL_IZQ_SHOW - base - 400);
    // Bill izquierda aparece tras desvanecerse la burbuja central
    const t1 = window.setTimeout(() => setShowBillIzq(true), TIMING.BILL_IZQ_SHOW - base);
    const t2 = window.setTimeout(() => setShowBillIzqBubble(true), TIMING.BILL_IZQ_BUBBLE - base);
    return () => { window.clearTimeout(t0); window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, [showBillCentralBubble, billIzqImage]);

  if (!finalApplied || !billImage) return null;

  return (
    <>
      <style>{`
        @keyframes billSlideIn {
          0% { transform: translateY(40px) scale(0.7); opacity: 0; }
          60% { transform: translateY(-6px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes billFadeOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        @keyframes bubbleFadeOut {
          0% { opacity: 1; transform: translateX(-50%) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) scale(0.85); }
        }
        @keyframes bubblePopIn {
          0% { transform: scale(0.3) translateY(10px); opacity: 0; }
          50% { transform: scale(1.08) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* ── Bill personaje (esquina inferior derecha) ── */}
      {showBill && (
        <div style={{
          position: 'absolute',
          bottom: billCornerConfig.bottom,
          right: billCornerConfig.right,
          zIndex: 30,
          width: billCornerConfig.width,
          height: billCornerConfig.height,
          animation: billFading
            ? 'billFadeOut 0.6s ease-in forwards'
            : 'billSlideIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          pointerEvents: 'none',
        }}>
          <img
            src={billImage}
            alt="Bill"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
              opacity: billFrame === 0 ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
            }}
          />
          {billImage2 && (
            <img
              src={billImage2}
              alt="Bill"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
                opacity: billFrame === 1 ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
              }}
            />
          )}
        </div>
      )}

      {/* ── Burbuja de Bill ── */}
      {showBillBubble && (
        <div style={{
          position: 'absolute',
          bottom: billCornerBubbleConfig.bottom,
          right: billCornerBubbleConfig.right,
          zIndex: 31,
          maxWidth: billCornerBubbleConfig.maxWidth,
          padding: mobileHeader ? '0.7rem 1rem' : '0.9rem 1.3rem',
          background: 'rgba(255, 255, 255, 0.96)',
          borderRadius: '18px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35), 0 0 16px rgba(212,175,55,0.2)',
          fontFamily: "'Cinzel', serif",
          fontSize: mobileHeader ? '0.72rem' : '0.85rem',
          fontWeight: 700,
          color: '#3a0808',
          lineHeight: 1.4,
          animation: billFading
            ? 'billFadeOut 0.6s ease-in forwards'
            : 'bubblePopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, bubbleFloat 3s ease-in-out 0.5s infinite',
          pointerEvents: 'none',
        }}>
          <span style={{ color: '#5C0000', fontWeight: 800 }}>¡Hola! Soy Bill</span>
          <br />
          <span style={{ color: '#7a1010' }}>y soy la que te explicará todo</span>
          {/* Cola de la nube */}
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            right: billCornerBubbleConfig.tailRight,
            width: '0', height: '0',
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '12px solid rgba(255, 255, 255, 0.96)',
          }} />
        </div>
      )}

      {/* ── Bill izquierda (esquina inferior izquierda) ── */}
      {showBillIzq && billIzqImage && (
        <div style={{
          position: 'absolute',
          bottom: mobileHeader ? '100px' : '0.5rem',
          left: mobileHeader ? '20px' : '1rem',
          zIndex: 30,
          width: mobileHeader ? '160px' : '240px',
          height: mobileHeader ? '160px' : '240px',
          animation: 'billSlideIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          pointerEvents: 'none',
        }}>
          <img
            src={billIzqImage}
            alt="Bill izquierda"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
            }}
          />
        </div>
      )}

      {/* ── Burbuja de Bill izquierda ── */}
      {showBillIzqBubble && (
        <div style={{
          position: 'absolute',
          bottom: mobileHeader ? '11rem' : '13rem',
          left: mobileHeader ? '1.5rem' : '10rem',
          zIndex: 31,
          maxWidth: mobileHeader ? '200px' : '280px',
          padding: mobileHeader ? '0.7rem 1rem' : '0.9rem 1.3rem',
          background: 'rgba(255, 255, 255, 0.96)',
          borderRadius: '18px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35), 0 0 16px rgba(212,175,55,0.2)',
          fontFamily: "'Cinzel', serif",
          fontSize: mobileHeader ? '0.72rem' : '0.85rem',
          fontWeight: 700,
          color: '#3a0808',
          lineHeight: 1.4,
          animation: 'bubblePopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, bubbleFloat 3s ease-in-out 0.5s infinite',
          pointerEvents: 'none',
        }}>
          <span style={{ color: '#5C0000', fontWeight: 800 }}>listo para obtener</span>
          <br />
          <span style={{ color: '#7a1010' }}>nuestros servicios</span>
          {/* Cola de la nube */}
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            left: '12px',
            width: '0', height: '0',
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '12px solid rgba(255, 255, 255, 0.96)',
          }} />
        </div>
      )}

      {/* ── Bill Central (centro inferior) ── */}
      {showBillCentral && billCentralImage && (
        <div style={{
          position: 'absolute',
          left:       billCentralConfig.left,
          bottom:     billCentralConfig.bottom,
          transform:  `translateX(${billCentralConfig.translateX}) translateY(${billCentralConfig.translateY})`,
          zIndex: 30,
          width:      billCentralConfig.width,
          height:     billCentralConfig.height,
          animation: `billSlideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards${billCentralFading ? ', billFadeOut 0.8s ease-in forwards' : ''}`,
          pointerEvents: 'none',
        }}>
          <img
            src={billCentralImage}
            alt="Bill Central"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
              opacity: billCentralFrame === 0 ? 1 : 0,
              transition: 'opacity 0.08s ease-in-out',
            }}
          />
          {billCentralImage2 && (
            <img
              src={billCentralImage2}
              alt="Bill Central"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
                opacity: billCentralFrame === 1 ? 1 : 0,
                transition: 'opacity 0.08s ease-in-out',
              }}
            />
          )}
        </div>
      )}

      {/* ── Burbuja de Bill Central ── */}
      {showBillCentralBubble && (
        <div style={{
          position: 'absolute',
          bottom: mobileHeader ? '12rem' : '14rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 31,
          maxWidth: mobileHeader ? '240px' : '360px',
          padding: mobileHeader ? '0.8rem 1.1rem' : '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,248,220,0.98) 50%, rgba(255,255,255,0.98) 100%)',
          borderRadius: '18px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.45), 0 0 20px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.8)',
          border: '1px solid rgba(212,175,55,0.3)',
          fontFamily: "'Cinzel', serif",
          fontSize: mobileHeader ? '0.7rem' : '0.82rem',
          fontWeight: 700,
          color: '#3a0808',
          lineHeight: 1.5,
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(255,255,255,0.8)',
          animation: `bubblePopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, bubbleFloat 3s ease-in-out 0.5s infinite${billCentralBubbleFading ? ', bubbleFadeOut 0.8s ease-in forwards' : ''}`,
          pointerEvents: 'none',
        }}>
          <span style={{ color: '#5C0000', fontWeight: 800 }}>¡Worship es una entidad de estudio</span>
          <br />
          <span style={{ color: '#7a1010' }}>que desarrolla páginas web y software de calidad.</span>
          <br />
          <span style={{ color: '#5C0000', fontWeight: 800 }}>Tiene su tienda de ecommerces</span>
          <br />
          <span style={{ color: '#7a1010' }}>y financia su club de fútbol.</span>
          <br />
          <span style={{ color: '#5C0000', fontWeight: 800 }}>Seguimos las enseñanzas de nuestro maestro Samuel.</span>
          {/* Cola de la nube */}
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0', height: '0',
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '12px solid rgba(255, 248, 220, 0.98)',
          }} />
        </div>
      )}
    </>
  );
}