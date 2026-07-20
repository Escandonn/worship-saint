import React, { useState, useEffect } from 'react';

const links = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nuestras obras', href: '#nuestras-obras' },
  { label: 'Quiénes somos', href: '#quienes-somos' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const check = () => {
      setRevealed(document.body.classList.contains('scroll-enabled'));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Pre-reveal (verde) / Post-reveal (rojo/dorado)
  const c = revealed
    ? {
        bg: 'rgba(120, 8, 8, 0.92)',
        border: 'rgba(212, 175, 55, 0.45)',
        glow: '0 0 20px rgba(212, 175, 55, 0.2)',
        accent: '#D4AF37',
        text: '#F5E2A0',
        hover: '#FFD700',
        hoverGlow: 'rgba(255, 215, 0, 0.8)',
        mark: '#D4AF37',
        textShadow: '0 0 16px rgba(212, 175, 55, 0.6), 0 0 32px rgba(212, 175, 55, 0.3)',
      }
    : {
        bg: 'rgba(4, 28, 4, 0.92)',
        border: 'rgba(80, 200, 80, 0.3)',
        glow: '0 0 20px rgba(0, 255, 136, 0.15)',
        accent: '#00ff88',
        text: '#C7FFCD',
        hover: '#9CFFB8',
        hoverGlow: 'rgba(0, 255, 136, 0.8)',
        mark: '#00ff88',
        textShadow: '0 0 16px rgba(0, 255, 136, 0.5), 0 0 32px rgba(0, 255, 136, 0.25)',
      };

  return (
    <>
      <style>{`
        .site-nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          max-width: 100vw;
          box-sizing: border-box;
          z-index: 1000;
          padding: 14px 20px;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: background-color 1.2s ease, border-color 1.2s ease, box-shadow 1.2s ease;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.72rem;
          text-decoration: none;
        }
        .brand-mark {
          display: inline-block;
          width: 16px;
          height: 16px;
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          transition: background-color 1.2s ease;
        }
        .brand-copy {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          transition: color 1.2s ease, text-shadow 1.2s ease;
        }
        .menu-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          cursor: pointer;
          flex-direction: column;
          gap: 4px;
          padding: 0;
          transition: border-color 1.2s ease, color 1.2s ease;
        }
        .menu-toggle span {
          width: 20px;
          height: 5px;
          display: block;
          transition: background-color 1.2s ease;
        }
        .nav-links {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          justify-content: flex-end;
          align-items: center;
        }
        .nav-links a {
          font-family: 'Cinzel', serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }
        @media (max-width: 768px) {
          .menu-toggle {
            display: flex;
          }
          .nav-links {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
            border-bottom: 1px solid;
          }
          .nav-links.show {
            display: flex;
          }
        }
      `}</style>

      <header
        className="site-nav"
        style={{
          backgroundColor: c.bg,
          borderBottom: `1px solid ${c.border}`,
          boxShadow: c.glow,
        }}
      >
        <a className="brand" href="#inicio" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true" style={{ backgroundColor: c.mark }} />
          <span
            className="brand-copy"
            style={{ color: c.text, textShadow: c.textShadow }}
          >
            Worship-Saint
          </span>
        </a>

        <button
          type="button"
          className={`menu-toggle ${open ? 'open' : ''}`}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen(prev => !prev)}
          style={{ border: `1px solid ${c.accent}`, color: c.accent }}
        >
          <span style={{ backgroundColor: c.accent }} />
          <span style={{ backgroundColor: c.accent }} />
          <span style={{ backgroundColor: c.accent }} />
        </button>

        <nav
          className={`nav-links ${open ? 'show' : ''}`}
          aria-label="Navegación principal"
          style={{
            backgroundColor: open ? c.bg : 'transparent',
            borderBottomColor: open ? c.border : 'transparent',
          }}
        >
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{ color: c.text }}
              onMouseEnter={e => {
                e.currentTarget.style.color = c.hover;
                e.currentTarget.style.textShadow = `0 0 12px ${c.hoverGlow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = c.text;
                e.currentTarget.style.textShadow = 'none';
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>
    </>
  );
}
