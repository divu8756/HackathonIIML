# CodeStorm '26 — IIM Lucknow Hackathon Site

A complete, responsive event portal for a flagship college hackathon hosted by **IIM Lucknow (Noida Campus)**. Built with plain HTML, CSS and vanilla JavaScript — no build step, no framework, no dependencies to install. The only third-party script is [Chart.js](https://www.chartjs.org/) (loaded from a CDN) for the analytics dashboard.

Prize pool: **₹10,00,000**. Teams of exactly **3**. Event dates: **14–15 November 2026**.

## Features

**Landing page** — hero with dates and a prominent Register CTA, a live countdown, the ₹10,00,000 prize pool with a full tier breakdown, About, Themes/Tracks, Schedule, Sponsors and FAQ sections.

**Rules & instructions** — a dedicated, scannable page covering eligibility, team composition, code of conduct, submission format, the weighted judging rubric, and every timeline milestone.

**Registration** — a team-based signup that hard-enforces exactly 3 members (name, email, college, role each), rejects duplicate emails, issues a unique team ID on the spot, and shows a simulated confirmation email.

**Project Submission** — title, track, repo link, demo video link, 150-word summary, tools/AI-use declaration and a PDF deck upload. Editable as many times as you like; the portal locks itself automatically at the deadline.

**Team Dashboard** — the team's home: members, live submission status, a readiness checklist, organiser announcements and quick links.

**Live Countdown** — a ribbon that follows every page plus a full countdown block on the homepage, both phase-aware (registration close → kickoff → submission deadline → finals) and driving the submission lock in real time.

**Coding Arena** — official problem statements, event-day resources, and five practice challenges with an in-browser JS editor, a test runner, and a live leaderboard.

**Analytics Dashboard** — an organiser-facing view: registrations over time, submissions over time, track/college distribution, engagement, a registration→submission funnel and the top-teams table, all charted with Chart.js.

Also: dark/light theme toggle (persisted, no flash-of-wrong-theme), a mobile nav, keyboard-navigable forms and accordions, a skip-to-content link, and colours checked for WCAG AA contrast in both themes.

## Project structure

```
HackathonIIML/
├── index.html            # markup for all seven views
├── assets/
│   ├── css/
│   │   └── styles.css    # design system + every component style
│   └── js/
│       ├── data.js       # ALL event content: dates, prizes, tracks, schedule,
│       │                 #   sponsors, FAQ, rubric, challenges, mock dataset
│       ├── api.js        # the only file that would talk to a real backend
│       └── app.js        # routing, rendering, validation, interactions
├── README.md
└── LICENSE
```

Fonts (Sora, IBM Plex Sans, IBM Plex Mono) load from Google Fonts, so an internet connection is needed for the intended typography; everything else is self-contained.

## Data model — what's mocked and where a backend plugs in

There is no backend. Everything persists to `localStorage` in the visitor's own browser via **`assets/js/api.js`** — the single file every other script goes through to read or write "server" state. Each method has a `LIVE:` comment showing the real HTTP call it would make:

| API method | Mock behaviour | Real endpoint |
|---|---|---|
| `registerTeam()` | Validates 3 unique members, writes to `localStorage`, returns a generated team ID | `POST /teams` |
| `saveSubmission()` | Validates the deadline, upserts a submission object | `PUT /teams/{id}/submission` |
| `recordSolve()` | Awards Arena points client-side | `POST /arena/solves` (score server-side in production) |
| `getAnalytics()` | Folds the current visitor's team/submission into the seed dataset in `data.js` | `GET /analytics/overview` |
| `sendConfirmationEmail()` | Renders a fake email preview in the UI | a transactional-mail provider (SES, SendGrid, Resend…) |

Suggested backend schema: `teams(id, name, college, track, created_at)`, `members(team_id, name, email, college, role)`, `submissions(team_id, title, repo_url, demo_url, deck_key, summary, updated_at)`, `arena_solves(team_id, challenge_id, points, at)`.

All the *content* an organiser edits between editions — dates, prize amounts, tracks, schedule, sponsors, FAQ, the judging rubric and the seeded registration/submission numbers — lives in **`assets/js/data.js`**, in one place, so a new edition doesn't require touching `app.js`.

## Run it locally

Just open `index.html` in any browser. Or serve it (recommended, so relative asset paths behave exactly as they will on GitHub Pages):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publish on GitHub Pages

1. Push this repo to GitHub (already done if you're reading this from there).
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick the **`main`** branch and the **`/ (root)`** folder, and click **Save**.
4. Wait a minute — the site goes live at `https://<your-username>.github.io/<your-repo>/`.

Because `index.html` sits at the repo root, GitHub Pages serves it automatically — no build step.

## Customise before you go live

- **Everything content-related** — dates, prize amounts, tracks, schedule, sponsors, FAQ, rubric weights, arena challenges — lives in `assets/js/data.js`. Edit that one file for a new edition.
- **Contact email** — `EVENT.contact` in `data.js` (defaults to the placeholder `codestorm@iiml.example`).
- **Countdown milestones** — the `MILESTONES` array in `data.js` drives the ribbon, the homepage countdown, the schedule table and the submission-lock timing.
- **Colours** — CSS custom properties on `:root` and `:root[data-theme="light"]` in `assets/css/styles.css`.
- **Disclaimer** — the footer notes this is a demo site, not an official IIM Lucknow page. Remove that line if this is a sanctioned event.

## Accessibility

- Colour pairs are checked for WCAG AA contrast (4.5:1 body text, 3:1 large text/UI) in both themes.
- Every interactive control has a visible focus ring; a skip-to-content link is the first Tab stop.
- Forms use associated `<label>`s, `aria-describedby` error text and `role="alert"`/`aria-live` regions instead of colour alone.
- The layout is mobile-first and works down to phone width, with a collapsible nav under 900px.

## Note

Every form, submission and score on this site is client-side and stored only in the visitor's own browser (`localStorage`) — nothing is sent to a server, and nothing is shared between visitors or devices. See **Data model** above for exactly what a production backend would need to replace.
