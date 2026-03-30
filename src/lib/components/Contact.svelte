<script lang="ts">
	interface ContactLink {
		href: string;
		icon: string;
		label: string;
	}

	const contactLinks: ContactLink[] = [
		{
			href: 'https://github.com/GiuseppeBellamacina',
			icon: 'fab fa-github',
			label: 'GitHub'
		},
		{
			href: 'https://www.linkedin.com/in/giuseppe-bellamacina-739b03204/',
			icon: 'fab fa-linkedin',
			label: 'LinkedIn'
		},
		{
			href: 'https://www.instagram.com/giuseppe_bellamacina/',
			icon: 'fab fa-instagram',
			label: 'Instagram'
		}
	];
</script>

<section id="contact" class="contact">
	<div class="container">
		<h2 class="section-title">Get In Touch</h2>
		<p class="contact-text">I'm always open to new opportunities and collaborations!</p>
		<div class="contact-links">
			{#each contactLinks as link}
				<a href={link.href} target="_blank" class="contact-btn">
					<i class={link.icon}></i>
					{link.label}
				</a>
			{/each}
		</div>
	</div>
</section>
