import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCareerGoals } from '../context/CareerGoalsContext';
import { useProfile } from '../context/ProfileContext';

const TRACK_LABEL = {
  fullstack: 'Full-stack web',
  frontend: 'Frontend',
  backend: 'Backend & APIs',
  data: 'Data foundations',
};

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}

export default function Home() {
  const { careerGoals, addGoal, deleteGoal } = useCareerGoals();
  const { profile } = useProfile();
  const [field, setField] = useState('');
  const [level, setLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!field.trim() || !level.trim() || savingGoal) return;

    setSavingGoal(true);
    try {
      const r = await addGoal({
        careerField: field.trim(),
        experienceLevel: level.trim(),
        notes: notes.trim(),
      });
      setField('');
      setLevel('');
      setNotes('');
      showToast(r.offline ? 'Saved locally — server unavailable.' : 'Career goal saved.');
    } catch {
      showToast('Could not save your goal right now.');
    } finally {
      setSavingGoal(false);
    }
  };

  const openChat = () => {
    document.querySelector('.chatbot-fab')?.click();
  };

  const path = profile?.lastLearningPath;
  const skillCount = profile?.skills?.length ?? 0;

  return (
    <>
      <section className="hero hero-dashboard" id="home">
        <div className="hero-inner">
          <p className="eyebrow">Full-stack portfolio app</p>
          <h1 className="hero-title">One place to learn, search, and apply</h1>
          <p className="hero-lead">
            Define your <strong>career goals</strong>, generate a <strong>learning path</strong>, and jump into
            <strong> job search</strong> with one clear flow. This app is designed to feel like a real career
            planning assistant, not just a demo dashboard.
          </p>
          <div className="hero-badges" aria-label="Project highlights">
            <span className="hero-chip">React + Express</span>
            <span className="hero-chip">JSON persistence</span>
            <span className="hero-chip">Optional Gemini AI</span>
            <span className="hero-chip">Portfolio-ready UX</span>
          </div>
          <div className="hero-actions">
            <Link to="/learn" className="btn btn-primary">
              Build learning path
            </Link>
            <Link to="/job-search" className="btn btn-secondary">
              Search jobs
            </Link>
            <button type="button" className="btn btn-secondary" onClick={openChat}>
              Ask CareerBot
            </button>
          </div>
          <div className="stat-grid" aria-label="Project quality highlights">
            <article className="stat-card">
              <strong>Rule-based + AI-ready</strong>
              <span>Learning path generation with fallback behavior for demo reliability.</span>
            </article>
            <article className="stat-card">
              <strong>Recruiter-friendly</strong>
              <span>Clear flows for goals, job search, and chat assistant in one dashboard.</span>
            </article>
            <article className="stat-card">
              <strong>Production-minded</strong>
              <span>Rate limits, CORS, file-backed persistence, and clean API separation.</span>
            </article>
          </div>
        </div>
        <div className="hero-glow" aria-hidden />
      </section>

      <section className="section">
        <div className="dashboard-grid">
          <Link to="/learn" className="dash-card dash-card-feature">
            <span className="dash-icon">
              <i className="fa-solid fa-route" />
            </span>
            <h2>Learning Path</h2>
            <p>
              Rule-based engine + optional Gemini: gap detection, proficiency-aware pruning, curated
              resources per phase.
            </p>
            <span className="dash-meta">
              {path ? (
                <>
                  Active: <em>{path.title}</em>
                </>
              ) : (
                <>No path saved yet — generate one from your skills.</>
              )}
            </span>
            <span className="dash-cta">Open →</span>
          </Link>

          <Link to="/job-search" className="dash-card">
            <span className="dash-icon">
              <i className="fa-solid fa-briefcase" />
            </span>
            <h2>Job Search</h2>
            <p>Indeed, LinkedIn, Google Jobs, Glassdoor (+ Naukri for India) with your keywords and location.</p>
            <span className="dash-cta">Search →</span>
          </Link>

          <Link to="/set-goals" className="dash-card">
            <span className="dash-icon">
              <i className="fa-solid fa-bullseye" />
            </span>
            <h2>Career goals</h2>
            <p>Persisted goals feed CareerBot and complement your learning profile.</p>
            <span className="dash-meta">{careerGoals.length} saved goal(s)</span>
            <span className="dash-cta">Manage →</span>
          </Link>

          <div className="dash-card dash-card-static">
            <span className="dash-icon">
              <i className="fa-solid fa-user-gear" />
            </span>
            <h2>Your profile snapshot</h2>
            <p>
              Track: <strong>{TRACK_LABEL[profile?.targetTrack] || 'Full-stack web'}</strong>
              <br />
              Skills listed: <strong>{skillCount}</strong>
            </p>
            <Link to="/learn" className="btn btn-secondary btn-inline">
              Edit profile & path
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-head">
          <h2>Why this belongs on a full-stack resume</h2>
          <p>End-to-end features recruiters can click through in a demo, with clean flow and practical value.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon">
              <i className="fa-solid fa-gears" />
            </div>
            <h3>Recommendation-style pipeline</h3>
            <p>
              Inputs → sanitization → deterministic personalization → optional LLM JSON (validated) → persisted
              profile.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">
              <i className="fa-solid fa-server" />
            </div>
            <h3>REST API + persistence</h3>
            <p>
              Express routes for profile, learning path generation, career goals, chat proxy, and contact—data in{' '}
              <code className="inline-code">/data</code>.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">
              <i className="fa-solid fa-shield-halved" />
            </div>
            <h3>Security-minded</h3>
            <p>Gemini only on the server, rate limits, CORS, and no secrets in the Vite bundle.</p>
          </article>
        </div>
      </section>

      <section className="section section-alt" id="goals">
        <div className="section-head">
          <h2>What you can improve next</h2>
          <p>A few portfolio-grade upgrades to move this from demo to production-quality showcase.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon"><i className="fa-solid fa-palette" /></div>
            <h3>UI polish</h3>
            <p>Refined cards, stronger hierarchy, smoother transitions, and a more premium visual system.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon"><i className="fa-solid fa-chart-line" /></div>
            <h3>Product depth</h3>
            <p>Add saved history, analytics, and richer learning-path insights for a stronger portfolio story.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon"><i className="fa-solid fa-shield-halved" /></div>
            <h3>Engineering quality</h3>
            <p>Testing, linting, CI, and deployment polish make this feel ready for real-world review.</p>
          </article>
        </div>

        <div className="section-head">
          <h2>Quick goal capture</h2>
          <p>Optional: one-line goals list for the coach. Full editor also on the Career Goals page.</p>
        </div>
        <form className="goals-form card-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Desired field</span>
            <input
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="e.g. Full-stack developer"
              maxLength={120}
              required
            />
          </label>
          <label className="field">
            <span>Experience level</span>
            <input
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="e.g. Bootcamp grad"
              maxLength={120}
              required
            />
          </label>
          <label className="field">
            <span>Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Stack, timeline, target companies…"
              rows={3}
              maxLength={2000}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={savingGoal}>
            {savingGoal ? 'Saving goal…' : 'Add goal'}
          </button>
          <p className="inline-hint" aria-live="polite">
            {savingGoal ? 'Saving to your goal list…' : 'Goals are saved locally if the API is unavailable.'}
          </p>
        </form>

        <div className="goals-output card-elevated">
          {careerGoals.length === 0 ? (
            <p className="muted">No goals yet.</p>
          ) : (
            <ul className="goals-list">
              {careerGoals.map((g, i) => (
                <li key={`${g.careerField}-${i}`} className="goal-item">
                  <div>
                    <strong>{g.careerField}</strong>
                    <div className="goal-meta">{g.experienceLevel}</div>
                  </div>
                  <button type="button" className="btn-text-danger" onClick={() => deleteGoal(i)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section" id="contact">
        <div className="section-head">
          <h2>Contact</h2>
          <p>Messages append to a JSON file on the server (gitignored in production setups).</p>
        </div>
        <ContactForm onToast={showToast} />
      </section>

      {toast && <Toast message={toast} />}
    </>
  );
}

function ContactForm({ onToast }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setPending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setName('');
      setEmail('');
      setMessage('');
      onToast('Thanks — we received your message.');
    } catch {
      onToast('Could not send right now. Please try again later.');
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="goals-form card-form contact-form" onSubmit={submit}>
      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} maxLength={2000} />
      </label>
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? 'Sending…' : 'Send message'}
      </button>
      <p className="inline-hint" aria-live="polite">
        {pending ? 'Sending your message…' : 'We save contact messages on the server for demo use.'}
      </p>
    </form>
  );
}
