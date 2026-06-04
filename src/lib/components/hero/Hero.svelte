<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { currentSeason } from '$lib/stores/seasonStore';
	import { t, lang } from '$lib/i18n';
	import { getBaseTexts, getSeasonalGreetings } from './heroData';
	import { startTypingEffect } from './typingEffect';
	import { downloadCV, type CvDownloadState } from '$lib/cvDownload';
	import SnowEffect from '$lib/components/seasonal/SnowEffect.svelte';
	import SummerEffect from '$lib/components/seasonal/SummerEffect.svelte';
	import NewYearEffect from '$lib/components/seasonal/NewYearEffect.svelte';
	import './hero.css';

	let typingText = $state('');
	let mounted = $state(false);
	let heroContainer: HTMLDivElement;
	let heroSection: HTMLElement;
	let spotlightX = $state(50);
	let spotlightY = $state(50);

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

	onMount(() => {
		const unsubSeason = currentSeason.subscribe(() => {});
		const unsubLang = lang.subscribe(() => {});
		startTypingEffect(getTexts, (t) => (typingText = t));

		let cleanup: (() => void) | undefined;
		let idle: number | undefined;

		// Skip heavy GPGPU particles on mobile/low-end devices
		const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
		if (!isMobile) {
			// Small delay so the galaxy appears promptly without blocking the TBT window;
			// the system itself fades in gradually once initialized.
			idle = setTimeout(async () => {
				if ('requestIdleCallback' in window) {
					requestIdleCallback(async () => {
						const { initGpgpuParticles } = await import('./gpgpuParticles');
						cleanup = await initGpgpuParticles(heroContainer, heroSection);
					});
				} else {
					const { initGpgpuParticles } = await import('./gpgpuParticles');
					cleanup = await initGpgpuParticles(heroContainer, heroSection);
				}
			}, 600) as unknown as number;
		}

		requestAnimationFrame(() => (mounted = true));
		return () => {
			unsubSeason();
			unsubLang();
			if (idle !== undefined) {
				clearTimeout(idle);
			}
			cleanup?.();
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
	id="home"
	class="hero"
	bind:this={heroSection}
	onmousemove={(e) => {
		const rect = heroSection.getBoundingClientRect();
		spotlightX = ((e.clientX - rect.left) / rect.width) * 100;
		spotlightY = ((e.clientY - rect.top) / rect.height) * 100;
	}}
>
	<div class="hero-canvas" bind:this={heroContainer}></div>
	<SnowEffect />
	<NewYearEffect />
	<SummerEffect />
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

		<h1 class="glitch hero-stagger s2" data-text="Giuseppe Bellamacina">Giuseppe Bellamacina</h1>

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
