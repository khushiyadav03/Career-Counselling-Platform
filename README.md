# Career Compass

**Portfolio-grade full-stack app:** a React (Vite) SPA plus an Express API that delivers **personalized learning paths**, **job-board deep links**, **persisted career goals**, **CareerBot** (Gemini on the server with mock fallback), and **contact capture**—with JSON file persistence so reviewers can run it locally without a database.

Use this README in interviews: it states the problem, architecture, and API surface clearly.

---

## Highlights for recruiters

| Area | What to demo |
|------|----------------|
| **Learning path** | `/learn` — add skills + proficiency, pick track, **Generate** → phased plan with gap fill + optional Gemini JSON (validated). |
| **Job search** | `/job-search` — keywords + filters → opens Indeed, LinkedIn, Google Jobs, Glassdoor (+ Naukri for India). |
| **Career goals** | `/set-goals` — CRUD-style list stored under `data/career-goals.json`. |
| **CareerBot** | Floating chat — `POST /api/chat` uses goals + profile context; **no API keys in the browser**. |
| **Ops** | Rate limits, CORS, `npm run build` + `npm start` for static + API on one process. |

---

## Architecture

```mermaid
flowchart TB
  subgraph spa [React SPA - Vite]
    Pages[Router pages]
    Ctx[CareerGoals + Profile context]
    Pages --> Ctx
  end
  subgraph api [Express API]
    Goals[/api/career-goals]
    Profile[/api/profile]
    Learn[/api/learning-path/generate]
    Chat[/api/chat]
    Contact[/api/contact]
  end
  subgraph data [JSON persistence]
    CG[career-goals.json]
    UP[user-profile.json]
    RM[roadmaps.json]
    CT[contacts.json - gitignored]
  end
  spa -->|fetch /api| api
  Learn --> RM
  Learn --> UP
  Goals --> CG
  Profile --> UP
  Chat --> CG
  Contact --> CT
```

**Recommendation pipeline (learning path)**

1. Client sends skills, per-skill proficiency, career goal, experience band, weekly hours, and target track.
2. Server loads `data/roadmaps.json` and runs **`lib/learningPath.js`**: gap detection vs `requiredSkills`, skip redundant **foundation** steps when all addressed skills are **advanced**, prepend a “north star” phase from the goal string.
3. If `GEMINI_API_KEY` is set, the server asks Gemini for **strict JSON**; response is **validated** (`validateLearningPathShape`). On any failure, the rule-based path is kept (sources may read `gemini` + `rules` only when AI path is accepted).
4. Result is saved as `lastLearningPath` on the user profile (`data/user-profile.json`).

---

## Tech stack

- **Frontend:** React 18, React Router 6, Vite 5, CSS (design tokens + responsive layout).
- **Backend:** Node 18+, Express 4, `dotenv`, `cors`, `express-rate-limit`.
- **AI:** Google Gemini **server-side only** (chat + optional learning-path JSON).
- **Persistence:** File-based JSON under `data/` (appropriate for demos; swap for PostgreSQL in a “phase 2” story).

---

## Project layout

```
├── server.js              # Express app, all /api routes, serves dist/ in production
├── lib/
│   └── learningPath.js    # Rule-based personalization + JSON extract/validate helpers
├── data/
│   ├── roadmaps.json        # Track definitions + gap resource catalog
│   ├── user-profile.json    # Skills, proficiency, last generated path
│   ├── career-goals.json
│   └── contacts.json        # Created at runtime; listed in .gitignore
├── src/                     # React application
│   ├── pages/
│   ├── components/
│   └── context/
├── vite.config.js
└── index.html
```

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/career-goals` | List goals |
| POST | `/api/career-goals` | Add goal `{ careerField, experienceLevel, notes? }` |
| DELETE | `/api/career-goals/:index` | Remove by index |
| GET | `/api/profile` | Load skills, proficiency map, track, goal, `lastLearningPath` |
| PUT | `/api/profile` | Merge-update profile (sanitized) |
| POST | `/api/learning-path/generate` | Body overrides profile fields; returns `{ learningPath, profile }` |
| POST | `/api/chat` | `{ message, careerGoals?, userProfile? }` → `{ reply, usedMock }` |
| POST | `/api/contact` | `{ name, email, message }` |

Rate limits: global `/api` bucket + tighter limits on chat and learning-path generation.

---

## Local development

**Prerequisites:** Node.js 18+ (for native `fetch` on the server).

```bash
npm install
cp .env.example .env
# Add a real Gemini API key to .env if you want AI chat and AI learning paths
npm run dev
```

- Open **http://localhost:5173** (Vite proxies `/api` → Express on **3000**).- Do not use `npm run preview` for the full app: that serves only built frontend assets and will return 404 for `/api/*` unless the backend is also running separately.- Production-like run: `npm run build` then `npm start` → **http://localhost:3000**.

---

## Deployment (e.g. Render)

- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Environment:** `GEMINI_API_KEY` (optional), `PORT`, optional `CLIENT_ORIGIN` if SPA and API differ.

---

## Ideas you can mention in interviews (“what’s next?”)

- Replace JSON files with **PostgreSQL** + Prisma and add **user accounts**.
- Add **OAuth** (GitHub) for “import skills from profile”.
- **Embeddings** for semantic skill matching instead of string heuristics.
- **Webhooks** or email provider for contact instead of file append.

---

## License

MIT
