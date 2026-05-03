<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import type { Translations } from '$lib/i18n';
	import { skillCategories } from './skillsData';
	import { createCanvasConstellation } from './skillsConstellation';
	import './skills.css';

	let skillsSection: HTMLElement;
	let isVisible = false;

	function addParallaxEffect() {
		const icons = document.querySelectorAll('.tech-icon') as NodeListOf<HTMLElement>;

		icons.forEach((icon) => {
			icon.addEventListener('mouseleave', () => {
				icon.style.transform = '';
			});

			icon.addEventListener('mousemove', (e) => {
				const rect = icon.getBoundingClientRect();
				const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
				const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
				icon.style.transform = `scale(1.18) translateY(-3px) translate(${x * 4}px, ${y * 4}px)`;
			});
		});
	}

	function setupSkillsAnimations() {
		const categories = document.querySelectorAll('.skills-category') as NodeListOf<HTMLElement>;
		const categoryObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
		);

		categories.forEach((category) => {
			categoryObserver.observe(category);
		});

		const icons = document.querySelectorAll('.tech-icon') as NodeListOf<HTMLElement>;
		const iconObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry, index) => {
					if (entry.isIntersecting) {
						setTimeout(() => {
							entry.target.classList.add('visible');
						}, index * 50);
					}
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
		);

		icons.forEach((icon) => {
			iconObserver.observe(icon);
		});
	}

	onMount(() => {
		let cleanupCanvas: (() => void) | undefined;
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isVisible) {
						isVisible = true;
						cleanupCanvas = createCanvasConstellation(skillsSection);
						setTimeout(() => {
							addParallaxEffect();
							setupSkillsAnimations();
						}, 100);
					}
				});
			},
			{ threshold: 0.05, rootMargin: '100px' }
		);

		if (skillsSection) {
			observer.observe(skillsSection);
		}

		return () => {
			if (skillsSection) {
				observer.unobserve(skillsSection);
			}
			cleanupCanvas?.();
		};
	});
</script>

<section id="skills" class="skills" bind:this={skillsSection}>
	<div class="container">
		<h2 class="section-title">{$t.skills_title}</h2>

		{#each skillCategories as category}
			<div class="skills-category">
				<h3>{$t[category.key as keyof Translations]}</h3>
				<div class="skills-grid">
					{#each category.icons as icon}
						<a href={icon.url} target="_blank" rel="noopener noreferrer" class="tech-icon-link">
							<div class="tech-icon" data-title={icon.name}>
								<span class="tech-name">{icon.name}</span>
								<img src="/assets/icons/{icon.icon}" alt={icon.name} loading="lazy" />
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>
