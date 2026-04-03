<script lang="ts">
	import { onMount } from 'svelte';
	import Terminal from '../terminal/Terminal.svelte';
	import { createNeuralNetworkViz, createMobileParticles } from './neuralNetwork';
	import './about.css';

	let canvasElement: HTMLCanvasElement;
	let aboutSection: HTMLElement;
	let isVisible = false;
	let isSmallScreen = false;
	let revealed = $state<boolean[]>([]);

	onMount(() => {
		const checkScreenSize = () => {
			isSmallScreen = window.innerWidth < 768;
		};
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);

		// Staggered reveal for about blocks
		const BLOCK_COUNT = 3;
		revealed = Array(BLOCK_COUNT).fill(false);
		const revealBlocks = aboutSection?.querySelectorAll('.about-block');
		const revealObs = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const idx = Number((entry.target as HTMLElement).dataset.idx);
						if (!isNaN(idx)) revealed[idx] = true;
					}
				});
			},
			{ threshold: 0.15 }
		);
		revealBlocks?.forEach((el) => revealObs.observe(el));

		let cleanupCanvas: (() => void) | undefined;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (!isVisible) {
							isVisible = true;
							setTimeout(() => {
								const factory = isSmallScreen ? createMobileParticles : createNeuralNetworkViz;
								cleanupCanvas = factory(canvasElement, aboutSection, () => isVisible);
							}, 0);
						} else {
							isVisible = true;
						}
					} else {
						isVisible = false;
					}
				});
			},
			{ threshold: 0.05, rootMargin: '50px' }
		);

		if (aboutSection) {
			observer.observe(aboutSection);
		}

		return () => {
			window.removeEventListener('resize', checkScreenSize);
			cleanupCanvas?.();
			if (aboutSection) {
				observer.unobserve(aboutSection);
			}
		};
	});
</script>

<section id="about" class="about" bind:this={aboutSection}>
	<canvas class="neural-canvas" bind:this={canvasElement}></canvas>
	<div class="container">
		<!-- Title -->
		<h2 class="section-title about-block" class:show={revealed[0]} data-idx="0">About Me</h2>

		<div class="about-content">
			<!-- Bio card (glassmorphism) -->
			<div class="bio-card about-block" class:show={revealed[1]} data-idx="1">
				<p>
					Hi there! 👋 I'm Giuseppe, a Computer Science student at the University of Catania. I'm
					passionate about <strong>Artificial Intelligence</strong> and
					<strong>Cybersecurity</strong>, always diving into new challenges and exploring the
					unknown.
				</p>
				<p>
					Most of the time, I just end up doing weird stuff because, well... <strong
						>Sbaddu Supecchiu</strong
					>.
				</p>
				<p>
					I'm a huge fan of Marvel and Star Wars universe, but I'm just as obsessed with anime and
					way too many other things to list here. I also have a deep love for video games.
				</p>
				<p>
					Oh, and I have a thing for cars. I drive. <em>(Yes, I'm Ryan Gosling)</em>.
				</p>
			</div>

			<!-- Interactive terminal -->
			<div class="about-block" class:show={revealed[2]} data-idx="2">
				<Terminal />
			</div>
		</div>
	</div>
</section>
