<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import About from '$lib/components/About.svelte';
	import Experience from '$lib/components/Experience.svelte';
	import Projects from '$lib/components/Projects.svelte';
	import Skills from '$lib/components/Skills.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ScrollProgress from '$lib/components/ScrollProgress.svelte';
	import BackToTop from '$lib/components/BackToTop.svelte';
	import CursorTrail from '$lib/components/CursorTrail.svelte';
	import SectionSnap from '$lib/components/SectionSnap.svelte';
	// import SeasonalEffectsDebug from '$lib/components/seasonal/SeasonalEffectsDebug.svelte';
</script>

<!-- <SeasonalEffectsDebug /> -->
<SectionSnap />
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
