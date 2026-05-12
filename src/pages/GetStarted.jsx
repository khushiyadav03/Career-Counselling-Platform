import { Link } from 'react-router-dom';

const pillars = [
  {
    title: 'Learning Path',
    body: 'List skills with proficiency, pick a track, and generate a phased roadmap with gap fill and curated links.',
    to: '/learn',
    icon: 'fa-route',
  },
  {
    title: 'Job Search',
    body: 'Send your keywords and filters to Indeed, LinkedIn, Google Jobs, and more in one click.',
    to: '/job-search',
    icon: 'fa-briefcase',
  },
  {
    title: 'CareerBot',
    body: 'Server-side Gemini (optional) with mock fallback—context from your goals and saved profile.',
    to: '/',
    icon: 'fa-comments',
    hash: '#home',
  },
];

export default function GetStarted() {
  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">Architecture at a glance</p>
        <h1 className="page-title">Three pillars, one Express API</h1>
        <p className="page-lead">
          Built to demo on a portfolio call: React SPA, Vite proxy in dev, JSON persistence, rate limits, and
          optional AI enrichment.
        </p>
        <div className="hero-actions">
          <Link to="/learn" className="btn btn-primary">
            Start with Learning Path
          </Link>
          <Link to="/" className="btn btn-secondary">
            Dashboard
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="steps-grid">
          {pillars.map((p) => (
            <Link key={p.title} to={`${p.to}${p.hash || ''}`} className="step-card step-card-link">
              <div className="step-icon">
                <i className={`fas ${p.icon}`} />
              </div>
              <h2>{p.title}</h2>
              <p>{p.body}</p>
              <span className="dash-cta">Open →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
