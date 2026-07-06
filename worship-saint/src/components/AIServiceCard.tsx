import React, { useEffect, useRef, useState } from 'react';
import TypewriterText from './TypewriterText';
import { iaServiceConfig, getAISummary } from '../services/ai/aiService';
import bill from '../assets/bill.jpg';
import emogin from '../assets/emogin.jpg';

const AIServiceCard: React.FC = () => {
  const [stage, setStage] = useState<'intro' | 'min'>('intro');
  const [isMobile, setIsMobile] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 768);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 50);
    return () => window.clearTimeout(timer);
  }, []);

  if (stage === 'min') {
    return (
      <>
        {chatOpen && (
          <div style={{
            position: 'fixed', right: '1rem', bottom: '5.5rem', zIndex: 65,
            width: isMobile ? '88vw' : '320px', maxWidth: '340px',
            padding: '1rem', borderRadius: '24px',
            background: 'rgba(8, 12, 24, 0.98)', border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 28px 90px rgba(0,0,0,0.45)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ color: '#ffdd6d', fontWeight: 700, fontSize: '0.95rem' }}>Chat Bill</div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>Cerrar</button>
            </div>
            <div style={{ color: '#f5f3e8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '0.75rem', padding: '0.75rem', borderRadius: '18px', background: 'rgba(255,255,255,0.04)' }}>
                Hola, soy Bill. Toca el icono para seguir hablando y descubrir todo.
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '18px', background: 'rgba(255,255,255,0.06)', color: '#dcd8c7' }}>
                Este es un chat demo solo en frontend.
              </div>
            </div>
          </div>
        )}

        <div style={{
          position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 60,
          width: '72px', height: '72px', borderRadius: '999px', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 18px 48px rgba(0,0,0,0.45)', cursor: 'pointer',
          transition: 'transform 0.45s ease, opacity 0.45s ease, box-shadow 0.35s ease',
          transform: entered ? 'translateX(0)' : 'translateX(20px)',
          opacity: entered ? 1 : 0,
        }}
        onClick={() => setChatOpen(open => !open)}>
          <img src={emogin.src} alt="emogin" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }} />
        </div>
        <div style={{
          position: 'fixed', right: '1.1rem', bottom: '5.15rem', zIndex: 61,
          width: 'max-content', maxWidth: 'calc(100vw - 3rem)',
          padding: '0.45rem 0.9rem', borderRadius: '999px',
          background: 'rgba(6, 10, 18, 0.95)',
          color: '#fff', fontSize: '0.78rem', lineHeight: 1.4,
          textAlign: 'center', boxShadow: '0 14px 36px rgba(0,0,0,0.35)'
        }}>
          Presiona y se abre el chat
        </div>
      </>
    );
  }

  const imageWidth = isMobile ? '72vw' : '360px';
  const imageHeight = isMobile ? 'min(70vw, 340px)' : '420px';
  const textTop = isMobile ? '0.5rem' : '1rem';

  return (
    <div style={{
      position: 'fixed', right: isMobile ? '50%' : '1.5rem', bottom: isMobile ? '1.25rem' : '1.5rem',
      transform: isMobile ? 'translateX(50%)' : 'none',
      zIndex: 55,
      width: imageWidth,
      maxWidth: '92vw',
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        position: 'relative', width: '100%', overflow: 'hidden',
        boxShadow: '0 28px 90px rgba(0,0,0,0.38)',
        transform: entered ? 'translateX(0)' : 'translateX(-22px)',
        opacity: entered ? 1 : 0,
        transition: 'transform 0.5s ease, opacity 0.5s ease'
      }}>
        <img src={bill.src} alt="Bill" style={{
          width: '100%', height: imageHeight,
          objectFit: 'contain', objectPosition: 'center top',
          display: 'block', background: 'transparent'
        }} />
        <div style={{
          position: 'absolute', top: textTop, left: '50%', transform: 'translateX(-50%)',
          width: isMobile ? '90%' : '86%',
          color: '#fff', textAlign: 'center',
          fontFamily: "'Cinzel', serif", fontSize: isMobile ? '0.92rem' : '1rem',
          fontWeight: 700, letterSpacing: '0.08em',
          textShadow: '0 14px 22px rgba(0,0,0,0.35)'
        }}>
          <TypewriterText
            text="Hola, soy Bill — la IA que te ayuda y te explicará todo."
            speed={52}
            readDelay={2600}
            bubble={false}
            autoHide={false}
            style={{ position: 'static', width: '100%', background: 'transparent', padding: 0, color: '#fff', fontSize: 'inherit', fontWeight: 'inherit', textAlign: 'center' }}
            className="bill-image-text"
            onComplete={() => {
              window.setTimeout(() => setStage('min'), 4200);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AIServiceCard;
