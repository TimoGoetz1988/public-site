import { useState, useEffect } from 'react';

const links = [
  { href: '/#showcase', label: 'Services' },
  { href: '/projects', label: 'Projekte' },
  { href: '/about', label: 'Über mich' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
        transition: 'background 0.25s, border-color 0.25s',
      }}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-sm"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        <a
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 hover:opacity-75 transition-opacity"
        >
          <span
            style={{
              border: '1px solid var(--border-2)',
              color: 'var(--accent)',
              background: 'var(--bg-card)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-xs font-medium"
          >
            TG
          </span>
          <span style={{ color: 'var(--text)', letterSpacing: '0.06em' }} className="text-xs font-semibold uppercase">
            Timo Goetz
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                style={{ color: 'var(--muted)' }}
                className="text-sm transition-colors hover:text-[var(--text)]"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="hidden md:inline-flex btn-ghost text-xs py-2 px-4"
        >
          Kontakt
        </a>

        <button
          style={{ color: 'var(--muted)' }}
          className="md:hidden text-sm"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {open && (
        <div
          style={{ borderTop: '1px solid var(--border)', background: 'rgba(8,8,8,0.97)' }}
          className="md:hidden px-6 py-6 flex flex-col gap-5"
        >
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ color: 'var(--muted)' }}
              className="text-sm hover:text-[var(--text)] transition-colors"
            >
              {label}
            </a>
          ))}
          <a href="#contact" className="btn-primary text-center mt-2">
            Kontakt
          </a>
        </div>
      )}
    </header>
  );
}
