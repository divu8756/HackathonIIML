# CodeStorm '26 — IIM Lucknow Hackathon Site

A single-page, fully static website for a college hackathon hosted by **IIM Lucknow (Noida Campus)**. Built with plain HTML, CSS and vanilla JavaScript — no build step, no dependencies to install.

## Features

- **Hero** with the ₹10,00,000 prize pool and a live countdown to the event.
- **Prize breakdown** — Winner ₹5,00,000 · Runner-up ₹3,00,000 · Second runner-up ₹1,50,000 · Best Track ₹50,000 (₹10,00,000 total).
- **Problem tracks**, full **rules & instructions** (teams of exactly three), and a two-day **schedule**.
- A working, client-side **registration form** for a team of three that validates all fields and issues a confirmation ticket ID.
- **FAQ**, a **dark/light theme toggle**, and a responsive layout that works down to phone width.

## Project structure

```
codestorm-26/
├── index.html      # the entire site (HTML + CSS + JS in one file)
├── README.md
├── LICENSE
└── .gitignore
```

Fonts (Sora, IBM Plex Sans, IBM Plex Mono) are loaded from Google Fonts, so an internet connection is needed to see the intended typography; everything else is self-contained.

## Run it locally

Just open `index.html` in any browser. Or serve it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publish on GitHub Pages

1. Create a new repository on GitHub (e.g. `codestorm-26`).
2. Push these files to the repo:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: CodeStorm '26 hackathon site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

3. On GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick the **`main`** branch and the **`/ (root)`** folder, and click **Save**.
5. Wait a minute — your site goes live at `https://<your-username>.github.io/<your-repo>/`.

Because the file is named `index.html` and sits at the repo root, GitHub Pages serves it automatically.

## Customise before you go live

- **Contact email** — replace the placeholder `codestorm@iiml.example` in `index.html`.
- **Dates** — the countdown targets `2026-11-14T11:00:00+05:30`; update it and the schedule if your dates differ.
- **Prize split, tracks and rules** — edit the relevant sections in `index.html`.
- **Disclaimer** — the footer notes this is a demo site, not an official IIM Lucknow page. Remove that line if this is a sanctioned event.

## Note

The registration form is client-side only — submissions are validated and shown a ticket, but they are **not stored or emailed anywhere**. To collect real registrations, connect the form to a backend or a form service (e.g. Formspree, Google Forms, or a serverless endpoint).
