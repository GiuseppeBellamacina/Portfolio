<script lang="ts">
	import { onMount } from 'svelte';

	let typingText = $state('');

	const texts = [
		'AI/ML Engineer',
		'Data Scientist',
		'Ethical Hacker',
		'Star Wars Fanatic',
		'Daft Punk Lover',
		'Tame Impala Listener',
		'Cars Enthusiast',
		'Anime Enjoyer',
		'Literally Ryan Gosling',
		'Cyberpunk Dreamer'
	];

	let textIndex = 0;
	let charIndex = 0;
	let isDeleting = false;
	let isPaused = false;

	function typeEffect() {
		const currentText = texts[textIndex];

		if (isPaused) {
			isPaused = false;
			isDeleting = true;
			setTimeout(typeEffect, 1200);
			return;
		}

		if (isDeleting) {
			typingText = currentText.substring(0, charIndex - 1);
			charIndex--;

			if (charIndex === 0) {
				isDeleting = false;
				textIndex = (textIndex + 1) % texts.length;
				setTimeout(typeEffect, 300);
			} else {
				setTimeout(typeEffect, 25);
			}
		} else {
			typingText = currentText.substring(0, charIndex + 1);
			charIndex++;

			if (charIndex === currentText.length) {
				isPaused = true;
				setTimeout(typeEffect, 1200);
			} else {
				setTimeout(typeEffect, 70);
			}
		}
	}

	onMount(() => {
		setTimeout(typeEffect, 1000);
	});
</script>

<section id="home" class="hero">
	<div class="hero-content">
		<div class="profile-container">
			<img
				src="/assets/profile.png"
				alt="Giuseppe Bellamacina"
				class="profile-image"
				fetchpriority="high"
			/>
		</div>
		<h1 class="glitch" data-text="Giuseppe Bellamacina">Giuseppe Bellamacina</h1>
		<p class="subtitle">
			<span id="typing-text">{typingText}</span><span class="typing-cursor">|</span>
		</p>
		<div class="hero-buttons">
			<a
				href="#experience"
				class="btn btn-primary"
				onclick={(e) => {
					e.preventDefault();
					document
						.querySelector('#experience')
						?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}}>View Experience</a
			>
			<a href="/assets/cv.pdf" download="Giuseppe_Bellamacina_CV.pdf" class="btn btn-secondary">
				<i class="fas fa-download"></i> Download CV
			</a>
			<a href="https://github.com/GiuseppeBellamacina" target="_blank" class="btn btn-secondary">
				<i class="fab fa-github"></i> GitHub
			</a>
		</div>
		<div class="social-links">
			<a
				href="https://www.linkedin.com/in/giuseppe-bellamacina-739b03204/"
				target="_blank"
				title="LinkedIn"
			>
				<i class="fab fa-linkedin"></i>
			</a>
			<a href="https://www.instagram.com/giuseppe_bellamacina/" target="_blank" title="Instagram">
				<i class="fab fa-instagram"></i>
			</a>
			<a href="https://github.com/GiuseppeBellamacina" target="_blank" title="GitHub">
				<i class="fab fa-github"></i>
			</a>
		</div>
	</div>
	<div class="scroll-indicator">
		<span></span>
	</div>
</section>
