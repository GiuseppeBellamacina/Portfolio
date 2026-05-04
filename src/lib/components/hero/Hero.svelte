<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { currentSeason } from '$lib/stores/seasonStore';
	import { t, lang } from '$lib/i18n';
	import { getBaseTexts, getSeasonalGreetings } from './heroData';
	import { initGpgpuParticles } from './gpgpuParticles';
	import { startTypingEffect } from './typingEffect';
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
		const idle =
			'requestIdleCallback' in window
				? requestIdleCallback(async () => {
						cleanup = await initGpgpuParticles(heroContainer, heroSection);
					})
				: setTimeout(async () => {
						cleanup = await initGpgpuParticles(heroContainer, heroSection);
					}, 50);

		requestAnimationFrame(() => (mounted = true));
		return () => {
			unsubSeason();
			unsubLang();
			if ('cancelIdleCallback' in window) cancelIdleCallback(idle as number);
			else clearTimeout(idle as number);
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
			<picture>
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
			<a href="/assets/cv.pdf" download="Giuseppe_Bellamacina_CV.pdf" class="btn btn-secondary">
				<i class="fas fa-download"></i>
				{$t.hero_downloadCV}
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
