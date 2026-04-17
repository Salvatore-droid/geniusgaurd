<![CDATA[# GeniusGuard — AI-Powered Security Scanning Platform

A full-stack web application for automated security scanning of websites and web applications. GeniusGuard performs quick and deep security scans, identifies vulnerabilities across multiple categories (SSL/TLS, security headers, cookies, content security), and provides actionable remediation guidance.



## Tech Stack

| Layer      | Technology                                                     |
|------------|----------------------------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, Wouter   |
| Backend    | Express.js, Node.js                                            |
| Database   | SQLite (via better-sqlite3 + Drizzle ORM)                      |
| UI Library | Radix UI primitives, Lucide React icons, Framer Motion          |

## Features

- **Quick Scan** — Fast surface-level security check of any URL
- **Deep Scan** — Comprehensive multi-category vulnerability analysis (SSL/TLS, headers, cookies, content)
- **Scan History** — Browse, search, and review all past scan results with severity breakdowns
- **Scheduled Scans** — Set up recurring scans on cron-based schedules
- **Threat Intelligence** — Aggregated threat landscape view with trend charts
- **Reports** — Exportable security reports with vulnerability scoring
- **Real-time Notifications** — In-app alerts for completed scans and critical findings
- **Dark/Light Theme** — Full theme support with system preference detection

---

## Prerequisites

- **Node.js** ≥ 18.x
- **pnpm** (recommended) or npm

```bash
# Install pnpm if you don't have it
npm install -g pnpm
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd geniusguard-frontend
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Initialize the database

The SQLite database is created automatically on first server start. No manual setup needed.

### 4. Start the development servers

You need **two terminals** running simultaneously:

**Terminal 1 — Backend API server (port 5000):**

```bash
npx tsx --no-cache server/index.ts
```

**Terminal 2 — Frontend dev server (port 3000):**

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

> The Vite dev server proxies all `/api/*` requests to the backend on port 5000 automatically.

---

## Production Build

```bash
# Build both frontend and backend
npm run build

# Start the production server
npm start
```

In production, the Express server at port 5000 serves both the API and the static frontend from `dist/public/`.

---

## Project Structure

```
geniusguard-frontend/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # shadcn/Radix primitives
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ScanNameModal.tsx
│   │   ├── contexts/           # React context providers
│   │   ├── lib/                # API client, utilities
│   │   ├── pages/              # Route-level page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── QuickScan.tsx
│   │   │   ├── DeepScan.tsx
│   │   │   ├── Scans.tsx
│   │   │   ├── ScanDetail.tsx
│   │   │   ├── ScheduledScans.tsx
│   │   │   ├── ThreatIntelligence.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Landing.tsx
│   │   │   ├── SignIn.tsx
│   │   │   └── SignUp.tsx
│   │   ├── App.tsx             # Router + providers
│   │   └── index.css           # Global styles + animations
│   └── index.html
├── server/                     # Backend (Express)
│   ├── db/
│   │   ├── schema.ts           # Drizzle ORM schema (SQLite)
│   │   └── index.ts            # Database connection
│   ├── routes.ts               # REST API endpoints
│   ├── scheduler.ts            # Cron-based scan scheduler
│   └── index.ts                # Server entry point
├── shared/                     # Shared types (frontend + backend)
├── data/                       # SQLite database files (auto-created)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## API Endpoints

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| POST   | `/api/scan`                     | Start a new scan               |
| GET    | `/api/scan/:id`                 | Get scan details + findings    |
| GET    | `/api/scan/:id/progress`        | Poll scan progress             |
| GET    | `/api/scans`                    | List all scans                 |
| DELETE | `/api/scans/:id`                | Delete a scan                  |
| GET    | `/api/stats`                    | Dashboard statistics           |
| GET    | `/api/recent-scans`             | Recent scan results            |
| GET    | `/api/vulnerability-stats`      | Vulnerability trend data       |
| GET    | `/api/threat-stats`             | Threat intelligence stats      |
| GET    | `/api/report-stats`             | Report summary stats           |
| GET    | `/api/notifications/unread`     | Unread notifications           |
| POST   | `/api/notifications/read-all`   | Mark all notifications read    |
| GET    | `/api/schedules`                | List scheduled scans           |
| POST   | `/api/schedules`                | Create a scheduled scan        |
| PUT    | `/api/schedules/:id`            | Update a scheduled scan        |
| DELETE | `/api/schedules/:id`            | Delete a scheduled scan        |

## Available Scripts

| Script           | Command                   | Description                        |
|------------------|---------------------------|------------------------------------|
| `npm run dev`    | `vite --host`             | Start Vite dev server (port 3000)  |
| `npm run dev:server` | `tsx watch server/index.ts` | Start backend with file watching |
| `npm run build`  | `vite build && esbuild ...` | Production build (frontend + backend) |
| `npm start`      | `node dist/index.js`      | Run production server              |
| `npm run check`  | `tsc --noEmit`            | TypeScript type checking           |
| `npm run format` | `prettier --write .`      | Format all files                   |

---

## License

MIT
]]>
