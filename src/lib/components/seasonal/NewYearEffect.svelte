<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { currentSeason, setSeason } from '$lib/stores/seasonStore';

	let { forceShow = false }: { forceShow?: boolean } = $props();
	let showNewYear = $state(false);
	let canvas = $state<HTMLCanvasElement>();
	let effectCleanup: (() => void) | undefined;
	let isDateBased = false;

	function isNewYearPeriod(): boolean {
		const now = new Date();
		const month = now.getMonth();
		const day = now.getDate();
		if (month === 11 && day === 31) return true;
		if (month === 0 && day <= 2) return true;
		return false;
	}

	interface Spark {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		maxLife: number;
		hue: number;
		size: number;
		trail: { x: number; y: number; alpha: number }[];
	}

	interface Rocket {
		x: number;
		y: number;
		vy: number;
		targetY: number;
		hue: number;
		trail: { x: number; y: number; alpha: number }[];
	}

	function initFireworks() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let W = (canvas.width = window.innerWidth);
		let H = (canvas.height = window.innerHeight);
		let raf: number;
		let paused = false;

		const rockets: Rocket[] = [];
		const sparks: Spark[] = [];
		const GRAVITY = 0.035;
		const FRICTION = 0.98;

		function resize() {
			W = canvas!.width = window.innerWidth;
			H = canvas!.height = window.innerHeight;
		}

		function launchRocket() {
			const x = W * 0.15 + Math.random() * W * 0.7;
			const hue = Math.random() * 360;
			const targetY = H * 0.15 + Math.random() * H * 0.35;
			// Calculate vy needed to reach target (no deceleration on rockets)
			const dist = H - targetY;
			const frames = 40 + Math.random() * 30; // 40-70 frames to reach target
			const vy = -dist / frames;
			rockets.push({
				x,
				y: H,
				vy,
				targetY,
				hue,
				trail: []
			});
		}

		function explode(x: number, y: number, hue: number) {
			const count = 60 + Math.floor(Math.random() * 40);
			const pattern = Math.random();

			for (let i = 0; i < count; i++) {
				let vx: number, vy: number;

				if (pattern < 0.5) {
					// Sphere burst
					const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
					const speed = 2 + Math.random() * 3;
					vx = Math.cos(angle) * speed;
					vy = Math.sin(angle) * speed;
				} else {
					// Random burst
					const angle = Math.random() * Math.PI * 2;
					const speed = 1 + Math.random() * 4;
					vx = Math.cos(angle) * speed;
					vy = Math.sin(angle) * speed;
				}

				const sparkHue = hue + (Math.random() - 0.5) * 40;
				sparks.push({
					x,
					y,
					vx,
					vy,
					life: 1,
					maxLife: 60 + Math.random() * 50,
					hue: sparkHue,
					size: 1.5 + Math.random() * 1.5,
					trail: []
				});
			}
		}

		function draw() {
			// Clear canvas fully — transparent overlay, no darkening
			ctx!.clearRect(0, 0, W, H);

			// ── Update & draw rockets ──
			for (let i = rockets.length - 1; i >= 0; i--) {
				const r = rockets[i];
				r.trail.push({ x: r.x, y: r.y, alpha: 1 });
				if (r.trail.length > 15) r.trail.shift();

				r.y += r.vy;

				// Draw rocket trail
				for (let t = 0; t < r.trail.length; t++) {
					const pt = r.trail[t];
					pt.alpha *= 0.85;
					ctx!.beginPath();
					ctx!.arc(pt.x, pt.y, 1.5 * pt.alpha, 0, Math.PI * 2);
					ctx!.fillStyle = `hsla(${r.hue}, 50%, 80%, ${pt.alpha * 0.6})`;
					ctx!.fill();
				}

				// Draw rocket head
				ctx!.beginPath();
				ctx!.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
				ctx!.fillStyle = `hsla(${r.hue}, 60%, 90%, 1)`;
				ctx!.shadowBlur = 15;
				ctx!.shadowColor = `hsla(${r.hue}, 60%, 70%, 0.8)`;
				ctx!.fill();
				ctx!.shadowBlur = 0;

				// Explode at target height
				if (r.y <= r.targetY) {
					explode(r.x, r.y, r.hue);
					rockets.splice(i, 1);
				}
			}

			// ── Update & draw sparks ──
			for (let i = sparks.length - 1; i >= 0; i--) {
				const s = sparks[i];

				s.trail.push({ x: s.x, y: s.y, alpha: s.life });
				if (s.trail.length > 8) s.trail.shift();

				s.x += s.vx;
				s.y += s.vy;
				s.vy += GRAVITY;
				s.vx *= FRICTION;
				s.vy *= FRICTION;
				s.life -= 1 / s.maxLife;

				// Draw spark trail — fading tail
				for (let t = 0; t < s.trail.length; t++) {
					const pt = s.trail[t];
					const a = pt.alpha * ((t + 1) / s.trail.length) * 0.4;
					if (a < 0.01) continue;
					ctx!.beginPath();
					ctx!.arc(pt.x, pt.y, s.size * 0.4, 0, Math.PI * 2);
					ctx!.fillStyle = `hsla(${s.hue}, 80%, 65%, ${a})`;
					ctx!.fill();
				}

				// Draw spark
				if (s.life > 0) {
					const brightness = 50 + s.life * 30;
					ctx!.beginPath();
					ctx!.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
					ctx!.fillStyle = `hsla(${s.hue}, 80%, ${brightness}%, ${s.life})`;
					ctx!.shadowBlur = 6 * s.life;
					ctx!.shadowColor = `hsla(${s.hue}, 90%, 60%, ${s.life * 0.6})`;
					ctx!.fill();
					ctx!.shadowBlur = 0;
				}

				if (s.life <= 0) sparks.splice(i, 1);
			}

			raf = requestAnimationFrame(draw);
		}

		draw();

		// Launch rockets at random intervals
		let launchTimeout: ReturnType<typeof setTimeout>;
		function scheduleLaunch() {
			const delay = 400 + Math.random() * 2000;
			launchTimeout = setTimeout(() => {
				if (!showNewYear || paused) {
					scheduleLaunch();
					return;
				}
				launchRocket();
				if (Math.random() > 0.5) {
					setTimeout(launchRocket, 100 + Math.random() * 200);
				}
				if (Math.random() > 0.75) {
					setTimeout(launchRocket, 200 + Math.random() * 300);
				}
				scheduleLaunch();
			}, delay);
		}
		scheduleLaunch();

		function onVisibilityChange() {
			if (document.hidden) {
				paused = true;
				cancelAnimationFrame(raf);
				// Clear existing particles so they don't burst on resume
				rockets.length = 0;
				sparks.length = 0;
			} else {
				paused = false;
				ctx!.clearRect(0, 0, W, H);
				raf = requestAnimationFrame(draw);
			}
		}
		document.addEventListener('visibilitychange', onVisibilityChange);

		window.addEventListener('resize', resize);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(launchTimeout);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('resize', resize);
		};
	}

	function startFireworks() {
		if (effectCleanup) return;
		tick().then(() => {
			effectCleanup = initFireworks();
		});
	}

	function stopFireworks() {
		effectCleanup?.();
		effectCleanup = undefined;
	}

	onMount(() => {
		if (forceShow || isNewYearPeriod()) {
			isDateBased = !forceShow;
			showNewYear = true;
			setSeason('newyear');
			startFireworks();
		}

		return () => {
			stopFireworks();
		};
	});

	// React to terminal theme commands
	$effect(() => {
		const season = $currentSeason;
		if (season === 'newyear' && !showNewYear) {
			showNewYear = true;
			startFireworks();
		} else if (season !== 'newyear' && showNewYear && !isDateBased) {
			showNewYear = false;
			stopFireworks();
		} else if (season !== 'newyear' && showNewYear && isDateBased) {
			showNewYear = false;
			stopFireworks();
			isDateBased = false;
		}
	});
</script>

{#if showNewYear}
	<canvas class="fireworks-canvas" bind:this={canvas}></canvas>
{/if}

<style>
	.fireworks-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 10001;
	}
</style>
