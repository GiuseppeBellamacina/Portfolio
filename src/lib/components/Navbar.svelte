<script lang="ts">
	import { onMount } from 'svelte';

	let isMenuActive = $state(false);
	let navbarElement: HTMLElement;
	let scrollY = $state(0);

	function toggleMenu() {
		isMenuActive = !isMenuActive;
	}

	function closeMenu() {
		isMenuActive = false;
	}

	function handleScroll(e: MouseEvent) {
		e.preventDefault();
		const target = e.currentTarget as HTMLAnchorElement;
		const href = target.getAttribute('href');
		if (href && href.startsWith('#')) {
			const element = document.querySelector(href);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
		closeMenu();
	}

	// Matrix rain effect — capped to MAX_RAIN to keep DOM small
	const MAX_RAIN = 12;
	let rainCount = 0;
	let isNavbarVisible = true;
	function createMatrixRain() {
		if (!navbarElement) return;

		const characters =
			'01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

		setInterval(() => {
			if (!isNavbarVisible) return;
			if (rainCount >= MAX_RAIN) return;
			if (Math.random() > 0.3) {
				const rain = document.createElement('span');
				rain.textContent = characters[Math.floor(Math.random() * characters.length)];
				rain.style.position = 'absolute';
				rain.style.left = Math.random() * 100 + '%';
				rain.style.top = '0';
				rain.style.color = 'var(--primary-color)';
				rain.style.fontSize = Math.random() * 6 + 10 + 'px';
				rain.style.opacity = (Math.random() * 0.3 + 0.2).toString();
				rain.style.pointerEvents = 'none';
				rain.style.animation = `matrixFall ${Math.random() * 1 + 1.5}s linear forwards`;
				navbarElement.appendChild(rain);
				rainCount++;

				setTimeout(() => {
					rain.remove();
					rainCount--;
				}, 2500);
			}
		}, 80);
	}

	onMount(() => {
		// Update navbar background on scroll
		const handleScrollEffect = () => {
			scrollY = window.scrollY;
		};

		window.addEventListener('scroll', handleScrollEffect);
		createMatrixRain();

		return () => {
			window.removeEventListener('scroll', handleScrollEffect);
		};
	});
</script>

<nav
	class="navbar"
	bind:this={navbarElement}
	style:background={scrollY > 100 ? 'rgba(11, 13, 23, 0.98)' : 'rgba(11, 13, 23, 0.92)'}
>
	<div class="container" style="position: relative;">
		<div class="nav-brand">Giuseppe Bellamacina</div>
		<ul class="nav-menu desktop-menu">
			<li><a href="#home" onclick={handleScroll}>Home</a></li>
			<li><a href="#about" onclick={handleScroll}>About</a></li>
			<li><a href="#experience" onclick={handleScroll}>Experience</a></li>
			<li><a href="#projects" onclick={handleScroll}>Projects</a></li>
			<li><a href="#skills" onclick={handleScroll}>Skills</a></li>
			<li><a href="#contact" onclick={handleScroll}>Contact</a></li>
		</ul>
		<div
			class="hamburger"
			class:active={isMenuActive}
			onclick={toggleMenu}
			onkeydown={(e) => e.key === 'Enter' && toggleMenu()}
			role="button"
			tabindex="0"
			aria-label={isMenuActive ? 'Chiudi menu' : 'Apri menu'}
			aria-expanded={isMenuActive}
		>
			<span></span>
			<span></span>
			<span></span>
		</div>
	</div>
</nav>

<!-- Menu mobile separato -->
<div class="mobile-menu-wrapper" class:active={isMenuActive}>
	<ul class="nav-menu mobile-menu">
		<li><a href="#home" onclick={handleScroll}>Home</a></li>
		<li><a href="#about" onclick={handleScroll}>About</a></li>
		<li><a href="#experience" onclick={handleScroll}>Experience</a></li>
		<li><a href="#projects" onclick={handleScroll}>Projects</a></li>
		<li><a href="#skills" onclick={handleScroll}>Skills</a></li>
		<li><a href="#contact" onclick={handleScroll}>Contact</a></li>
	</ul>
</div>
