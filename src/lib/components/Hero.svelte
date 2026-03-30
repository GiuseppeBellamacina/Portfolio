<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { currentSeason } from '$lib/stores/seasonStore';

	let typingText = $state('');
	let mounted = $state(false);
	let heroCanvas: HTMLCanvasElement;
	let heroSection: HTMLElement;
	let spotlightX = $state(50);
	let spotlightY = $state(50);

	const baseTexts = [
		'AI/ML Engineer',
		'Data Scientist',
		'Ethical Hacker',
		'Star Wars Fanatic',
		'Daft Punk Lover',
		'Tame Impala Listener',
		'Cars Enthusiast',
		'Anime Enjoyer',
		'Literally Ryan Gosling',
		'Cyberpunk Dreamer'
	];

	const seasonalGreetings: Record<string, string[]> = {
		snow: ['Merry Christmas!'],
		newyear: ['Happy New Year!']
	};

	function getTexts(): string[] {
		const season = get(currentSeason);
		const greetings = seasonalGreetings[season];
		if (!greetings) return baseTexts;
		// Insert greetings spread throughout the rotation
		const texts = [...baseTexts];
		for (let i = 0; i < greetings.length; i++) {
			const pos = Math.floor((texts.length / (greetings.length + 1)) * (i + 1));
			texts.splice(pos, 0, greetings[i]);
		}
		return texts;
	}

	let texts = baseTexts;

	let textIndex = 0;
	let charIndex = 0;
	let isDeleting = false;
	let isPaused = false;

	function typeEffect() {
		const currentText = texts[textIndex];

		if (isPaused) {
			isPaused = false;
			isDeleting = true;
			setTimeout(typeEffect, 1200);
			return;
		}

		if (isDeleting) {
			typingText = currentText.substring(0, charIndex - 1);
			charIndex--;

			if (charIndex === 0) {
				isDeleting = false;
				textIndex = (textIndex + 1) % texts.length;
				setTimeout(typeEffect, 300);
			} else {
				setTimeout(typeEffect, 25);
			}
		} else {
			typingText = currentText.substring(0, charIndex + 1);
			charIndex++;

			if (charIndex === currentText.length) {
				isPaused = true;
				setTimeout(typeEffect, 1200);
			} else {
				setTimeout(typeEffect, 70);
			}
		}
	}

	/* ── Canvas particle constellation ── */
	interface Node {
		x: number;
		y: number;
		vx: number;
		vy: number;
		r: number;
		hue: number;
		pulse: number;
		pulseSpeed: number;
	}

	function initCanvas() {
		if (!heroCanvas) return;
		const ctx = heroCanvas.getContext('2d');
		if (!ctx) return;

		let W = heroCanvas.offsetWidth;
		let H = heroCanvas.offsetHeight;
		const nodes: Node[] = [];
		const COUNT = 80;
		const CONNECT_DIST = 150;
		const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;
		const REPULSE_DIST = 70; // inter-particle repulsion range
		const REPULSE_DIST_SQ = REPULSE_DIST * REPULSE_DIST;
		const REPULSE_FORCE = 0.004; // gentle push apart
		const MOUSE_CONNECT_DIST = 190;
		const MOUSE_REPULSE_DIST = 110;
		const MAX_VEL = 1.2;
		const DAMPING = 0.997;
		let mouse = { x: -9999, y: -9999 };
		let raf: number;

		function resize() {
			W = heroCanvas.width = heroCanvas.offsetWidth;
			H = heroCanvas.height = heroCanvas.offsetHeight;
		}
		resize();

		for (let i = 0; i < COUNT; i++) {
			nodes.push({
				x: Math.random() * W,
				y: Math.random() * H,
				vx: (Math.random() - 0.5) * 0.4,
				vy: (Math.random() - 0.5) * 0.4,
				r: Math.random() * 2 + 1,
				hue: Math.random() > 0.5 ? 235 + Math.random() * 15 : 270 + Math.random() * 20,
				pulse: Math.random() * Math.PI * 2,
				pulseSpeed: 0.02 + Math.random() * 0.02
			});
		}

		function draw() {
			ctx!.clearRect(0, 0, W, H);

			// ── Connections + inter-particle repulsion (piggybacked on same loop) ──
			ctx!.lineWidth = 0.6;
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const dx = nodes[j].x - nodes[i].x;
					const dy = nodes[j].y - nodes[i].y;
					const distSq = dx * dx + dy * dy;

					// Inter-particle repulsion — prevents clustering
					if (distSq < REPULSE_DIST_SQ && distSq > 0) {
						const dist = Math.sqrt(distSq);
						const force = (1 - dist / REPULSE_DIST) * REPULSE_FORCE;
						const fx = (dx / dist) * force;
						const fy = (dy / dist) * force;
						nodes[i].vx -= fx;
						nodes[i].vy -= fy;
						nodes[j].vx += fx;
						nodes[j].vy += fy;
					}

					// Draw connection line
					if (distSq < CONNECT_DIST_SQ) {
						const dist = Math.sqrt(distSq);
						const alpha = (1 - dist / CONNECT_DIST) * 0.25;
						ctx!.strokeStyle = `hsla(${(nodes[i].hue + nodes[j].hue) >> 1}, 60%, 60%, ${alpha})`;
						ctx!.beginPath();
						ctx!.moveTo(nodes[i].x, nodes[i].y);
						ctx!.lineTo(nodes[j].x, nodes[j].y);
						ctx!.stroke();
					}
				}
			}

			// ── Mouse connections ──
			ctx!.lineWidth = 0.8;
			for (const n of nodes) {
				const dx = n.x - mouse.x;
				const dy = n.y - mouse.y;
				const distSq = dx * dx + dy * dy;
				if (distSq < MOUSE_CONNECT_DIST * MOUSE_CONNECT_DIST) {
					const dist = Math.sqrt(distSq);
					const alpha = (1 - dist / MOUSE_CONNECT_DIST) * 0.4;
					ctx!.strokeStyle = `hsla(${n.hue}, 65%, 65%, ${alpha})`;
					ctx!.beginPath();
					ctx!.moveTo(n.x, n.y);
					ctx!.lineTo(mouse.x, mouse.y);
					ctx!.stroke();
				}
			}

			// ── Nodes ──
			for (const n of nodes) {
				n.pulse += n.pulseSpeed;
				const glow = 0.5 + Math.sin(n.pulse) * 0.3;
				const r = n.r + Math.sin(n.pulse) * 0.5;

				ctx!.fillStyle = `hsla(${n.hue}, 55%, 65%, ${glow})`;
				ctx!.shadowBlur = 10;
				ctx!.shadowColor = `hsla(${n.hue}, 55%, 60%, 0.4)`;
				ctx!.beginPath();
				ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
				ctx!.fill();
				ctx!.shadowBlur = 0;

				// ── Physics ──
				n.x += n.vx;
				n.y += n.vy;

				// Mouse repulsion
				const mdx = n.x - mouse.x;
				const mdy = n.y - mouse.y;
				const mdSq = mdx * mdx + mdy * mdy;
				if (mdSq < MOUSE_REPULSE_DIST * MOUSE_REPULSE_DIST && mdSq > 0) {
					const md = Math.sqrt(mdSq);
					n.vx += (mdx / md) * 0.03;
					n.vy += (mdy / md) * 0.03;
				}

				// Damping
				n.vx *= DAMPING;
				n.vy *= DAMPING;

				// Velocity cap
				const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
				if (speed > MAX_VEL) {
					n.vx = (n.vx / speed) * MAX_VEL;
					n.vy = (n.vy / speed) * MAX_VEL;
				}

				// Wrap around edges (seamless)
				if (n.x < -10) n.x = W + 10;
				if (n.x > W + 10) n.x = -10;
				if (n.y < -10) n.y = H + 10;
				if (n.y > H + 10) n.y = -10;
			}

			raf = requestAnimationFrame(draw);
		}

		draw();

		function onMouseMove(e: MouseEvent) {
			// Cache rect — recalculated on resize
			mouse.x = e.clientX - cachedRect.left;
			mouse.y = e.clientY - cachedRect.top;
		}
		function onMouseLeave() {
			mouse.x = -9999;
			mouse.y = -9999;
		}

		let cachedRect = heroCanvas.getBoundingClientRect();
		function updateRect() {
			cachedRect = heroCanvas.getBoundingClientRect();
		}

		heroSection.addEventListener('mousemove', onMouseMove);
		heroSection.addEventListener('mouseleave', onMouseLeave);
		window.addEventListener('resize', resize);
		window.addEventListener('resize', updateRect);

		return () => {
			cancelAnimationFrame(raf);
			heroSection.removeEventListener('mousemove', onMouseMove);
			heroSection.removeEventListener('mouseleave', onMouseLeave);
			window.removeEventListener('resize', resize);
			window.removeEventListener('resize', updateRect);
		};
	}

	onMount(() => {
		// Pick up seasonal greetings if active
		texts = getTexts();
		// Re-check when season changes (e.g. debug panel)
		const unsubscribe = currentSeason.subscribe(() => {
			texts = getTexts();
		});
		setTimeout(typeEffect, 1000);
		let cleanup: (() => void) | undefined;
		// Defer heavy canvas init off the critical path
		const idle =
			'requestIdleCallback' in window
				? requestIdleCallback(() => {
						cleanup = initCanvas();
					})
				: setTimeout(() => {
						cleanup = initCanvas();
					}, 50);
		// Staggered entrance
		requestAnimationFrame(() => (mounted = true));
		return () => {
			unsubscribe();
			if ('cancelIdleCallback' in window) cancelIdleCallback(idle as number);
			else clearTimeout(idle as number);
			cleanup?.();
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
	id="home"
	class="hero"
	bind:this={heroSection}
	onmousemove={(e) => {
		const rect = heroSection.getBoundingClientRect();
		spotlightX = ((e.clientX - rect.left) / rect.width) * 100;
		spotlightY = ((e.clientY - rect.top) / rect.height) * 100;
	}}
>
	<canvas class="hero-canvas" bind:this={heroCanvas}></canvas>
	<div
		class="hero-spotlight"
		style="--spot-x: {spotlightX}%; --spot-y: {spotlightY}%"
		aria-hidden="true"
	></div>

	<div class="hero-content" class:hero-entered={mounted}>
		<!-- Holographic ring -->
		<div class="profile-container hero-stagger">
			<div class="holo-ring">
				<div class="holo-ring-inner"></div>
			</div>
			<img
				src="/assets/profile.webp"
				alt="Giuseppe Bellamacina"
				class="profile-image"
				fetchpriority="high"
				width="192"
				height="192"
			/>
		</div>

		<h1 class="glitch hero-stagger s2" data-text="Giuseppe Bellamacina">Giuseppe Bellamacina</h1>

		<p class="subtitle hero-stagger s3">
			<span class="typing-prefix">&gt;&nbsp;</span>
			<span id="typing-text">{typingText}</span><span class="typing-cursor">|</span>
		</p>

		<div class="hero-buttons hero-stagger s4">
			<a
				href="#experience"
				class="btn btn-primary"
				onclick={(e) => {
					e.preventDefault();
					document
						.querySelector('#experience')
						?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}}>View Experience</a
			>
			<a href="/assets/cv.pdf" download="Giuseppe_Bellamacina_CV.pdf" class="btn btn-secondary">
				<i class="fas fa-download"></i> Download CV
			</a>
			<a href="https://github.com/GiuseppeBellamacina" target="_blank" class="btn btn-secondary">
				<i class="fab fa-github"></i> GitHub
			</a>
		</div>

		<div class="social-links hero-stagger s5">
			<a
				href="https://www.linkedin.com/in/giuseppe-bellamacina-739b03204/"
				target="_blank"
				title="LinkedIn"
			>
				<i class="fab fa-linkedin"></i>
			</a>
			<a href="https://www.instagram.com/giuseppe_bellamacina/" target="_blank" title="Instagram">
				<i class="fab fa-instagram"></i>
			</a>
			<a href="https://github.com/GiuseppeBellamacina" target="_blank" title="GitHub">
				<i class="fab fa-github"></i>
			</a>
		</div>
	</div>

	<div class="scroll-indicator hero-stagger s6" class:hero-entered={mounted}>
		<div class="scroll-mouse">
			<div class="scroll-dot"></div>
		</div>
	</div>
</section>

<style>
	.hero-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
	}

	/* ── Mouse-following spotlight ── */
	.hero-spotlight {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background: radial-gradient(
			600px circle at var(--spot-x) var(--spot-y),
			rgba(var(--primary-rgb), 0.06) 0%,
			rgba(var(--secondary-rgb), 0.03) 30%,
			transparent 70%
		);
		transition: background 0.15s ease;
	}

	/* ── Holographic ring ── */
	.profile-container {
		position: relative;
		display: flex;
		justify-content: center;
		margin: 0;
	}

	.holo-ring {
		position: absolute;
		width: 240px;
		height: 240px;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: conic-gradient(
			from 0deg,
			var(--primary-color),
			var(--secondary-color),
			var(--accent-color),
			var(--neon-pink),
			var(--neon-blue),
			var(--neon-green),
			var(--primary-color)
		);
		padding: 2px;
		animation: holoSpin 4s linear infinite;
		filter: drop-shadow(0 0 12px rgba(var(--primary-rgb), 0.4));
	}
	.holo-ring::after {
		content: '';
		position: absolute;
		inset: 2px;
		border-radius: 50%;
		background: var(--bg-dark);
	}
	.holo-ring-inner {
		position: absolute;
		inset: 8px;
		border-radius: 50%;
		border: 1px dashed rgba(var(--primary-rgb), 0.12);
		animation: holoSpinInner 10s linear infinite reverse;
		z-index: 1;
	}
	@keyframes holoSpin {
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
	@keyframes holoSpinInner {
		to {
			transform: rotate(360deg);
		}
	}

	/* ── Staggered entrance ── */
	.hero-stagger {
		opacity: 0;
		transform: translateY(30px) scale(0.96);
		filter: blur(8px);
		transition:
			opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
			filter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}
	:global(.hero-entered) .hero-stagger,
	.hero-stagger:global(.hero-entered) {
		opacity: 1;
		transform: translateY(0) scale(1);
		filter: blur(0);
	}
	.hero-stagger.s2 {
		transition-delay: 0.15s;
	}
	.hero-stagger.s3 {
		transition-delay: 0.3s;
	}
	.hero-stagger.s4 {
		transition-delay: 0.45s;
	}
	.hero-stagger.s5 {
		transition-delay: 0.6s;
	}
	.hero-stagger.s6 {
		transition-delay: 0.8s;
	}

	/* ── Typing prefix ── */
	.typing-prefix {
		color: var(--neon-green);
		font-family: 'Courier New', monospace;
		font-weight: bold;
		opacity: 0.7;
	}

	/* ── Scroll indicator redesign ── */
	.scroll-indicator {
		position: absolute;
		bottom: 30px;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
	}
	.scroll-mouse {
		width: 22px;
		height: 34px;
		border: 1.5px solid rgba(var(--primary-rgb), 0.4);
		border-radius: 12px;
		position: relative;
	}
	.scroll-dot {
		position: absolute;
		top: 6px;
		left: 50%;
		transform: translateX(-50%);
		width: 4px;
		height: 6px;
		background: var(--primary-color);
		border-radius: 2px;
		animation: scrollBounce 2.5s ease-in-out infinite;
		will-change: transform, opacity;
	}
	@keyframes scrollBounce {
		0%,
		100% {
			transform: translateX(-50%) translateY(0);
			opacity: 1;
		}
		50% {
			transform: translateX(-50%) translateY(12px);
			opacity: 0.3;
		}
	}
	@media (max-width: 768px) {
		.scroll-indicator {
			display: none;
		}
		.holo-ring {
			width: 190px;
			height: 190px;
		}
	}
	@media (max-width: 480px) {
		.holo-ring {
			width: 160px;
			height: 160px;
		}
	}
</style>
