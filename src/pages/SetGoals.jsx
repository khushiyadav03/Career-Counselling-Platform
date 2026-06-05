import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCareerGoals } from '../context/CareerGoalsContext';

export default function SetGoals() {
  const { careerGoals, addGoal, deleteGoal, loading, error } = useCareerGoals();
  const [field, setField] = useState('');
  const [level, setLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!field.trim() || !level.trim()) return;
    const r = await addGoal({
      careerField: field.trim(),
      experienceLevel: level.trim(),
      notes: notes.trim(),
    });
    setField('');
    setLevel('');
    setNotes('');
    showToast(r.offline ? 'Saved locally.' : 'Goal saved to server.');
  };

  return (
    <section className="section page-tight">
      <div className="section-head">
        <h1 className="page-title-inline">Career goals</h1>
        <p className="page-lead narrow">
          Career goals are your <strong>north star</strong>: they shape the coach conversation and help the
          roadmap stay focused. Stack a few options here, then pair them with the{' '}
          <Link to="/learn">Learning Path</Link> for a concrete skills plan.
        </p>
        {error && <p className="inline-hint">{error}</p>}
        {loading && <p className="inline-hint">Loading goals…</p>}
      </div>

      <form className="goals-form card-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Desired field</span>
          <input
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g. Product design"
            maxLength={120}
            required
          />
        </label>
        <label className="field">
          <span>Experience level</span>
          <input
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="e.g. Bootcamp grad, 1 internship"
            maxLength={120}
            required
          />
        </label>
        <label className="field">
          <span>Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Links, constraints, or questions for your coach"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block">
          Add goal
        </button>
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
                  {g.notes && <p className="goal-notes">{g.notes}</p>}
                </div>
                <button type="button" className="btn-text-danger" onClick={() => deleteGoal(i)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </section>
  );
}
