<script lang="ts">
	import { onMount } from 'svelte';

	let progress = $state(0);

	// Cached layout metrics (invalidated on resize) to avoid forced layouts on every scroll event
	let scrollable = 1;
	let rafId: number | undefined;

	function measure() {
		scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
	}

	function updateProgress() {
		rafId = undefined;
		progress = Math.min(100, (window.scrollY / scrollable) * 100);
	}

	function onScroll() {
		// Coalesce scroll events into a single update per frame
		if (rafId === undefined) {
			rafId = requestAnimationFrame(updateProgress);
		}
	}

	function onResize() {
		measure();
		updateProgress();
	}

	onMount(() => {
		measure();
		updateProgress();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize);

		return () => {
			if (rafId !== undefined) cancelAnimationFrame(rafId);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<div class="scroll-progress-bar" style="transform: scaleX({progress / 100})"></div>

<style>
	.scroll-progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 3px;
		background: linear-gradient(90deg, var(--primary-color), var(--neon-pink), var(--neon-green));
		z-index: 10000;
		transform-origin: left;
		box-shadow:
			0 0 8px var(--primary-color),
			0 0 20px rgba(var(--primary-rgb), 0.3);
	}

	.scroll-progress-bar::after {
		content: '';
		position: absolute;
		right: 0;
		top: -1px;
		width: 80px;
		height: 5px;
		background: radial-gradient(
			ellipse at right,
			rgba(var(--neon-green-rgb), 0.6) 0%,
			transparent 80%
		);
		filter: blur(2px);
		pointer-events: none;
	}
</style>
