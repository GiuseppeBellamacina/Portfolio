<script lang="ts">
	import '../app.css';
	import '../lib/performance.css';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import SnowEffect from '$lib/components/seasonal/SnowEffect.svelte';
	import SummerEffect from '$lib/components/seasonal/SummerEffect.svelte';
	import NewYearEffect from '$lib/components/seasonal/NewYearEffect.svelte';
	// import HalloweenEffect from '$lib/components/seasonal/HalloweenEffect.svelte';
	// import SakuraEffect from '$lib/components/seasonal/SakuraEffect.svelte';
	// import AutumnEffect from '$lib/components/seasonal/AutumnEffect.svelte';
	// import SeasonalEffectsDebug from '$lib/components/seasonal/SeasonalEffectsDebug.svelte';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	let { children } = $props();
</script>

<SnowEffect />
<NewYearEffect />
<SummerEffect />
<!-- <HalloweenEffect /> -->
<!-- <SakuraEffect /> -->
<!-- <AutumnEffect /> -->

<!-- Debug panel per testare gli effetti -->
<!-- <SeasonalEffectsDebug /> -->

<div class="noise-overlay" aria-hidden="true"></div>

{@render children()}
