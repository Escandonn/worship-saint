import React, { useState } from 'react';

const links = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nuestras obras', href: '#nuestras-obras' },
  { label: 'Quiénes somos', href: '#quienes-somos' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-nav">
      <a className="brand" href="#inicio" onClick={() => setOpen(false)}>
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-copy">Worship-Saint</span>
      </a>

      <button
        type="button"
        className={`menu-toggle ${open ? 'open' : ''}`}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`nav-links ${open ? 'show' : ''}`} aria-label="Navegación principal">
        {links.map(link => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
