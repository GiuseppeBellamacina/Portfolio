<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { skillCategories, type SkillCategory } from './skillsData';
	import { createCanvasConstellation } from './skillsConstellation';
	import './skills.css';

	let skillsSection: HTMLElement;
	let isVisible = false;

	// Wall: every tech dealt round-robin into rows so categories mix along each row
	const ROWS = 4;
	const allIcons = skillCategories.flatMap((c) => c.icons);
	const rows = Array.from({ length: ROWS }, (_, r) => allIcons.filter((_, i) => i % ROWS === r));

	let selectedIndex = $state<number | null>(null);
	let selected = $derived(selectedIndex === null ? null : skillCategories[selectedIndex]);

	function select(index: number | null) {
		selectedIndex = index;
		const key = index === null ? null : skillCategories[index].key;
		window.dispatchEvent(new CustomEvent('skills-category', { detail: key }));
	}

	onMount(() => {
		let cleanupCanvas: (() => void) | undefined;
		const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isVisible) {
						isVisible = true;
						if (!isMobile) {
							cleanupCanvas = createCanvasConstellation(skillsSection);
						}
					}
				});
			},
			{ threshold: 0.05, rootMargin: '100px' }
		);

		if (skillsSection) {
			observer.observe(skillsSection);
		}

		return () => {
			observer.disconnect();
			cleanupCanvas?.();
		};
	});
</script>

{#snippet tile(icon: SkillCategory['icons'][number], i = 0)}
	<a
		href={icon.url}
		target="_blank"
		rel="noopener noreferrer"
		class="tech-icon-link"
		style="--i:{i}"
	>
		<div class="tech-icon visible" data-title={icon.name}>
			<span class="tech-name">{icon.name}</span>
			<img src="/assets/icons/{icon.icon}" alt={icon.name} loading="lazy" />
		</div>
	</a>
{/snippet}

<section id="skills" class="skills" bind:this={skillsSection}>
	<div class="container">
		<h2 class="section-title">{$t.skills_title}</h2>

		<div class="skills-cats" role="group" aria-label={$t.skills_title}>
			<button class:on={!selected} aria-pressed={!selected} onclick={() => select(null)}>
				{$t.skills_all} <span>{allIcons.length}</span>
			</button>
			{#each skillCategories as category, i}
				<button
					class:on={selectedIndex === i}
					aria-pressed={selectedIndex === i}
					onclick={() => select(i)}
				>
					{$t[category.key]} <span>{category.icons.length}</span>
				</button>
			{/each}
		</div>
	</div>

	{#if selected}
		<div class="container">
			{#key selectedIndex}
				<div class="skills-grid skills-focus">
					{#each selected.icons as icon, i}
						{@render tile(icon, i)}
					{/each}
				</div>
			{/key}
		</div>
	{:else}
		<div class="skills-wall">
			{#each rows as row, r}
				<!-- Second copy makes the -50% loop seamless; hidden from AT and tab order -->
				<div class="skills-row" class:rev={r % 2 === 1} style="--dur:{70 + r * 12}s">
					{#each row as icon}
						{@render tile(icon)}
					{/each}
					<div class="skills-row-copy" aria-hidden="true" inert>
						{#each row as icon}
							{@render tile(icon)}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
