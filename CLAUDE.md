# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Giuseppe Bellamacina's personal portfolio: a single-page, cyberpunk-themed SvelteKit site, statically prerendered and deployed to Vercel.

## Commands

Package manager is **Bun** (preferred; `.npmrc` has `engine-strict=true`).

```bash
bun install
bun run dev            # http://localhost:5173
bun run build
bun run preview
bun run check           # svelte-kit sync + svelte-check (type checking)
bun run check:watch
bun run format          # prettier --write .
bun run format:check
```

There is no test suite/runner in this project — `bun run check` (types) and `bun run format:check` are the only verification commands, mirrored exactly in `.github/workflows/check.yml` (runs on PRs and pushes to `main`: `check`, `format:check`, `build`). Deploy is not done via GitHub Actions — Vercel deploys automatically on push to `main`.

### Asset scripts

```bash
bun scripts/optimize-assets.mjs                    # dry-run report (default)
bun scripts/optimize-assets.mjs --apply
bun scripts/optimize-assets.mjs --apply --icons
bun scripts/optimize-assets.mjs --apply --projects
bun scripts/optimize-assets.mjs --apply --profile
bun scripts/optimize-assets.mjs --apply --max-size 256
bun scripts/optimize-assets.mjs --apply --to-webp
bun scripts/optimize-assets.mjs --apply --to-webp --projects

bun scripts/gen-favicon.mjs           # regenerate static/favicon.ico from the SVG favicon
bun scripts/subset-fontawesome.mjs    # regenerate the self-hosted Font Awesome subset
```

**Always re-run `bun scripts/subset-fontawesome.mjs` after adding a new Font Awesome icon/class** — icons are self-hosted as a generated WOFF2 subset (`static/fonts/`, `static/fa-subset.css`) built with `fontkit`/`subset-font`/`harfbuzzjs`, not loaded from a CDN, so unsubsetted icons silently don't render.

## Architecture

### Single-page structure

The whole site is one route: `src/routes/+page.svelte` sequentially mounts every section (`Navbar`, `Hero`, `About`, `Experience`, `Projects`, `Skills`, `Contact`, `Footer`) plus global chrome (`ScrollProgress`, `BackToTop`). `src/routes/+layout.ts` sets `prerender = true` — the whole app builds to static HTML (via `adapter-vercel`, `nodejs22.x` runtime only for what can't prerender, e.g. `sitemap.xml/+server.ts`).

Each section lives in `src/lib/components/<name>/` with its own `<Name>.svelte`, `<name>.css`, and colocated logic/data modules (e.g. `hero/typingEffect.ts`, `hero/gpgpuParticles.ts`, `hero/heroData.ts`). Keep new component logic and data inside that component's folder rather than a shared/global location; put static content in a `*Data.ts` file next to the component.

### i18n

`src/lib/i18n/index.ts` is a hand-rolled i18n layer, not a library: a `lang` Svelte store (`'en' | 'it'`) and a derived `t` store over a single `translations` object with parallel `en`/`it` key blocks. `lang` always starts as `'en'` so SSR and the initial hydration match; `initLang()` (called from `+layout.svelte`'s `onMount`) detects the saved/browser language afterwards and only then starts persisting to `localStorage`. **Any new user-facing string needs a key added to both the `en` and `it` blocks** — there's no fallback/missing-key mechanism.

### Seasonal theme system

`src/lib/stores/seasonStore.ts` holds a `currentSeason` store (`'default' | 'snow' | 'summer' | 'newyear'`). The root layout applies it as a `season-*` class on `<body>` via `$effect`; `src/app.css` redefines the same CSS custom properties (`--primary-color`, `--neon-*`, `--bg-*`, etc.) per season class. Real seasons are date-driven (Snow: Dec 1–30 & Jan 3–6; Summer: Jun–Aug; New Year: Dec 31–Jan 2); the terminal's `theme` command can also force a season temporarily by calling `setSeason`/`resetSeason` directly, bypassing the calendar logic.

### Terminal

`src/lib/components/terminal/commands.ts` is a command registry: each command is a pure `CommandHandler` over a `CommandContext` (history/input operations are injected, not owned by the handler). A handler returns `HistoryEntry[]` for a synchronous result, or `'async'` when it drives output itself over time via `ctx.pushLine(s)`/`ctx.lockInput` (see `playRandomSong` for the pattern: lock input, push lines with delays, unlock, refocus). Command data (projects, songs, bio) lives in `terminalData.ts`.

### Heavy visual effects: lazy-loaded and pausable

Canvas/WebGL-heavy modules (`hero/gpgpuParticles.ts` — GPGPU particles, dynamically `import('three')` so three.js isn't in the main bundle; `about/neuralNetwork.ts`; `skills/skillsConstellation.ts`; `experience/binaryRain.ts`; `seasonal/*Effect.svelte`) are:

- mounted through `LazySection.svelte`, which only loads the component once an `IntersectionObserver` fires (viewport-based, `rootMargin` configurable) — use this wrapper for any new heavy/offscreen effect rather than importing it eagerly;
- paused when the tab is hidden (`document.visibilitychange` toggles a `tab-hidden` class on `<body>` in the root layout — effects should respect it or their own pause logic);
- gated on `prefers-reduced-motion` where the effect is purely decorative (see `sectionSnap.ts`'s `REDUCED_MOTION` check and `+page.svelte`'s parallax setup).

### Hero scroll-snap

`src/lib/components/sectionSnap.ts` implements a custom, hero-only scroll lock: while the viewport is within the Hero section, any wheel/touch/key scroll gesture is intercepted and smoothly snaps straight to the About section; once past the Hero, scrolling is unlocked and normal. This is deliberately hand-rolled (not a scroll-snap CSS/library) to allow the asymmetric behavior (locked in Hero, free everywhere else) and reduced-motion fallback (instant jump instead of animation).

### Assets

- Skill icons → `static/assets/icons/`, project screenshots → `static/assets/projects/`, favicons → `static/favicons/`, self-hosted fonts + generated FA subset → `static/fonts/`.
- Adding a skill: add the icon asset, run `optimize-assets.mjs --apply --icons`, then update `skills/skillsData.ts`.
- Adding a project: add the screenshot, run `optimize-assets.mjs --apply --to-webp --projects`, then update `projects/projectsData.ts` and, if relevant, the terminal's project entries in `terminal/terminalData.ts`.

## Conventions

- Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) in all components — no legacy `export let`/reactive-statement style.
- Tabs, Prettier (`prettier-plugin-svelte`), single quotes, no trailing commas, 100-char print width — enforced by `bun run format:check` in CI, not just convention.
- Code comments in English even though UI copy is bilingual (en/it).
- Preserve accessibility (ARIA labels, keyboard nav, skip link), effect cleanup, and offscreen/hidden-tab pausing when touching any animation code.
