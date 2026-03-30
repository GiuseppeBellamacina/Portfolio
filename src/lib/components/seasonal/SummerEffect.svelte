<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { setSeason, resetSeason } from '$lib/stores/seasonStore';

	let { forceShow = false }: { forceShow?: boolean } = $props();

	let showSummer = $state(false);
	let canvas = $state<HTMLCanvasElement>();

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
			if (document.hidden) {
				raf = requestAnimationFrame(draw);
				return;
			}
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
					const glowRadius = f.size * (3 + glow * 4);
					const grad = ctx!.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowRadius);
					grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${glow * 0.9})`);
					grad.addColorStop(0.3, `hsla(${hue}, ${sat}%, ${light - 10}%, ${glow * 0.4})`);
					grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${light - 20}%, 0)`);
					ctx!.fillStyle = grad;
					ctx!.beginPath();
					ctx!.arc(f.x, f.y, glowRadius, 0, Math.PI * 2);
					ctx!.fill();

					// Bright core
					ctx!.fillStyle = `hsla(${hue}, ${sat}%, 90%, ${glow})`;
					ctx!.beginPath();
					ctx!.arc(f.x, f.y, f.size * 0.6, 0, Math.PI * 2);
					ctx!.fill();
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
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
		};
	}

	onMount(() => {
		showSummer = forceShow || isSummerPeriod();

		if (showSummer) {
			setSeason('summer');
			let cleanup: (() => void) | undefined;
			tick().then(() => {
				cleanup = initFireflies();
			});
			return () => {
				cleanup?.();
				resetSeason();
			};
		}
	});
</script>

{#if showSummer}
	<canvas class="fireflies-canvas" bind:this={canvas}></canvas>
	<div class="summer-ambience" aria-hidden="true"></div>
{/if}

<style>
	.fireflies-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 10001;
	}

	/* Subtle warm ambient glow at the bottom — like a summer twilight */
	.summer-ambience {
		position: fixed;
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
