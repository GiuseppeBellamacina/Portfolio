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

	let canvas: HTMLCanvasElement;
	let particles: Particle[] = [];
	let cursorX = -100;
	let cursorY = -100;
	let lastTime = 0;
	let hueBase = 0;
	let season: Season = 'default';
	let raf = 0;
	let isMobile = false;

	currentSeason.subscribe((value) => {
		season = value;
	});

	function getSeasonalColors(season: Season): { hues: number[]; count: number } {
		switch (season) {
			case 'newyear':
				return { hues: [0, 45, 200, 280, 320], count: 3 };
			case 'snow':
				return { hues: [180, 200, 220], count: 2 };
			case 'halloween':
				return { hues: [25, 30, 280], count: 2 };
			case 'summer':
				return { hues: [45, 60, 160, 180], count: 2 };
			case 'spring':
				return { hues: [300, 320, 340], count: 2 };
			case 'autumn':
				return { hues: [15, 25, 35], count: 2 };
			default:
				return { hues: [180, 200, 280, 320, 45], count: 2 };
		}
	}

	function spawnParticles(x: number, y: number) {
		const seasonalConfig = getSeasonalColors(season);
		const particleCount = seasonalConfig.count;

		for (let i = 0; i < particleCount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = season === 'snow' ? Math.random() * 0.3 : Math.random() * 0.5;

			const hue =
				seasonalConfig.hues[Math.floor(Math.random() * seasonalConfig.hues.length)] +
				(Math.random() - 0.5) * 20;

			particles.push({
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

		// Cap at 30 particles to prevent memory growth
		if (particles.length > 30) {
			particles = particles.slice(-30);
		}
	}

	function draw(timestamp: number) {
		raf = requestAnimationFrame(draw);
		if (document.hidden) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
		lastTime = timestamp;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Update & draw particles
		for (let i = particles.length - 1; i >= 0; i--) {
			const p = particles[i];
			p.x += p.velocityX;
			p.y += p.velocityY;
			p.opacity -= 0.025;
			p.rotation += p.rotationSpeed;
			p.size *= 0.98;

			if (p.opacity <= 0 || p.size <= 0.5) {
				particles.splice(i, 1);
				continue;
			}

			// Outer glow
			const glowAlpha = p.opacity * 0.25;
			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate((p.rotation * Math.PI) / 180);
			ctx.beginPath();
			const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
			grad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${glowAlpha})`);
			grad.addColorStop(0.5, `hsla(${p.hue}, 100%, 60%, ${glowAlpha * 0.6})`);
			grad.addColorStop(1, 'transparent');
			ctx.fillStyle = grad;
			ctx.rect(-p.size * 2, -p.size * 2, p.size * 4, p.size * 4);
			ctx.fill();

			// Core
			const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
			coreGrad.addColorStop(0, `hsla(${p.hue}, 100%, 85%, ${p.opacity})`);
			coreGrad.addColorStop(0.4, `hsla(${p.hue}, 100%, 55%, ${p.opacity * 0.7})`);
			coreGrad.addColorStop(1, 'transparent');
			ctx.fillStyle = coreGrad;
			ctx.beginPath();
			ctx.arc(0, 0, p.size, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
	}

	function handleMouseMove(e: MouseEvent) {
		cursorX = e.clientX;
		cursorY = e.clientY;

		const now = performance.now();
		if (now - lastTime > 30) {
			spawnParticles(e.clientX, e.clientY);
			hueBase = (hueBase + 1) % 360;
			if (lastTime === 0) lastTime = now;
		}
	}

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
		if (isMobile) return;

		// Size canvas to viewport
		function resize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
		resize();
		window.addEventListener('resize', resize);
		window.addEventListener('mousemove', handleMouseMove);

		lastTime = performance.now();
		raf = requestAnimationFrame(draw);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});
</script>

<canvas class="cursor-trail" bind:this={canvas}></canvas>

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

	@media (max-width: 768px) {
		.cursor-trail {
			display: none;
		}
	}
</style>
