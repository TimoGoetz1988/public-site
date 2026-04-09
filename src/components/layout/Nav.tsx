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
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.92)' }}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-md"
    >
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

        <a
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <span
            style={{ background: 'var(--accent)', color: '#ffffff' }}
            className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
          >
            TG
          </span>
          <span style={{ color: 'var(--text)', letterSpacing: '0.08em' }} className="text-xs font-semibold uppercase">
            Timo Goetz
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                style={{
                  color: pathname === href || pathname.startsWith(href + '/') ? 'var(--accent-2)' : 'var(--muted)',
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
          style={{ background: 'var(--accent)', color: '#ffffff' }}
          className="hidden md:inline-flex text-xs font-semibold px-4 py-2 rounded hover:opacity-90 transition-opacity tracking-wide"
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
              style={{ color: pathname === href ? 'var(--accent-2)' : 'var(--muted)' }}
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
