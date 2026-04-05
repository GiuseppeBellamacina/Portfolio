<script lang="ts">
	import { onMount } from 'svelte';
	import { t, lang, toggleLang } from '$lib/i18n';
	import './navbar.css';

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

<nav class="navbar" class:navbar-solid={scrollY > 100} bind:this={navbarElement}>
	<div class="container" style="position: relative;">
		<div class="nav-brand">Giuseppe Bellamacina</div>
		<ul class="nav-menu desktop-menu">
			<li><a href="#home" onclick={handleScroll}>{$t.nav_home}</a></li>
			<li><a href="#about" onclick={handleScroll}>{$t.nav_about}</a></li>
			<li><a href="#experience" onclick={handleScroll}>{$t.nav_experience}</a></li>
			<li><a href="#projects" onclick={handleScroll}>{$t.nav_projects}</a></li>
			<li><a href="#skills" onclick={handleScroll}>{$t.nav_skills}</a></li>
			<li><a href="#contact" onclick={handleScroll}>{$t.nav_contact}</a></li>
		</ul>
		<div
			class="hamburger"
			class:active={isMenuActive}
			onclick={toggleMenu}
			onkeydown={(e) => e.key === 'Enter' && toggleMenu()}
			role="button"
			tabindex="0"
			aria-label={isMenuActive ? $t.nav_close : $t.nav_open}
			aria-expanded={isMenuActive}
		>
			<span></span>
			<span></span>
			<span></span>
		</div>
	</div>
	<button class="lang-toggle desktop-lang" onclick={toggleLang} aria-label="Switch language">
		{#if $lang === 'en'}
			<svg class="flag-icon" viewBox="0 0 640 480"
				><path fill="#fff" d="M0 0h640v480H0z" /><path fill="#009246" d="M0 0h213.3v480H0z" /><path
					fill="#ce2b37"
					d="M426.7 0H640v480H426.7z"
				/></svg
			>
		{:else}
			<svg class="flag-icon" viewBox="0 0 640 480"
				><path fill="#012169" d="M0 0h640v480H0z" /><path
					fill="#FFF"
					d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z"
				/><path
					fill="#C8102E"
					d="m424 281 216 159v40L369 281zm-184 20 6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z"
				/><path fill="#FFF" d="M241 0v480h160V0zM0 160v160h640V160z" /><path
					fill="#C8102E"
					d="M0 193v96h640v-96zM273 0v480h96V0z"
				/></svg
			>
		{/if}
	</button>
</nav>

<!-- Menu mobile separato -->
<div class="mobile-menu-wrapper" class:active={isMenuActive}>
	<ul class="nav-menu mobile-menu">
		<li><a href="#home" onclick={handleScroll}>{$t.nav_home}</a></li>
		<li><a href="#about" onclick={handleScroll}>{$t.nav_about}</a></li>
		<li><a href="#experience" onclick={handleScroll}>{$t.nav_experience}</a></li>
		<li><a href="#projects" onclick={handleScroll}>{$t.nav_projects}</a></li>
		<li><a href="#skills" onclick={handleScroll}>{$t.nav_skills}</a></li>
		<li><a href="#contact" onclick={handleScroll}>{$t.nav_contact}</a></li>
		<li>
			<button
				class="lang-toggle mobile-lang"
				onclick={() => {
					toggleLang();
					closeMenu();
				}}
				aria-label="Switch language"
			>
				{#if $lang === 'en'}
					<svg class="flag-icon" viewBox="0 0 640 480"
						><path fill="#fff" d="M0 0h640v480H0z" /><path
							fill="#009246"
							d="M0 0h213.3v480H0z"
						/><path fill="#ce2b37" d="M426.7 0H640v480H426.7z" /></svg
					> Italiano
				{:else}
					<svg class="flag-icon" viewBox="0 0 640 480"
						><path fill="#012169" d="M0 0h640v480H0z" /><path
							fill="#FFF"
							d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0z"
						/><path
							fill="#C8102E"
							d="m424 281 216 159v40L369 281zm-184 20 6 35L54 480H0zM640 0v3L391 191l2-44L590 0zM0 0l239 176h-60L0 42z"
						/><path fill="#FFF" d="M241 0v480h160V0zM0 160v160h640V160z" /><path
							fill="#C8102E"
							d="M0 193v96h640v-96zM273 0v480h96V0z"
						/></svg
					> English
				{/if}
			</button>
		</li>
	</ul>
</div>
