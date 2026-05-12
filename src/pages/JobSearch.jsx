import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildJobBoardUrls } from '../utils/jobBoardLinks';

const initialForm = {
  keywords: '',
  skillsExtra: '',
  location: '',
  workType: 'any',
  experience: 'any',
  jobType: 'any',
  country: 'us',
};

export default function JobSearch() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const boards = useMemo(() => {
    if (!submitted || !form.keywords.trim()) return [];
    return buildJobBoardUrls({
      keywords: form.keywords.trim(),
      skillsExtra: form.skillsExtra.trim(),
      location: form.location.trim(),
      workType: form.workType,
      experience: form.experience,
      jobType: form.jobType,
      country: form.country,
    });
  }, [submitted, form]);

  const update = (key) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [key]: v }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.keywords.trim()) return;
    setSubmitted(true);
  };

  const reset = () => {
    setSubmitted(false);
    setForm(initialForm);
  };

  return (
    <>
      <section className="page-hero job-hero">
        <p className="eyebrow">Find jobs</p>
        <h1 className="page-title">Search jobs you can apply to</h1>
        <p className="page-lead">
          Enter your keywords and preferences. We open trusted job sites with your search already filled
          in so you can browse listings and apply on each platform.
        </p>
      </section>

      <section className="section job-search-section">
        <form className="job-search-form card-elevated pad-lg" onSubmit={onSubmit}>
          <h2 className="h2-tight">Your search</h2>
          <p className="muted small-gap">
            <strong>Job title or keywords</strong> are required (for example: React developer, data
            analyst intern).
          </p>

          <div className="form-grid-2">
            <label className="field field-span-2">
              <span>Keywords / job title *</span>
              <input
                value={form.keywords}
                onChange={update('keywords')}
                placeholder="e.g. Frontend developer, Python, marketing associate"
                maxLength={200}
                required
                autoComplete="on"
                name="job_keywords"
              />
            </label>

            <label className="field">
              <span>Extra skills or tools (optional)</span>
              <input
                value={form.skillsExtra}
                onChange={update('skillsExtra')}
                placeholder="e.g. TypeScript, AWS, Excel"
                maxLength={200}
              />
            </label>

            <label className="field">
              <span>Location (optional)</span>
              <input
                value={form.location}
                onChange={update('location')}
                placeholder="e.g. Austin TX, London, Remote India"
                maxLength={120}
              />
            </label>

            <label className="field">
              <span>Where to search (Indeed region)</span>
              <select value={form.country} onChange={update('country')}>
                <option value="us">United States (Indeed.com)</option>
                <option value="uk">United Kingdom (Indeed UK)</option>
                <option value="in">India (Indeed India + Naukri)</option>
              </select>
            </label>

            <label className="field">
              <span>Work arrangement</span>
              <select value={form.workType} onChange={update('workType')}>
                <option value="any">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </label>

            <label className="field">
              <span>Experience level</span>
              <select value={form.experience} onChange={update('experience')}>
                <option value="any">Any</option>
                <option value="entry">Entry level</option>
                <option value="mid">Mid level</option>
                <option value="senior">Senior</option>
              </select>
            </label>

            <label className="field field-span-2">
              <span>Job type</span>
              <select value={form.jobType} onChange={update('jobType')}>
                <option value="any">Any</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </label>
          </div>

          <div className="form-actions-row">
            <button type="submit" className="btn btn-primary">
              Open job sites
            </button>
            {submitted && (
              <button type="button" className="btn btn-secondary" onClick={reset}>
                New search
              </button>
            )}
          </div>
        </form>

        {submitted && boards.length === 0 && (
          <p className="muted job-results-block" role="alert">
            Add a job title or keywords above, then click &quot;Open job sites&quot; again.
          </p>
        )}

        {submitted && boards.length > 0 && (
          <div className="job-results-block">
            <h2 className="h2-tight">Apply on these sites</h2>
            <p className="muted results-hint">
              Each button opens a new tab on that job board with your search. Create an account or sign
              in there to submit applications.
            </p>
            <ul className="job-board-grid">
              {boards.map((b) => (
                <li key={b.id}>
                  <a className="job-board-card" href={b.url} target="_blank" rel="noopener noreferrer">
                    <span className="job-board-icon" aria-hidden>
                      <i className={b.icon} />
                    </span>
                    <span className="job-board-name">{b.name}</span>
                    <span className="job-board-desc">{b.description}</span>
                    <span className="job-board-cta">
                      Search & apply <i className="fas fa-arrow-up-right-from-square" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="section section-narrow">
        <p className="muted center-text">
          Want AI tips for your resume?{' '}
          <Link to="/">Dashboard</Link> · <Link to="/learn">Learning Path</Link> ·{' '}
          <Link to="/set-goals">Career goals</Link>
        </p>
      </section>
    </>
  );
}
