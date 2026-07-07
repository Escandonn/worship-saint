// ─────────────────────────────────────────────────────────────────────────────
// Header / NavBar del componente ScratchReveal
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { getColors } from './types';

interface HeaderProps {
  isRevealed: boolean;
  headerVisible: boolean;
  mobileHeader: boolean;
}

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Nuestras obras', href: '#nuestras-obras' },
  { label: 'Quiénes somos', href: '#quienes-somos' },
  { label: 'Servicios', href: '#servicios' },
];

export function Header({ isRevealed, headerVisible, mobileHeader }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const c = getColors(isRevealed);

  return (
    <>
      <style>{`
        .sweep-text { position: relative; display: inline-block; overflow: hidden; }
        .sweep-text .sweep-bar { position: absolute; left: -160%; top: -10%; height: 120%; width: 160%;
          background: linear-gradient(90deg, transparent 0%, var(--sweep-color-1, rgba(255,255,255,0.95)) 45%, var(--sweep-color-2, rgba(255,255,255,0.6)) 55%, transparent 100%);
          transform: skewX(-18deg);
          pointer-events: none; opacity: 0.95; }
        @keyframes sweepLR { from { left: -160%; } to { left: 160%; } }
        .sweep-on .sweep-bar { animation: sweepLR 1.6s ease-in-out forwards; }
      `}</style>

      <header style={{
        position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 50,
        padding: mobileHeader ? '14px 18px' : '12px 20px',
        display: 'flex', flexDirection: 'column', gap: mobileHeader ? '0.85rem' : '0.75rem',
        alignItems: 'center',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: c.headerBg,
        borderBottom: `1px solid ${c.headerBorder}`,
        boxShadow: c.headerGlow,
        transition: 'background-color 1.2s ease, box-shadow 1.2s ease, border-color 1.2s ease, padding 0.3s ease',
        ...(isRevealed
          ? { ['--sweep-color-1' as any]: '#FFD27A', ['--sweep-color-2' as any]: '#FFFFFF' }
          : { ['--sweep-color-1' as any]: '#9CFFB8', ['--sweep-color-2' as any]: '#FFFFFF' }
        ) as React.CSSProperties,
      }}>
        <div style={{
          width: '100%', maxWidth: '1260px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          {/* ── Brand ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.72rem' }}>
            <span aria-hidden="true" style={{
              display: 'inline-block', width: '16px', height: '16px', background: c.accent,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', transform: 'translateY(-1px)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
              <span className={headerVisible ? 'sweep-text sweep-on' : 'sweep-text'} style={{
                color: c.text,
                fontFamily: "'Cinzel', serif",
                fontSize: mobileHeader ? '0.82rem' : '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                textShadow: isRevealed
                  ? '0 0 16px rgba(212,175,55,0.6), 0 0 32px rgba(212,175,55,0.3)'
                  : '0 0 16px rgba(0,255,136,0.5), 0 0 32px rgba(0,255,136,0.25)',
              }}>
                Worship-Saint
                <span className="sweep-bar" />
              </span>
              <span className={headerVisible ? 'sweep-text sweep-on' : 'sweep-text'} style={{
                color: c.accent,
                fontFamily: "'Cinzel', serif",
                fontSize: mobileHeader ? '0.62rem' : '0.64rem',
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                textShadow: isRevealed
                  ? '0 0 12px rgba(212,175,55,0.5), 0 0 24px rgba(212,175,55,0.25)'
                  : '0 0 12px rgba(0,255,136,0.4), 0 0 24px rgba(0,255,136,0.2)',
              }}>
                Estudio de impacto
                <span className="sweep-bar" />
              </span>
            </div>
          </div>

          {/* ── Desktop Nav ── */}
          {mobileHeader ? (
            <button
              type="button"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(prev => !prev)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '42px', height: '42px', borderRadius: '999px',
                border: `1px solid ${c.link}`, background: 'rgba(255,255,255,0.06)',
                color: c.link, cursor: 'pointer', transition: 'transform 0.2s ease',
              }}
            >
              <span style={{
                width: '20px', height: '2px', background: c.link, display: 'block',
                boxShadow: `0 -6px 0 ${c.link}, 0 6px 0 ${c.link}`,
                transform: menuOpen ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s ease',
              }} />
            </button>
          ) : (
            <nav aria-label="Navegación principal" style={{
              display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center',
            }}>
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    color: c.link,
                    fontFamily: "'Cinzel', serif",
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    transition: 'color 0.25s ease',
                    textShadow: isRevealed
                      ? '0 0 10px rgba(212,175,55,0.4)'
                      : '0 0 10px rgba(0,255,136,0.3)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = c.link; }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      {mobileHeader && menuOpen && headerVisible && (
        <nav aria-label="Menú móvil" style={{
          position: 'absolute', top: '72px', right: 18, left: 18,
          zIndex: 51, display: 'flex', flexDirection: 'column', gap: '0.75rem',
          padding: '1rem', background: 'rgba(0,0,0,0.72)', borderRadius: '18px',
          border: `1px solid ${c.link}`, backdropFilter: 'blur(14px)',
          boxShadow: '0 18px 50px rgba(0,0,0,0.25)',
          transition: 'opacity 0.25s ease',
        }}>
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: c.link,
                fontFamily: "'Cinzel', serif",
                fontSize: '0.96rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '0.9rem 1rem',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)',
                transition: 'background 0.25s ease',
                textShadow: isRevealed
                  ? '0 0 10px rgba(212,175,55,0.4)'
                  : '0 0 10px rgba(0,255,136,0.3)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}