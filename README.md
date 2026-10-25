# PULSE — Real-Time Crypto Market Terminal

A high-performance, editorial fintech landing page and real-time market tracker for cryptocurrency pairs streaming directly from **Kraken Spot WebSocket v2** (`wss://ws.kraken.com/v2`).

Built with React 19, TypeScript, and Vite. Features zero synthetic data, resilient connection state machines, in-memory session sparklines, and coalesced rendering.

---

## Key Highlights

- **Direct L1 Market Feed**: Connects straight to Kraken's public Spot WebSocket v2 without intermediary servers, proxy scrapers, or API tokens.
- **Tracked Currency Pairs**:
  - `BTC/USD` (Bitcoin)
  - `ETH/USD` (Ethereum)
  - `SOL/USD` (Solana)
  - `XRP/USD` (XRP)
- **Zero Synthetic Smoothing**: Real trade prices, genuine 24h percentage changes calculated by the exchange, and volatile in-memory session sparklines. No fake data or demo prices.
- **Self-Healing Connection Engine**:
  - `CONNECTING`: WebSocket handshake initiated, requesting snapshot.
  - `LIVE`: Confirmed after receiving valid ticker data.
  - `STALE`: Triggers if no message or heartbeat arrives for 20 seconds. Automatically closes the socket and reconnects.
  - `RECONNECTING`: Exponential backoff (`1s`, `2s`, `4s`, `8s`, `16s`, `30s`) with randomized jitter; strict single active socket and timer guarantee.
  - `ERROR`: Exchange rejection handling with manual retry capability.
- **Performance & Accessibility**:
  - Coalesced state updates (capped at ~4 renders/second) to prevent layout thrashing and screen reader flooding during intense trade volleys.
  - Micro-interactions (250–350ms price pulse) using `tabular-nums` without layout shift.
  - Full keyboard accessibility and visible focus rings.
  - Full adherence to `prefers-reduced-motion: reduce`.
  - Zero horizontal overflow down to 320px mobile viewport.

---

## Tech Stack

- **Framework**: React 19 + TypeScript (strict mode)
- **Bundler / Dev Server**: Vite 6
- **Test Runner**: Vitest 3 + `@testing-library/react` + `jsdom`
- **Linting**: ESLint 9 + TypeScript-ESLint
- **Styling**: Pure CSS with CSS variables, responsive grid, and SVG graphics (no bloated UI library dependencies)

---

## Project Structure

```text
├── index.html                   # Entry HTML with SVG favicon, meta descriptions, lang="en"
├── package.json                 # Dependencies and scripts
├── vite.config.ts               # Vite & Vitest configuration
├── tsconfig.json                # Strict TypeScript configuration
├── eslint.config.js             # Modern ESLint configuration
├── src/
│   ├── types/
│   │   └── market.ts            # Type definitions, symbols metadata, connection states
│   ├── services/
│   │   └── krakenParser.ts      # Pure parser for Kraken WS v2 frames (ticker, heartbeat, status, errors)
│   ├── hooks/
│   │   └── useKrakenTicker.ts   # WebSocket state machine, watchdog timer, backoff & coalesced buffer
│   ├── components/
│   │   ├── Header.tsx           # Brand wordmark, connection badge, navigation, retry action
│   │   ├── Hero.tsx             # Signal field visual, headline, value proposition & primary CTAs
│   │   ├── SignalField.tsx      # Low-opacity ambient telemetry grid & wave flux SVG
│   │   ├── LiveBoard.tsx        # 4-column market card grid with telemetry counters
│   │   ├── MarketCard.tsx       # Live price, 24h delta, flash indicators, session sparkline
│   │   ├── Sparkline.tsx        # Real-time SVG session momentum trend (up to 24 ticks)
│   │   ├── SignalsSection.tsx   # Integrity & resilience architecture cards
│   │   ├── HowItWorks.tsx       # 4-step data pipeline breakdown
│   │   └── FooterCTA.tsx        # Direct anchor to board and official Kraken documentation links
│   ├── App.tsx                  # Root application composition
│   ├── index.css                # Design system tokens, typography, motion & responsive rules
│   └── main.tsx                 # Application mounting point
└── tests/
    ├── krakenParser.test.ts     # Parser unit tests (snapshots, updates, errors, malformed frames)
    ├── useKrakenTicker.test.ts  # Lifecycle & state machine tests (watchdog, backoff, cleanup, timers)
    └── App.test.tsx             # Full landmark, accessibility, link validity, and integration tests
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Quality & Test Pipeline

```bash
# Typecheck
npm run typecheck

# Lint
npm run lint

# Run all test suites
npm run test

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Verification & Test Results

All verification suites pass cleanly:

1. **Unit & Integration Tests (`npm run test`)**:
   - `tests/krakenParser.test.ts`: 10 tests passing (snapshot/update parsing, heartbeat, status, error payloads, malformed JSON resilience, finite number guards, undefined representation for missing 24h change).
   - `tests/useKrakenTicker.test.ts`: 10 tests passing (CONNECTING -> LIVE transition, sparkline buffer, 20s watchdog STALE trigger, heartbeat watchdog reset, subscription error handling, strict teardown on unmount, handshake stall watchdog, 19s reconnect watchdog stop regression, terminal/sticky ERROR state without auto-reconnect past 20s until manual retry).
   - `tests/App.test.tsx`: 4 tests passing (ARIA landmark verification, link target validation, live snapshot rendering, STALE pill and styling for retained tickers across non-LIVE states while omitting pills for skeletons).
   - **Total**: 24 tests passing across 3 suites.

2. **TypeScript (`npm run typecheck`)**:
   - `tsc --noEmit` exited with code 0 (0 errors).

3. **Linter (`npm run lint`)**:
   - `eslint .` exited with code 0 (0 warnings, 0 errors).

4. **Production Build (`npm run build`)**:
   - Transformed 41 modules, generating optimized production bundle in `dist/`.

5. **Accessibility & WCAG AA Contrast**:
   - Elevated `--text-muted` to `#9eb2c2` (7.5:1 contrast against `#0c1820`, exceeding 4.5:1 WCAG AA).
   - Elevated `--text-secondary` to `#b2c5d4` (9.8:1 contrast against `#0c1820`).
   - Elevated `--color-negative` to `#ff6b8b` and negative change badge text to `#ffa3b5` (> 5.5:1 contrast).
   - Neutral change indicator displays `—` without inventing 0 for missing 24h change deltas.
   - All interactive controls feature visible focus outlines (`2px solid var(--accent-cyan)` with `3px` offset).
