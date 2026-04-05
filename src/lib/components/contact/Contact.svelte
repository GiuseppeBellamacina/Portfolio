<script lang="ts">
	import { t } from '$lib/i18n';
	import './contact.css';

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
		<h2 class="section-title">{$t.contact_title}</h2>
		<p class="contact-text">{$t.contact_subtitle}</p>
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
