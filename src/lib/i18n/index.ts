import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type Lang = 'en' | 'it';

// Always start as 'en' so SSR and hydration produce the same DOM
export const lang = writable<Lang>('en');

/** Call from onMount in the root layout to detect the real language after hydration */
export function initLang() {
	if (!browser) return;
	const saved = localStorage.getItem('portfolio-lang');
	if (saved === 'it' || saved === 'en') {
		lang.set(saved);
	} else if (navigator.language.toLowerCase().startsWith('it')) {
		lang.set('it');
	}
	// Start persisting only after the real language has been detected
	lang.subscribe(($lang) => {
		localStorage.setItem('portfolio-lang', $lang);
		document.documentElement.lang = $lang;
	});
}

export function toggleLang() {
	lang.update((l) => (l === 'en' ? 'it' : 'en'));
}

const translations = {
	en: {
		// Nav
		nav_home: 'Home',
		nav_about: 'About',
		nav_experience: 'Experience',
		nav_projects: 'Projects',
		nav_skills: 'Skills',
		nav_contact: 'Contact',
		nav_close: 'Close menu',
		nav_open: 'Open menu',

		// Hero
		hero_viewExperience: 'View Experience',
		hero_downloadCV: 'Download CV',

		// About
		about_title: 'About Me',
		about_p1:
			"Hi there! 👋 I'm Giuseppe, a Computer Science student at the University of Catania. I'm passionate about <strong>Artificial Intelligence</strong> and <strong>Cybersecurity</strong>, always diving into new challenges and exploring the unknown.",
		about_p2:
			'Most of the time, I just end up doing weird stuff because, well... <strong>Sbaddu Supecchiu</strong>.',
		about_p3:
			"I'm a huge fan of Marvel and Star Wars universe, but I'm just as obsessed with anime and way too many other things to list here. I also have a deep love for video games.",
		about_p4: "Oh, and I have a thing for cars.<br>I drive. <em>(Yes, I'm Ryan Gosling)</em>.",

		// Skills
		skills_title: 'Tech Stack',
		skills_languages: 'Languages',
		skills_aiml: 'AI/ML & Data Science',
		skills_frameworks: 'Frameworks & Libraries',
		skills_databases: 'Databases',
		skills_devops: 'DevOps & Tools',
		skills_ides: 'IDEs & Editors',
		skills_os: 'Operating Systems & Security',

		// Experience
		exp_title: 'Experience & Education',
		exp_downloadCV: 'Download CV',
		exp_work: 'Work',
		exp_education: 'Education',

		// Projects
		proj_title: 'Personal Projects',
		proj_showGrid: 'Show Grid',
		proj_showCarousel: 'Show Carousel',
		proj_viewAllRepos: 'View All Repos',
		proj_viewOnGithub: 'View on GitHub',
		proj_download: 'Download',
		proj_watch: 'Watch',
		proj_hackathon: 'Hackathon',
		proj_demo: 'Demo',
		proj_winner: '🏆 Winner',
		proj_hackathonWinner: '🏆 Hackathon Winner',
		proj_stars: 'stars',

		// Contact
		contact_title: 'Get In Touch',
		contact_subtitle: "I'm always open to new opportunities and collaborations!",

		// Footer
		footer_built: 'Built with ❤️ and lots of',
		footer_tagline: '🚀 Always learning, always building.',
		footer_nav: 'Navigation',
		footer_social: 'Connect',

		// Back to top
		backToTop: 'Back to top',

		// Error page
		error_home: 'Return Home',
		error_back: 'Go Back',
		error_boot1: '> Initializing system diagnostic...',
		error_boot2: '> Scanning route table............',
		error_boot5: '> Stack trace: REDACTED',
		error_boot6: '> Suggestion: Return to base /',

		// Terminal
		term_helpTitle: 'Available commands:',
		term_helpHelp: 'Show this message',
		term_helpAbout: 'Who is Giuseppe?',
		term_helpSkills: 'List tech skills',
		term_helpContact: 'Contact info',
		term_helpProjects: 'Current projects',
		term_helpSocials: 'Social links',
		term_helpWhoami: 'Identity check',
		term_helpDate: 'Current date',
		term_helpEcho: 'Repeat after me',
		term_helpClear: 'Clear terminal',
		term_helpNeofetch: 'System info',
		term_helpAnime: 'Random anime pick',
		term_helpMusic: 'Play a random song',
		term_helpHidden: '...and maybe some hidden ones 👀',
		term_aboutName: '👋 Giuseppe Bellamacina',
		term_aboutStudent: 'CS Student @ University of Catania',
		term_aboutPassion: 'Passionate about AI/ML & Cybersecurity',
		term_aboutAlias: 'Also known as: Ryan Gosling',
		term_sudo: "Nice try. You don't have root access here 😏",
		term_rmrf: '🚨 NICE TRY! This portfolio is rm-proof.',
		term_rmDenied: 'Permission denied. This is a read-only filesystem.',
		term_hackInit: '🔓 Initializing hack sequence...',
		term_hackGranted: 'ACCESS GRANTED ✅',
		term_hackJk: 'Just kidding. But I do study cybersecurity 😎',
		term_starwarsQuote: '"Do or do not. There is no try." — Yoda',
		term_starwarsForce: 'May the Force be with you! ⚔️',
		term_animeWatch: '🎌 You should watch:',
		term_musicAvailable: '🎵 Available music:',
		term_musicTip: 'Tip: music -l to see all available songs',
		term_musicTipArtist: 'Tip: type an artist name directly to play their music.',
		term_driveJacket: '🏎️ *puts on scorpion jacket*',
		term_driveStare: '*stares intensely*',
		term_driveQuote: '"I drive." — The Driver',
		term_matrixChose: 'You chose to visit this portfolio.',
		term_matrixIn: "You're already in the",
		term_matrixWake: 'Wake up, Neo...',
		term_sbaddu: '🤌 SBADDU SUPECCHIU!',
		term_sbadduKnow: 'If you know, you know.',
		term_exitNo: 'There is no escape from this portfolio.',
		term_exitStuck: "You're stuck here forever. Enjoy! 🔒",
		term_cdHere: "You're already where you need to be.",
		term_42answer: 'The Answer to the Ultimate Question of Life, the Universe, and Everything.',
		term_hello: 'Hey there! 👋 Welcome to my portfolio!',
		term_helpThemes: 'Change galaxy theme',
		term_themesTitle: 'Available themes:',
		term_themesUsage: 'Usage: type the theme name to apply it.',
		term_themesTemp: 'Changes are temporary — reload to restore the seasonal default.',
		term_themeApplied: 'Theme applied:',
		term_themeDefault: 'Restored default seasonal theme.',
		term_notFound: 'command not found:',
		term_typeHelp: 'Type "help" for available commands.',
		term_catNotFound: 'No such file or directory',
		term_nowPlaying: 'Now playing:',
		term_musicTipShort: 'Tip: music -l to see all available songs'
	},
	it: {
		// Nav
		nav_home: 'Home',
		nav_about: 'Chi Sono',
		nav_experience: 'Esperienza',
		nav_projects: 'Progetti',
		nav_skills: 'Competenze',
		nav_contact: 'Contatti',
		nav_close: 'Chiudi menu',
		nav_open: 'Apri menu',

		// Hero
		hero_viewExperience: 'Vedi Esperienze',
		hero_downloadCV: 'Scarica CV',

		// About
		about_title: 'Chi Sono',
		about_p1:
			"Ciao! 👋 Sono Giuseppe, studente di Informatica presso l'Università di Catania. Sono appassionato di <strong>Intelligenza Artificiale</strong> e <strong>Cybersecurity</strong>, sempre pronto a tuffarmi in nuove sfide e ad esplorare l'ignoto.",
		about_p2:
			'La maggior parte del tempo finisco per fare cose strane per via dello <strong>Sbaddu Supecchiu</strong>.',
		about_p3:
			"Sono un grande fan dell'universo Marvel e Star Wars, ma sono altrettanto ossessionato dagli anime e da troppe altre cose per elencarle tutte. Ho anche una profonda passione per i videogiochi.",
		about_p4: 'Ah, e ho una cosa per le macchine.<br>I Drive. <em>(Sì, sono Ryan Gosling)</em>.',

		// Skills
		skills_title: 'Tech Stack',
		skills_languages: 'Linguaggi',
		skills_aiml: 'AI/ML & Data Science',
		skills_frameworks: 'Framework & Librerie',
		skills_databases: 'Database',
		skills_devops: 'DevOps & Strumenti',
		skills_ides: 'IDE & Editor',
		skills_os: 'Sistemi Operativi & Sicurezza',

		// Experience
		exp_title: 'Esperienza & Formazione',
		exp_downloadCV: 'Scarica CV',
		exp_work: 'Lavoro',
		exp_education: 'Formazione',

		// Projects
		proj_title: 'Progetti Personali',
		proj_showGrid: 'Vista Griglia',
		proj_showCarousel: 'Vista Carosello',
		proj_viewAllRepos: 'Tutti i Repository',
		proj_viewOnGithub: 'Vedi su GitHub',
		proj_download: 'Download',
		proj_watch: 'Guarda',
		proj_hackathon: 'Hackathon',
		proj_demo: 'Demo',
		proj_winner: '🏆 Vincitore',
		proj_hackathonWinner: '🏆 Vincitore Hackathon',
		proj_stars: 'stelle',

		// Contact
		contact_title: 'Contattami',
		contact_subtitle: 'Sono sempre aperto a nuove opportunità e collaborazioni!',

		// Footer
		footer_built: 'Fatto con ❤️ e tanto',
		footer_tagline: '🚀 Sempre al passo, sempre a costruire.',
		footer_nav: 'Navigazione',
		footer_social: 'Connettiti',

		// Back to top
		backToTop: 'Torna su',

		// Error page
		error_home: 'Torna alla Home',
		error_back: 'Indietro',
		error_boot1: '> Inizializzazione diagnostica di sistema...',
		error_boot2: '> Scansione tabella di routing............',
		error_boot5: '> Stack trace: OSCURATO',
		error_boot6: '> Suggerimento: Tornare alla base /',

		// Terminal
		term_helpTitle: 'Comandi disponibili:',
		term_helpHelp: 'Mostra questo messaggio',
		term_helpAbout: 'Chi è Giuseppe?',
		term_helpSkills: 'Lista competenze tech',
		term_helpContact: 'Info contatto',
		term_helpProjects: 'Progetti attuali',
		term_helpSocials: 'Link social',
		term_helpWhoami: 'Verifica identità',
		term_helpDate: 'Data corrente',
		term_helpEcho: 'Ripeti dopo di me',
		term_helpClear: 'Pulisci terminale',
		term_helpNeofetch: 'Info sistema',
		term_helpAnime: 'Anime casuale',
		term_helpMusic: 'Riproduci una canzone casuale',
		term_helpHidden: '...e forse qualcuno nascosto 👀',
		term_aboutName: '👋 Giuseppe Bellamacina',
		term_aboutStudent: 'Studente di Informatica @ Università di Catania',
		term_aboutPassion: 'Appassionato di AI/ML e Cybersecurity',
		term_aboutAlias: 'Conosciuto anche come: Ryan Gosling',
		term_sudo: 'Bel tentativo. Non hai accesso root qui 😏',
		term_rmrf: '🚨 BEL TENTATIVO! Questo portfolio è a prova di rm.',
		term_rmDenied: 'Permesso negato. Questo è un filesystem in sola lettura.',
		term_hackInit: '🔓 Inizializzazione sequenza di hack...',
		term_hackGranted: 'ACCESSO CONCESSO ✅',
		term_hackJk: 'Scherzo. Ma studio davvero cybersecurity 😎',
		term_starwarsQuote: '"Fare o non fare. Non c\'è provare." — Yoda',
		term_starwarsForce: 'Che la Forza sia con te! ⚔️',
		term_animeWatch: '🎌 Dovresti guardare:',
		term_musicAvailable: '🎵 Musica disponibile:',
		term_musicTip: 'Suggerimento: music -l per vedere tutte le canzoni',
		term_musicTipArtist:
			'Suggerimento: scrivi direttamente il nome di un artista per riprodurre la sua musica.',
		term_driveJacket: '🏎️ *indossa la giacca con lo scorpione*',
		term_driveStare: '*fissa intensamente*',
		term_driveQuote: '"Io guido." — The Driver',
		term_matrixChose: 'Hai scelto di visitare questo portfolio.',
		term_matrixIn: 'Sei già nella',
		term_matrixWake: 'Svegliati, Neo...',
		term_sbaddu: '🤌 SBADDU SUPECCHIU!',
		term_sbadduKnow: 'Chi sa, sa.',
		term_exitNo: 'Non si scappa da questo portfolio.',
		term_exitStuck: 'Sei bloccato qui per sempre. Divertiti! 🔒',
		term_cdHere: 'Sei già dove devi essere.',
		term_42answer: "La Risposta alla Domanda Fondamentale sulla Vita, l'Universo e Tutto Quanto.",
		term_hello: 'Ehi ciao! 👋 Benvenuto nel mio portfolio!',
		term_helpThemes: 'Cambia tema galassia',
		term_themesTitle: 'Temi disponibili:',
		term_themesUsage: 'Uso: digita il nome del tema per applicarlo.',
		term_themesTemp: 'Le modifiche sono temporanee — ricarica per ripristinare il tema stagionale.',
		term_themeApplied: 'Tema applicato:',
		term_themeDefault: 'Ripristinato tema stagionale predefinito.',
		term_notFound: 'comando non trovato:',
		term_typeHelp: 'Digita "help" per i comandi disponibili.',
		term_catNotFound: 'File o directory non trovato',
		term_nowPlaying: 'In riproduzione:',
		term_musicTipShort: 'Suggerimento: music -l per vedere tutte le canzoni'
	}
} as const;

export type Translations = (typeof translations)['en'];

export const t = derived(lang, ($lang) => translations[$lang]);
