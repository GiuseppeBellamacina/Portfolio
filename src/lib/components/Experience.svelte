<script lang="ts">
	import { onMount } from 'svelte';

	let experienceSection: HTMLElement;
	let isVisible = false;
	let visibleItems: boolean[] = [];
	let canvasEl: HTMLCanvasElement;
	let rafId = 0;

	// ── Lightweight binary particle system (canvas) ────────────────────────
	interface Particle {
		x: number;
		y: number;
		ch: string;
		color: string;
		speed: number;
		opacity: number;
		fade: number;
		size: number;
	}

	const MAX_PARTICLES = 25;
	const COLORS = ['#818cf8', '#a78bfa', '#34d399'];
	let particles: Particle[] = [];

	function spawnParticle(w: number, h: number): Particle {
		return {
			x: Math.random() * w,
			y: Math.random() * h,
			ch: Math.random() > 0.5 ? '1' : '0',
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			speed: 3 + Math.random() * 6,
			opacity: 0,
			fade: 0.001 + Math.random() * 0.002,
			size: 11 + Math.random() * 6
		};
	}

	function runCanvas() {
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		function frame() {
			const w = canvasEl.width;
			const h = canvasEl.height;
			ctx!.clearRect(0, 0, w, h);

			// Spawn up to MAX
			if (particles.length < MAX_PARTICLES && Math.random() < 0.12) {
				particles.push(spawnParticle(w, h));
			}

			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.y -= p.speed * 0.016; // ~60fps normalised
				p.opacity += p.fade;
				if (p.opacity > 0.55) p.fade = -Math.abs(p.fade); // start fading out
				if (p.opacity <= 0) {
					particles.splice(i, 1);
					continue;
				}

				ctx!.globalAlpha = p.opacity;
				ctx!.font = `bold ${p.size}px 'Courier New', monospace`;
				ctx!.fillStyle = p.color;
				ctx!.shadowColor = p.color;
				ctx!.shadowBlur = 4;
				ctx!.fillText(p.ch, p.x, p.y);
			}
			ctx!.globalAlpha = 1;
			ctx!.shadowBlur = 0;

			rafId = requestAnimationFrame(frame);
		}
		rafId = requestAnimationFrame(frame);
	}

	function sizeCanvas() {
		if (!canvasEl || !experienceSection) return;
		canvasEl.width = experienceSection.clientWidth;
		canvasEl.height = experienceSection.clientHeight;
	}

	interface TimelineItem {
		type: 'work' | 'education';
		icon: string;
		date: string;
		title: string;
		subtitle: string;
		description: string;
		highlights: string[];
	}

	const timelineItems: TimelineItem[] = [
		{
			type: 'education',
			icon: 'fas fa-graduation-cap',
			date: '2025 - Present',
			title: "Master's Degree in Machine Learning and Artificial Intelligence",
			subtitle: 'Università degli Studi di Catania',
			description: 'Advanced studies in cutting-edge AI technologies and methodologies',
			highlights: [
				'Deep Learning and Neural Network Architectures',
				'Natural Language Processing and Computer Vision',
				'Reinforcement Learning and Multi-Agent Systems'
			]
		},
		{
			type: 'work',
			icon: 'fas fa-laptop-code',
			date: 'September 2025 - Present',
			title: 'AI Developer',
			subtitle: 'RICCA IT',
			description: 'Developing innovative AI solutions and intelligent systems',
			highlights: [
				'Design and implementation of AI-powered applications',
				'Integration of machine learning models into production systems',
				'Collaboration with cross-functional teams on AI projects'
			]
		},
		{
			type: 'work',
			icon: 'fas fa-briefcase',
			date: 'December 2024 - May 2025',
			title: 'Artificial Intelligence Engineer & Data Scientist',
			subtitle: 'Intellisync',
			description:
				'AI Research and Development with focus on multi-agent systems and predictive analytics',
			highlights: [
				'Development and optimization of multi-agent architectures',
				'Analysis and research of new application fields for innovative AI technologies',
				'Design and implementation of functional prototypes to validate technical approaches',
				'Data Science & Predictive Analytics: Advanced analysis of wind turbine data',
				'Development of predictive models for energy loss estimation and failure prediction',
				'Pattern and anomaly identification using neural networks and machine learning'
			]
		},
		{
			type: 'work',
			icon: 'fas fa-code',
			date: 'June 2024 - November 2024',
			title: 'AI Research and Development',
			subtitle: 'Intellisync - Corporate Internship',
			description: 'Design and development of advanced RAG-based chatbot systems',
			highlights: [
				'Chatbot development based on Retrieval-Augmented Generation (RAG) techniques',
				'Analysis of customer needs to define system architecture',
				'Definition of functional requirements and technical specifications'
			]
		},
		{
			type: 'education',
			icon: 'fas fa-graduation-cap',
			date: '2021 - 2024',
			title: "Bachelor's Degree in Computer Science",
			subtitle: 'Università degli Studi di Catania',
			description: 'Graduated with honors, specialization in Data Elaboration and Applications',
			highlights: [
				'Graduation Grade: 110 cum Laude',
				'Focus on Artificial Intelligence, Machine Learning, and Data Science',
				'Advanced coursework in Neural Networks and Deep Learning'
			]
		},
		{
			type: 'education',
			icon: 'fas fa-school',
			date: '2016 - 2021',
			title: 'High School Diploma',
			subtitle: 'Liceo Archimede, Acireale (CT)',
			description: 'Strong foundation in mathematics and sciences',
			highlights: []
		}
	];

	visibleItems = timelineItems.map(() => false);
	let itemDirs: ('up' | 'down')[] = timelineItems.map(() => 'down');

	onMount(() => {
		sizeCanvas();
		const onResize = () => sizeCanvas();
		window.addEventListener('resize', onResize);

		const sectionObs = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting && !isVisible) {
						isVisible = true;
						sizeCanvas();
						runCanvas();
					} else if (!e.isIntersecting && isVisible) {
						cancelAnimationFrame(rafId);
					} else if (e.isIntersecting && isVisible) {
						runCanvas();
					}
				});
			},
			{ threshold: 0.05, rootMargin: '100px' }
		);

		if (experienceSection) {
			sectionObs.observe(experienceSection);

			// Staggered reveal for each timeline item
			const items = experienceSection.querySelectorAll('.tl-item');
			const itemObs = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						const idx = Number((entry.target as HTMLElement).dataset.idx);
						if (isNaN(idx)) return;
						// Determine direction: if boundingClientRect.top > 0, item is below viewport (scroll down)
						const fromBelow = entry.boundingClientRect.top > 0;
						if (entry.isIntersecting) {
							itemDirs[idx] = fromBelow ? 'down' : 'up';
						} else {
							// Exiting: if top < 0 it left from the top (scrolled down past it)
							itemDirs[idx] = fromBelow ? 'down' : 'up';
						}
						itemDirs = [...itemDirs];
						visibleItems[idx] = entry.isIntersecting;
						visibleItems = [...visibleItems];
					});
				},
				{ threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
			);

			items.forEach((item) => itemObs.observe(item));

			return () => {
				sectionObs.disconnect();
				itemObs.disconnect();
				cancelAnimationFrame(rafId);
				window.removeEventListener('resize', onResize);
			};
		}

		return () => {
			sectionObs.disconnect();
			cancelAnimationFrame(rafId);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<section id="experience" class="experience" bind:this={experienceSection}>
	<canvas class="binary-canvas" bind:this={canvasEl}></canvas>
	<div class="container">
		<h2 class="section-title">Experience & Education</h2>

		<div class="cv-download">
			<a href="/assets/cv.pdf" download="Giuseppe_Bellamacina_CV.pdf" class="btn btn-primary">
				<i class="fas fa-download"></i> Download CV
			</a>
		</div>

		<div class="tl">
			<div class="tl-line"></div>
			{#each timelineItems as item, index}
				<div
					class="tl-item {item.type}"
					class:tl-visible={visibleItems[index]}
					class:tl-from-up={itemDirs[index] === 'up'}
					data-idx={index}
				>
					<div class="tl-node">
						<div class="tl-ring"></div>
						<div class="tl-icon">
							<i class={item.icon}></i>
						</div>
					</div>
					<div class="tl-card">
						<div class="tl-card-glow"></div>
						<span class="tl-date">{item.date}</span>
						<h3 class="tl-title">{item.title}</h3>
						<h4 class="tl-subtitle">{item.subtitle}</h4>
						<p class="tl-desc">{item.description}</p>
						{#if item.highlights.length > 0}
							<ul class="tl-highlights">
								{#each item.highlights as highlight}
									<li>{highlight}</li>
								{/each}
							</ul>
						{/if}
						<span class="tl-type-badge">
							{#if item.type === 'work'}
								<i class="fas fa-briefcase"></i> Work
							{:else}
								<i class="fas fa-book"></i> Education
							{/if}
						</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	/* ── Binary rain canvas ──────────────────────────────────────────────── */
	.binary-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 0;
		opacity: 0.6;
	}

	/* ── Timeline container ──────────────────────────────────────────────── */
	.tl {
		max-width: 950px;
		margin: 0 auto;
		position: relative;
		padding: 2rem 0 1rem;
	}

	/* Animated gradient centre line */
	.tl-line {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 2px;
		translate: -50% 0;
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgba(129, 140, 248, 0.4) 10%,
			rgba(167, 139, 250, 0.4) 50%,
			rgba(52, 211, 153, 0.4) 90%,
			transparent 100%
		);
		border-radius: 2px;
	}

	/* ── Timeline item (row) ─────────────────────────────────────────────── */
	.tl-item {
		display: grid;
		grid-template-columns: 1fr 72px 1fr;
		gap: 1.5rem;
		margin-bottom: 3rem;
		position: relative;
		opacity: 0;
		transition:
			opacity 0.6s ease,
			translate 0.6s ease;
	}
	.tl-item.tl-visible {
		opacity: 1;
		translate: 0 0 !important;
	}
	/* Default: entering from below (scroll down) */
	.tl-item.work {
		translate: -50px 40px;
	}
	.tl-item.education {
		translate: 50px 40px;
	}
	/* Entering/exiting from above (scroll up) */
	.tl-item.work.tl-from-up {
		translate: -50px -40px;
	}
	.tl-item.education.tl-from-up {
		translate: 50px -40px;
	}

	/* Work cards sit left */
	.tl-item.work .tl-card {
		grid-column: 1 / 2;
		grid-row: 1;
		text-align: right;
	}
	.tl-item.work .tl-node {
		grid-column: 2 / 3;
		grid-row: 1;
	}
	/* Education cards sit right */
	.tl-item.education .tl-card {
		grid-column: 3 / 4;
		grid-row: 1;
		text-align: left;
	}
	.tl-item.education .tl-node {
		grid-column: 2 / 3;
		grid-row: 1;
	}

	/* ── Central node (icon + ring) ──────────────────────────────────────── */
	.tl-node {
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: center;
		position: relative;
		z-index: 3;
	}
	.tl-icon {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		color: #fff;
		position: relative;
		z-index: 2;
	}
	.tl-item.work .tl-icon {
		background: linear-gradient(135deg, #4f46e5, #818cf8);
		box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);
	}
	.tl-item.education .tl-icon {
		background: linear-gradient(135deg, #7c3aed, #a78bfa);
		box-shadow: 0 0 16px rgba(167, 139, 250, 0.3);
	}

	/* Rotating ring */
	.tl-ring {
		position: absolute;
		width: 68px;
		height: 68px;
		border-radius: 50%;
		border: 2px dashed transparent;
		animation: ringRotate 12s linear infinite;
	}
	.tl-item.work .tl-ring {
		border-color: rgba(99, 102, 241, 0.2);
	}
	.tl-item.education .tl-ring {
		border-color: rgba(167, 139, 250, 0.2);
	}
	@keyframes ringRotate {
		to {
			rotate: 360deg;
		}
	}

	/* ── Card ────────────────────────────────────────────────────────────── */
	.tl-card {
		position: relative;
		padding: 1.6rem 1.8rem;
		border-radius: 16px;
		background: rgba(15, 18, 35, 0.7);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition:
			transform 0.35s ease,
			border-color 0.35s ease,
			box-shadow 0.35s ease;
		overflow: hidden;
	}
	/* Animated gradient border overlay */
	.tl-card::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 16px;
		padding: 1px;
		background: linear-gradient(
			135deg,
			rgba(99, 102, 241, 0.2),
			transparent 30%,
			transparent 70%,
			rgba(167, 139, 250, 0.2)
		);
		background-size: 300% 300%;
		-webkit-mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.4s ease;
		animation: borderGlowExp 5s ease-in-out infinite;
	}
	.tl-card:hover::after {
		opacity: 1;
	}
	@keyframes borderGlowExp {
		0%,
		100% {
			background-position: 0% 0%;
		}
		50% {
			background-position: 100% 100%;
		}
	}
	.tl-item.work .tl-card {
		border-color: rgba(99, 102, 241, 0.1);
	}
	.tl-item.education .tl-card {
		border-color: rgba(167, 139, 250, 0.1);
	}
	.tl-card:hover {
		transform: translateY(-4px);
	}
	.tl-item.work .tl-card:hover {
		border-color: rgba(99, 102, 241, 0.35);
		box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1);
	}
	.tl-item.education .tl-card:hover {
		border-color: rgba(167, 139, 250, 0.35);
		box-shadow: 0 8px 30px rgba(167, 139, 250, 0.1);
	}

	/* Colour glow overlay inside card */
	.tl-card-glow {
		position: absolute;
		top: -50%;
		right: -50%;
		width: 120%;
		height: 120%;
		border-radius: 50%;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.4s ease;
	}
	.tl-item.work .tl-card-glow {
		background: radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%);
	}
	.tl-item.education .tl-card-glow {
		background: radial-gradient(circle, rgba(167, 139, 250, 0.05) 0%, transparent 70%);
	}
	.tl-card:hover .tl-card-glow {
		opacity: 1;
	}

	/* ── Card inner elements ─────────────────────────────────────────────── */
	.tl-date {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 1.2px;
		border-radius: 6px;
		margin-bottom: 0.75rem;
	}
	.tl-item.work .tl-date {
		background: rgba(99, 102, 241, 0.08);
		color: #818cf8;
		border: 1px solid rgba(99, 102, 241, 0.2);
	}
	.tl-item.education .tl-date {
		background: rgba(167, 139, 250, 0.08);
		color: #c4b5fd;
		border: 1px solid rgba(167, 139, 250, 0.2);
	}

	.tl-title {
		font-size: 1.3rem;
		font-weight: 700;
		margin: 0 0 0.4rem;
		color: var(--text-light);
		line-height: 1.3;
	}
	.tl-subtitle {
		font-size: 1rem;
		font-weight: 500;
		margin: 0 0 0.75rem;
	}
	.tl-item.work .tl-subtitle {
		color: #818cf8;
	}
	.tl-item.education .tl-subtitle {
		color: #c4b5fd;
	}
	.tl-desc {
		color: var(--text-muted);
		line-height: 1.6;
		font-size: 0.95rem;
		margin: 0 0 0.75rem;
	}

	/* Highlights list */
	.tl-highlights {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.tl-highlights li {
		padding-left: 1.4rem;
		position: relative;
		margin-bottom: 0.4rem;
		color: var(--text-light);
		font-size: 0.9rem;
		line-height: 1.5;
	}
	.tl-item.work .tl-highlights li::before {
		content: '▸';
		position: absolute;
		left: 0;
		color: #818cf8;
		font-size: 1rem;
	}
	.tl-item.education .tl-highlights li::before {
		content: '▸';
		position: absolute;
		left: 0;
		color: #c4b5fd;
		font-size: 1rem;
	}

	/* Type badge */
	.tl-type-badge {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.2rem 0.65rem;
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		border-radius: 4px;
		opacity: 0.7;
	}
	.tl-item.work .tl-type-badge {
		background: rgba(99, 102, 241, 0.06);
		color: #818cf8;
	}
	.tl-item.education .tl-type-badge {
		background: rgba(167, 139, 250, 0.06);
		color: #c4b5fd;
	}

	/* ── Responsive ──────────────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.tl-line {
			left: 28px;
		}
		.tl-item {
			grid-template-columns: 56px 1fr;
			gap: 1rem;
		}
		.tl-item.work .tl-card,
		.tl-item.education .tl-card {
			grid-column: 2 / 3;
			text-align: left;
		}
		.tl-item.work .tl-node,
		.tl-item.education .tl-node {
			grid-column: 1 / 2;
		}
		.tl-item.work,
		.tl-item.education {
			translate: 30px 40px;
		}
		.tl-item.work.tl-visible,
		.tl-item.education.tl-visible {
			translate: 0 0;
		}
		.tl-icon {
			width: 44px;
			height: 44px;
			font-size: 1rem;
		}
		.tl-ring {
			width: 58px;
			height: 58px;
		}
		.tl-card {
			padding: 1.2rem 1.4rem;
		}
		.tl-title {
			font-size: 1.15rem;
		}
	}
</style>
