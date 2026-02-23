# TechNova Refund Investigation Suite

An interactive dashboard built to investigate a 340% spike in refund activity across Brazil, Mexico, and Colombia. Submitted for Yuno's AI challenge.

**[Live Demo](#)** · **[Repo](#)**

> Replace the links above with your Vercel URL and GitHub URL before submitting.

---

## Quick Start

```bash
npm install
npm run dev     # → http://localhost:5173
npm run build   # production build (zero TS errors)
```

No environment variables required.

---

## Screenshots

<!-- Add screenshots here -->

---

## How to Investigate a Spike (60-second walkthrough)

1. **Load the dashboard** — the default view shows all 500 refunds across the full 90-day window. The timeline immediately shows a cliff-edge volume jump around mid-November.
2. **Read the alert banners** — PatternAlerts auto-detects clusters on load. You'll see a geographic cluster warning for Guadalajara and a serial refunder warning. These are the two highest-confidence signals.
3. **Zoom in on the spike** — set the date filter to Nov 14 onward to isolate the spike period. All four breakdown charts and the KPI bar update instantly.
4. **Find the worst actors** — set Risk Level → High. The table filters to flagged records only. Sort by Amount descending to find the Bogotá high-value cluster ($800–$1,200 USD refunds via Visa credit).
5. **Drill into a record** — click any row to open the detail modal. The "Why flagged" section lists every contributing factor with an icon. The customer history panel shows how many times that customer ID appears in the dataset.
6. **Filter by country + reason** — select Mexico + `duplicate_charge` to isolate the Guadalajara Gang cluster (OpenPay processor, 22 refunds in 8 days).

---

## Embedded Anomalies

Three anomalies are baked into the mock data, each independently detectable through filters:

| Anomaly | Signal | Days |
|---------|--------|------|
| **Guadalajara Gang** | 22 refunds · Guadalajara + OpenPay + `duplicate_charge` | 50–57 |
| **Serial Refunders** | 10 customers with 5–6 refunds each in a 30-day window | 50–78 |
| **Bogotá High-Value Cluster** | 14 refunds · Bogotá + Visa credit + `fraud_prevention` · $800–$1,200 USD | 62–70 |

---

## Risk-Flagging Logic

Every refund receives a score from 0–100. The score is built additively from independent factors, and the reasons are stored per-record so the UI can explain exactly why a refund was flagged.

| Factor | Points | Rationale |
|--------|--------|-----------|
| Customer has 3+ refunds in 30 days | +30 | Strongest signal — burst activity from a single account is the most reliable fraud pattern |
| Customer has 5+ lifetime refunds | +15 | Secondary signal — high lifetime frequency warrants review even without a burst |
| Amount > $500 USD equivalent | +20 | High-value refunds have outsized financial impact and are a common fraud target |
| Account age < 60 days | +15 | New accounts requesting large refunds is a known abuse vector |
| Reason = `fraud_prevention` | +15 | Already processor-flagged; surfacing it confirms the signal |
| Reason = `duplicate_charge` | +10 | Operationally suspicious; common in coordinated abuse rings |
| Geographic/processor cluster (5+ same city + processor in 7 days) | +20 | Detects coordinated attacks originating from the same location and payment route |
| Refund ≥ 90% of order amount | +10 | Full-amount refunds on a completed order are more likely abusive than partial ones |

**Levels:** Low = 0–30 · Medium = 31–60 · High = 61+

Scoring runs against the full dataset once at startup so cluster detection has global context (a refund's score doesn't change when you filter — you're always seeing its true risk relative to all data).

---

## Design Decisions

**Single derived state, no sync bugs.** All data displayed in the dashboard — metrics, charts, alerts, table — is derived from one `filters` object via `useMemo`. There's no secondary state to keep in sync. Changing any filter updates everything in one render pass.

**Score once against full data.** Risk scoring (especially the geographic cluster check) needs global context to be accurate. Scoring is computed once against all 500 records at startup, not re-computed per filter. Filters then slice into the pre-scored array. This means a record's risk score reflects the real dataset, not an artificially narrowed subset.

**Transparency over black boxes.** Each scored refund carries a `riskReasons` array — the specific factors that contributed to its score. The detail modal surfaces these as a human-readable list with icons. An analyst can always explain why a record was flagged.

**Pattern alerts are additive, not noisy.** PatternAlerts only fires two types of signals (geographic cluster, serial refunder) and deduplicates to the top 3 city alerts. Dismissal is per-session. The goal is to surface the two or three most actionable findings, not flood the screen.

**Dark neutral palette, red accent.** A dark UI reduces eye strain for analysts working long sessions. Red is reserved exclusively for high-risk signals (badges, alerts, chart spikes) so it retains its meaning — it's never used decoratively.

**Recharts over a heavier charting library.** Recharts is React-native, composable, and has zero peer-dependency conflicts with Vite + React 19. For the volume of data here (~500 points at most) it's more than sufficient and keeps the bundle lean.

---

## Stretch Goal: Pattern Discovery Tool

Three capabilities added beyond the base filters to help investigators find patterns they wouldn't know to look for:

### 1. Cohort Anomaly Ranking
The **Pattern Discovery** panel automatically groups all refunds by a configurable pair of dimensions (City × Processor, City × Reason, Method × Reason) and scores each cohort with a weighted anomaly formula:

```
anomalyScore = count × 0.4 + avgRiskScore × 0.4 + pctHigh × 100 × 0.2
```

Cohorts are ranked highest-first and displayed as cards. On load, Guadalajara × OpenPay surfaces at the top of the City × Processor view. Clicking **Investigate →** applies the cohort's dimensions as active filters, instantly narrowing all charts and the table. Clicking **🚩** saves the cohort as a named investigation bookmark.

### 2. Saved Investigation Views
Investigators can bookmark any filter state — whether set manually, loaded from a cohort card, or composed over time — with a custom label. Saved views persist across sessions via `localStorage` and appear as clickable chips in the filter sidebar. Views can be deleted individually.

### 3. Period Comparison Chart
A grouped bar chart below the breakdown charts shows how each country compares against the equivalent prior period. The comparison adjusts dynamically as the date range filter changes — narrowing to "last two weeks" shows this week vs last week, not the full 90-day baseline.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Vite + React 19 + TypeScript |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| Utilities | date-fns, clsx |
| Deploy | Vercel (auto-detected Vite config) |

---

## Project Structure

```
src/
├── data/mockData.ts          # 500-record dataset with 3 embedded anomalies
├── types/index.ts            # Refund, FilterState, ScoredRefund, Metrics types
├── utils/
│   ├── riskScoring.ts        # 0–100 scoring algorithm
│   └── dataHelpers.ts        # Filter, aggregate, group, detect-pattern helpers
└── components/
    ├── MetricsBar.tsx         # 4 KPI cards with trend arrows
    ├── PatternAlerts.tsx      # Auto-detected cluster banners
    ├── FilterPanel.tsx        # Sidebar: date, country, reason, method, amount, risk
    ├── TimelineChart.tsx      # Area chart with spike reference line
    ├── BreakdownCharts.tsx    # 2×2: country, reason, method, risk distribution
    ├── RefundTable.tsx        # Sortable, paginated, risk badges
    └── RefundDetailModal.tsx  # Drill-down: risk reasons, customer history
```

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in Vercel → it auto-detects Vite, no config needed
3. No environment variables required
