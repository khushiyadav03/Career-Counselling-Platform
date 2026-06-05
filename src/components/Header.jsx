import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/learn', label: 'Learning Path' },
  { to: '/job-search', label: 'Job Search' },
  { to: '/set-goals', label: 'Career Goals' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

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
      <div className="header-actions">
        <button
          type="button"
          className="theme-toggle-btn"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} />
        </button>
        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <i className={`fas ${open ? 'fa-times' : 'fa-bars'}`} />
        </button>
      </div>
    </header>
  );
}
