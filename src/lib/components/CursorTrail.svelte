<script lang="ts">
	import { onMount } from 'svelte';
	import { currentSeason } from '$lib/stores/seasonStore';
	import type { Season } from '$lib/stores/seasonStore';

	interface Particle {
		x: number;
		y: number;
		opacity: number;
		size: number;
		hue: number;
		velocityX: number;
		velocityY: number;
		rotation: number;
		rotationSpeed: number;
	}

	let particles: Particle[] = [];
	let cursorX = 0;
	let cursorY = 0;
	let lastTime = Date.now();
	let hueBase = 0;
	let season: Season = 'default';

	// Subscribe to season changes
	currentSeason.subscribe((value) => {
		season = value;
	});

	function getSeasonalColors(season: Season): { hues: number[]; count: number } {
		switch (season) {
			case 'newyear':
				return { hues: [0, 45, 200, 280, 320], count: 3 }; // Confetti colors
			case 'snow':
				return { hues: [180, 200, 220], count: 2 }; // Ice blue/white
			case 'halloween':
				return { hues: [25, 30, 280], count: 2 }; // Orange and purple
			case 'summer':
				return { hues: [45, 60, 160, 180], count: 2 }; // Yellow/green firefly
			case 'spring':
				return { hues: [300, 320, 340], count: 2 }; // Pink sakura
			case 'autumn':
				return { hues: [15, 25, 35], count: 2 }; // Orange/red leaves
			default:
				return { hues: [180, 200, 280, 320, 45], count: 2 }; // Rainbow
		}
	}

	function createParticle(x: number, y: number) {
		const seasonalConfig = getSeasonalColors(season);
		const particleCount = seasonalConfig.count;
		const newParticles = [];

		for (let i = 0; i < particleCount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = season === 'snow' ? Math.random() * 0.3 : Math.random() * 0.5;

			const hue =
				seasonalConfig.hues[Math.floor(Math.random() * seasonalConfig.hues.length)] +
				(Math.random() - 0.5) * 20;

			newParticles.push({
				x: x + (Math.random() - 0.5) * 10,
				y: y + (Math.random() - 0.5) * 10,
				opacity: 0.9,
				size: Math.random() * 3 + 2,
				hue: hue % 360,
				velocityX: Math.cos(angle) * speed,
				velocityY: season === 'snow' ? Math.abs(Math.sin(angle)) * 0.3 : Math.sin(angle) * speed,
				rotation: Math.random() * 360,
				rotationSpeed: (Math.random() - 0.5) * 10
			});
		}

		particles = [...particles.slice(-25), ...newParticles];
	}

	function updateParticles() {
		particles = particles
			.map((p) => ({
				...p,
				x: p.x + p.velocityX,
				y: p.y + p.velocityY,
				opacity: p.opacity - 0.025,
				rotation: p.rotation + p.rotationSpeed,
				size: p.size * 0.98
			}))
			.filter((p) => p.opacity > 0 && p.size > 0.5);
	}

	function handleMouseMove(e: MouseEvent) {
		cursorX = e.clientX;
		cursorY = e.clientY;

		const now = Date.now();
		if (now - lastTime > 30) {
			createParticle(e.clientX, e.clientY);
			lastTime = now;
			hueBase = (hueBase + 1) % 360;
		}
	}

	onMount(() => {
		// Honor reduced-motion: no cursor trail at all.
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		window.addEventListener('mousemove', handleMouseMove);

		let raf = 0;
		let lastUpdate = 0;
		function loop(ts: number) {
			raf = requestAnimationFrame(loop);
			// Throttle physics to ~30ms and skip while the tab is hidden.
			if (document.hidden || ts - lastUpdate < 30) return;
			lastUpdate = ts;
			updateParticles();
		}
		raf = requestAnimationFrame(loop);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			cancelAnimationFrame(raf);
		};
	});
</script>

<div class="cursor-trail">
	{#each particles as particle, i (i)}
		<div
			class="particle"
			style="
				left: {particle.x}px;
				top: {particle.y}px;
				opacity: {particle.opacity};
				width: {particle.size}px;
				height: {particle.size}px;
				transform: translate(-50%, -50%) rotate({particle.rotation}deg);
				background: radial-gradient(circle, 
					hsla({particle.hue}, 100%, 70%, {particle.opacity}), 
					hsla({particle.hue}, 100%, 50%, {particle.opacity * 0.6}) 40%,
					transparent 70%
				);
				box-shadow: 0 0 {particle.size * 2}px hsla({particle.hue}, 100%, 60%, {particle.opacity * 0.8});
			"
		></div>
	{/each}
</div>

<style>
	.cursor-trail {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 9999;
	}

	.particle {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		filter: blur(0.5px);
		animation: particleTwinkle 0.6s ease-in-out infinite;
	}

	@keyframes particleTwinkle {
		0%,
		100% {
			filter: blur(0.5px) brightness(1);
		}
		50% {
			filter: blur(1px) brightness(1.3);
		}
	}

	@media (max-width: 768px) {
		.cursor-trail {
			display: none;
		}
	}
</style>
