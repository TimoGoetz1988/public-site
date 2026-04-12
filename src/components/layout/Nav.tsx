import { useState, useEffect } from 'react';

const links = [
  { href: '/projects', label: 'Projekte' },
  { href: '/blog', label: 'Blog' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/about', label: 'Über mich' },
  { href: '/contact', label: 'Kontakt' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <header
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(250, 250, 248, 0.94)' }}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-sm"
    >
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

        <a
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <span
            style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg-card)' }}
            className="flex h-8 w-8 items-center justify-center rounded text-xs font-semibold"
          >
            TG
          </span>
          <span style={{ color: 'var(--text)', letterSpacing: '0.08em' }} className="text-xs font-semibold uppercase">
            Timo Götz
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                style={{
                  color: pathname === href || pathname.startsWith(href + '/') ? 'var(--text)' : 'var(--muted)',
                }}
                className="text-sm transition-colors hover:text-[var(--text)]"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="/contact"
          style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg-card)' }}
          className="hidden md:inline-flex rounded px-4 py-2 text-xs font-semibold tracking-wide transition-colors hover:bg-[var(--bg)]"
        >
          Kontakt
        </a>

        <button
          style={{ color: 'var(--muted)' }}
          className="md:hidden text-sm"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? 'Schliessen' : 'Menu'}
        </button>
      </nav>

      {open && (
        <div
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}
          className="md:hidden px-6 py-6 flex flex-col gap-5 shadow-sm"
        >
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ color: pathname === href ? 'var(--text)' : 'var(--muted)' }}
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
