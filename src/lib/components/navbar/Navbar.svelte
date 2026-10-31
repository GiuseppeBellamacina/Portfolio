<script lang="ts">
	import { onMount } from 'svelte';
	import { t, lang, toggleLang } from '$lib/i18n';
	import './navbar.css';

	const navLinks = [
		{ href: '#home', key: 'nav_home' },
		{ href: '#about', key: 'nav_about' },
		{ href: '#experience', key: 'nav_experience' },
		{ href: '#projects', key: 'nav_projects' },
		{ href: '#skills', key: 'nav_skills' },
		{ href: '#contact', key: 'nav_contact' }
	] as const;

	let isMenuActive = $state(false);
	let navbarElement: HTMLElement;
	let hamburgerEl: HTMLButtonElement;
	let scrollY = $state(0);

	function toggleMenu() {
		isMenuActive = !isMenuActive;
	}

	function closeMenu() {
		isMenuActive = false;
	}

	function handleScroll(e: MouseEvent) {
		e.preventDefault();
		const target = e.currentTarget as HTMLAnchorElement;
		const href = target.getAttribute('href');
		if (href && href.startsWith('#')) {
			const element = document.querySelector(href);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
		closeMenu();
	}

	// Matrix rain behind the navbar: sparse columns, each a bright head trailed by
	// fading glyphs, crisp on high-DPI screens and tinted with the theme colour
	let rainCanvas: HTMLCanvasElement;

	function initMatrixRain() {
		if (!rainCanvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const ctx = rainCanvas.getContext('2d');
		if (!ctx) return;

		const GLYPHS =
			'01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
		const CELL = 14; // px per glyph, both directions
		const TRAIL = 7;
		const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

		interface Column {
			/** Head position in cells; negative while waiting to fall */
			head: number;
			speed: number; // cells per second
			glyphs: string[];
		}
		let columns: Column[] = [];
		let w = 0;
		let h = 0;
		let color = '#818cf8';

		const newColumn = (): Column => ({
			head: -Math.random() * 90, // long, random gaps keep the rain sparse
			speed: 5 + Math.random() * 7,
			glyphs: Array.from({ length: TRAIL }, randomGlyph)
		});

		function resize() {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			w = navbarElement.offsetWidth;
			h = navbarElement.offsetHeight;
			rainCanvas.width = Math.round(w * dpr);
			rainCanvas.height = Math.round(h * dpr);
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx!.font = `500 ${CELL - 2}px ui-monospace, 'Cascadia Code', Consolas, monospace`;
			ctx!.textAlign = 'center';
			ctx!.textBaseline = 'top';
			const count = Math.ceil(w / CELL);
			columns = Array.from({ length: count }, (_, i) => columns[i] ?? newColumn());
		}
		function readColor() {
			color = getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || color;
		}

		const resizeObs = new ResizeObserver(resize);
		resizeObs.observe(navbarElement);
		// Seasons, night and terminal palettes all land on <body> class/style
		const themeObs = new MutationObserver(readColor);
		themeObs.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
		resize();
		readColor();

		let raf = 0;
		let last = 0;
		function tick(time: number) {
			raf = requestAnimationFrame(tick);
			if (document.hidden) return;
			const dt = last ? Math.min(time - last, 100) / 1000 : 0;
			last = time;
			ctx!.clearRect(0, 0, w, h);
			const rows = Math.ceil(h / CELL);
			ctx!.fillStyle = color;
			columns.forEach((c, i) => {
				c.head += c.speed * dt;
				if (c.head - TRAIL > rows) Object.assign(c, newColumn());
				// Glyphs flicker now and then, like the film
				if (Math.random() < dt * 3) c.glyphs[Math.floor(Math.random() * TRAIL)] = randomGlyph();
				const x = i * CELL + CELL / 2;
				for (let k = 0; k < TRAIL; k++) {
					const row = Math.floor(c.head) - k;
					if (row < 0 || row >= rows) continue;
					// Bright head, then a fading tail
					ctx!.globalAlpha = k === 0 ? 0.5 : 0.26 * (1 - k / TRAIL);
					ctx!.fillText(c.glyphs[(row + TRAIL * 99) % TRAIL], x, row * CELL);
				}
			});
			ctx!.globalAlpha = 1;
		}
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			resizeObs.disconnect();
			themeObs.disconnect();
		};
	}

	onMount(() => {
		// Update navbar background on scroll
		const handleScrollEffect = () => {
			scrollY = window.scrollY;
		};

		window.addEventListener('scroll', handleScrollEffect);
		const rainCleanup = initMatrixRain();

		return () => {
			window.removeEventListener('scroll', handleScrollEffect);
			rainCleanup?.();
		};
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && isMenuActive) {
			closeMenu();
			hamburgerEl?.focus();
		}
	}}
/>

{#snippet flag()}
	{#if $lang === 'en'}
		<svg class="flag-icon" viewBox="0 0 640 480"
			><path fill="#fff" d="M0 0h640v480H0z" /><path fill="#009246" d="M0 0h213.3v480H0z" /><path
				fill="#ce2b37"
				d="M426.7 0H640v480H426.7z"
			/></svg
		>
	{:else}
		<svg class="flag-icon" viewBox="0 0 640 480"
			><path fill="#012169" d="M0 0h640v480H0z" /><path
				fill="#FFF"
				d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z"
			/><path
				fill="#C8102E"
				d="m424 281 216 159v40L369 281zm-184 20 6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z"
			/><path fill="#FFF" d="M241 0v480h160V0zM0 160v160h640V160z" /><path
				fill="#C8102E"
				d="M0 193v96h640v-96zM273 0v480h96V0z"
			/></svg
		>
	{/if}
{/snippet}

<nav class="navbar" class:navbar-solid={scrollY > 100} bind:this={navbarElement}>
	<canvas class="rain-canvas" bind:this={rainCanvas}></canvas>
	<div class="container" style="position: relative;">
		<div class="nav-brand">Giuseppe Bellamacina</div>
		<ul class="nav-menu desktop-menu">
			{#each navLinks as link}
				<li><a href={link.href} onclick={handleScroll}>{$t[link.key]}</a></li>
			{/each}
		</ul>
		<button
			class="hamburger"
			class:active={isMenuActive}
			onclick={toggleMenu}
			aria-label={isMenuActive ? $t.nav_close : $t.nav_open}
			aria-expanded={isMenuActive}
			aria-controls="mobile-menu"
			bind:this={hamburgerEl}
		>
			<span></span>
			<span></span>
			<span></span>
		</button>
	</div>
	<button class="lang-toggle desktop-lang" onclick={toggleLang} aria-label="Switch language">
		{@render flag()}
	</button>
</nav>

<!-- Menu mobile separato -->
<div class="mobile-menu-wrapper" class:active={isMenuActive} id="mobile-menu">
	<ul class="nav-menu mobile-menu">
		{#each navLinks as link}
			<li><a href={link.href} onclick={handleScroll}>{$t[link.key]}</a></li>
		{/each}
		<li>
			<button
				class="lang-toggle mobile-lang"
				onclick={() => {
					toggleLang();
					closeMenu();
				}}
				aria-label="Switch language"
			>
				{@render flag()}
				{#if $lang === 'en'}
					Italiano
				{:else}
					English
				{/if}
			</button>
		</li>
	</ul>
</div>
