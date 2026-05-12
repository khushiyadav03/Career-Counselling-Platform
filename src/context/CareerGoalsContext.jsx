import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CareerGoalsContext = createContext(null);

export function CareerGoalsProvider({ children }) {
  const [careerGoals, setCareerGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/career-goals');
      if (!res.ok) throw new Error('Failed to load goals');
      const data = await res.json();
      setCareerGoals(data.careerGoals || []);
      try {
        localStorage.setItem('careerGoals', JSON.stringify(data.careerGoals || []));
      } catch {
        /* ignore */
      }
    } catch {
      const stored = localStorage.getItem('careerGoals');
      if (stored) {
        try {
          setCareerGoals(JSON.parse(stored));
        } catch {
          setCareerGoals([]);
        }
      } else {
        setCareerGoals([]);
      }
      setError('Using offline copy of goals where available.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addGoal = useCallback(async (goal) => {
    try {
      const res = await fetch('/api/career-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      setCareerGoals(data.careerGoals);
      localStorage.setItem('careerGoals', JSON.stringify(data.careerGoals));
      return { ok: true };
    } catch {
      setCareerGoals((prev) => {
        const next = [...prev, goal];
        localStorage.setItem('careerGoals', JSON.stringify(next));
        return next;
      });
      return { ok: false, offline: true };
    }
  }, []);

  const deleteGoal = useCallback(async (index) => {
    try {
      const res = await fetch(`/api/career-goals/${index}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      const data = await res.json();
      setCareerGoals(data.careerGoals);
      localStorage.setItem('careerGoals', JSON.stringify(data.careerGoals));
      return { ok: true };
    } catch {
      setCareerGoals((prev) => {
        const next = prev.filter((_, i) => i !== index);
        localStorage.setItem('careerGoals', JSON.stringify(next));
        return next;
      });
      return { ok: false, offline: true };
    }
  }, []);

  const value = useMemo(
    () => ({
      careerGoals,
      loading,
      error,
      refresh,
      addGoal,
      deleteGoal,
    }),
    [careerGoals, loading, error, refresh, addGoal, deleteGoal]
  );

  return <CareerGoalsContext.Provider value={value}>{children}</CareerGoalsContext.Provider>;
}

export function useCareerGoals() {
  const ctx = useContext(CareerGoalsContext);
  if (!ctx) throw new Error('useCareerGoals must be used within CareerGoalsProvider');
  return ctx;
}
