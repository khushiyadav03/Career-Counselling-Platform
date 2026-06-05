import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CareerGoalsContext = createContext(null);

export function CareerGoalsProvider({ children }) {
  const [careerGoals, setCareerGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    
    // 1. Check local storage first. If goals exist locally, use them and do not query the server.
    const stored = localStorage.getItem('careerGoals');
    if (stored) {
      try {
        const localGoals = JSON.parse(stored);
        if (Array.isArray(localGoals)) {
          setCareerGoals(localGoals);
          setLoading(false);
          
          // Sync to server in the background so chatbot context remains aligned
          (async () => {
            try {
              const res = await fetch('/api/career-goals', { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                const serverGoals = data.careerGoals || [];
                // If server is empty (reset), sync local copy to server
                if (serverGoals.length === 0 && localGoals.length > 0) {
                  for (const goal of localGoals) {
                    await fetch('/api/career-goals', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(goal),
                    });
                  }
                }
              }
            } catch {
              /* ignore background sync errors */
            }
          })();
          
          return;
        }
      } catch {
        /* ignore parsing errors */
      }
    }

    // 2. If no local cache exists, fetch goals from the server.
    try {
      const res = await fetch('/api/career-goals', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load goals');
      const data = await res.json();
      setCareerGoals(data.careerGoals || []);
      localStorage.setItem('careerGoals', JSON.stringify(data.careerGoals || []));
    } catch {
      setError('Running in local-first mode. Career goals synced locally.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addGoal = useCallback(async (goal) => {
    setError(null);
    let nextGoals = [];
    setCareerGoals((prev) => {
      nextGoals = [...prev, goal];
      localStorage.setItem('careerGoals', JSON.stringify(nextGoals));
      return nextGoals;
    });

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
      return { ok: true, offline: true };
    }
  }, []);

  const deleteGoal = useCallback(async (index) => {
    setError(null);
    let nextGoals = [];
    setCareerGoals((prev) => {
      nextGoals = prev.filter((_, i) => i !== index);
      localStorage.setItem('careerGoals', JSON.stringify(nextGoals));
      return nextGoals;
    });

    try {
      const res = await fetch(`/api/career-goals/${index}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      const data = await res.json();
      setCareerGoals(data.careerGoals);
      localStorage.setItem('careerGoals', JSON.stringify(data.careerGoals));
      return { ok: true };
    } catch {
      return { ok: true, offline: true };
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
