<script lang="ts">
	import { t } from '$lib/i18n';
	import './footer.css';

	const navLinks = [
		{ href: '#home', key: 'nav_home' },
		{ href: '#about', key: 'nav_about' },
		{ href: '#experience', key: 'nav_experience' },
		{ href: '#projects', key: 'nav_projects' },
		{ href: '#skills', key: 'nav_skills' },
		{ href: '#contact', key: 'nav_contact' }
	] as const;

	const socialLinks = [
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

<footer id="footer" class="footer">
	<div class="footer-divider"></div>
	<div class="container footer-grid">
		<div class="footer-col footer-brand">
			<span class="footer-logo">GB</span>
			<p class="footer-copy">&copy; 2026 Giuseppe Bellamacina</p>
			<p class="footer-tagline">{$t.footer_tagline}</p>
		</div>

		<div class="footer-col">
			<h4 class="footer-heading">{$t.footer_nav}</h4>
			<nav class="footer-nav">
				{#each navLinks as link}
					<a href={link.href}>{$t[link.key]}</a>
				{/each}
			</nav>
		</div>

		<div class="footer-col">
			<h4 class="footer-heading">{$t.footer_social}</h4>
			<div class="footer-social">
				{#each socialLinks as link}
					<a href={link.href} target="_blank" title={link.label} class="footer-social-link">
						<i class={link.icon}></i>
						<span>{link.label}</span>
					</a>
				{/each}
			</div>
		</div>
	</div>

	<div class="footer-bottom">
		<p>
			{$t.footer_built}
			<b>Sbaddu Supecchiu</b>
		</p>
	</div>
</footer>
