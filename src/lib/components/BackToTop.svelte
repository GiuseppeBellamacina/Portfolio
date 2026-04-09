<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	let visible = false;

	function checkScroll() {
		visible = window.scrollY > 500;
	}

	function scrollToTop() {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	}

	onMount(() => {
		window.addEventListener('scroll', checkScroll);
		checkScroll();

		return () => {
			window.removeEventListener('scroll', checkScroll);
		};
	});
</script>

<button
	class="back-to-top"
	class:visible
	on:click={scrollToTop}
	aria-label={$t.backToTop}
	title={$t.backToTop}
>
	<i class="fas fa-arrow-up"></i>
</button>

<style>
	.back-to-top {
		position: fixed;
		bottom: 90px;
		right: 30px;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: var(--bg-card);
		border: 1.5px solid var(--primary-color);
		color: var(--primary-color);
		font-size: 1.2rem;
		cursor: pointer;
		opacity: 0;
		visibility: hidden;
		transform: translateY(20px) scale(0.8);
		transition: all 0.3s ease;
		z-index: 1000;
		box-shadow: 0 4px 15px rgba(var(--indigo-rgb), 0.12);
	}

	.back-to-top.visible {
		opacity: 1;
		visibility: visible;
		transform: translateY(0) scale(1);
		animation: btnPulseGlow 3s ease-in-out infinite;
	}

	@keyframes btnPulseGlow {
		0%,
		100% {
			box-shadow: 0 4px 15px rgba(var(--indigo-rgb), 0.12);
		}
		50% {
			box-shadow:
				0 4px 15px rgba(var(--indigo-rgb), 0.2),
				0 0 20px rgba(var(--primary-rgb), 0.15),
				0 0 40px rgba(var(--primary-rgb), 0.06);
		}
	}

	.back-to-top:hover {
		background: rgba(var(--indigo-rgb), 0.15);
		color: #fff;
		transform: translateY(-3px) scale(1.08);
		box-shadow: 0 8px 24px rgba(var(--indigo-rgb), 0.2);
	}

	.back-to-top:active {
		transform: translateY(-1px) scale(1.05);
	}
</style>
