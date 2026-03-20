<script lang="ts">
	import { onMount } from 'svelte';

	let typingText = $state('');
	let mounted = $state(false);
	let heroCanvas: HTMLCanvasElement;
	let heroSection: HTMLElement;

	const texts = [
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
		const COUNT = 50;
		const CONNECT_DIST = 160;
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
				hue: Math.random() > 0.5 ? 180 + Math.random() * 20 : 290 + Math.random() * 20,
				pulse: Math.random() * Math.PI * 2,
				pulseSpeed: 0.02 + Math.random() * 0.02
			});
		}

		function draw() {
			ctx!.clearRect(0, 0, W, H);

			// Connections
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const dx = nodes[j].x - nodes[i].x;
					const dy = nodes[j].y - nodes[i].y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < CONNECT_DIST) {
						const alpha = (1 - dist / CONNECT_DIST) * 0.25;
						ctx!.strokeStyle = `hsla(${(nodes[i].hue + nodes[j].hue) / 2}, 80%, 60%, ${alpha})`;
						ctx!.lineWidth = 0.6;
						ctx!.beginPath();
						ctx!.moveTo(nodes[i].x, nodes[i].y);
						ctx!.lineTo(nodes[j].x, nodes[j].y);
						ctx!.stroke();
					}
				}
			}

			// Mouse connections
			for (const n of nodes) {
				const dx = n.x - mouse.x;
				const dy = n.y - mouse.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < 200) {
					const alpha = (1 - dist / 200) * 0.4;
					ctx!.strokeStyle = `hsla(${n.hue}, 90%, 70%, ${alpha})`;
					ctx!.lineWidth = 0.8;
					ctx!.beginPath();
					ctx!.moveTo(n.x, n.y);
					ctx!.lineTo(mouse.x, mouse.y);
					ctx!.stroke();
				}
			}

			// Nodes
			for (const n of nodes) {
				n.pulse += n.pulseSpeed;
				const glow = 0.5 + Math.sin(n.pulse) * 0.3;
				const r = n.r + Math.sin(n.pulse) * 0.5;

				ctx!.fillStyle = `hsla(${n.hue}, 80%, 65%, ${glow})`;
				ctx!.shadowBlur = 12;
				ctx!.shadowColor = `hsla(${n.hue}, 80%, 60%, 0.6)`;
				ctx!.beginPath();
				ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
				ctx!.fill();
				ctx!.shadowBlur = 0;

				// Move
				n.x += n.vx;
				n.y += n.vy;

				// Mouse repulsion
				const mdx = n.x - mouse.x;
				const mdy = n.y - mouse.y;
				const md = Math.sqrt(mdx * mdx + mdy * mdy);
				if (md < 120 && md > 0) {
					n.vx += (mdx / md) * 0.03;
					n.vy += (mdy / md) * 0.03;
				}

				// Damping
				n.vx *= 0.999;
				n.vy *= 0.999;

				// Wrap
				if (n.x < -10) n.x = W + 10;
				if (n.x > W + 10) n.x = -10;
				if (n.y < -10) n.y = H + 10;
				if (n.y > H + 10) n.y = -10;
			}

			raf = requestAnimationFrame(draw);
		}

		draw();

		function onMouseMove(e: MouseEvent) {
			const rect = heroCanvas.getBoundingClientRect();
			mouse.x = e.clientX - rect.left;
			mouse.y = e.clientY - rect.top;
		}
		function onMouseLeave() {
			mouse.x = -9999;
			mouse.y = -9999;
		}

		heroSection.addEventListener('mousemove', onMouseMove);
		heroSection.addEventListener('mouseleave', onMouseLeave);
		window.addEventListener('resize', resize);

		return () => {
			cancelAnimationFrame(raf);
			heroSection.removeEventListener('mousemove', onMouseMove);
			heroSection.removeEventListener('mouseleave', onMouseLeave);
			window.removeEventListener('resize', resize);
		};
	}

	onMount(() => {
		setTimeout(typeEffect, 1000);
		const cleanup = initCanvas();
		// Staggered entrance
		requestAnimationFrame(() => (mounted = true));
		return cleanup;
	});
</script>

<section id="home" class="hero" bind:this={heroSection}>
	<canvas class="hero-canvas" bind:this={heroCanvas}></canvas>

	<div class="hero-content" class:hero-entered={mounted}>
		<!-- Holographic ring -->
		<div class="profile-container hero-stagger">
			<div class="holo-ring">
				<div class="holo-ring-inner"></div>
			</div>
			<img
				src="/assets/profile.png"
				alt="Giuseppe Bellamacina"
				class="profile-image"
				fetchpriority="high"
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

	/* ── Holographic ring ── */
	.profile-container {
		position: relative;
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.holo-ring {
		position: absolute;
		width: 240px;
		height: 240px;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		border: 2px solid transparent;
		border-top-color: var(--primary-color);
		border-bottom-color: var(--secondary-color);
		animation: holoSpin 4s linear infinite;
		filter: drop-shadow(0 0 8px var(--primary-color)) drop-shadow(0 0 8px var(--secondary-color));
	}
	.holo-ring-inner {
		position: absolute;
		inset: 6px;
		border-radius: 50%;
		border: 1.5px dashed rgba(0, 255, 255, 0.3);
		animation: holoSpin 6s linear infinite reverse;
	}
	@keyframes holoSpin {
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}

	/* ── Staggered entrance ── */
	.hero-stagger {
		opacity: 0;
		transform: translateY(30px);
		transition:
			opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
	}
	:global(.hero-entered) .hero-stagger,
	.hero-stagger:global(.hero-entered) {
		opacity: 1;
		transform: translateY(0);
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
		border: 2px solid var(--primary-color);
		border-radius: 12px;
		position: relative;
		box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
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
		animation: scrollBounce 2s ease-in-out infinite;
	}
	@keyframes scrollBounce {
		0%,
		100% {
			top: 6px;
			opacity: 1;
		}
		50% {
			top: 18px;
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
