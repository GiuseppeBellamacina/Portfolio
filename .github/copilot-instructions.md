# .github/copilot-instructions.md

## Progetto

Portfolio personale di Giuseppe Bellamacina — sito single-page in SvelteKit, prerenderizzato staticamente.

## Stack

- **Framework**: SvelteKit 5 / Svelte 5 con runes + TypeScript
- **Build tool**: Vite 7
- **Deploy**: Vercel; push su `main` → deploy automatico
- **Package manager**: Bun (preferito)
- **Formatter**: Prettier con plugin Svelte
- **Icone**: subset Font Awesome self-hosted in `static/fonts/`

## Comandi utili

```bash
bun install
bun run dev
bun run build
bun run preview
bun run check
bun run format
bun run format:check

# Asset
bun scripts/optimize-assets.mjs                    # dry-run
bun scripts/optimize-assets.mjs --apply
bun scripts/optimize-assets.mjs --apply --icons
bun scripts/optimize-assets.mjs --apply --projects
bun scripts/optimize-assets.mjs --apply --profile
bun scripts/optimize-assets.mjs --apply --max-size 256
bun scripts/optimize-assets.mjs --apply --to-webp
bun scripts/optimize-assets.mjs --apply --to-webp --projects
bun scripts/gen-favicon.mjs
bun scripts/subset-fontawesome.mjs
```

Dopo aver aggiunto icone Font Awesome, ri-eseguire `bun scripts/subset-fontawesome.mjs`.

## Struttura del progetto

```text
src/
  app.css, app.d.ts, app.html
  lib/
    components/
      hero/        # Hero, typingEffect, gpgpuParticles
      about/       # About, neuralNetwork
      experience/  # Experience, experienceData, binaryRain
      skills/      # Skills, skillsData, skillsConstellation
      projects/    # Projects, projectsData
      navbar/      # Navbar
      terminal/    # Terminal, terminalData, command registry
      contact/     # Contact
      footer/      # Footer
      seasonal/    # SnowEffect, SummerEffect, NewYearEffect
      sectionSnap.ts
      LazySection.svelte, ScrollProgress.svelte, BackToTop.svelte
    stores/seasonStore.ts
    performance.css, index.ts, cvDownload.ts
  routes/
    +page.svelte, +layout.svelte, +layout.ts, +error.svelte
    sitemap.xml/+server.ts
static/
  assets/icons/ and assets/projects/
  favicons/
  fonts/ and fa-subset.css
scripts/
  optimize-assets.mjs
  gen-favicon.mjs
  subset-fontawesome.mjs
```

## Convenzioni

- Usare tab e Prettier; commenti nel codice in inglese.
- Usare Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) nei nuovi componenti.
- Mantenere la logica specifica nelle sottocartelle del componente e i dati in file `*Data.ts`.
- Effetti seasonal: solo Snow (1-30 dic, 3-6 gen), Summer (giu-ago), New Year (31 dic-2 gen); stato in `seasonStore.ts`, comando manuale `theme` nel terminale.
- Preservare accessibilità, cleanup degli effetti e pausa quando non visibili.
- Asset: icone in `static/assets/icons/`, progetti in `static/assets/projects/`, favicon in `static/favicons/`.
- Dopo ogni nuova classe/icona Font Awesome, rigenerare il subset self-hosted.
- Tema dark di default; mantenere le variabili CSS globali esistenti.

## Aggiungere skill o progetto

- Skill: aggiungere l'asset in `static/assets/icons/`, ottimizzare con `--apply --icons`, quindi aggiornare i dati della cartella `skills/`.
- Progetto: aggiungere lo screenshot in `static/assets/projects/`, usare `--apply --to-webp --projects`, quindi aggiornare `projectsData.ts` e, se necessario, le entry del terminale.

## CI e deploy

- `.github/workflows/check.yml` esegue su pull request e push su `main`: `check`, `format:check`, `build`.
- Il deploy non è gestito da GitHub Actions: avviene tramite Vercel dopo il push su `main`.
