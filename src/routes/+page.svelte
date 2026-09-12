<script lang="ts">
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/navbar/Navbar.svelte';
	import Hero from '$lib/components/hero/Hero.svelte';
	import About from '$lib/components/about/About.svelte';
	import Experience from '$lib/components/experience/Experience.svelte';
	import Projects from '$lib/components/projects/Projects.svelte';
	import Skills from '$lib/components/skills/Skills.svelte';
	import Contact from '$lib/components/contact/Contact.svelte';
	import Footer from '$lib/components/footer/Footer.svelte';
	import ScrollProgress from '$lib/components/ScrollProgress.svelte';
	import BackToTop from '$lib/components/BackToTop.svelte';
	import { initSectionSnap } from '$lib/components/sectionSnap';

	onMount(() => {
		const cleanup = initSectionSnap();

		// Parallax is a decorative motion effect: skip entirely for reduced motion
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return () => cleanup();
		}

		// Enhanced parallax on section titles and dividers
		const titles = document.querySelectorAll<HTMLElement>('.section-title');
		const dividers = document.querySelectorAll<HTMLElement>('.section-divider');
		let raf: number;

		function updateParallax() {
			const vh = window.innerHeight;
			// Pass 1: read ALL rects first (no interleaved reads/writes → no forced reflow)
			const titleData: { el: HTMLElement; offset: number }[] = [];
			for (const el of titles) {
				const rect = el.getBoundingClientRect();
				const center = rect.top + rect.height / 2;
				titleData.push({ el, offset: ((center - vh / 2) / vh) * -8 });
			}
			const dividerData: { el: HTMLElement; offset: number }[] = [];
			for (const el of dividers) {
				const rect = el.getBoundingClientRect();
				const center = rect.top + rect.height / 2;
				dividerData.push({ el, offset: ((center - vh / 2) / vh) * -10 });
			}
			// Pass 2: write all transforms
			for (const { el, offset } of titleData) {
				el.style.transform = `translateY(${offset}px) translateZ(0)`;
			}
			for (const { el, offset } of dividerData) {
				el.style.setProperty('--parallax-offset', `${offset}px`);
			}
		}

		function onScroll() {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(updateParallax);
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		updateParallax();

		return () => {
			cleanup();
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(raf);
		};
	});
</script>

<ScrollProgress />
<Navbar />
<main>
	<a href="#main-content" class="skip-link">Skip to main content</a>
	<div id="main-content" tabindex="-1">
		<Hero />
		<About />
		<div class="section-divider divider-to-card"></div>
		<Experience />
		<div class="section-divider divider-to-dark"></div>
		<Projects />
		<div class="section-divider divider-to-card"></div>
		<Skills />
		<Contact />
	</div>
</main>
<Footer />
<BackToTop />
