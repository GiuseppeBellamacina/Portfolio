/**
 * Terminal command registry.
 * Each command is a pure handler over a CommandContext; the component owns
 * all UI state (history, input, scrolling) and exposes it via the context.
 */
import { get } from 'svelte/store';
import { t as tStore } from '$lib/i18n';
import type { Translation } from '$lib/i18n';
import { setSeason, resetSeason } from '$lib/stores/seasonStore';
import { type HistoryEntry, type Song, projectEntries, musicCatalog } from './terminalData';

export interface CommandContext {
	/** Command arguments (tokens after the command name) */
	args: string[];
	/** Current translations, captured at invocation time */
	tr: Translation;
	/** History length at invocation time (base index for animated output) */
	historyLength: number;
	/** Push one entry, wait for render, scroll to bottom */
	pushLine: (entry: HistoryEntry) => Promise<void>;
	/** Push entries sequentially with a delay between each */
	pushLines: (entries: HistoryEntry[], delayMs: number) => Promise<void>;
	/** Push an entry without render/scroll (for in-place animated entries) */
	pushRaw: (entry: HistoryEntry) => void;
	/** Replace a history entry in place, wait for render, scroll to bottom */
	setHistoryEntry: (index: number, entry: HistoryEntry) => Promise<void>;
	/** Empty the history */
	clearHistory: () => void;
	/** Lock/unlock the input while an async command runs */
	lockInput: (locked: boolean) => void;
	/** Focus the terminal input */
	focusInput: () => void;
}

export type CommandResult = HistoryEntry[] | 'async';

export type CommandHandler = (ctx: CommandContext) => CommandResult;

/* ── Internal helpers ── */

function delay(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

/* ── Smart pick: no repeats until all used, then prefer least shown ── */
const pickCounts = new Map<string, Map<number, number>>();

function smartPick<T>(pool: string, arr: T[]): T {
	if (!pickCounts.has(pool)) pickCounts.set(pool, new Map());
	const counts = pickCounts.get(pool)!;
	const minCount = Math.min(...arr.map((_, i) => counts.get(i) ?? 0));
	const candidates = arr
		.map((item, i) => ({ item, i, count: counts.get(i) ?? 0 }))
		.filter((c) => c.count === minCount);
	const chosen = candidates[Math.floor(Math.random() * candidates.length)];
	counts.set(chosen.i, (counts.get(chosen.i) ?? 0) + 1);
	return chosen.item;
}

function playRandomSong(ctx: CommandContext, artistKey?: string): 'async' {
	let song: Song;
	if (artistKey) {
		song = smartPick(`music:${artistKey}`, musicCatalog[artistKey]);
	} else {
		const allSongs = Object.entries(musicCatalog).flatMap(([, songs]) => songs);
		song = smartPick('music:all', allSongs);
	}
	ctx.lockInput(true);
	(async () => {
		const tr = get(tStore);
		const titleHtml = song.url
			? `<a href="${song.url}" target="_blank" rel="noopener noreferrer" class="song-title">${song.title}</a>`
			: `<span class="song-title">${song.title}</span>`;
		await ctx.pushLine({
			type: 'html',
			text: `🎵 ${tr.term_nowPlaying} ${titleHtml} — <span class="song-artist">${song.artist}</span>`
		});
		await delay(400);
		await ctx.pushLines(
			song.lyrics.map((t) => ({ type: 'output' as const, text: t })),
			380
		);
		await ctx.pushLine({ type: 'output', text: '' });
		await ctx.pushLine({
			type: 'html',
			text: `<span class="cmt">${tr.term_musicTipShort}</span>`
		});
		ctx.lockInput(false);
		ctx.focusInput();
	})();
	return 'async';
}

function clearGalaxyOverrides() {
	for (let i = 1; i <= 12; i++) {
		document.body.style.removeProperty(`--galaxy-c${i}`);
	}
}

/* ── Commands ── */

const helpCommand: CommandHandler = ({ tr }) => [
	{ type: 'output', text: tr.term_helpTitle },
	{ type: 'html', text: `<span class="cmd-name">help</span>          ${tr.term_helpHelp}` },
	{ type: 'html', text: `<span class="cmd-name">about</span>         ${tr.term_helpAbout}` },
	{ type: 'html', text: `<span class="cmd-name">skills</span>        ${tr.term_helpSkills}` },
	{ type: 'html', text: `<span class="cmd-name">contact</span>       ${tr.term_helpContact}` },
	{ type: 'html', text: `<span class="cmd-name">projects</span>      ${tr.term_helpProjects}` },
	{ type: 'html', text: `<span class="cmd-name">socials</span>       ${tr.term_helpSocials}` },
	{ type: 'html', text: `<span class="cmd-name">whoami</span>        ${tr.term_helpWhoami}` },
	{ type: 'html', text: `<span class="cmd-name">date</span>          ${tr.term_helpDate}` },
	{ type: 'html', text: `<span class="cmd-name">echo</span> [text]   ${tr.term_helpEcho}` },
	{ type: 'html', text: `<span class="cmd-name">clear</span>         ${tr.term_helpClear}` },
	{ type: 'html', text: `<span class="cmd-name">neofetch</span>      ${tr.term_helpNeofetch}` },
	{ type: 'html', text: `<span class="cmd-name">anime</span>         ${tr.term_helpAnime}` },
	{ type: 'html', text: `<span class="cmd-name">music</span> [-l]    ${tr.term_helpMusic}` },
	{ type: 'html', text: `<span class="cmd-name">themes</span>        ${tr.term_helpThemes}` },
	{ type: 'output', text: '' },
	{ type: 'output', text: tr.term_helpHidden }
];

const aboutCommand: CommandHandler = ({ tr }) => [
	{ type: 'output', text: tr.term_aboutName },
	{ type: 'output', text: tr.term_aboutStudent },
	{ type: 'output', text: tr.term_aboutPassion },
	{ type: 'output', text: tr.term_aboutAlias }
];

const skillsCommand: CommandHandler = () => [
	{
		type: 'html',
		text: '<span class="sk-cat">Languages:</span>  Python, TypeScript, C/C++, Java, SQL'
	},
	{
		type: 'html',
		text: '<span class="sk-cat">AI/ML:</span>      PyTorch, TensorFlow, Scikit-learn, Langchain'
	},
	{
		type: 'html',
		text: '<span class="sk-cat">Web:</span>        Svelte, React, Node.js, FastAPI'
	},
	{
		type: 'html',
		text: '<span class="sk-cat">DevOps:</span>     Docker, Git, Linux, Vercel, CI/CD'
	},
	{
		type: 'html',
		text: '<span class="sk-cat">Security:</span>   Pentesting, Network Analysis, CTFs'
	}
];

const contactCommand: CommandHandler = () => [
	{
		type: 'html',
		text: '📧 <a href="mailto:bellamacina50@gmail.com">bellamacina50@gmail.com</a>'
	},
	{
		type: 'html',
		text: '💼 <a href="https://www.linkedin.com/in/giuseppe-bellamacina-739b03204/" target="_blank" rel="noopener noreferrer">LinkedIn</a>'
	},
	{
		type: 'html',
		text: '🐙 <a href="https://github.com/GiuseppeBellamacina" target="_blank" rel="noopener noreferrer">GitHub</a>'
	}
];

const projectsCommand: CommandHandler = () => [...projectEntries];

const socialsCommand: CommandHandler = () => [
	{
		type: 'html',
		text: '💼 <a href="https://www.linkedin.com/in/giuseppe-bellamacina-739b03204/" target="_blank" rel="noopener noreferrer">LinkedIn</a>'
	},
	{
		type: 'html',
		text: '📸 <a href="https://www.instagram.com/giuseppe_bellamacina/" target="_blank" rel="noopener noreferrer">Instagram</a>'
	},
	{
		type: 'html',
		text: '🐙 <a href="https://github.com/GiuseppeBellamacina" target="_blank" rel="noopener noreferrer">GitHub</a>'
	}
];

const whoamiCommand: CommandHandler = () => [
	{ type: 'output', text: 'visitor@giuseppe-portfolio' }
];

const dateCommand: CommandHandler = () => [{ type: 'output', text: new Date().toLocaleString() }];

const echoCommand: CommandHandler = ({ args }) => [{ type: 'output', text: args.join(' ') || '' }];

const clearCommand: CommandHandler = (ctx) => {
	ctx.clearHistory();
	return [];
};

const neofetchCommand: CommandHandler = () => [
	{
		type: 'ascii',
		text: `       ⠀⠀⠀⠀⣠⣤⣤⣤⣤⣤⣄⡀⠀⠀⠀⠀⠀      <span class="nf-label">visitor</span>@<span class="nf-value">giuseppe-portfolio</span>`
	},
	{ type: 'ascii', text: `       ⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀      ──────────────────────────` },
	{
		type: 'ascii',
		text: `       ⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠀⠀      <span class="nf-label">OS:</span>     Portfolio v2.0`
	},
	{
		type: 'ascii',
		text: `       ⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧       <span class="nf-label">Host:</span>   Vercel Edge`
	},
	{
		type: 'ascii',
		text: `       ⣾⣿⡿⠛⠉⠁⠀⠈⠉⠛⢿⣿⣿⣿⣿⣿⡇      <span class="nf-label">Kernel:</span> SvelteKit 2.x`
	},
	{
		type: 'ascii',
		text: `       ⣿⣿⠁⠀⠀⢀⣀⡀⠀⠀⠈⣿⣿⣿⣿⣿⡇      <span class="nf-label">Shell:</span>  TypeScript 5.x`
	},
	{
		type: 'ascii',
		text: `       ⢿⣿⣦⡀⠀⠈⠉⠁⠀⢀⣴⣿⣿⣿⣿⡿⠁      <span class="nf-label">Theme:</span>  Cyberpunk Neon`
	},
	{
		type: 'ascii',
		text: `       ⠘⢿⣿⣿⣷⣶⣶⣶⣾⣿⣿⣿⣿⡿⠟⠁⠀      <span class="nf-label">Icons:</span>  Font Awesome 6`
	},
	{
		type: 'ascii',
		text: `       ⠀⠀⠙⠿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠁⠀⠀⠀      <span class="nf-label">CPU:</span>    Bun Runtime`
	},
	{
		type: 'ascii',
		text: `       ⠀⠀⠀⠀⠀⠉⠛⠛⠛⠉⠀⠀⠀⠀⠀⠀⠀      <span class="nf-label">GPU:</span>    Canvas 2D`
	}
];

/* ── Easter eggs ── */

const sudoCommand: CommandHandler = ({ tr }) => [{ type: 'error', text: tr.term_sudo }];

const rmCommand: CommandHandler = ({ args, tr }) => {
	if (args.includes('-rf') || args.includes('-rf/')) {
		return [{ type: 'error', text: tr.term_rmrf }];
	}
	return [{ type: 'error', text: tr.term_rmDenied }];
};

const hackCommand: CommandHandler = (ctx) => {
	ctx.lockInput(true);
	(async () => {
		const tr = get(tStore);
		await ctx.pushLine({ type: 'output', text: tr.term_hackInit });
		await delay(500);

		/* animated progress bar */
		const barLen = 20;
		const barIdx = ctx.historyLength;
		ctx.pushRaw({ type: 'output', text: '' });
		for (let i = 1; i <= barLen; i++) {
			const pct = Math.round((i / barLen) * 100);
			await ctx.setHistoryEntry(barIdx, {
				type: 'output',
				text: '█'.repeat(i) + '░'.repeat(barLen - i) + ` ${pct}%`
			});
			await delay(80);
		}

		await delay(300);
		await ctx.pushLine({ type: 'output', text: '' });
		await ctx.pushLine({ type: 'output', text: tr.term_hackGranted });
		await delay(600);
		await ctx.pushLine({ type: 'output', text: '' });
		await ctx.pushLine({ type: 'output', text: tr.term_hackJk });
		ctx.lockInput(false);
		ctx.focusInput();
	})();
	return 'async';
};

const starwarsCommand: CommandHandler = ({ tr }) => [
	{ type: 'ascii', text: '⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⣶⣶⣶⣤⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀' },
	{ type: 'output', text: tr.term_starwarsQuote },
	{ type: 'output', text: tr.term_starwarsForce }
];

const animeCommand: CommandHandler = ({ tr }) => {
	const animeList = [
		'Frieren',
		'DanDaDan',
		'Chainsaw Man',
		'Steins;Gate',
		'Initial D',
		'Cowboy Bebop',
		'Spy x Family',
		'To Be Hero X',
		'My Hero Academia',
		'Gurren Lagann',
		'FullMetal Alchemist',
		'Attack on Titan',
		'Cyberpunk: Edgerunners',
		'Lupin III',
		'Evangelion',
		'Hellsing',
		'Death Note',
		'Trigun',
		'Violet Evergarden',
		'Apothecary Diaries',
		'Detective Conan',
		'Sakamoto Days',
		'Call of the Night'
	];
	return [{ type: 'output', text: `${tr.term_animeWatch} ${smartPick('anime', animeList)}` }];
};

const musicCommand: CommandHandler = (ctx) => {
	const { args, tr } = ctx;
	if (args[0] === '-l' || args[0] === '-ls') {
		const lines: HistoryEntry[] = [{ type: 'output', text: tr.term_musicAvailable }];
		for (const [key, songs] of Object.entries(musicCatalog)) {
			const unique = [...new Set(songs.map((s) => s.title))];
			lines.push({
				type: 'html',
				text: `<span class="sk-cat">${key}</span>  ${unique.map((t) => `"${t}"`).join(', ')}`
			});
		}
		lines.push({ type: 'output', text: '' });
		lines.push({ type: 'output', text: tr.term_musicTipArtist });
		return lines;
	}
	return playRandomSong(ctx);
};

const daftpunkCommand: CommandHandler = (ctx) => playRandomSong(ctx, 'daftpunk');
const tameimpalaCommand: CommandHandler = (ctx) => playRandomSong(ctx, 'tameimpala');
const kavinskyCommand: CommandHandler = (ctx) => playRandomSong(ctx, 'kavinsky');

const driveCommand: CommandHandler = ({ tr }) => [
	{ type: 'output', text: tr.term_driveJacket },
	{ type: 'output', text: tr.term_driveStare },
	{ type: 'output', text: tr.term_driveQuote },
	{ type: 'output', text: '' },
	{
		type: 'html',
		text: '<span style="color:#ec469c;font-weight:bold;font-style:italic">A real human being... and a real hero.</span>'
	}
];

const matrixCommand: CommandHandler = ({ tr }) => [
	{
		type: 'html',
		text: '💊 <span style="color:#ff4444;font-weight:bold">Red pill</span> or <span style="color:#4488ff;font-weight:bold">blue pill</span>?'
	},
	{ type: 'output', text: tr.term_matrixChose },
	{
		type: 'html',
		text: `${tr.term_matrixIn} <span style="color:#00ff41;font-weight:bold">Matrix</span>.`
	},
	{ type: 'output', text: tr.term_matrixWake }
];

const sbadduCommand: CommandHandler = ({ tr }) => [
	{ type: 'output', text: tr.term_sbaddu },
	{ type: 'output', text: tr.term_sbadduKnow }
];

const exitCommand: CommandHandler = ({ tr }) => [
	{ type: 'output', text: tr.term_exitNo },
	{ type: 'output', text: tr.term_exitStuck }
];

const catCommand: CommandHandler = ({ args, tr }) => {
	if (args[0] === 'survive.sh') {
		return [
			{ type: 'output', text: '#!/bin/bash' },
			{ type: 'output', text: 'while true; do' },
			{ type: 'output', text: '  echo "still alive..."' },
			{ type: 'output', text: '  sleep $((RANDOM % 86400))' },
			{ type: 'output', text: '  cuttigghiare -v' },
			{ type: 'output', text: 'done' }
		];
	}
	return [{ type: 'error', text: `cat: ${args[0] || ''}: ${tr.term_catNotFound}` }];
};

const pwdCommand: CommandHandler = () => [
	{ type: 'output', text: '/home/visitor/giuseppe-portfolio' }
];

const cdCommand: CommandHandler = ({ tr }) => [{ type: 'output', text: tr.term_cdHere }];

const pingCommand: CommandHandler = ({ args }) => [
	{ type: 'output', text: `PING ${args[0] || 'localhost'}: 64 bytes, time=0.42ms` },
	{ type: 'output', text: '--- pong ---' }
];

const cowsayCommand: CommandHandler = ({ args }) => {
	const msg = args.join(' ') || 'Moo!';
	const border = '-'.repeat(msg.length + 2);
	return [
		{ type: 'output', text: ` ${border}` },
		{ type: 'output', text: `< ${msg} >` },
		{ type: 'output', text: ` ${border}` },
		{ type: 'output', text: '        \\   ^__^' },
		{ type: 'output', text: '         \\  (oo)\\_______' },
		{ type: 'output', text: '            (__)\\       )\\/\\' },
		{ type: 'output', text: '                ||----w |' },
		{ type: 'output', text: '                ||     ||' }
	];
};

const fortyTwoCommand: CommandHandler = ({ tr }) => [{ type: 'output', text: tr.term_42answer }];

const helloCommand: CommandHandler = ({ tr }) => [{ type: 'output', text: tr.term_hello }];

/* ── Theme commands ── */

const themesCommand: CommandHandler = ({ tr }) => [
	{ type: 'output', text: tr.term_themesTitle },
	{
		type: 'html',
		text: '<span class="cmd-name">default</span>                🌌 Violet/Indigo'
	},
	{
		type: 'html',
		text: '<span class="cmd-name">rainbow</span> <span class="cmt">(arcobaleno)</span>   🌈 Rainbow'
	},
	{
		type: 'html',
		text: '<span class="cmd-name">christmas</span> <span class="cmt">(natale)</span>     🎄 Christmas Red/Gold'
	},
	{
		type: 'html',
		text: '<span class="cmd-name">summer</span> <span class="cmt">(estate)</span>        ☀️ Summer Cyan/Gold'
	},
	{
		type: 'html',
		text: '<span class="cmd-name">newyear</span> <span class="cmt">(capodanno)</span>    🎆 New Year Gold/Blue'
	},
	{ type: 'output', text: '' },
	{ type: 'output', text: tr.term_themesUsage },
	{
		type: 'html',
		text: `<span class="cmt">${tr.term_themesTemp}</span>`
	}
];

const rainbowCommand: CommandHandler = ({ tr }) => {
	// Apply rainbow CSS variables directly as inline overrides
	const rainbowVars: Record<string, string> = {
		'--galaxy-c1': '#ffffff',
		'--galaxy-c2': '#ffcccc',
		'--galaxy-c3': '#ff4040',
		'--galaxy-c4': '#ff8c00',
		'--galaxy-c5': '#ffd700',
		'--galaxy-c6': '#40ff40',
		'--galaxy-c7': '#00e5ff',
		'--galaxy-c8': '#4080ff',
		'--galaxy-c9': '#6040ff',
		'--galaxy-c10': '#a020f0',
		'--galaxy-c11': '#ff40ff',
		'--galaxy-c12': '#cecece'
	};
	for (const [k, v] of Object.entries(rainbowVars)) {
		document.body.style.setProperty(k, v);
	}
	return [
		{
			type: 'html',
			text: `🌈 ${tr.term_themeApplied} <span class="cmd-name">Rainbow</span>`
		},
		{
			type: 'html',
			text: `<span class="cmt">${tr.term_themesTemp}</span>`
		}
	];
};

const christmasCommand: CommandHandler = ({ tr }) => {
	clearGalaxyOverrides();
	setSeason('snow');
	return [
		{
			type: 'html',
			text: `🎄 ${tr.term_themeApplied} <span class="cmd-name">Christmas</span>`
		},
		{
			type: 'html',
			text: `<span class="cmt">${tr.term_themesTemp}</span>`
		}
	];
};

const summerCommand: CommandHandler = ({ tr }) => {
	clearGalaxyOverrides();
	setSeason('summer');
	return [
		{
			type: 'html',
			text: `☀️ ${tr.term_themeApplied} <span class="cmd-name">Summer</span>`
		},
		{
			type: 'html',
			text: `<span class="cmt">${tr.term_themesTemp}</span>`
		}
	];
};

const newyearCommand: CommandHandler = ({ tr }) => {
	clearGalaxyOverrides();
	setSeason('newyear');
	return [
		{
			type: 'html',
			text: `🎆 ${tr.term_themeApplied} <span class="cmd-name">New Year</span>`
		},
		{
			type: 'html',
			text: `<span class="cmt">${tr.term_themesTemp}</span>`
		}
	];
};

const defaultCommand: CommandHandler = ({ tr }) => {
	clearGalaxyOverrides();
	resetSeason();
	return [
		{
			type: 'html',
			text: `🌌 ${tr.term_themeDefault}`
		}
	];
};

/* ── Registry (aliases map to the same handler) ── */

export const commands: Record<string, CommandHandler> = {
	help: helpCommand,
	about: aboutCommand,
	skills: skillsCommand,
	contact: contactCommand,
	projects: projectsCommand,
	ls: projectsCommand,
	socials: socialsCommand,
	whoami: whoamiCommand,
	date: dateCommand,
	echo: echoCommand,
	clear: clearCommand,
	neofetch: neofetchCommand,
	sudo: sudoCommand,
	rm: rmCommand,
	hack: hackCommand,
	starwars: starwarsCommand,
	star: starwarsCommand,
	anime: animeCommand,
	music: musicCommand,
	musica: musicCommand,
	daftpunk: daftpunkCommand,
	tameimpala: tameimpalaCommand,
	kavinsky: kavinskyCommand,
	drive: driveCommand,
	gosling: driveCommand,
	ryan: driveCommand,
	matrix: matrixCommand,
	sbaddu: sbadduCommand,
	supecchiu: sbadduCommand,
	exit: exitCommand,
	quit: exitCommand,
	cat: catCommand,
	pwd: pwdCommand,
	cd: cdCommand,
	ping: pingCommand,
	cowsay: cowsayCommand,
	'42': fortyTwoCommand,
	hello: helloCommand,
	hi: helloCommand,
	ciao: helloCommand,
	themes: themesCommand,
	theme: themesCommand,
	temi: themesCommand,
	rainbow: rainbowCommand,
	arcobaleno: rainbowCommand,
	christmas: christmasCommand,
	natale: christmasCommand,
	summer: summerCommand,
	estate: summerCommand,
	newyear: newyearCommand,
	capodanno: newyearCommand,
	default: defaultCommand
};
