<script lang="ts">
	import { onMount } from 'svelte';
	import { t, lang } from '$lib/i18n';
	import { getTimelineItems } from './experienceData';
	import { createBinaryRain } from './binaryRain';
	import './experience.css';

	let experienceSection: HTMLElement;
	let isVisible = false;
	let visibleItems = $state<boolean[]>([]);
	let canvasEl: HTMLCanvasElement;
	let rafId = 0;

	const timelineItems = $derived(getTimelineItems($lang));

	let itemDirs = $state<('up' | 'down')[]>([]);

	$effect(() => {
		const len = timelineItems.length;
		if (visibleItems.length !== len) {
			visibleItems = timelineItems.map(() => false);
			itemDirs = timelineItems.map(() => 'down' as const);
		}
	});

	function sizeCanvas() {
		if (!canvasEl || !experienceSection) return;
		canvasEl.width = experienceSection.clientWidth;
		canvasEl.height = experienceSection.clientHeight;
	}

	onMount(() => {
		sizeCanvas();
		const onResize = () => sizeCanvas();
		window.addEventListener('resize', onResize);

		let cleanupRain: (() => void) | undefined;

		const sectionObs = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting && !isVisible) {
						isVisible = true;
						sizeCanvas();
						cleanupRain = createBinaryRain(canvasEl, () => isVisible);
					} else if (!e.isIntersecting && isVisible) {
						isVisible = false;
						cleanupRain?.();
						cleanupRain = undefined;
					} else if (e.isIntersecting && isVisible && !cleanupRain) {
						cleanupRain = createBinaryRain(canvasEl, () => isVisible);
					}
				});
			},
			{ threshold: 0.05, rootMargin: '100px' }
		);

		if (experienceSection) {
			sectionObs.observe(experienceSection);

			const items = experienceSection.querySelectorAll('.tl-item');
			const itemObs = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						const idx = Number((entry.target as HTMLElement).dataset.idx);
						if (isNaN(idx)) return;
						const fromBelow = entry.boundingClientRect.top > 0;
						if (entry.isIntersecting) {
							itemDirs[idx] = fromBelow ? 'down' : 'up';
						} else {
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
				cleanupRain?.();
				window.removeEventListener('resize', onResize);
			};
		}

		return () => {
			sectionObs.disconnect();
			cleanupRain?.();
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<section id="experience" class="experience" bind:this={experienceSection}>
	<canvas class="binary-canvas" bind:this={canvasEl}></canvas>
	<div class="container">
		<h2 class="section-title">{$t.exp_title}</h2>

		<div class="cv-download">
			<a href="/assets/cv.pdf" download="Giuseppe_Bellamacina_CV.pdf" class="btn btn-primary">
				<i class="fas fa-download"></i>
				{$t.exp_downloadCV}
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
								<i class="fas fa-briefcase"></i> {$t.exp_work}
							{:else}
								<i class="fas fa-book"></i> {$t.exp_education}
							{/if}
						</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
