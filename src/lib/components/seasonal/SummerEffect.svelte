<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { currentSeason, setSeason } from '$lib/stores/seasonStore';

	let { forceShow = false }: { forceShow?: boolean } = $props();
	let showSummer = $state(false);
	let canvas = $state<HTMLCanvasElement>();
	let effectCleanup: (() => void) | undefined;
	let startTimeout: ReturnType<typeof setTimeout> | undefined;
	let isDateBased = false;

	function isSummerPeriod(): boolean {
		const now = new Date();
		const month = now.getMonth();
		return month >= 5 && month <= 7;
	}

	interface Firefly {
		x: number;
		y: number;
		vx: number;
		vy: number;
		phase: number;
		phaseSpeed: number;
		size: number;
		warmth: number; // 0 = amber, 1 = golden
		maxBrightness: number;
		wanderAngle: number;
		wanderSpeed: number;
	}

	function initFireflies() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let W = (canvas.width = window.innerWidth);
		let H = (canvas.height = window.innerHeight);
		let raf: number;
		let running = true;
		const sprite = document.createElement('canvas');
		sprite.width = sprite.height = 32;
		const spriteCtx = sprite.getContext('2d');
		if (!spriteCtx) return;
		const gradient = spriteCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
		gradient.addColorStop(0, '#fff');
		gradient.addColorStop(0.3, 'rgba(255, 190, 60, .45)');
		gradient.addColorStop(1, 'rgba(255, 160, 30, 0)');
		spriteCtx.fillStyle = gradient;
		spriteCtx.fillRect(0, 0, 32, 32);

		const screenArea = (W * H) / (1920 * 1080);
		const COUNT = Math.max(20, Math.floor(45 * screenArea));
		const fireflies: Firefly[] = [];

		function resize() {
			W = canvas!.width = window.innerWidth;
			H = canvas!.height = window.innerHeight;
		}

		for (let i = 0; i < COUNT; i++) {
			fireflies.push({
				x: Math.random() * W,
				y: Math.random() * H,
				vx: 0,
				vy: 0,
				phase: Math.random() * Math.PI * 2,
				phaseSpeed: 0.008 + Math.random() * 0.012,
				size: 1.5 + Math.random() * 2,
				warmth: Math.random(),
				maxBrightness: 0.4 + Math.random() * 0.6,
				wanderAngle: Math.random() * Math.PI * 2,
				wanderSpeed: 0.15 + Math.random() * 0.25
			});
		}

		function draw() {
			if (document.hidden || !running) return;
			ctx!.clearRect(0, 0, W, H);

			for (const f of fireflies) {
				f.phase += f.phaseSpeed;

				// Organic blink — fireflies glow on and off, not sinusoidal
				// Use sin² for sharper on/off with smooth transitions
				const rawGlow = Math.sin(f.phase);
				const glow = rawGlow > 0 ? rawGlow * rawGlow * f.maxBrightness : 0;

				if (glow > 0.02) {
					// Color: warm amber to soft golden
					const hue = 38 + f.warmth * 12; // 38-50 (amber-gold)
					const sat = 85 + f.warmth * 15; // 85-100%
					const light = 55 + glow * 20;

					// Outer glow
					ctx!.globalAlpha = glow;
					ctx!.drawImage(sprite, f.x - f.size * 4, f.y - f.size * 4, f.size * 8, f.size * 8);
					ctx!.globalAlpha = 1;
				}

				// Wander — smooth organic drift
				f.wanderAngle += (Math.random() - 0.5) * 0.08;
				f.vx += Math.cos(f.wanderAngle) * 0.01;
				f.vy += Math.sin(f.wanderAngle) * 0.01;
				f.vx *= 0.97;
				f.vy *= 0.97;

				const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
				if (speed > f.wanderSpeed) {
					f.vx = (f.vx / speed) * f.wanderSpeed;
					f.vy = (f.vy / speed) * f.wanderSpeed;
				}

				f.x += f.vx;
				f.y += f.vy;

				// Wrap
				if (f.x < -20) f.x = W + 20;
				if (f.x > W + 20) f.x = -20;
				if (f.y < -20) f.y = H + 20;
				if (f.y > H + 20) f.y = -20;
			}

			raf = requestAnimationFrame(draw);
		}

		draw();

		window.addEventListener('resize', resize);
		const observer = new IntersectionObserver(([entry]) => {
			running = entry.isIntersecting;
			if (running) raf = requestAnimationFrame(draw);
			else cancelAnimationFrame(raf);
		});
		observer.observe(canvas);
		return () => {
			running = false;
			cancelAnimationFrame(raf);
			observer.disconnect();
			window.removeEventListener('resize', resize);
		};
	}

	function startFireflies() {
		if (effectCleanup) return;
		tick().then(() => {
			effectCleanup = initFireflies();
		});
	}

	function stopFireflies() {
		if (startTimeout) clearTimeout(startTimeout);
		effectCleanup?.();
		effectCleanup = undefined;
	}

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (forceShow || isSummerPeriod()) {
			isDateBased = !forceShow;
			showSummer = true;
			setSeason('summer');
			startFireflies();
		}

		return () => {
			stopFireflies();
		};
	});

	// React to terminal theme commands
	$effect(() => {
		const season = $currentSeason;
		if (season === 'summer' && !showSummer) {
			showSummer = true;
			startFireflies();
		} else if (season !== 'summer' && showSummer && !isDateBased) {
			showSummer = false;
			stopFireflies();
		} else if (season !== 'summer' && showSummer && isDateBased) {
			showSummer = false;
			stopFireflies();
			isDateBased = false;
		}
	});
</script>

{#if showSummer}
	<canvas class="fireflies-canvas" bind:this={canvas}></canvas>
	<div class="summer-ambience" aria-hidden="true"></div>
{/if}

<style>
	.fireflies-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 10001;
	}

	/* Subtle warm ambient glow at the bottom — like a summer twilight */
	.summer-ambience {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 40%;
		pointer-events: none;
		z-index: 0;
		background: linear-gradient(
			to top,
			rgba(255, 170, 50, 0.03) 0%,
			rgba(255, 200, 80, 0.015) 40%,
			transparent 100%
		);
	}
</style>
