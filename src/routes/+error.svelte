<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { t as tStore } from '$lib/i18n';

	let mounted = $state(false);
	let glitchActive = $state(false);
	let terminalLines = $state<string[]>([]);

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'Page not found');

	function getBootSequence() {
		const tr = get(tStore);
		return [
			tr.error_boot1,
			tr.error_boot2,
			`> ERROR ${page.status}: ${page.error?.message ?? 'Page not found'}`,
			'> Requested path: ' + (typeof window !== 'undefined' ? window.location.pathname : '???'),
			tr.error_boot5,
			tr.error_boot6
		];
	}

	function triggerGlitch() {
		glitchActive = true;
		setTimeout(() => (glitchActive = false), 300);
	}

	onMount(() => {
		requestAnimationFrame(() => (mounted = true));

		// Boot sequence animation
		const bootSequence = getBootSequence();
		let i = 0;
		const interval = setInterval(() => {
			if (i < bootSequence.length) {
				terminalLines = [...terminalLines, bootSequence[i]];
				i++;
			} else {
				clearInterval(interval);
			}
		}, 400);

		// Periodic glitch
		const glitchInterval = setInterval(triggerGlitch, 4000);

		return () => {
			clearInterval(interval);
			clearInterval(glitchInterval);
		};
	});
</script>

<div class="error-page">
	<div class="error-content" class:entered={mounted}>
		<!-- Glitching 404 -->
		<h1 class="error-code" class:glitch-active={glitchActive} data-text={status}>
			{status}
		</h1>

		<p class="error-subtitle">{message}</p>

		<!-- Terminal box -->
		<div class="terminal-box">
			<div class="terminal-header">
				<span class="terminal-dot red"></span>
				<span class="terminal-dot yellow"></span>
				<span class="terminal-dot green"></span>
				<span class="terminal-title">system-diagnostic.sh</span>
			</div>
			<div class="terminal-body" role="log" aria-live="polite">
				{#each terminalLines as line, i}
					<p
						class="terminal-line"
						class:error-line={line.includes('ERROR')}
						style="animation-delay: {i * 0.1}s"
					>
						{line}
					</p>
				{/each}
				<span class="terminal-cursor">_</span>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="error-actions">
			<a href="/" class="btn btn-primary">
				<i class="fas fa-home"></i>
				{$tStore.error_home}
			</a>
			<button class="btn btn-secondary" onclick={() => history.back()}>
				<i class="fas fa-arrow-left"></i>
				{$tStore.error_back}
			</button>
		</div>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		padding: 2rem;
		background: var(--bg-dark);
	}

	/* ── Content wrapper ── */
	.error-content {
		position: relative;
		z-index: 1;
		text-align: center;
		max-width: 650px;
		width: 100%;
		opacity: 0;
		transform: translateY(40px);
		transition:
			opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.error-content.entered {
		opacity: 1;
		transform: translateY(0);
	}

	/* ── Giant error code ── */
	.error-code {
		font-size: clamp(6rem, 18vw, 12rem);
		font-weight: 900;
		letter-spacing: 0.05em;
		line-height: 1;
		margin-bottom: 0.5rem;
		position: relative;
		color: var(--text-light);
		text-shadow:
			0 0 10px rgba(var(--primary-rgb), 0.4),
			0 0 30px rgba(var(--primary-rgb), 0.2);
		animation: neonPulse 3s ease-in-out infinite;
	}

	/* Glitch pseudo-elements */
	.error-code::before,
	.error-code::after {
		content: attr(data-text);
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0;
	}
	.error-code::before {
		color: var(--primary-color);
		clip-path: inset(0 0 60% 0);
	}
	.error-code::after {
		color: var(--neon-pink);
		clip-path: inset(40% 0 0 0);
	}
	.error-code.glitch-active::before {
		opacity: 0.8;
		animation: glitchTop 0.3s steps(3) forwards;
	}
	.error-code.glitch-active::after {
		opacity: 0.8;
		animation: glitchBottom 0.3s steps(3) forwards;
	}

	@keyframes neonPulse {
		0%,
		100% {
			text-shadow:
				0 0 10px rgba(var(--primary-rgb), 0.4),
				0 0 30px rgba(var(--primary-rgb), 0.2);
		}
		50% {
			text-shadow:
				0 0 15px rgba(var(--primary-rgb), 0.5),
				0 0 40px rgba(var(--primary-rgb), 0.3);
		}
	}
	@keyframes glitchTop {
		0% {
			transform: translate(0);
		}
		33% {
			transform: translate(-4px, 1px);
		}
		66% {
			transform: translate(3px, -2px);
		}
		100% {
			transform: translate(0);
		}
	}
	@keyframes glitchBottom {
		0% {
			transform: translate(0);
		}
		33% {
			transform: translate(3px, -1px);
		}
		66% {
			transform: translate(-2px, 2px);
		}
		100% {
			transform: translate(0);
		}
	}

	/* ── Subtitle ── */
	.error-subtitle {
		font-size: 1.3rem;
		color: var(--text-muted);
		margin-bottom: 2.5rem;
		font-family: 'Courier New', monospace;
	}

	/* ── Terminal box ── */
	.terminal-box {
		background: rgba(var(--bg-dark-rgb), 0.85);
		border: 1px solid rgba(var(--primary-rgb), 0.12);
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 2.5rem;
		text-align: left;
		box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(12px);
	}

	.terminal-header {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 14px;
		background: rgba(var(--bg-card-rgb), 0.9);
		border-bottom: 1px solid rgba(var(--primary-rgb), 0.08);
	}
	.terminal-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.terminal-dot.red {
		background: #ff5f57;
	}
	.terminal-dot.yellow {
		background: #febc2e;
	}
	.terminal-dot.green {
		background: #28c840;
	}
	.terminal-title {
		margin-left: 8px;
		font-size: 0.75rem;
		color: var(--text-muted);
		font-family: 'Courier New', monospace;
	}

	.terminal-body {
		padding: 16px 18px;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		line-height: 1.7;
		height: 200px;
	}

	.terminal-line {
		color: var(--neon-green);
		opacity: 0;
		animation: lineAppear 0.3s ease forwards;
	}
	.terminal-line.error-line {
		color: #ff4444;
		font-weight: bold;
	}

	@keyframes lineAppear {
		from {
			opacity: 0;
			transform: translateX(-8px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.terminal-cursor {
		color: var(--primary-color);
		animation: blink 0.8s infinite;
	}
	@keyframes blink {
		0%,
		50% {
			opacity: 1;
		}
		51%,
		100% {
			opacity: 0;
		}
	}

	/* ── Buttons ── */
	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* ── Responsive ── */
	@media (max-width: 600px) {
		.error-code {
			font-size: clamp(4rem, 22vw, 8rem);
		}
		.error-subtitle {
			font-size: 1rem;
		}
		.terminal-body {
			font-size: 0.75rem;
			padding: 12px;
		}
	}
</style>
