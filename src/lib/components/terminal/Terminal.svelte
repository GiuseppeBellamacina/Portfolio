<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { get } from 'svelte/store';
	import { t as tStore, lang } from '$lib/i18n';
	import type { Translations } from '$lib/i18n';
	import './terminal.css';
	import { setSeason, resetSeason } from '$lib/stores/seasonStore';
	import {
		type HistoryEntry,
		type Song,
		projectEntries,
		bootLines,
		getBootHelpText,
		completableCommands,
		musicCatalog
	} from './terminalData';

	let inputValue = $state('');
	let history = $state<HistoryEntry[]>([]);
	let terminalBody: HTMLElement;
	let inputEl: HTMLInputElement;
	let commandHistory: string[] = [];
	let historyIndex = -1;

	let inputLocked = $state(false);

	/* ── Helpers for sequential output ── */
	function delay(ms: number): Promise<void> {
		return new Promise((r) => setTimeout(r, ms));
	}

	function randomPick<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
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

	async function pushLine(entry: HistoryEntry) {
		history.push(entry);
		await tick();
		if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
	}

	async function pushLines(entries: HistoryEntry[], delayMs: number) {
		for (const entry of entries) {
			await pushLine(entry);
			await delay(delayMs);
		}
	}

	function playRandomSong(artistKey?: string) {
		let song: Song;
		if (artistKey) {
			song = smartPick(`music:${artistKey}`, musicCatalog[artistKey]);
		} else {
			const allSongs = Object.entries(musicCatalog).flatMap(([, songs]) => songs);
			song = smartPick('music:all', allSongs);
		}
		inputLocked = true;
		(async () => {
			const tr = get(tStore);
			const titleHtml = song.url
				? `<a href="${song.url}" target="_blank" rel="noopener noreferrer" class="song-title">${song.title}</a>`
				: `<span class="song-title">${song.title}</span>`;
			await pushLine({
				type: 'html',
				text: `🎵 ${tr.term_nowPlaying} ${titleHtml} — <span class="song-artist">${song.artist}</span>`
			});
			await delay(400);
			await pushLines(
				song.lyrics.map((t) => ({ type: 'output' as const, text: t })),
				380
			);
			await pushLine({ type: 'output', text: '' });
			await pushLine({
				type: 'html',
				text: `<span class="cmt">${tr.term_musicTipShort}</span>`
			});
			inputLocked = false;
			inputEl?.focus();
		})();
	}

	/* ── Command registry ── */
	function executeCommand(raw: string): HistoryEntry[] | 'async' {
		const trimmed = raw.trim();
		if (!trimmed) return [];

		const parts = trimmed.split(/\s+/);
		const cmd = parts[0].toLowerCase();
		const args = parts.slice(1);
		const tr = get(tStore);

		switch (cmd) {
			case 'help':
				return [
					{ type: 'output', text: tr.term_helpTitle },
					{ type: 'html', text: `<span class="cmd-name">help</span>          ${tr.term_helpHelp}` },
					{
						type: 'html',
						text: `<span class="cmd-name">about</span>         ${tr.term_helpAbout}`
					},
					{
						type: 'html',
						text: `<span class="cmd-name">skills</span>        ${tr.term_helpSkills}`
					},
					{
						type: 'html',
						text: `<span class="cmd-name">contact</span>       ${tr.term_helpContact}`
					},
					{
						type: 'html',
						text: `<span class="cmd-name">projects</span>      ${tr.term_helpProjects}`
					},
					{
						type: 'html',
						text: `<span class="cmd-name">socials</span>       ${tr.term_helpSocials}`
					},
					{
						type: 'html',
						text: `<span class="cmd-name">whoami</span>        ${tr.term_helpWhoami}`
					},
					{ type: 'html', text: `<span class="cmd-name">date</span>          ${tr.term_helpDate}` },
					{ type: 'html', text: `<span class="cmd-name">echo</span> [text]   ${tr.term_helpEcho}` },
					{
						type: 'html',
						text: `<span class="cmd-name">clear</span>         ${tr.term_helpClear}`
					},
					{
						type: 'html',
						text: `<span class="cmd-name">neofetch</span>      ${tr.term_helpNeofetch}`
					},
					{
						type: 'html',
						text: `<span class="cmd-name">anime</span>         ${tr.term_helpAnime}`
					},
					{
						type: 'html',
						text: `<span class="cmd-name">music</span> [-l]    ${tr.term_helpMusic}`
					},
					{
						type: 'html',
						text: `<span class="cmd-name">themes</span>        ${tr.term_helpThemes}`
					},
					{ type: 'output', text: '' },
					{ type: 'output', text: tr.term_helpHidden }
				];

			case 'about':
				return [
					{ type: 'output', text: tr.term_aboutName },
					{ type: 'output', text: tr.term_aboutStudent },
					{ type: 'output', text: tr.term_aboutPassion },
					{ type: 'output', text: tr.term_aboutAlias }
				];

			case 'skills':
				return [
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

			case 'contact':
				return [
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

			case 'projects':
			case 'ls':
				return [...projectEntries];

			case 'socials':
				return [
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

			case 'whoami':
				return [{ type: 'output', text: 'visitor@giuseppe-portfolio' }];

			case 'date':
				return [{ type: 'output', text: new Date().toLocaleString() }];

			case 'echo':
				return [{ type: 'output', text: args.join(' ') || '' }];

			case 'clear':
				history = [];
				return [];

			case 'neofetch':
				return [
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

			// ── Easter eggs ──

			case 'sudo':
				return [{ type: 'error', text: tr.term_sudo }];

			case 'rm':
				if (args.includes('-rf') || args.includes('-rf/')) {
					return [{ type: 'error', text: tr.term_rmrf }];
				}
				return [{ type: 'error', text: tr.term_rmDenied }];

			case 'hack': {
				inputLocked = true;
				(async () => {
					const tr2 = get(tStore);
					await pushLine({ type: 'output', text: tr2.term_hackInit });
					await delay(500);

					/* animated progress bar */
					const barLen = 20;
					const barIdx = history.length;
					history.push({ type: 'output', text: '' });
					for (let i = 1; i <= barLen; i++) {
						const pct = Math.round((i / barLen) * 100);
						history[barIdx] = {
							type: 'output',
							text: '█'.repeat(i) + '░'.repeat(barLen - i) + ` ${pct}%`
						};
						await tick();
						if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
						await delay(80);
					}

					await delay(300);
					await pushLine({ type: 'output', text: '' });
					await pushLine({ type: 'output', text: tr2.term_hackGranted });
					await delay(600);
					await pushLine({ type: 'output', text: '' });
					await pushLine({ type: 'output', text: tr2.term_hackJk });
					inputLocked = false;
					inputEl?.focus();
				})();
				return 'async';
			}

			case 'starwars':
			case 'star':
				return [
					{ type: 'ascii', text: '⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⣶⣶⣶⣤⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀' },
					{ type: 'output', text: tr.term_starwarsQuote },
					{ type: 'output', text: tr.term_starwarsForce }
				];

			case 'anime': {
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
			}

			case 'music':
			case 'musica':
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
					lines.push({
						type: 'output',
						text: tr.term_musicTipArtist
					});
					return lines;
				}
				playRandomSong();
				return 'async';

			case 'daftpunk':
				playRandomSong('daftpunk');
				return 'async';

			case 'tameimpala':
				playRandomSong('tameimpala');
				return 'async';

			case 'kavinsky':
				playRandomSong('kavinsky');
				return 'async';

			case 'drive':
			case 'gosling':
			case 'ryan':
				return [
					{ type: 'output', text: tr.term_driveJacket },
					{ type: 'output', text: tr.term_driveStare },
					{ type: 'output', text: tr.term_driveQuote },
					{ type: 'output', text: '' },
					{
						type: 'html',
						text: '<span style="color:#ec469c;font-weight:bold;font-style:italic">A real human being... and a real hero.</span>'
					}
				];

			case 'matrix':
				return [
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

			case 'sbaddu':
			case 'supecchiu':
				return [
					{ type: 'output', text: tr.term_sbaddu },
					{ type: 'output', text: tr.term_sbadduKnow }
				];

			case 'exit':
			case 'quit':
				return [
					{ type: 'output', text: tr.term_exitNo },
					{ type: 'output', text: tr.term_exitStuck }
				];

			case 'cat':
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

			case 'pwd':
				return [{ type: 'output', text: '/home/visitor/giuseppe-portfolio' }];

			case 'cd':
				return [{ type: 'output', text: tr.term_cdHere }];

			case 'ping':
				return [
					{ type: 'output', text: `PING ${args[0] || 'localhost'}: 64 bytes, time=0.42ms` },
					{ type: 'output', text: '--- pong ---' }
				];

			case 'cowsay':
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

			case '42':
				return [
					{
						type: 'output',
						text: tr.term_42answer
					}
				];

			case 'hello':
			case 'hi':
			case 'ciao':
				return [{ type: 'output', text: tr.term_hello }];

			case 'themes':
			case 'theme':
			case 'temi':
				return [
					{ type: 'output', text: tr.term_themesTitle },
					{
						type: 'html',
						text: '<span class="cmd-name">default</span>                   🌌 Violet/Indigo'
					},
					{
						type: 'html',
						text: '<span class="cmd-name">rainbow</span> <span class="cmt">(arcobaleno)</span>    🌈 Rainbow'
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

			case 'rainbow':
			case 'arcobaleno': {
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
			}

			case 'christmas':
			case 'natale':
				// Clear any inline rainbow overrides, then set season
				for (let i = 1; i <= 12; i++) {
					document.body.style.removeProperty(`--galaxy-c${i}`);
				}
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

			case 'summer':
			case 'estate':
				for (let i = 1; i <= 12; i++) {
					document.body.style.removeProperty(`--galaxy-c${i}`);
				}
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

			case 'newyear':
			case 'capodanno':
				for (let i = 1; i <= 12; i++) {
					document.body.style.removeProperty(`--galaxy-c${i}`);
				}
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

			case 'default':
				for (let i = 1; i <= 12; i++) {
					document.body.style.removeProperty(`--galaxy-c${i}`);
				}
				resetSeason();
				return [
					{
						type: 'html',
						text: `🌌 ${tr.term_themeDefault}`
					}
				];

			default:
				return [{ type: 'error', text: `${tr.term_notFound} ${cmd}. ${tr.term_typeHelp}` }];
		}
	}

	async function handleSubmit() {
		if (inputLocked) return;
		const raw = inputValue;
		inputValue = '';
		historyIndex = -1;

		if (raw.trim()) {
			commandHistory = [raw.trim(), ...commandHistory];
		}

		history.push({ type: 'input', text: raw });

		const result = executeCommand(raw);
		if (result === 'async') {
			/* async commands push their own lines via pushLine/pushLines */
			return;
		}
		for (const entry of result) {
			history.push(entry);
		}

		await tick();
		if (terminalBody) {
			terminalBody.scrollTop = terminalBody.scrollHeight;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Tab') {
			e.preventDefault();
			const val = inputValue.trimStart().toLowerCase();
			if (!val) return;
			const matches = completableCommands.filter((c) => c.startsWith(val));
			if (matches.length === 1) {
				inputValue = matches[0];
			} else if (matches.length > 1) {
				/* complete common prefix */
				let prefix = matches[0];
				for (const m of matches) {
					while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1);
				}
				if (prefix.length > val.length) {
					inputValue = prefix;
				} else {
					/* show candidates */
					history.push({ type: 'output', text: matches.join('  ') });
					tick().then(() => {
						if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
					});
				}
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (historyIndex < commandHistory.length - 1) {
				historyIndex++;
				inputValue = commandHistory[historyIndex];
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (historyIndex > 0) {
				historyIndex--;
				inputValue = commandHistory[historyIndex];
			} else {
				historyIndex = -1;
				inputValue = '';
			}
		}
	}

	function focusInput() {
		inputEl?.focus();
	}

	function handleWheel(e: WheelEvent) {
		const el = terminalBody;
		if (!el) return;
		const atTop = el.scrollTop <= 0 && e.deltaY < 0;
		const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
		if (!atTop && !atBottom) {
			e.stopPropagation();
		}
	}

	onMount(() => {
		const currentLang = get(lang);
		history = [...bootLines, { type: 'output', text: getBootHelpText(currentLang) }];
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="terminal" onclick={focusInput}>
	<div class="terminal-bar">
		<span class="dot red"></span>
		<span class="dot yellow"></span>
		<span class="dot green"></span>
		<span class="bar-title">giuseppe@portfolio:~</span>
	</div>
	<div class="terminal-body" bind:this={terminalBody} onwheel={handleWheel}>
		{#each history as entry}
			{#if entry.type === 'input'}
				<div class="line">
					<span class="prompt">$</span>
					<span class="cmd">{entry.text}</span>
				</div>
			{:else if entry.type === 'output'}
				<div class="line output">{entry.text}</div>
			{:else if entry.type === 'error'}
				<div class="line err">{entry.text}</div>
			{:else if entry.type === 'html' || entry.type === 'ascii'}
				<div class="line rich">{@html entry.text}</div>
			{/if}
		{/each}

		<!-- Active input line -->
		<form
			class="input-line"
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
		>
			<span class="prompt">$</span>
			<input
				bind:this={inputEl}
				bind:value={inputValue}
				onkeydown={handleKeydown}
				type="text"
				class="term-input"
				spellcheck="false"
				autocomplete="off"
				autocapitalize="off"
				disabled={inputLocked}
			/>
		</form>
	</div>
</div>
