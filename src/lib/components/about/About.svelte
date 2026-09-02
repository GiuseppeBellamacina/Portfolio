<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import Terminal from '../terminal/Terminal.svelte';
	import { createNeuralGraphViz, createMobileParticles, type VizHandle } from './neuralNetwork';
	import './about.css';

	let canvasElement: HTMLCanvasElement;
	let aboutSection: HTMLElement;
	let isVisible = false;
	let isSmallScreen = false;
	let revealed = $state<boolean[]>([]);
	let vizHandle: VizHandle | undefined;

	onMount(() => {
		const checkScreenSize = () => {
			isSmallScreen = window.innerWidth < 768;
		};
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);

		// Staggered reveal for section title + terminal
		const BLOCK_COUNT = 2;
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

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (!isVisible) {
							isVisible = true;
							setTimeout(() => {
								const factory = isSmallScreen ? createMobileParticles : createNeuralGraphViz;
								vizHandle = factory(canvasElement, aboutSection, () => isVisible);
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
			vizHandle?.destroy();
			revealObs.disconnect();
			if (aboutSection) {
				observer.disconnect();
			}
		};
	});

	// The network "processes" every valid command typed in the terminal
	function handleCommandExecuted() {
		vizHandle?.triggerWave();
	}

	// ...and reacts once the bio finishes printing at the opening reveal
	function handleBioRevealed() {
		vizHandle?.triggerWave();
	}
</script>

<section id="about" class="about" bind:this={aboutSection}>
	<canvas class="neural-canvas" bind:this={canvasElement}></canvas>
	<div class="container">
		<!-- Title -->
		<h2 class="section-title about-block" class:show={revealed[0]} data-idx="0">
			{$t.about_title}
		</h2>

		<!-- Interactive terminal: fixed width, centered in the space below the title -->
		<div class="about-terminal-wrap about-block" class:show={revealed[1]} data-idx="1">
			<div class="about-terminal">
				<Terminal onCommandExecuted={handleCommandExecuted} onBioRevealed={handleBioRevealed} />
			</div>
		</div>
	</div>
</section>
