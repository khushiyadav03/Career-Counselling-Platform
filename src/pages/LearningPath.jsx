import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';

const TRACKS = [
  { id: 'fullstack', label: 'Full-stack web', hint: 'React + Node + SQL + deploy' },
  { id: 'frontend', label: 'Frontend', hint: 'UI depth, a11y, performance' },
  { id: 'backend', label: 'Backend & APIs', hint: 'Services, data, auth' },
  { id: 'data', label: 'Data foundations', hint: 'SQL + Python + storytelling' },
];

const SUGGESTED_SKILLS = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'Git',
  'React',
  'Node.js',
  'SQL',
  'REST APIs',
  'Python',
];

const PROF_OPTS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function LearningPath() {
  const { profile, loading, error, saving, generating, saveProfile, generateLearningPath, clearLearningPath } =
    useProfile();

  const [skills, setSkills] = useState([]);
  const [proficiency, setProficiency] = useState({});
  const [targetTrack, setTargetTrack] = useState('fullstack');
  const [careerGoal, setCareerGoal] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('entry');
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!profile) return;
    setSkills(profile.skills?.length ? [...profile.skills] : []);
    setProficiency({ ...profile.proficiency });
    setTargetTrack(profile.targetTrack || 'fullstack');
    setCareerGoal(profile.careerGoal || '');
    setExperienceLevel(profile.experienceLevel || 'entry');
    setWeeklyHours(profile.weeklyHours || 10);
  }, [profile]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const addSkill = useCallback((raw) => {
    const s = raw.trim();
    if (!s || skills.includes(s) || skills.length >= 40) return;
    setSkills((prev) => [...prev, s]);
    setProficiency((prev) => ({ ...prev, [s]: prev[s] || 'beginner' }));
  }, [skills]);

  const removeSkill = useCallback((s) => {
    setSkills((prev) => prev.filter((x) => x !== s));
    setProficiency((prev) => {
      const next = { ...prev };
      delete next[s];
      return next;
    });
  }, []);

  const setProf = useCallback((skill, value) => {
    setProficiency((prev) => ({ ...prev, [skill]: value }));
  }, []);

  const onSaveProfile = async () => {
    const r = await saveProfile({
      skills,
      proficiency,
      targetTrack,
      careerGoal,
      experienceLevel,
      weeklyHours,
    });
    showToast(r.ok ? 'Profile saved.' : 'Save failed — check server.');
  };

  const onGenerate = async () => {
    const r = await generateLearningPath({
      skills,
      proficiency,
      targetTrack,
      careerGoal,
      experienceLevel,
      weeklyHours,
    });
    if (r.ok) {
      const src = r.learningPath?.sources?.join(' + ') || 'rules';
      showToast(`Learning path ready (${src}).`);
    }
  };

  const onClearPath = async () => {
    const r = await clearLearningPath();
    showToast(r.ok ? 'Cleared saved path.' : 'Could not clear.');
  };

  const path = profile?.lastLearningPath;

  const totalSteps = useMemo(() => {
    if (!path?.phases) return 0;
    return path.phases.reduce((a, ph) => a + (ph.steps?.length || 0), 0);
  }, [path]);

  if (loading && !profile) {
    return (
      <section className="section page-tight">
        <p className="muted">Loading profile…</p>
      </section>
    );
  }

  return (
    <div className="learn-page">
      <section className="page-hero">
        <p className="eyebrow">Learning path engine</p>
        <h1 className="page-title">Personalized roadmap from your skills</h1>
        <p className="page-lead narrow">
          We analyze your <strong>skills</strong>, <strong>proficiency</strong>, <strong>career goal</strong>, and{' '}
          <strong>weekly hours</strong>, then build a phased plan with curated resources. Rules run locally; add{' '}
          <code className="inline-code">GEMINI_API_KEY</code> for an optional AI-refined version.
        </p>
      </section>

      {error && (
        <div className="banner banner-warn" role="status">
          {error}
        </div>
      )}

      <section className="section learn-layout">
        <div className="learn-form card-elevated pad-lg">
          <h2 className="h2-tight">Your profile</h2>

          <label className="field">
            <span>Career goal (feeds recommendations)</span>
            <textarea
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="e.g. Land a full-stack role at a product company within 6 months"
            />
          </label>

          <div className="field">
            <span>Target track</span>
            <div className="track-pills">
              {TRACKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`track-pill ${targetTrack === t.id ? 'is-active' : ''}`}
                  onClick={() => setTargetTrack(t.id)}
                >
                  <strong>{t.label}</strong>
                  <small>{t.hint}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid-2">
            <label className="field">
              <span>Overall experience</span>
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                <option value="student">Student / bootcamp</option>
                <option value="entry">Early career / switching</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior+</option>
              </select>
            </label>
            <label className="field">
              <span>Hours per week for study</span>
              <input
                type="number"
                min={1}
                max={40}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value) || 10)}
              />
            </label>
          </div>

          <div className="field">
            <span>Skills you already have</span>
            <div className="skill-input-row">
              <input
                type="text"
                placeholder="Add a skill and press Enter"
                maxLength={48}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
            <div className="suggested-skills">
              {SUGGESTED_SKILLS.map((s) => (
                <button key={s} type="button" className="chip-btn" onClick={() => addSkill(s)}>
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {skills.length > 0 && (
            <div className="skill-table-wrap">
              <table className="skill-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Proficiency</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {skills.map((s) => (
                    <tr key={s}>
                      <td>{s}</td>
                      <td>
                        <select
                          value={proficiency[s] || 'beginner'}
                          onChange={(e) => setProf(s, e.target.value)}
                          aria-label={`Proficiency for ${s}`}
                        >
                          {PROF_OPTS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button type="button" className="btn-text-danger" onClick={() => removeSkill(s)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions-row learn-actions">
            <button type="button" className="btn btn-secondary" onClick={onSaveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
            <button type="button" className="btn btn-primary" onClick={onGenerate} disabled={generating}>
              {generating ? 'Generating…' : 'Generate learning path'}
            </button>
          </div>
          {path && (
            <button type="button" className="btn-link-muted" onClick={onClearPath}>
              Clear saved path from profile
            </button>
          )}
        </div>

        <aside className="learn-sidebar card-elevated pad-lg">
          <h3 className="h3-sidebar">How recommendations work</h3>
          <ol className="sidebar-list">
            <li>
              <strong>Gap pass:</strong> required skills for your track that you did not list become priority
              modules.
            </li>
            <li>
              <strong>Proficiency pass:</strong> foundation steps are skipped when you mark every addressed skill as{' '}
              <em>Advanced</em>.
            </li>
            <li>
              <strong>AI pass (optional):</strong> with Gemini configured, the server may replace the roadmap with a
              tailored JSON plan (validated before save).
            </li>
          </ol>
          <Link to="/job-search" className="btn btn-secondary btn-block sidebar-cta">
            Next: search jobs
          </Link>
        </aside>
      </section>

      {path && (
        <section className="section path-output">
          <div className="path-header card-elevated pad-lg">
            <div>
              <h2 className="path-title">{path.title}</h2>
              <p className="path-summary">{path.summary}</p>
            </div>
            <dl className="path-meta">
              <div>
                <dt>Est. weeks</dt>
                <dd>{path.weeklyEstimate ?? '—'}</dd>
              </div>
              <div>
                <dt>Study hours</dt>
                <dd>{path.totalHours ?? '—'}h</dd>
              </div>
              <div>
                <dt>Steps</dt>
                <dd>{totalSteps}</dd>
              </div>
              <div>
                <dt>Sources</dt>
                <dd>{(path.sources || []).join(', ') || 'rules'}</dd>
              </div>
            </dl>
          </div>

          <div className="phases-timeline">
            {path.phases?.map((ph, i) => (
              <article key={ph.id || ph.name || i} className="phase-card">
                <div className="phase-marker">{i + 1}</div>
                <div className="phase-body">
                  <h3 className="phase-name">{ph.name}</h3>
                  {ph.description && <p className="phase-desc muted">{ph.description}</p>}
                  <ul className="step-cards">
                    {ph.steps?.map((st) => (
                      <li key={st.id || st.title} className={`step-card ${st.isGap ? 'is-gap' : ''}`}>
                        <div className="step-card-head">
                          <span className="step-badge">{st.level || 'core'}</span>
                          {st.isGap && <span className="gap-badge">Gap fill</span>}
                        </div>
                        <h4>{st.title}</h4>
                        <p>{st.description}</p>
                        <div className="step-meta">
                          {st.estHours != null && <span>~{st.estHours}h</span>}
                          {(st.skillsAddressed || []).length > 0 && (
                            <span className="step-tags">
                              {(st.skillsAddressed || []).map((t) => (
                                <span key={t} className="mini-tag">
                                  {t}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                        {st.resourceUrl && (
                          <a
                            href={st.resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="step-link"
                          >
                            {st.resourceLabel || 'Open resource'} <i className="fas fa-arrow-up-right-from-square" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
