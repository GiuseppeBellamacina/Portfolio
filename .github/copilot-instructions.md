# .github/copilot-instructions.md

## Progetto

Portfolio personale di Giuseppe Bellamacina — sito web single-page.

## Stack

- **Framework**: SvelteKit 5 (Svelte 5) + TypeScript
- **Build tool**: Vite 7
- **Deploy**: Vercel (adapter-vercel, runtime Node.js 22)
- **Package manager**: Bun (preferito). Usare `bun install`, `bun run dev`, ecc.
- **Image processing**: sharp (già in dependencies)
- **Formatter**: Prettier con plugin Svelte

## Comandi utili

```bash
bun install          # installa dipendenze
bun run dev          # dev server locale
bun run build        # build di produzione
bun run preview      # preview del build
bun run check        # type-check (svelte-check + tsc)
bun run format       # formatta tutto con Prettier
bun run format:check # verifica formattazione

# Ottimizzazione assets
bun scripts/optimize-assets.mjs              # dry-run (solo report)
bun scripts/optimize-assets.mjs --apply      # applica ottimizzazioni
bun scripts/optimize-assets.mjs --apply --icons    # solo icone
bun scripts/optimize-assets.mjs --apply --projects # solo immagini progetti
bun scripts/optimize-assets.mjs --apply --profile  # solo profilo
bun scripts/optimize-assets.mjs --apply --max-size 256  # override dimensione max
bun scripts/optimize-assets.mjs --apply --to-webp  # converti PNG/JPG → WebP (elimina originale)
bun scripts/optimize-assets.mjs --apply --to-webp --projects # converti solo progetti a WebP
```

## Struttura del progetto

```
src/
  app.css                    # Stili globali (variabili CSS, layout, responsive)
  app.html                   # Template HTML
  lib/
    performance.css          # Override CSS per performance
    assets/favicon.svg       # Favicon
    components/              # Componenti principali
      Hero.svelte            # Sezione hero
      About.svelte           # Chi sono
      Skills.svelte          # Tech stack (icone + canvas effects)
      Experience.svelte      # Esperienze lavorative
      Projects.svelte        # Portfolio progetti
      Contact.svelte         # Contatti
      Navbar.svelte          # Navigazione
      Footer.svelte          # Footer
      Terminal.svelte        # Terminale interattivo
      CursorTrail.svelte     # Effetto scia cursore
      ScrollProgress.svelte  # Barra progresso scroll
      BackToTop.svelte       # Bottone torna su
      SectionSnap.svelte     # Snap scroll tra sezioni
      seasonal/              # Effetti stagionali (neve, sakura, halloween, ecc.)
    stores/
      seasonStore.ts         # Stato stagione corrente
  routes/
    +page.svelte             # Pagina principale
    +layout.svelte           # Layout
    +error.svelte            # Pagina errore
    sitemap.xml/+server.ts   # Generazione sitemap
static/
  assets/
    icons/                   # Icone tech stack (target: max 128px, ~2-8KB ciascuna)
    projects/                # Screenshot progetti (target: max 800px, formato WebP)
    profile.avif/.png/.webp  # Foto profilo (.png tenuto come fallback per og:image)
    cv.pdf                   # CV
scripts/
  optimize-assets.mjs        # Script ottimizzazione + conversione WebP
```

## Skills — Come aggiungere una nuova skill

1. Metti il logo in `static/assets/icons/` (qualsiasi formato: png, jpg, webp, svg)
2. Esegui `bun scripts/optimize-assets.mjs --apply --icons` per ottimizzare
3. In `src/lib/components/Skills.svelte`, aggiungi l'entry nella categoria giusta:
   ```ts
   { name: 'NomeTool', icon: 'nome-file.png', url: 'https://...' }
   ```
4. Le categorie sono: Languages, AI/ML & Data Science, Frameworks & Libraries, Databases, DevOps & Tools, IDEs & Editors, Operating Systems & Security

## Projects — Come aggiungere un nuovo progetto

1. Metti lo screenshot in `static/assets/projects/` (qualsiasi formato raster)
2. Esegui `bun scripts/optimize-assets.mjs --apply --to-webp --projects` per ottimizzare e convertire a WebP
3. In `src/lib/components/Projects.svelte`, aggiungi l'entry nell'array `projects`:
   ```ts
   {
     icon: '🧬',
     title: 'Nome Progetto',
     description: 'Descrizione HTML...',
     techTags: ['Tag1', 'Tag2'],
     githubUrl: 'https://github.com/...',
     image: '/assets/projects/nome.webp'
   }
   ```
4. Opzionale: aggiungi `externalLink` per demo/download/youtube/hackathon
5. Se è un progetto in corso, aggiungilo anche in `Terminal.svelte` (array `projectEntries`)

## Asset — Linee guida

- **Icone**: vengono renderizzate a 50×50px CSS → max 128px (2× retina). Lo script le ridimensiona automaticamente.
- **Progetti**: thumbnail → max 800px, formato WebP preferito.
- **Profilo**: max 256px. Il `.png` è mantenuto come fallback per `og:image` (social preview).
- **SVG**: non vengono toccati dallo script (già vettoriali).
- **Conversione WebP**: usare `--to-webp` per convertire PNG/JPG in WebP. Lo script elimina l'originale e bisogna aggiornare i path nel codice.
- **Nomi file**: possono contenere spazi (es. `unsloth logo black text.png`).
- Alcuni file hanno prefisso `white_bg_` per versioni con sfondo bianco.
- Lo script scrive solo se il risparmio è > 5%.

## Stile e convenzioni

- Variabili CSS globali: `--primary-color`, `--secondary-color`, `--bg-card`, `--bg-main`, ecc.
- Le icone delle skill hanno effetti hover con glow e scale (definiti in `app.css`).
- La sezione Skills ha un canvas con costellazioni e stelle cadenti per lo sfondo.
- Effetti stagionali (neve, sakura...) sono in `components/seasonal/` e gestiti da `seasonStore.ts`.
- Stile dark theme di default.

## Deploy

- Push su `main` → deploy automatico su Vercel.
- Il deploy viene skippato se l'unica modifica è al README (`ignoreCommand` in `vercel.json`).
