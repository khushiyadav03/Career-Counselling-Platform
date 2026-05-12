require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const {
  buildPersonalizedPath,
  validateLearningPathShape,
  extractJsonObject,
} = require('./lib/learningPath');

const app = express();
const port = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const goalsPath = path.join(__dirname, 'data', 'career-goals.json');
const contactsPath = path.join(__dirname, 'data', 'contacts.json');
const profilePath = path.join(__dirname, 'data', 'user-profile.json');
const roadmapsPath = path.join(__dirname, 'data', 'roadmaps.json');

const MAX_FIELD_LEN = 120;
const MAX_NOTES_LEN = 2000;
const MAX_MESSAGE_LEN = 4000;
const MAX_SKILLS = 40;
const SKILL_LEN = 48;

const defaultProfile = {
  skills: [],
  proficiency: {},
  targetTrack: 'fullstack',
  careerGoal: '',
  experienceLevel: 'entry',
  weeklyHours: 10,
  lastLearningPath: null,
};

const corsOrigin =
  process.env.CLIENT_ORIGIN ||
  (isProd ? true : ['http://localhost:5173', 'http://127.0.0.1:5173']);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '64kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const learningPathLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

async function readGoals() {
  try {
    const raw = await fs.readFile(goalsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeGoals(goals) {
  await fs.mkdir(path.dirname(goalsPath), { recursive: true });
  await fs.writeFile(goalsPath, JSON.stringify(goals, null, 2), 'utf8');
}

async function readRoadmaps() {
  const raw = await fs.readFile(roadmapsPath, 'utf8');
  return JSON.parse(raw);
}

async function readProfile() {
  try {
    const raw = await fs.readFile(profilePath, 'utf8');
    const p = JSON.parse(raw);
    return { ...defaultProfile, ...p, skills: Array.isArray(p.skills) ? p.skills : [] };
  } catch {
    return { ...defaultProfile };
  }
}

async function writeProfile(profile) {
  await fs.mkdir(path.dirname(profilePath), { recursive: true });
  await fs.writeFile(profilePath, JSON.stringify(profile, null, 2), 'utf8');
}

function sanitizeProfile(body) {
  const p = { ...defaultProfile, ...body };
  const skills = Array.isArray(p.skills)
    ? p.skills
        .map((s) => (typeof s === 'string' ? s.trim().slice(0, SKILL_LEN) : ''))
        .filter(Boolean)
        .slice(0, MAX_SKILLS)
    : [];
  const prof = {};
  if (p.proficiency && typeof p.proficiency === 'object') {
    const allowed = new Set(['beginner', 'intermediate', 'advanced']);
    let n = 0;
    for (const [k, v] of Object.entries(p.proficiency)) {
      if (n++ > 60) break;
      const key = String(k).trim().slice(0, SKILL_LEN);
      const val = String(v).toLowerCase();
      if (!key) continue;
      prof[key] = allowed.has(val) ? val : 'beginner';
    }
  }
  const tracks = new Set(['fullstack', 'frontend', 'backend', 'data']);
  const targetTrack = tracks.has(p.targetTrack) ? p.targetTrack : 'fullstack';
  const expLevels = new Set(['entry', 'mid', 'senior', 'student']);
  const experienceLevel = expLevels.has(p.experienceLevel) ? p.experienceLevel : 'entry';
  const weeklyHours = Math.max(1, Math.min(40, parseInt(p.weeklyHours, 10) || 10));
  const careerGoal =
    typeof p.careerGoal === 'string' ? p.careerGoal.trim().slice(0, MAX_NOTES_LEN) : '';
  let lastLearningPath = null;
  if (p.lastLearningPath === null) {
    lastLearningPath = null;
  } else if (p.lastLearningPath && typeof p.lastLearningPath === 'object') {
    lastLearningPath = validateLearningPathShape(p.lastLearningPath) ? p.lastLearningPath : null;
  }
  return {
    skills,
    proficiency: prof,
    targetTrack,
    careerGoal,
    experienceLevel,
    weeklyHours,
    lastLearningPath,
  };
}

async function geminiLearningPath(profileInput, trackMeta, key) {
  const prompt = `You are a principal engineer designing a learning roadmap.
Output ONLY valid JSON (no markdown, no commentary) with this shape:
{"title":"string","summary":"string","track":"${profileInput.targetTrack}","sources":["gemini"],"weeklyEstimate":number,"totalHours":number,"phases":[{"id":"string","name":"string","steps":[{"id":"string","title":"string","description":"string","resourceLabel":"string","resourceUrl":"https://...","estHours":number,"skillsAddressed":["lowercase-skill"],"level":"foundation|core|capstone"}]}]}
Rules:
- 3 to 5 phases, max 4 steps each phase.
- resourceUrl must start with https://
- Personalize steps using this profile JSON:
${JSON.stringify(profileInput)}
- Track context: ${trackMeta}
- weeklyEstimate = ceil(totalHours / ${profileInput.weeklyHours || 10})`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error('Gemini learning path request failed', response.status, body.slice(0, 500));
    return null;
  }
  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  const parsed = extractJsonObject(text);
  if (!validateLearningPathShape(parsed)) return null;
  if (!Array.isArray(parsed.sources)) parsed.sources = [];
  if (!parsed.sources.includes('gemini')) parsed.sources.push('gemini');
  return parsed;
}

function trimGoal(body) {
  let { careerField, experienceLevel, notes } = body;
  careerField = typeof careerField === 'string' ? careerField.trim().slice(0, MAX_FIELD_LEN) : '';
  experienceLevel =
    typeof experienceLevel === 'string' ? experienceLevel.trim().slice(0, MAX_FIELD_LEN) : '';
  notes = typeof notes === 'string' ? notes.trim().slice(0, MAX_NOTES_LEN) : '';
  return { careerField, experienceLevel, notes };
}

function getMockReply(message, careerGoals, userProfile) {
  const lower = message.toLowerCase();
  const words = lower.split(/\s+/);
  const careerField =
    careerGoals[0]?.careerField ||
    words.find((w) => /^[a-z]+$/i.test(w) && w.length > 2) ||
    'your field';
  const pathHint = userProfile?.lastLearningPath?.title
    ? ` You have a saved learning path: "${userProfile.lastLearningPath.title}"—ask how to prioritize the next step.`
    : ' Try the Learning Path page to generate a personalized roadmap.';

  if (lower.includes('is') && (lower.includes('good') || lower.includes('career'))) {
    return `Career Report:
Field: ${careerField}
Outlook: Strong demand across many industries (general guidance).
Tips: Network intentionally, document wins, seek mentorship.
Skills Needed: Communication, domain depth, and adaptability.`;
  }
  if (lower.includes('plan') || lower.includes('career in')) {
    return `Use Career Goals and your Learning Path together: save your target role, then generate a roadmap from skills + proficiency.${pathHint}`;
  }
  if (lower.includes('resume') || lower.includes('cv')) {
    return `Resume tips:
• Match keywords to the job description.
• Use metrics (e.g. "raised efficiency 20%").
• One page unless senior with many roles.
• Clean layout and proofread twice.`;
  }
  if (lower.includes('job') && (lower.includes('find') || lower.includes('search'))) {
    return 'Use the Job Search page to open Indeed, LinkedIn, Google Jobs, and more with your filters pre-filled.';
  }
  if (lower.includes('skills') || lower.includes('learn') || lower.includes('path')) {
    return `Skill-building:${pathHint} Stack small portfolio projects that mirror job descriptions you like.`;
  }
  if (lower.includes('hi') || lower.includes('hello')) {
    return 'Hi there—tell me your target role or paste a job description and I will help you prepare.';
  }
  if (lower.includes('bye') || lower.includes('goodbye')) {
    return 'Best of luck—come back anytime you want a second opinion.';
  }
  if (lower.includes('thanks') || lower.includes('thank you')) {
    return 'You are welcome. What is the next career step you want to tackle?';
  }
  return 'I am here for career questions. Try asking about a role, interview prep, or how to stand out in your field.';
}

async function geminiReply(message, careerGoals, userProfile) {
  if (!GEMINI_API_KEY) {
    return { text: getMockReply(message, careerGoals, userProfile), mock: true };
  }

  const prompt = `You are CareerBot, a friendly expert career assistant. Be concise and actionable.
User career goals (JSON): ${JSON.stringify(careerGoals, null, 2)}
User profile (skills, proficiency, track, goal): ${JSON.stringify(userProfile || {}, null, 2)}
User message: ${message}

Rules:
- If they ask whether a field is a good career, use a short "Career Report" with Field, Outlook, Tips, Skills Needed.
- If they ask to plan a career, reference Learning Path + Career Goals and offer one concrete next step.
- Resume questions: bullet tips.
- Job search: point them to the Job Search tool for board deep-links.
- Learning roadmap questions: summarize how to use the app's Learning Path generator.
- Greetings: warm and brief.
- Otherwise ask a brief clarifying question or give targeted advice.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Gemini chat request failed', response.status, body.slice(0, 500));
    return { text: getMockReply(message, careerGoals, userProfile), mock: true };
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text || typeof text !== 'string') {
    return { text: getMockReply(message, careerGoals, userProfile), mock: true };
  }
  return { text, mock: false };
}

app.get('/api/career-goals', async (req, res) => {
  try {
    const careerGoals = await readGoals();
    res.json({ careerGoals });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve career goals' });
  }
});

app.post('/api/career-goals', async (req, res) => {
  try {
    const goal = trimGoal(req.body);
    if (!goal.careerField || !goal.experienceLevel) {
      return res.status(400).json({ error: 'Career field and experience level are required' });
    }
    const careerGoals = await readGoals();
    careerGoals.push(goal);
    await writeGoals(careerGoals);
    res.json({ careerGoals });
  } catch {
    res.status(500).json({ error: 'Failed to save career goal' });
  }
});

app.delete('/api/career-goals/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    const careerGoals = await readGoals();
    if (Number.isNaN(index) || index < 0 || index >= careerGoals.length) {
      return res.status(400).json({ error: 'Invalid index' });
    }
    careerGoals.splice(index, 1);
    await writeGoals(careerGoals);
    res.json({ careerGoals });
  } catch {
    res.status(500).json({ error: 'Failed to delete career goal' });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const profile = await readProfile();
    res.json({ profile });
  } catch {
    res.status(500).json({ error: 'Failed to read profile' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const current = await readProfile();
    const merged = sanitizeProfile({ ...current, ...req.body });
    await writeProfile(merged);
    res.json({ profile: merged });
  } catch {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

app.post('/api/learning-path/generate', learningPathLimiter, async (req, res) => {
  try {
    const saved = await readProfile();
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const input = sanitizeProfile({
      ...saved,
      skills: body.skills ?? saved.skills,
      proficiency: body.proficiency ?? saved.proficiency,
      targetTrack: body.targetTrack ?? saved.targetTrack,
      careerGoal: body.careerGoal ?? saved.careerGoal,
      experienceLevel: body.experienceLevel ?? saved.experienceLevel,
      weeklyHours: body.weeklyHours ?? saved.weeklyHours,
    });

    const roadmapsData = await readRoadmaps();
    let pathResult = buildPersonalizedPath(roadmapsData, input);
    const key = GEMINI_API_KEY;
    const track = roadmapsData.tracks[input.targetTrack] || roadmapsData.tracks.fullstack;
    const trackMeta = `${track.title}. ${track.summary}`;

    if (key) {
      try {
        const ai = await geminiLearningPath(
          {
            skills: input.skills,
            proficiency: input.proficiency,
            careerGoal: input.careerGoal,
            experienceLevel: input.experienceLevel,
            weeklyHours: input.weeklyHours,
            targetTrack: input.targetTrack,
          },
          trackMeta,
          key
        );
        if (ai) {
          pathResult = { ...ai, sources: ['gemini', 'rules'] };
        }
      } catch (e) {
        console.error('Gemini learning path:', e.message);
      }
    }

    const outProfile = { ...input, lastLearningPath: pathResult };
    await writeProfile(outProfile);
    res.json({ learningPath: pathResult, profile: outProfile });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    let { message, careerGoals: clientGoals } = req.body;
    if (typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    message = message.trim().slice(0, MAX_MESSAGE_LEN);
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let careerGoals = Array.isArray(clientGoals) ? clientGoals : [];
    if (careerGoals.length === 0) {
      careerGoals = await readGoals();
    }

    let userProfile = null;
    try {
      userProfile = await readProfile();
    } catch {
      userProfile = null;
    }
    if (req.body && req.body.userProfile && typeof req.body.userProfile === 'object') {
      userProfile = { ...userProfile, ...req.body.userProfile };
    }

    const { text, mock } = await geminiReply(message, careerGoals, userProfile);
    res.json({ reply: text, usedMock: mock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    let { name, email, message } = req.body;
    name = typeof name === 'string' ? name.trim().slice(0, 120) : '';
    email = typeof email === 'string' ? email.trim().slice(0, 200) : '';
    message = typeof message === 'string' ? message.trim().slice(0, MAX_NOTES_LEN) : '';
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const entry = { name, email, message, at: new Date().toISOString() };
    let list = [];
    try {
      const raw = await fs.readFile(contactsPath, 'utf8');
      list = JSON.parse(raw);
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
    list.push(entry);
    await fs.mkdir(path.dirname(contactsPath), { recursive: true });
    await fs.writeFile(contactsPath, JSON.stringify(list, null, 2), 'utf8');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not save message' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (isProd) {
  const dist = path.join(__dirname, 'dist');
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server http://localhost:${port} (${isProd ? 'production' : 'development API'})`);
  if (!GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY is not configured. Gemini AI features will use fallback behavior.');
  }
});
