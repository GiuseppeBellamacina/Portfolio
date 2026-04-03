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
		return cleanup;
	});
</script>

<ScrollProgress />
<CursorTrail />
<Navbar />
<main>
	<Hero />
	<About />
	<Experience />
	<Projects />
	<Skills />
	<Contact />
</main>
<Footer />
<BackToTop />
