import { useState, useEffect } from 'react';

const links = [
  { href: '/projects', label: 'Projekte' },
  { href: '/about',    label: 'Über mich' },
  { href: '/contact',  label: 'Kontakt' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <header
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(250,250,248,0.9)' }}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-sm"
    >
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

        <a
          href="/"
          onClick={() => setOpen(false)}
          style={{ color: 'var(--text)', letterSpacing: '0.1em' }}
          className="text-xs font-semibold uppercase hover:opacity-50 transition-opacity"
        >
          Timo Goetz
        </a>

        <ul className="hidden md:flex items-center gap-10">
          {links.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                style={{ color: pathname === href ? 'var(--text)' : 'var(--muted)' }}
                className="text-sm transition-colors hover:opacity-70"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="/contact"
          style={{ background: 'var(--text)', color: 'var(--bg)' }}
          className="hidden md:inline-flex text-xs font-medium px-4 py-2 rounded-sm hover:opacity-80 transition-opacity tracking-wide"
        >
          Kontakt
        </a>

        <button
          style={{ color: 'var(--muted)' }}
          className="md:hidden text-sm"
          onClick={() => setOpen(!open)}
          aria-label="Menü öffnen"
        >
          {open ? 'Schließen' : 'Menü'}
        </button>
      </nav>

      {open && (
        <div
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
          className="md:hidden px-6 py-6 flex flex-col gap-5"
        >
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ color: 'var(--muted)' }}
              className="text-sm"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
