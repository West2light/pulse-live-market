# Deployment Result — PULSE to GitHub & Vercel

**Date**: 2026-10-25
**Workspace**: `D:\testGPTPLUS`
**Builder**: Herdr agent `builder`, pane `w3:p2` (Gemini 3.8 Flash Medium)

---

## 1. GitHub Repository

- **Repository**: [`West2light/pulse-live-market`](https://github.com/West2light/pulse-live-market)
- **Visibility**: `PUBLIC` (`isPrivate: false`)
- **Default Branch**: `main`
- **Initial application deployment commit SHA**: `dd42ca72aa633d604c9413c16093bd616b07ee00` (subsequent documentation/release commits deploy through the connected `main` branch).
- **Commit Message**: `feat: PULSEのリアルタイム市場ページを公開`
- **Sync Status**: Remote and local branch are synchronized (`git ls-remote` verified). No force-push was used.
- **Excluded Files**:
  - `node_modules/`, `dist/`, `.vercel/`, `.codex/`, `.agents/`, `skills-lock.json`
  - `.env.local`, `*.log`, `adds/REVIEW/`

---

## 2. Vercel Project & Production Deployment

- **Account / Whoami**: `west2light`
- **Team Scope**: `duongdongs-projects` (`DuongDong's projects`, Hobby plan)
- **Project Name**: `pulse-live-market`
- **Project ID**: `prj_kjY17d4MYbFSsMs990B1U0EVOchV`
- **Framework Preset**: `Vite` (Node.js 24.x)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Deployment ID**: `dpl_8Zxc4fDt6KdxZjcgrGybdJLF1gRL`
- **Deployment Status**: `● Ready` (`READY`)
- **Production Alias URLs**:
  - Primary Production: **https://pulse-live-market.vercel.app**
  - Team Production: `https://pulse-live-market-duongdongs-projects.vercel.app`
  - Direct Deployment: `https://pulse-live-market-hjtznh366-duongdongs-projects.vercel.app`
- **Deployment Inspector**: `https://vercel.com/duongdongs-projects/pulse-live-market/8Zxc4fDt6KdxZjcgrGybdJLF1gRL`

---

## 3. Git Integration Status

- **GitHub connection**: Vercel project API now reports `type=github`, `org=West2light`, `repo=pulse-live-market`, `productionBranch=main`.
- An initial CLI connect returned `400` while GitHub App authorization was pending; after authorization/propagation, the project link is verified successfully. No further user action is needed.
- Production deployment is live and also remains independently deployable with the authenticated Vercel CLI.

---

## 4. Quality & Verification Evidence

| Check | Command | Result |
| :--- | :--- | :--- |
| **TypeScript Typecheck** | `npm run typecheck` | **Pass** (0 errors) |
| **ESLint** | `npm run lint` | **Pass** (0 errors, 0 warnings) |
| **Unit & Integration Tests** | `npm run test` | **Pass** (24/24 tests passed in 3 suites) |
| **Production Build** | `npm run build` | **Pass** (`dist/` created in 554ms) |
| **Vercel Dry-Run Payload** | `vercel deploy --dry --json` | **Pass** (31 source files, 0 credentials, 19 items properly ignored) |
| **HTTP Production Smoke Test** | `Invoke-WebRequest https://pulse-live-market.vercel.app` | **Pass** (HTTP 200 OK, `X-Vercel-Cache: HIT`, `Content-Length: 963`) |
| **Headless Browser DOM Verification** | Headless Chrome DOM dump on live production URL | **Pass** (Full React tree mounted: header, SignalField SVG, 4 cards, signals section, how it works, footer) |
| **Runtime Logs** | `vercel logs --limit 10` | No records returned in the sampled interval; this static client app has no backend runtime logs. |
| **Production browser check** | Chrome/agent-browser on the production alias | LIVE STREAM, all four pairs, no page errors, 320/768/1440px without page overflow, axe 0 violations in sampled live view. |

## 5. Release

The first release uses version `v1.0.0`, matching `package.json`. Release publication and subsequent production readiness are verified against the repository's commit and Vercel deployment metadata.

