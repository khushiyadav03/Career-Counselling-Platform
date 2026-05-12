import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/learn', label: 'Learning Path' },
  { to: '/job-search', label: 'Job Search' },
  { to: '/set-goals', label: 'Career Goals' },
  { to: '/#features', label: 'Highlights', hash: true },
  { to: '/#contact', label: 'Contact', hash: true },
  { to: '/get-started', label: 'Get Started' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <NavLink to="/" className="site-logo" onClick={() => setOpen(false)}>
        Career Compass
      </NavLink>
      <nav className={`site-nav ${open ? 'is-open' : ''}`}>
        {links.map(({ to, label, end, hash }) =>
          hash ? (
            <a
              key={label}
              href={to}
              className="site-nav-link"
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `site-nav-link${isActive ? ' is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          )
        )}
      </nav>
      <button
        type="button"
        className="nav-toggle"
        aria-label="Toggle menu"
        onClick={() => setOpen((v) => !v)}
      >
        <i className={`fas ${open ? 'fa-times' : 'fa-bars'}`} />
      </button>
    </header>
  );
}
