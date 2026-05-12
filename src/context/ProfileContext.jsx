import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('profile');
      const data = await res.json();
      setProfile(data.profile);
    } catch {
      setProfile({
        skills: [],
        proficiency: {},
        targetTrack: 'fullstack',
        careerGoal: '',
        experienceLevel: 'entry',
        weeklyHours: 10,
        lastLearningPath: null,
      });
      setError('Profile API unavailable — using local defaults until the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveProfile = useCallback(async (partial) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(profile || {}), ...partial }),
      });
      if (!res.ok) throw new Error('save');
      const data = await res.json();
      setProfile(data.profile);
      return { ok: true };
    } catch {
      setError('Could not save profile to the server.');
      return { ok: false };
    } finally {
      setSaving(false);
    }
  }, [profile]);

  const generateLearningPath = useCallback(
    async (payload) => {
      setGenerating(true);
      setError(null);
      try {
        const res = await fetch('/api/learning-path/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('gen');
        const data = await res.json();
        setProfile(data.profile);
        return { ok: true, learningPath: data.learningPath };
      } catch {
        setError('Could not generate learning path. Is the API running?');
        return { ok: false };
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  const clearLearningPath = useCallback(async () => {
    if (!profile) return { ok: false };
    return saveProfile({ lastLearningPath: null });
  }, [profile, saveProfile]);

  const value = useMemo(
    () => ({
      profile,
      loading,
      error,
      saving,
      generating,
      refresh,
      saveProfile,
      generateLearningPath,
      clearLearningPath,
    }),
    [profile, loading, error, saving, generating, refresh, saveProfile, generateLearningPath, clearLearningPath]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
