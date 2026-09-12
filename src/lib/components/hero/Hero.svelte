<script lang="ts">
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';
	import { get } from 'svelte/store';
	import { currentSeason } from '$lib/stores/seasonStore';
	import type { Season } from '$lib/stores/seasonStore';
	import { t, lang } from '$lib/i18n';
	import { getBaseTexts, getSeasonalGreetings } from './heroData';
	import { startTypingEffect } from './typingEffect';
	import { downloadCV, type CvDownloadState } from '$lib/cvDownload';
	import './hero.css';

	type SeasonalProps = { forceShow?: boolean };
	const seasonalLoaders: Record<
		'snow' | 'summer' | 'newyear',
		() => Promise<{ default: Component<SeasonalProps> }>
	> = {
		snow: () => import('$lib/components/seasonal/SnowEffect.svelte'),
		summer: () => import('$lib/components/seasonal/SummerEffect.svelte'),
		newyear: () => import('$lib/components/seasonal/NewYearEffect.svelte')
	};

	/**
	 * Season implied by the current date — mirrors the exact windows checked
	 * inside each seasonal effect component (they stay authoritative).
	 */
	function dateSeason(): Season {
		const month = new Date().getMonth(); // 0-11
		const day = new Date().getDate();
		if ((month === 11 && day === 31) || (month === 0 && day <= 2)) return 'newyear';
		if ((month === 11 && day >= 1 && day <= 30) || (month === 0 && day >= 3 && day <= 6)) {
			return 'snow';
		}
		if (month >= 5 && month <= 7) return 'summer';
		return 'default';
	}

	// Only the active season's effect is mounted, via dynamic import, so
	// off-season chunks never enter the initial bundle. The terminal
	// `theme` command overrides the calendar via the season store.
	let SeasonalEffect = $state<Component<SeasonalProps> | null>(null);

	$effect(() => {
		const storeSeason = $currentSeason;
		const active = storeSeason !== 'default' ? storeSeason : dateSeason();
		if (active === 'default') {
			SeasonalEffect = null;
			return;
		}
		let cancelled = false;
		seasonalLoaders[active]()
			.then((mod) => {
				if (!cancelled) SeasonalEffect = mod.default;
			})
			.catch(() => {
				/* decorative effect — fail silently */
			});
		return () => {
			cancelled = true;
		};
	});

	let typingText = $state('');
	let mounted = $state(false);
	let heroContainer: HTMLDivElement;
	let heroSection: HTMLElement;
	let spotlightX = $state(50);
	let spotlightY = $state(50);
	let isGlitching = $state(false);

	// Rare glitch moment on the name (~every 45-90s, random interval) — a
	// delightful glitch-in-the-matrix beat rather than a constant metronome
	let glitchTimeout: ReturnType<typeof setTimeout>;
	function scheduleGlitch() {
		function tick() {
			if (!document.hidden) {
				isGlitching = true;
				setTimeout(() => (isGlitching = false), 700);
			}
			glitchTimeout = setTimeout(tick, 45000 + Math.random() * 45000);
		}
		glitchTimeout = setTimeout(tick, 45000 + Math.random() * 45000);
	}

	let cvState = $state<CvDownloadState>('idle');
	async function handleCvDownload(e: MouseEvent) {
		e.preventDefault();
		if (cvState === 'loading') return;
		cvState = 'loading';
		await downloadCV();
		cvState = 'done';
		setTimeout(() => (cvState = 'idle'), 2200);
	}

	function getTexts(): string[] {
		const season = get(currentSeason);
		const currentLang = get(lang);
		const greetings = getSeasonalGreetings(currentLang)[season];
		const texts = [...getBaseTexts(currentLang)];
		if (!greetings) return texts;
		for (let i = 0; i < greetings.length; i++) {
			const pos = Math.floor((texts.length / (greetings.length + 1)) * (i + 1));
			texts.splice(pos, 0, greetings[i]);
		}
		return texts;
	}

	/* ── Spotlight: rAF-coalesced mouse tracking with a cached rect ── */
	let pendingMouseEvent: MouseEvent | null = null;
	let spotlightRaf: number | undefined;
	let heroRect: DOMRect | null = null;

	function invalidateHeroRect() {
		heroRect = null;
	}

	function applySpotlight() {
		spotlightRaf = undefined;
		const e = pendingMouseEvent;
		pendingMouseEvent = null;
		if (!e || !heroSection) return;
		if (!heroRect) heroRect = heroSection.getBoundingClientRect();
		spotlightX = ((e.clientX - heroRect.left) / heroRect.width) * 100;
		spotlightY = ((e.clientY - heroRect.top) / heroRect.height) * 100;
	}

	function onHeroMouseMove(e: MouseEvent) {
		pendingMouseEvent = e;
		if (spotlightRaf === undefined) {
			spotlightRaf = requestAnimationFrame(applySpotlight);
		}
	}

	onMount(() => {
		const cancelTyping = startTypingEffect(getTexts, (text) => (typingText = text));
		scheduleGlitch();

		const mountedRaf = requestAnimationFrame(() => (mounted = true));
		window.addEventListener('scroll', invalidateHeroRect, { passive: true });
		window.addEventListener('resize', invalidateHeroRect);

		/* ── GPGPU particles: deferred init with unmount-race guards ── */
		let gpgpuCleanup: (() => void) | undefined;
		let idleTimeout: number | undefined;
		let idleHandle: number | undefined;
		let destroyed = false;

		const initGpgpu = async () => {
			const { initGpgpuParticles } = await import('./gpgpuParticles');
			// Too late (component unmounted): init never ran, nothing to clean.
			if (destroyed || !document.contains(heroContainer)) return;
			gpgpuCleanup = await initGpgpuParticles(heroContainer, heroSection);
			if (destroyed) {
				// Unmounted while initializing: release immediately.
				gpgpuCleanup?.();
				gpgpuCleanup = undefined;
			}
		};

		// Skip heavy GPGPU particles on mobile/low-end devices
		const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
		if (!isMobile) {
			// Small delay so the galaxy appears promptly without blocking the TBT window;
			// the system itself fades in gradually once initialized.
			idleTimeout = setTimeout(() => {
				if ('requestIdleCallback' in window) {
					idleHandle = requestIdleCallback(initGpgpu);
				} else {
					initGpgpu();
				}
			}, 600) as unknown as number;
		}

		return () => {
			destroyed = true;
			cancelTyping();
			clearTimeout(glitchTimeout);
			cancelAnimationFrame(mountedRaf);
			if (spotlightRaf !== undefined) cancelAnimationFrame(spotlightRaf);
			window.removeEventListener('scroll', invalidateHeroRect);
			window.removeEventListener('resize', invalidateHeroRect);
			if (idleTimeout !== undefined) clearTimeout(idleTimeout);
			if (idleHandle !== undefined && 'cancelIdleCallback' in window) {
				cancelIdleCallback(idleHandle);
			}
			gpgpuCleanup?.();
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section id="home" class="hero" bind:this={heroSection} onmousemove={onHeroMouseMove}>
	<div class="hero-canvas" bind:this={heroContainer}></div>
	{#if SeasonalEffect}
		<SeasonalEffect />
	{/if}
	<div
		class="hero-spotlight"
		style="--spot-x: {spotlightX}%; --spot-y: {spotlightY}%"
		aria-hidden="true"
	></div>

	<div class="hero-content" class:hero-entered={mounted}>
		<!-- Holographic ring -->
		<div class="profile-container hero-stagger">
			<div class="holo-ring">
				<div class="holo-ring-inner"></div>
			</div>
			<picture class="profile-picture">
				<source srcset="/assets/profile.avif" type="image/avif" />
				<img
					src="/assets/profile.webp"
					alt="Giuseppe Bellamacina"
					class="profile-image"
					fetchpriority="high"
					width="192"
					height="192"
				/>
			</picture>
		</div>

		<h1
			class="glitch hero-stagger s2"
			class:is-glitching={isGlitching}
			data-text="Giuseppe Bellamacina"
		>
			Giuseppe Bellamacina
		</h1>

		<p class="subtitle hero-stagger s3">
			<span class="typing-prefix">&gt;&nbsp;</span>
			<span id="typing-text">{typingText}</span><span class="typing-cursor">|</span>
		</p>

		<div class="hero-buttons hero-stagger s4">
			<a
				href="#experience"
				class="btn btn-primary"
				onclick={(e) => {
					e.preventDefault();
					document
						.querySelector('#experience')
						?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}}>{$t.hero_viewExperience}</a
			>
			<a
				href="https://raw.githubusercontent.com/GiuseppeBellamacina/CurriculumVitae/main/cv.pdf"
				download="Giuseppe_Bellamacina_CV.pdf"
				rel="noopener noreferrer"
				class="btn btn-secondary cv-btn"
				class:is-loading={cvState === 'loading'}
				class:is-done={cvState === 'done'}
				onclick={handleCvDownload}
			>
				{#if cvState === 'loading'}
					<i class="fas fa-download"></i>
					{$t.cv_downloading}
				{:else if cvState === 'done'}
					<i class="fas fa-check"></i>
					{$t.cv_downloaded}
				{:else}
					<i class="fas fa-download"></i>
					{$t.hero_downloadCV}
				{/if}
			</a>
			<a href="https://github.com/GiuseppeBellamacina" target="_blank" class="btn btn-secondary">
				<i class="fab fa-github"></i> GitHub
			</a>
		</div>

		<div class="social-links hero-stagger s5">
			<a
				href="https://www.linkedin.com/in/giuseppe-bellamacina-739b03204/"
				target="_blank"
				title="LinkedIn"
			>
				<i class="fab fa-linkedin"></i>
			</a>
			<a href="https://www.instagram.com/giuseppe_bellamacina/" target="_blank" title="Instagram">
				<i class="fab fa-instagram"></i>
			</a>
			<a href="https://github.com/GiuseppeBellamacina" target="_blank" title="GitHub">
				<i class="fab fa-github"></i>
			</a>
		</div>
	</div>

	<div class="scroll-indicator hero-stagger s6" class:hero-entered={mounted}>
		<div class="scroll-mouse">
			<div class="scroll-dot"></div>
		</div>
	</div>
</section>
