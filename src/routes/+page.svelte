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
	import CursorTrail from '$lib/components/CursorTrail.svelte';
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
<CursorTrail />
<Navbar />
<main>
	<Hero />
	<About />
	<div class="section-divider divider-to-card"></div>
	<Experience />
	<div class="section-divider divider-to-dark"></div>
	<Projects />
	<div class="section-divider divider-to-card"></div>
	<Skills />
	<Contact />
</main>
<Footer />
<BackToTop />
