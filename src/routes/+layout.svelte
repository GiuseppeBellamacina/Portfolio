<script lang="ts">
	import '../app.css';
	import '../lib/performance.css';
	import { dev, browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { initLang } from '$lib/i18n';
	import { currentSeason } from '$lib/stores/seasonStore';
	import { initTimeOfDay, timeOfDay } from '$lib/stores/timeOfDayStore';
	import {
		DEFAULT_DAY_VARIANTS,
		applyPaletteVars,
		clearPaletteOverrides,
		isManualPaletteOverrideActive
	} from '$lib/stores/defaultVariants';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	let { children } = $props();

	const variantKeys = Object.keys(DEFAULT_DAY_VARIANTS);

	/**
	 * The inline script in app.html already rolled this (and painted it)
	 * before this component ever ran, IF the page loaded straight into
	 * "no season + day" — read that choice here rather than rolling again,
	 * or the two would disagree and cause exactly the flash this avoids.
	 * `undefined` = no choice made yet (page loaded at night/in a season;
	 * decided lazily below the first time it's actually needed). `null` =
	 * decided as the original palette. A string = one of DEFAULT_DAY_VARIANTS.
	 */
	let sessionVariant = $state<string | null | undefined>(
		browser
			? (window as unknown as { __sessionVariant?: string | null }).__sessionVariant
			: undefined
	);

	onMount(() => {
		initLang();
		initTimeOfDay();

		// Pause heavy CSS animations when the tab is hidden to save GPU/CPU
		const onVis = () => document.body.classList.toggle('tab-hidden', document.hidden);
		document.addEventListener('visibilitychange', onVis);
		onVis();

		return () => document.removeEventListener('visibilitychange', onVis);
	});

	// Apply seasonal CSS class on <body> — idempotent: currentSeason's initial
	// value already mirrors what's on <body> (see seasonStore.ts), so this
	// never has to "correct" anything after the fact.
	$effect(() => {
		const season = $currentSeason;
		const classes = ['season-snow', 'season-newyear', 'season-summer'];
		classes.forEach((c) => document.body.classList.remove(c));
		if (season !== 'default') {
			document.body.classList.add(`season-${season}`);
		}
	});

	// Apply day/night CSS class on <body> — independent of season, same
	// idempotent reasoning as above (see timeOfDayStore.ts).
	$effect(() => {
		const mode = $timeOfDay;
		document.body.classList.toggle('tod-day', mode === 'day');
		document.body.classList.toggle('tod-night', mode === 'night');
	});

	// Apply this session's default-mode variant — day only, no season active,
	// and only while nothing was manually overridden via the terminal
	// (season/rainbow/palette commands all set that flag).
	$effect(() => {
		const season = $currentSeason;
		const mode = $timeOfDay;
		if (isManualPaletteOverrideActive()) return;
		if (season === 'default' && mode === 'day') {
			if (sessionVariant === undefined) {
				// Loaded at night or mid-season, now switched to default+day for
				// the first time this session — decide now, remember for later.
				const choices = [null, ...variantKeys];
				sessionVariant = choices[Math.floor(Math.random() * choices.length)];
			}
			if (sessionVariant) {
				applyPaletteVars(DEFAULT_DAY_VARIANTS[sessionVariant]);
			} else {
				clearPaletteOverrides();
			}
		} else {
			clearPaletteOverrides();
		}
	});
</script>

<div class="noise-overlay" aria-hidden="true"></div>

{@render children()}
