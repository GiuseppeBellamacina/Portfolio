<script lang="ts">
	import { onMount } from 'svelte';

	let progress = 0;

	function updateProgress() {
		const windowHeight = window.innerHeight;
		const documentHeight = document.documentElement.scrollHeight;
		const scrollTop = window.scrollY;
		const scrollable = documentHeight - windowHeight;
		progress = (scrollTop / scrollable) * 100;
	}

	onMount(() => {
		window.addEventListener('scroll', updateProgress);
		updateProgress();

		return () => {
			window.removeEventListener('scroll', updateProgress);
		};
	});
</script>

<div class="scroll-progress-bar" style="width: {progress}%"></div>

<style>
	.scroll-progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--primary-color), var(--neon-pink), var(--neon-green));
		z-index: 10000;
		transition: width 0.1s ease-out;
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
