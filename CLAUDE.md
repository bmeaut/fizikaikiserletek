# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A GitHub Pages site that serves as a hub for mobile-targeted Progressive Web Apps (PWAs) for physics experiments. The site is written in Hungarian. See `WEBSITE.md` for the step-by-step guide on adding new apps.

## Structure

```
fizikaikiserletek/
├── index.html          # Hub landing page
├── manifest.json       # PWA manifest for the hub
├── sw.js               # Service Worker for the hub
├── assets/
│   ├── style.css       # Shared styles (light/dark mode via CSS variables)
│   ├── main.js         # QR code generation + SW registration
│   └── icons/          # SVG placeholders — replace with PNG for real PWA install
├── apps/
│   └── <name>/         # Each experiment is a self-contained PWA subfolder
└── WEBSITE.md          # How to add a new app (Hungarian guide)
```

## No build step

This is a plain HTML/CSS/JS site. There is no build tool, bundler, or package manager. Files are served as-is by GitHub Pages.

## Adding a new app

See `WEBSITE.md` for the full checklist. In brief:
1. Create `apps/<name>/` with `index.html`, `manifest.json`, `sw.js`, and icons.
2. Add an `<article class="app-card">` to the `#app-grid` section in `index.html`.
3. Set `data-url` on the `.qr-canvas` to the full GitHub Pages URL of the app — the QR code is generated client-side by qrcodejs.

## Icons

`assets/icons/` currently contains SVG placeholders. For PWA installability, convert them to PNG (192×192 and 512×512) and keep the same filenames with `.png` extension. The `manifest.json` already references `.png`.

## GitHub Pages deployment

Push to `master`; Pages is configured to serve from the repo root. The live URL is `https://<username>.github.io/fizikaikiserletek/`.

## Cache busting

When updating an app, increment the `CACHE` constant version string in its `sw.js` (e.g. `inga-v1` → `inga-v2`).
