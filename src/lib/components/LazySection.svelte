<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		loader: () => Promise<{ default: any }>;
		rootMargin?: string;
	}

	let { loader, rootMargin = '200px' }: Props = $props();

	let container: HTMLDivElement;
	let Component: any = $state(null);

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					observer.disconnect();
					loader().then((mod) => {
						Component = mod.default;
					});
				}
			},
			{ rootMargin }
		);
		observer.observe(container);
		return () => observer.disconnect();
	});
</script>

<div bind:this={container} class="lazy-section">
	{#if Component}
		<Component />
	{/if}
</div>
