<script lang="ts">
	import { onMount } from 'svelte';
	import { setSeason, resetSeason } from '$lib/stores/seasonStore';

	let { forceShow = false }: { forceShow?: boolean } = $props();

	let showLeaves = $state(false);
	let leavesContainer = $state<HTMLDivElement>();

	function isAutumnPeriod(): boolean {
		const now = new Date();
		const month = now.getMonth(); // 0-11
		const day = now.getDate();

		// Settembre (mese 8) dal giorno 15 in poi
		if (month === 8 && day >= 15) return true;

		// Ottobre (mese 9) fino al giorno 19 (escludiamo 20-31 per Halloween)
		if (month === 9 && day <= 19) return true;

		// Novembre (mese 10)
		if (month === 10) return true;

		return false;
	}

	function createLeaf() {
		if (!leavesContainer || !showLeaves) return;

		const leaf = document.createElement('div');
		leaf.classList.add('leaf');

		// Vari tipi di foglie (emoji e simboli)
		const leafTypes = ['🍂', '🍁'];
		leaf.textContent = leafTypes[Math.floor(Math.random() * leafTypes.length)];

		// Colori autunnali (usati come filtro)
		const colors = ['hue-rotate(0deg)', 'hue-rotate(10deg)', 'hue-rotate(-10deg)'];
		leaf.style.filter = colors[Math.floor(Math.random() * colors.length)];

		// Posizione iniziale random
		leaf.style.left = Math.random() * 100 + '%';

		// Dimensione random
		const size = Math.random() * 1.2 + 0.6; // 0.6 - 1.8
		leaf.style.fontSize = size + 'rem';

		// Durata animazione random
		const duration = Math.random() * 8 + 8; // 8-16 secondi
		leaf.style.animationDuration = duration + 's';

		// Delay random per movimento oscillante
		const delay = Math.random() * 2;
		leaf.style.animationDelay = `-${delay}s`;

		// Opacità random
		leaf.style.opacity = (Math.random() * 0.3 + 0.7).toString(); // 0.7 - 1

		// Rimuovi la foglia quando l'animazione finisce
		leaf.addEventListener('animationend', () => {
			if (leaf.parentNode) {
				leaf.remove();
			}
		});

		leavesContainer.appendChild(leaf);
	}

	onMount(() => {
		showLeaves = forceShow || isAutumnPeriod();

		if (showLeaves) {
			// Set the season in the store
			setSeason('autumn');

			// Calcola la densità in base alla dimensione dello schermo
			const screenArea = window.innerWidth * window.innerHeight;
			const referenceArea = 1920 * 1080;
			const densityFactor = screenArea / referenceArea;
			const initialLeaves = Math.max(10, Math.floor(35 * densityFactor));

			// Crea foglie iniziali
			for (let i = 0; i < initialLeaves; i++) {
				setTimeout(() => createLeaf(), i * 250);
			}

			// Continua a creare nuove foglie
			const interval = setInterval(() => {
				if (document.hidden) return;
				if (Math.random() > 0.8) {
					createLeaf();
				}
			}, 600);

			return () => {
				clearInterval(interval);
				resetSeason();
			};
		}
	});
</script>

{#if showLeaves}
	<div class="leaves-container" bind:this={leavesContainer}></div>
{/if}

<style>
	.leaves-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 10001;
		overflow: hidden;
	}

	:global(.leaf) {
		position: absolute;
		top: -100px;
		animation: fall linear infinite;
		pointer-events: none;
		user-select: none;
		will-change: transform;
	}

	@keyframes fall {
		0% {
			transform: translateY(0) translateX(0) rotate(0deg);
		}
		25% {
			transform: translateY(calc(25vh)) translateX(30px) rotate(90deg);
		}
		50% {
			transform: translateY(calc(50vh)) translateX(-30px) rotate(180deg);
		}
		75% {
			transform: translateY(calc(75vh)) translateX(30px) rotate(270deg);
		}
		100% {
			transform: translateY(calc(100vh + 100px)) translateX(0) rotate(360deg);
		}
	}

	/* Variazione per movimento più naturale */
	:global(.leaf:nth-child(3n)) {
		animation-name: fall-spin;
	}

	@keyframes fall-spin {
		0% {
			transform: translateY(0) translateX(0) rotate(0deg) rotateY(0deg);
		}
		25% {
			transform: translateY(calc(25vh)) translateX(-40px) rotate(120deg) rotateY(90deg);
		}
		50% {
			transform: translateY(calc(50vh)) translateX(40px) rotate(240deg) rotateY(180deg);
		}
		75% {
			transform: translateY(calc(75vh)) translateX(-40px) rotate(360deg) rotateY(270deg);
		}
		100% {
			transform: translateY(calc(100vh + 100px)) translateX(0) rotate(480deg) rotateY(360deg);
		}
	}

	:global(.leaf:nth-child(2n)) {
		animation-name: fall-gentle;
	}

	@keyframes fall-gentle {
		0% {
			transform: translateY(0) translateX(0) rotate(0deg);
		}
		33% {
			transform: translateY(calc(33vh)) translateX(20px) rotate(60deg);
		}
		66% {
			transform: translateY(calc(66vh)) translateX(-20px) rotate(300deg);
		}
		100% {
			transform: translateY(calc(100vh + 100px)) translateX(0) rotate(360deg);
		}
	}
</style>
