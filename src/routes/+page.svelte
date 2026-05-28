<script lang="ts">
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/navbar/Navbar.svelte';
	import Hero from '$lib/components/hero/Hero.svelte';
	import LazySection from '$lib/components/LazySection.svelte';
	import Footer from '$lib/components/footer/Footer.svelte';
	import ScrollProgress from '$lib/components/ScrollProgress.svelte';
	import BackToTop from '$lib/components/BackToTop.svelte';
	import { initSectionSnap } from '$lib/components/sectionSnap';

	onMount(() => {
		const cleanup = initSectionSnap();

		// Subtle parallax on section titles
		const titles = document.querySelectorAll<HTMLElement>('.section-title');
		let raf: number;
		function updateParallax() {
			const vh = window.innerHeight;
			for (const el of titles) {
				const rect = el.getBoundingClientRect();
				const center = rect.top + rect.height / 2;
				const offset = ((center - vh / 2) / vh) * -12; // max ±12px
				el.style.transform = `translateY(${offset}px)`;
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
		<LazySection loader={() => import('$lib/components/about/About.svelte')} />
		<div class="section-divider divider-to-card"></div>
		<LazySection loader={() => import('$lib/components/experience/Experience.svelte')} />
		<div class="section-divider divider-to-dark"></div>
		<LazySection loader={() => import('$lib/components/projects/Projects.svelte')} />
		<div class="section-divider divider-to-card"></div>
		<LazySection loader={() => import('$lib/components/skills/Skills.svelte')} />
		<LazySection loader={() => import('$lib/components/contact/Contact.svelte')} />
	</div>
</main>
<Footer />
<BackToTop />
