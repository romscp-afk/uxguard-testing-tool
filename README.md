# UXGuard AI — Testing Tool

Accessibility + UX validation platform. Scan a live URL or paste/upload code and get a single scored report combining:

- **Accessibility** — WCAG checks via [axe-core](https://github.com/dequelabs/axe-core), the industry-standard engine (used by Google, Deque, etc.)
- **UX Heuristics** — rule-based checks: heading hierarchy, readability, CTA clarity, link text, form labels, layout density
- **AI Review** — Claude reviews the actual screenshot for visual hierarchy, trust signals, and first-impression clarity (skipped automatically if no API key is set)

## Project structure

```
uxguard-testing-tool/
├── server/          Express backend — scanning engine, scoring, API
│   └── src/
│       ├── analyzers/   accessibility (axe-core + puppeteer), UX heuristics, AI review
│       ├── routes/      /api/scan-url, /api/analyze-code
│       └── utils/       scoring engine
└── client/          React + Vite frontend
    └── src/
        ├── pages/       Home, URL Scan, Code Analysis
        ├── components/  Navbar, ScoreCard, IssueList
        └── styles/       design tokens (dark + #FF6B00 accent theme)
```

## Setup

### Backend
```bash
cd server
npm install
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env for AI review (optional — rest works without it)
npm run dev
```
Runs on `http://localhost:4000`.

### Frontend
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`, proxies `/api` to the backend.

## Notes on v1 scope

- **JSX/TSX/Vue uploads**: analyzed as rendered markup rather than fully compiled components (no build step in this version), so results are strongest for plain HTML. Framework-aware analysis is a natural next step.
- **AI review**: requires `ANTHROPIC_API_KEY`. Without it, the tool still returns full accessibility + heuristic results — the AI section is simply marked unavailable in the report.
- **Deployment**: this repo is code only. To get a live URL, deploy `server/` (Render, Railway, Fly.io — needs a host that supports Puppeteer/headless Chrome) and `client/` (Vercel, Netlify) separately, then point the client's API proxy at the deployed backend URL.

## Roadmap ideas
- Persist scan history per user
- PDF export of reports
- Real JSX/Vue component rendering via a lightweight build step
- Scheduled re-scans with regression tracking
