import React from 'react';
import { iaServiceConfig, getAISummary } from '../services/ai/aiService';

const AIServiceCard: React.FC = () => {
  return (
    <div style={{
      position: 'absolute', right: '1.5rem', bottom: '1.5rem', zIndex: 55,
      width: '300px', maxWidth: 'calc(100vw - 3rem)',
      padding: '1rem 1.25rem', borderRadius: '28px',
      background: 'rgba(11, 10, 25, 0.95)', border: '1px solid rgba(255,215,0,0.18)',
      boxShadow: '0 32px 100px rgba(0,0,0,0.45)',
      backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: '68px', height: '68px', borderRadius: '22px',
          padding: '6px',
          background: 'linear-gradient(135deg, #ffe67d 0%, #f7b400 50%, #d18505 100%)',
          border: '1px solid rgba(255,215,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 18px 36px rgba(255, 190, 60, 0.2)',
        }}>
          <div style={{
            width: '100%', height: '100%', background: '#111',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: 'radial-gradient(circle, #fff, rgba(255,255,255,0.08))',
              boxShadow: '0 0 18px rgba(255,255,255,0.45)',
            }} />
            <div style={{
              position: 'absolute', top: '18%', left: '50%', width: '5px', height: '5px',
              background: '#ff4444', borderRadius: '50%', transform: 'translateX(-50%)',
            }} />
          </div>
        </div>
        <div style={{ flex: 1, color: '#fde5a8', fontFamily: "'Cinzel', serif" }}>
          <div style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.2rem', color: '#fee08b' }}>
            {iaServiceConfig.name}
          </div>
          <div style={{ fontSize: '0.8rem', lineHeight: 1.4, color: '#f5f5f5' }}>
            {iaServiceConfig.headline}
          </div>
        </div>
      </div>
      <div style={{ marginTop: '0.95rem', color: '#f8e7b2', fontSize: '0.88rem', lineHeight: 1.4, letterSpacing: '0.02em' }}>
        <div style={{ marginBottom: '0.55rem', fontWeight: 700, color: '#ffdd6d' }}>
          Hola bill cyber, la IA del todo poderoso.
        </div>
        {getAISummary()}
      </div>
    </div>
  );
};

export default AIServiceCard;
