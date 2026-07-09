# UXGuard AI — Testing Tool

Accessibility + UX validation platform. Scan a live URL or paste/upload code and get a single scored report combining:

- **Accessibility** — WCAG checks via [axe-core](https://github.com/dequelabs/axe-core), the industry-standard engine (used by Google, Deque, etc.)
- **UX Heuristics** — rule-based checks: heading hierarchy, readability, CTA clarity, link text, form labels, layout density
- **AI Review** — Claude reviews the actual screenshot for visual hierarchy, trust signals, and first-impression clarity (skipped automatically if no API key is set)

## Project structure

```
uxguard-testing-tool/
├── api/             Vercel serverless functions (production API)
│   ├── scan-url.js       POST — analyze a live URL
│   ├── analyze-code.js   POST — analyze pasted/uploaded code
│   └── health.js
├── lib/             Shared analysis engine used by the api/ functions
│   ├── analyzers/   accessibility (axe-core + serverless Chromium), UX heuristics, AI review
│   └── utils/       scoring engine
├── client/          React + Vite frontend
│   └── src/
│       ├── pages/       Home, URL Scan, Code Analysis
│       ├── components/  Navbar, ScoreCard, IssueList
│       └── styles/       design tokens (dark + teal accent theme)
├── server/          Standalone Express version (optional — for local dev
│                    without Vercel, or if you prefer deploying to
│                    Render/Railway instead of Vercel serverless)
└── vercel.json      Monorepo build config (client + api together)
```

This project is set up to deploy as a **single Vercel project**: the `client/` folder builds as the static frontend, and `api/` becomes serverless functions automatically. Accessibility scanning uses `@sparticuz/chromium` + `puppeteer-core`, a Chromium build made specifically for serverless environments.

## Deploying to Vercel

1. Import this repo into Vercel
2. **Root Directory**: leave as the repo root (not `client`) — `vercel.json` handles routing both the frontend build and the `api/` functions
3. Add environment variable `ANTHROPIC_API_KEY` (optional — enables the AI review pass; everything else works without it)
4. Deploy

## Local development (optional, via the standalone server/)

```bash
cd server
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY if desired
npm run dev             # runs on http://localhost:4000
```
```bash
cd client
npm install
npm run dev             # runs on http://localhost:5173, proxies /api to the backend above
```

## Notes on v1 scope

- **JSX/TSX/Vue uploads**: analyzed as rendered markup rather than fully compiled components (no build step in this version), so results are strongest for plain HTML. Framework-aware analysis is a natural next step.
- **AI review**: requires `ANTHROPIC_API_KEY`. Without it, the tool still returns full accessibility + heuristic results — the AI section is simply marked unavailable in the report.
- **Deployment**: this repo is code only. To get a live URL, deploy `server/` (Render, Railway, Fly.io — needs a host that supports Puppeteer/headless Chrome) and `client/` (Vercel, Netlify) separately, then point the client's API proxy at the deployed backend URL.

## Roadmap ideas
- Persist scan history per user
- PDF export of reports
- Real JSX/Vue component rendering via a lightweight build step
- Scheduled re-scans with regression tracking

<!-- redeploy trigger 2026-07-09T05:05:22Z -->
