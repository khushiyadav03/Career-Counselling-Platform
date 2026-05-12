/**
 * Rule-based learning path personalization (no ML dependencies).
 * Skips redundant foundation steps when proficiency is "advanced".
 * Injects gap steps when required track skills are missing from the user's list.
 */

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+#\s]/g, '')
    .replace(/\s+/g, ' ');
}

function normKey(s) {
  return norm(s).replace(/\s/g, '');
}

function userHasSkill(userSkills, skill) {
  const n = normKey(skill);
  if (!n) return false;
  return userSkills.some((u) => {
    const un = normKey(u);
    return un === n || un.includes(n) || n.includes(un);
  });
}

function getProficiency(proficiency, skill) {
  const p = proficiency && typeof proficiency === 'object' ? proficiency : {};
  const target = normKey(skill);
  for (const [k, v] of Object.entries(p)) {
    if (normKey(k) === target) return String(v).toLowerCase();
  }
  return 'beginner';
}

function shouldSkipStep(step, proficiency) {
  if (!step || step.level !== 'foundation') return false;
  const skills = Array.isArray(step.skillsAddressed) ? step.skillsAddressed : [];
  if (skills.length === 0) return false;
  return skills.every((s) => getProficiency(proficiency, s) === 'advanced');
}

function buildGapSteps(track, userSkills, gapResources) {
  const required = Array.isArray(track.requiredSkills) ? track.requiredSkills : [];
  const gaps = [];
  for (const r of required) {
    if (!userHasSkill(userSkills, r) && gapResources && gapResources[r]) {
      const g = gapResources[r];
      gaps.push({
        id: `gap-${r}`,
        title: g.title,
        description: g.description,
        resourceLabel: g.resourceLabel,
        resourceUrl: g.resourceUrl,
        estHours: 8,
        skillsAddressed: [r],
        level: 'foundation',
        isGap: true,
      });
    }
  }
  return gaps;
}

function buildPersonalizedPath(roadmapsData, input) {
  const tracks = roadmapsData && roadmapsData.tracks ? roadmapsData.tracks : {};
  const trackKey =
    input.targetTrack && tracks[input.targetTrack] ? input.targetTrack : 'fullstack';
  const track = tracks[trackKey];
  const userSkills = Array.isArray(input.skills) ? input.skills : [];
  const proficiency = input.proficiency && typeof input.proficiency === 'object' ? input.proficiency : {};

  const gapResources = roadmapsData.gapResources || {};
  const gapSteps = buildGapSteps(track, userSkills, gapResources);
  const phases = [];

  if (input.careerGoal && String(input.careerGoal).trim()) {
    phases.push({
      id: 'personalized',
      name: 'Your north star',
      steps: [
        {
          id: 'goal-anchor',
          title: 'Align learning to your goal',
          description: `Goal: "${String(input.careerGoal).trim()}". Tie each milestone below to a portfolio artifact (repo, demo URL, short Loom).`,
          resourceLabel: 'Writing a strong dev README',
          resourceUrl: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes',
          estHours: 2,
          skillsAddressed: [],
          level: 'foundation',
          isGap: false,
        },
      ],
    });
  }

  if (gapSteps.length) {
    phases.push({
      id: 'gaps',
      name: 'Priority skill gaps',
      description: 'Suggested first based on your selected track vs skills you listed.',
      steps: gapSteps,
    });
  }

  for (const phase of track.phases || []) {
    const steps = (phase.steps || [])
      .filter((st) => !shouldSkipStep(st, proficiency))
      .map((st) => ({ ...st, isGap: false }));
    if (steps.length) {
      phases.push({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        steps,
      });
    }
  }

  const totalHours = phases.reduce(
    (acc, ph) => acc + (ph.steps || []).reduce((a, s) => a + (Number(s.estHours) || 0), 0),
    0
  );
  const weekly = Math.max(1, Math.min(40, Number(input.weeklyHours) || 10));
  const weeks = Math.max(1, Math.ceil(totalHours / weekly));

  return {
    title: `${track.title} — your learning path`,
    summary: `About ${weeks} weeks at ~${weekly} hrs/week (~${totalHours}h of mapped content). Foundation steps you marked as advanced are de-emphasized; missing track skills surface as gap modules first.`,
    track: trackKey,
    sources: ['rules'],
    weeklyEstimate: weeks,
    totalHours,
    phases,
    meta: {
      generatedAt: new Date().toISOString(),
      experienceLevel: input.experienceLevel || '',
    },
  };
}

function validateLearningPathShape(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.title !== 'string' || typeof obj.summary !== 'string') return false;
  if (!Array.isArray(obj.phases)) return false;
  for (const ph of obj.phases) {
    if (!ph || typeof ph.name !== 'string' || !Array.isArray(ph.steps)) return false;
    for (const st of ph.steps) {
      if (!st || typeof st.title !== 'string' || typeof st.description !== 'string') return false;
      if (st.resourceUrl && typeof st.resourceUrl !== 'string') return false;
    }
  }
  return true;
}

function extractJsonObject(text) {
  if (typeof text !== 'string') return null;
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1].trim() : t;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = {
  buildPersonalizedPath,
  validateLearningPathShape,
  extractJsonObject,
};
