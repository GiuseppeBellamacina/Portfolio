<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
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
		<h2 class="section-title about-block" class:show={revealed[0]} data-idx="0">
			{$t.about_title}
		</h2>

		<div class="about-content">
			<!-- Bio card (glassmorphism) -->
			<div class="bio-card about-block" class:show={revealed[1]} data-idx="1">
				<p>{@html $t.about_p1}</p>
				<p>{@html $t.about_p2}</p>
				<p>{@html $t.about_p3}</p>
				<p>{@html $t.about_p4}</p>
			</div>

			<!-- Interactive terminal -->
			<div class="about-block" class:show={revealed[2]} data-idx="2">
				<Terminal />
			</div>
		</div>
	</div>
</section>
