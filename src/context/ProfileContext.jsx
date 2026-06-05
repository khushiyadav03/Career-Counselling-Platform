import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ProfileContext = createContext(null);

const defaultProfile = {
  skills: [],
  proficiency: {},
  targetTrack: 'fullstack',
  careerGoal: '',
  experienceLevel: 'entry',
  weeklyHours: 10,
  lastLearningPath: null,
};

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    
    // 1. Check local storage first. If profile exists locally, use it and do not query the server.
    const stored = localStorage.getItem('userProfile');
    let localProf = null;
    if (stored) {
      try {
        localProf = JSON.parse(stored);
        if (localProf && typeof localProf === 'object') {
          console.log('[ProfileContext] Initializing state with localStorage profile:', localProf);
          setProfile(localProf);
          setLoading(false);
          
          // Sync to server in the background so API generation remains aligned
          fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(localProf),
          })
          .then(res => res.json())
          .then(data => {
            console.log('[ProfileContext] Background sync to server complete:', data.profile);
          })
          .catch((err) => {
            console.warn('[ProfileContext] Background sync to server failed:', err.message);
          });
          
          return;
        }
      } catch (err) {
        console.error('[ProfileContext] Failed to parse localStorage profile:', err);
      }
    }

    // 2. If no local cache exists, fetch the initial profile from the server.
    try {
      console.log('[ProfileContext] No localStorage profile found, fetching from server...');
      const res = await fetch('/api/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error('profile');
      const data = await res.json();
      console.log('[ProfileContext] Profile fetched from server:', data.profile);
      setProfile(data.profile);
      localStorage.setItem('userProfile', JSON.stringify(data.profile));
    } catch (err) {
      console.error('[ProfileContext] Server fetch failed, using defaults:', err);
      setProfile({ ...defaultProfile });
      setError('Running in local-first mode.');
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
    
    const merged = { ...(profile || defaultProfile), ...partial };
    console.log('[ProfileContext] Saving updated profile to state & localStorage:', merged);
    setProfile(merged);
    localStorage.setItem('userProfile', JSON.stringify(merged));

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (!res.ok) throw new Error('save');
      const data = await res.json();
      console.log('[ProfileContext] Server save complete:', data.profile);
      
      const serverProfile = data.profile || {};
      const updated = {
        ...merged,
        skills: serverProfile.skills?.length ? serverProfile.skills : merged.skills,
        proficiency: serverProfile.proficiency && Object.keys(serverProfile.proficiency).length ? serverProfile.proficiency : merged.proficiency,
        targetTrack: serverProfile.targetTrack || merged.targetTrack,
        careerGoal: serverProfile.careerGoal || merged.careerGoal,
        experienceLevel: serverProfile.experienceLevel || merged.experienceLevel,
        weeklyHours: serverProfile.weeklyHours || merged.weeklyHours,
        lastLearningPath: serverProfile.lastLearningPath !== undefined ? serverProfile.lastLearningPath : merged.lastLearningPath,
      };
      
      setProfile(updated);
      localStorage.setItem('userProfile', JSON.stringify(updated));
      return { ok: true };
    } catch (err) {
      console.warn('[ProfileContext] Server save failed (running offline):', err.message);
      return { ok: true, offline: true };
    } finally {
      setSaving(false);
    }
  }, [profile]);

  const generateLearningPath = useCallback(
    async (payload) => {
      setGenerating(true);
      setError(null);
      
      const updatedProfile = { ...(profile || defaultProfile), ...payload };
      console.log('[ProfileContext] Generating path. Pre-saving profile state:', updatedProfile);
      setProfile(updatedProfile);
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      try {
        const res = await fetch('/api/learning-path/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('gen');
        const data = await res.json();
        console.log('[ProfileContext] Path generation complete. Profile returned:', data.profile);
        
        const serverProfile = data.profile || {};
        const updated = {
          ...updatedProfile,
          skills: serverProfile.skills?.length ? serverProfile.skills : updatedProfile.skills,
          proficiency: serverProfile.proficiency && Object.keys(serverProfile.proficiency).length ? serverProfile.proficiency : updatedProfile.proficiency,
          targetTrack: serverProfile.targetTrack || updatedProfile.targetTrack,
          careerGoal: serverProfile.careerGoal || updatedProfile.careerGoal,
          experienceLevel: serverProfile.experienceLevel || updatedProfile.experienceLevel,
          weeklyHours: serverProfile.weeklyHours || updatedProfile.weeklyHours,
          lastLearningPath: serverProfile.lastLearningPath !== undefined ? serverProfile.lastLearningPath : data.learningPath,
        };
        
        setProfile(updated);
        localStorage.setItem('userProfile', JSON.stringify(updated));
        return { ok: true, learningPath: data.learningPath };
      } catch (err) {
        console.error('[ProfileContext] Path generation failed:', err);
        setError('Could not contact the generation engine. Please check your connection.');
        return { ok: false };
      } finally {
        setGenerating(false);
      }
    },
    [profile]
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
