<script lang="ts">
	import '../app.css';
	import '../lib/performance.css';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { initLang } from '$lib/i18n';
	import { currentSeason } from '$lib/stores/seasonStore';
	import { initTimeOfDay, timeOfDay } from '$lib/stores/timeOfDayStore';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	let { children } = $props();

	onMount(() => {
		initLang();
		initTimeOfDay();

		// Pause heavy CSS animations when the tab is hidden to save GPU/CPU
		const onVis = () => document.body.classList.toggle('tab-hidden', document.hidden);
		document.addEventListener('visibilitychange', onVis);
		onVis();

		return () => document.removeEventListener('visibilitychange', onVis);
	});

	// Apply seasonal CSS class on <body>
	$effect(() => {
		const season = $currentSeason;
		const classes = ['season-snow', 'season-newyear', 'season-summer'];
		classes.forEach((c) => document.body.classList.remove(c));
		if (season !== 'default') {
			document.body.classList.add(`season-${season}`);
		}
	});

	// Apply day/night CSS class on <body> — independent of season
	$effect(() => {
		const mode = $timeOfDay;
		document.body.classList.toggle('tod-day', mode === 'day');
		document.body.classList.toggle('tod-night', mode === 'night');
	});
</script>

<div class="noise-overlay" aria-hidden="true"></div>

{@render children()}
