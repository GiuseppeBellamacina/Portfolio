# Giuseppe Bellamacina - Portfolio

A modern, cyberpunk-themed portfolio website showcasing AI/ML engineering projects and skills with immersive visual effects.

🌐 **Live Website**: [Portfolio](https://giuseppebellamacina.com)

## ✨ Features

### 🎨 Visual Effects

- **Matrix Rain Animation** - Dynamic character rain effect on the navigation bar
- **Seasonal Effects System** - Automatic themed animations based on calendar periods:
  - 🎄 **Snow** (Dec 1-30 and Jan 3-6)
  - 🌟 **Summer** (Jun-Aug)
  - 🎆 **New Year** (Dec 31-Jan 2)
- **Terminal Theme Control** - Seasonal themes can also be selected with the terminal `theme` command
- **Neural Network Visualization** - Interactive canvas-based feedforward network with animated impulse propagation
- **Binary Particle System** - Animated binary digits with neon glow effects
- **Shooting Stars & Constellations** - Space-themed background animations
- **Glitch Effects** - Cyberpunk-style text animations and hover effects

### 🚀 Performance

- **Lazy Loading** - Heavy visual effects use IntersectionObserver for viewport-based rendering
- **GPU Acceleration** - CSS animations use `will-change` and hardware acceleration where appropriate
- **Pause When Offscreen** - Animations automatically pause when not visible
- **Optimized Rendering** - Canvas effects are capped at suitable frame rates

### 📱 Responsive Design

- **Mobile-First Approach** - Responsive across devices
- **Futuristic Hamburger Menu** - Cyberpunk-styled mobile navigation
- **Touch-Optimized** - Smooth interactions on mobile devices
- **Accessibility** - ARIA labels, keyboard navigation support, and semantic HTML

## 🛠️ Tech Stack

- **[Svelte 5](https://svelte.dev/)** - Reactive UI with the runes API
- **[SvelteKit](https://kit.svelte.dev/)** - Application framework
- **TypeScript** - Type-safe development
- **Bun** - JavaScript runtime and package manager
- **[Vite 7](https://vitejs.dev/)** - Build tool
- **Static prerendering (SSG)** - The portfolio is prerendered for deployment as static output
- **Self-hosted Font Awesome subset** - Only the used icons are included in generated WOFF2 assets
- **Vercel** - Hosting and deployment from pushes to `main`

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system

### Installation

```bash
git clone https://github.com/GiuseppeBellamacina/Portfolio.git
cd Portfolio
bun install
```

### Development

```bash
bun run dev
# Open http://localhost:5173
```

### Build

```bash
bun run build
bun run preview
```

### Code Quality

```bash
bun run check
bun run check:watch
bun run format
bun run format:check
```

### Asset Scripts

```bash
# Dry-run report (default)
bun scripts/optimize-assets.mjs
bun scripts/optimize-assets.mjs --apply
bun scripts/optimize-assets.mjs --apply --icons
bun scripts/optimize-assets.mjs --apply --projects
bun scripts/optimize-assets.mjs --apply --profile
bun scripts/optimize-assets.mjs --apply --max-size 256
bun scripts/optimize-assets.mjs --apply --to-webp
bun scripts/optimize-assets.mjs --apply --to-webp --projects

# Generate static/favicon.ico from the SVG favicon
bun scripts/gen-favicon.mjs

# Generate the self-hosted Font Awesome subset
bun scripts/subset-fontawesome.mjs
```

Dopo aver aggiunto icone Font Awesome, ri-esegui `bun scripts/subset-fontawesome.mjs`.

## 📂 Project Structure

```text
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/check.yml
├── src/
│   ├── app.css, app.d.ts, app.html
│   ├── lib/
│   │   ├── components/
│   │   │   ├── hero/        # Hero, typing effect, GPGPU particles
│   │   │   ├── about/       # About and neural network
│   │   │   ├── experience/  # Experience and binary rain
│   │   │   ├── skills/      # Skills and constellation effects
│   │   │   ├── projects/    # Projects and GitHub integration
│   │   │   ├── navbar/      # Navigation and matrix effect
│   │   │   ├── terminal/    # Interactive terminal and command data
│   │   │   ├── contact/
│   │   │   ├── footer/
│   │   │   ├── seasonal/    # SnowEffect, SummerEffect, NewYearEffect
│   │   │   ├── sectionSnap.ts
│   │   │   ├── LazySection.svelte
│   │   │   ├── ScrollProgress.svelte
│   │   │   └── BackToTop.svelte
│   │   ├── stores/seasonStore.ts
│   │   └── performance.css, index.ts, cvDownload.ts
│   └── routes/
│       ├── +page.svelte, +layout.svelte, +layout.ts, +error.svelte
│       └── sitemap.xml/+server.ts
├── static/
│   ├── assets/icons/ and projects/
│   ├── favicons/
│   ├── fonts/ and fa-subset.css
│   └── robots.txt, site.webmanifest, sitemap.xml
├── scripts/
│   ├── optimize-assets.mjs
│   ├── gen-favicon.mjs
│   └── subset-fontawesome.mjs
└── svelte.config.js, vite.config.ts, tsconfig.json, vercel.json
```

## 🎯 Key Components

### Seasonal Effects

`SnowEffect`, `SummerEffect`, and `NewYearEffect` activate according to their calendar periods and can be controlled through `seasonStore.ts` and the terminal `theme` command. They manage their particles and animations with responsive density and cleanup.

### Navbar

Matrix rain, smooth section navigation, active-section highlighting, responsive menu, and backdrop effects.

### Hero

Typing variations, glitch title animation, cursor blink, profile image, and GPU-accelerated particles.

### About

Canvas-based neural network visualization with layered nodes, animated impulses, trails, and live connections.

### Projects

Project cards with technology tags, external links, GitHub API star counts, and keyboard-accessible project detail interaction.

### Skills

Categorized technology icons with constellation and shooting-star canvas effects, hover states, and animated reveals.

### Experience

Timeline cards with binary rain background, gradient date styling, and responsive positioning.

### Terminal

Interactive terminal backed by a modular command registry, including navigation, project information, CV actions, and the `theme` command.

## 🌟 Performance Optimizations

- IntersectionObserver and lazy sections for viewport-based work
- RequestAnimationFrame loops for canvas animations
- Web Animations API for isolated seasonal animations
- Automatic cleanup and offscreen pausing
- CSS containment and GPU-friendly effects
- Debounced scroll handling
- Lazy GitHub star-count requests
- Responsive particle density
- Static prerendering (SSG) and a self-hosted Font Awesome subset

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📧 Contact

Giuseppe Bellamacina

- GitHub: [@GiuseppeBellamacina](https://github.com/GiuseppeBellamacina)
- Email: [g.bellamacina@gmail.com](mailto:g.bellamacina@gmail.com)
- LinkedIn: [Giuseppe Bellamacina](https://www.linkedin.com/in/giuseppe-bellamacina/)

---

Made with ❤️ using Svelte 5 and modern web technologies
