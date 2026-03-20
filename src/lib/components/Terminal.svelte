<script lang="ts">
	import { onMount, tick } from 'svelte';

	interface HistoryEntry {
		type: 'input' | 'output' | 'html' | 'error' | 'ascii';
		text: string;
	}

	let inputValue = $state('');
	let history = $state<HistoryEntry[]>([]);
	let terminalBody: HTMLElement;
	let inputEl: HTMLInputElement;
	let commandHistory: string[] = [];
	let historyIndex = -1;

	/* ── Boot sequence ── */
	const projectEntries: HistoryEntry[] = [
		{
			type: 'html',
			text: '<span class="file">image-enhancement/</span>  <span class="cmt"># <a href="https://github.com/GiuseppeBellamacina/Image-Enhancement" target="_blank" rel="noopener noreferrer">Advanced image quality improvement</a></span>'
		},
		{
			type: 'html',
			text: '<span class="file">warehouse-swarm/</span>    <span class="cmt"># <a href="https://github.com/GiuseppeBellamacina/Warehouse-Swarm-Intelligence-System" target="_blank" rel="noopener noreferrer">Multi-agent warehouse optimization</a></span>'
		},
		{
			type: 'html',
			text: '<span class="file">trip-planner/</span>        <span class="cmt"># PWA for trip planning</span>'
		},
		{
			type: 'html',
			text: '<span class="file">world-domination-ai/</span> <span class="cmt"># I\'m joking... maybe</span>'
		},
		{
			type: 'html',
			text: '<span class="file">survive.sh</span>           <span class="cmt"># chmod +x survive.sh && ./survive.sh</span>'
		}
	];

	const bootLines: HistoryEntry[] = [
		{ type: 'output', text: 'giuseppe@portfolio:~$ ls projects/' },
		...projectEntries,
		{ type: 'output', text: '' },
		{ type: 'output', text: 'Type "help" for available commands.' }
	];

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

	/* ── Music catalog ── */
	interface Song {
		title: string;
		artist: string;
		lyrics: string[];
	}

	const musicCatalog: Record<string, Song[]> = {
		daftpunk: [
			{
				title: 'Around the World',
				artist: 'Daft Punk',
				lyrics: [
					'Around the world, around the world',
					'Around the world, around the world',
					'Around the world, around the world',
					'Around the world, around the world',
					'Around the world, around the world...'
				]
			},
			{
				title: 'Something About Us',
				artist: 'Daft Punk',
				lyrics: [
					'It might not be the right time',
					'I might not be the right one',
					"But there's something about us I want to say",
					"'Cause there's something between us anyway"
				]
			},
			{
				title: 'Harder, Better, Faster, Stronger',
				artist: 'Daft Punk',
				lyrics: [
					'Work it harder, make it better',
					'Do it faster, makes us stronger',
					'More than ever, hour after hour',
					'Work is never over'
				]
			}
		],
		tameimpala: [
			{
				title: 'Let It Happen',
				artist: 'Tame Impala',
				lyrics: [
					"It's always around me, all this noise",
					'But not really as loud as the voice saying',
					'Let it happen, let it happen',
					"It's gonna feel so good",
					'Just let it happen, let it happen'
				]
			},
			{
				title: 'Let It Happen',
				artist: 'Tame Impala',
				lyrics: [
					"Baby, now I'm ready, moving on",
					'Oh, but maybe I was ready all along',
					"Oh, I'm ready for the moment and the sound",
					'Oh, but maybe I was ready all along',
					"Oh, baby, now I'm ready, moving on"
				]
			},
			{
				title: 'Let It Happen',
				artist: 'Tame Impala',
				lyrics: [
					'I cannot vanish, you will not scare me',
					'Try to get through it, try to push through it',
					'You were not thinking that I will not do it',
					"They be lovin\u2032 someone and I'm another story",
					'Take the next ticket, get the next train',
					"Why would I do it? Anyone'd think that"
				]
			},
			{
				title: 'Dracula',
				artist: 'Tame Impala',
				lyrics: [
					'The morning light is turning blue, the feeling is bizarre',
					"The night is almost over, I still don't know where you are",
					'The shadows, yeah, they keep me pretty like a movie star',
					'Daylight makes me feel like Dracula'
				]
			},
			{
				title: 'The Less I Know the Better',
				artist: 'Tame Impala',
				lyrics: [
					"I was doin' fine without you",
					"'Til I saw your face, now I can't erase",
					"Givin' in to all his bullshit",
					'Is this what you want? Is this who you are?',
					"I was doin' fine without you",
					"'Til I saw your eyes turn away from mine",
					'Oh, sweet darling, where he wants you',
					'Said, "Come on Superman, say your stupid line"'
				]
			},
			{
				title: 'Eventually',
				artist: 'Tame Impala',
				lyrics: [
					"But I know that I'll be happier",
					'And I know you will too',
					"Said, I know that I'll be happier",
					'And I know you will too'
				]
			}
		],
		kavinsky: [
			{
				title: 'Nightcall',
				artist: 'Kavinsky',
				lyrics: [
					"There's something inside you",
					"It's hard to explain",
					"They're talking about you, boy",
					"But you're still the same"
				]
			}
		]
	};

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
			await pushLine({
				type: 'html',
				text: `🎵 Now playing: <span class="song-title">${song.title}</span> — <span class="song-artist">${song.artist}</span>`
			});
			await delay(400);
			await pushLines(
				song.lyrics.map((t) => ({ type: 'output' as const, text: t })),
				380
			);
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

		switch (cmd) {
			case 'help':
				return [
					{ type: 'output', text: 'Available commands:' },
					{ type: 'html', text: '<span class="cmd-name">help</span>          Show this message' },
					{ type: 'html', text: '<span class="cmd-name">about</span>         Who is Giuseppe?' },
					{ type: 'html', text: '<span class="cmd-name">skills</span>        List tech skills' },
					{ type: 'html', text: '<span class="cmd-name">contact</span>       Contact info' },
					{ type: 'html', text: '<span class="cmd-name">projects</span>      Current projects' },
					{ type: 'html', text: '<span class="cmd-name">socials</span>       Social links' },
					{ type: 'html', text: '<span class="cmd-name">whoami</span>        Identity check' },
					{ type: 'html', text: '<span class="cmd-name">date</span>          Current date' },
					{ type: 'html', text: '<span class="cmd-name">echo</span> [text]   Repeat after me' },
					{ type: 'html', text: '<span class="cmd-name">clear</span>         Clear terminal' },
					{ type: 'html', text: '<span class="cmd-name">neofetch</span>      System info' },
					{ type: 'output', text: '' },
					{ type: 'output', text: '...and maybe some hidden ones 👀' }
				];

			case 'about':
				return [
					{ type: 'output', text: '👋 Giuseppe Bellamacina' },
					{ type: 'output', text: 'CS Student @ University of Catania' },
					{ type: 'output', text: 'Passionate about AI/ML & Cybersecurity' },
					{ type: 'output', text: 'Also known as: Ryan Gosling' }
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
				return [{ type: 'error', text: "Nice try. You don't have root access here 😏" }];

			case 'rm':
				if (args.includes('-rf') || args.includes('-rf/')) {
					return [{ type: 'error', text: '🚨 NICE TRY! This portfolio is rm-proof.' }];
				}
				return [{ type: 'error', text: 'Permission denied. This is a read-only filesystem.' }];

			case 'hack': {
				inputLocked = true;
				(async () => {
					await pushLine({ type: 'output', text: '🔓 Initializing hack sequence...' });
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
					await pushLine({ type: 'output', text: 'ACCESS GRANTED ✅' });
					await delay(600);
					await pushLine({ type: 'output', text: '' });
					await pushLine({ type: 'output', text: 'Just kidding. But I do study cybersecurity 😎' });
					inputLocked = false;
					inputEl?.focus();
				})();
				return 'async';
			}

			case 'starwars':
			case 'star':
				return [
					{ type: 'ascii', text: '⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⣶⣶⣶⣤⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀' },
					{ type: 'output', text: '"Do or do not. There is no try." — Yoda' },
					{ type: 'output', text: 'May the Force be with you! ⚔️' }
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
				return [{ type: 'output', text: `🎌 You should watch: ${smartPick('anime', animeList)}` }];
			}

			case 'music':
			case 'musica':
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
					{ type: 'output', text: '🏎️ *puts on scorpion jacket*' },
					{ type: 'output', text: '*stares intensely*' },
					{ type: 'output', text: '"I drive." — The Driver' },
					{ type: 'output', text: '' },
					{ type: 'output', text: 'A real human being... and a real hero.' }
				];

			case 'matrix':
				return [
					{
						type: 'html',
						text: '💊 <span style="color:#ff4444;font-weight:bold">Red pill</span> or <span style="color:#4488ff;font-weight:bold">blue pill</span>?'
					},
					{ type: 'output', text: 'You chose to visit this portfolio.' },
					{
						type: 'html',
						text: 'You\'re already in the <span style="color:#00ff41;font-weight:bold">Matrix</span>.'
					},
					{ type: 'output', text: 'Wake up, Neo...' }
				];

			case 'sbaddu':
			case 'supecchiu':
				return [
					{ type: 'output', text: '🤌 SBADDU SUPECCHIU!' },
					{ type: 'output', text: 'If you know, you know.' }
				];

			case 'exit':
			case 'quit':
				return [
					{ type: 'output', text: 'There is no escape from this portfolio.' },
					{ type: 'output', text: "You're stuck here forever. Enjoy! 🔒" }
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
				return [{ type: 'error', text: `cat: ${args[0] || ''}: No such file or directory` }];

			case 'pwd':
				return [{ type: 'output', text: '/home/visitor/giuseppe-portfolio' }];

			case 'cd':
				return [{ type: 'output', text: "You're already where you need to be." }];

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
						text: 'The Answer to the Ultimate Question of Life, the Universe, and Everything.'
					}
				];

			case 'hello':
			case 'hi':
			case 'ciao':
				return [{ type: 'output', text: 'Hey there! 👋 Welcome to my portfolio!' }];

			default:
				return [
					{ type: 'error', text: `command not found: ${cmd}. Type "help" for available commands.` }
				];
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
		if (e.key === 'ArrowUp') {
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
		history = [...bootLines];
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

<style>
	.terminal {
		background: rgba(10, 12, 28, 0.45);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(0, 255, 255, 0.1);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
		font-family: 'Courier New', 'Fira Code', monospace;
		cursor: text;
	}

	/* ── Title bar ── */
	.terminal-bar {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 10px 14px;
		background: rgba(30, 34, 60, 0.5);
		border-bottom: 1px solid rgba(0, 255, 255, 0.08);
		cursor: default;
	}
	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}
	.dot.red {
		background: #ff5f57;
	}
	.dot.yellow {
		background: #febc2e;
	}
	.dot.green {
		background: #28c840;
	}
	.bar-title {
		margin-left: 8px;
		font-size: 0.75rem;
		color: var(--text-muted);
		letter-spacing: 0.5px;
	}

	/* ── Body ── */
	.terminal-body {
		padding: 1rem 1.2rem;
		max-height: 340px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 255, 255, 0.2) transparent;
	}
	.terminal-body::-webkit-scrollbar {
		width: 5px;
	}
	.terminal-body::-webkit-scrollbar-track {
		background: transparent;
	}
	.terminal-body::-webkit-scrollbar-thumb {
		background: rgba(0, 255, 255, 0.2);
		border-radius: 3px;
	}

	/* ── Lines ── */
	.line {
		font-size: 0.85rem;
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
		min-height: 1.2em;
	}
	.line .prompt {
		color: var(--neon-green);
		font-weight: bold;
		margin-right: 8px;
	}
	.line .cmd {
		color: var(--primary-color);
	}
	.output {
		color: var(--text-light);
	}
	.err {
		color: #ff5f57;
	}
	.rich {
		color: var(--text-light);
	}

	/* Rich HTML styles */
	.rich :global(.file) {
		color: #66d9ef;
	}
	.rich :global(.cmt) {
		color: var(--text-muted);
		opacity: 0.7;
	}
	.rich :global(.cmt a),
	.rich :global(a) {
		color: var(--primary-color);
		text-decoration: none;
		border-bottom: 1px dashed rgba(0, 255, 255, 0.3);
		transition: border-color 0.2s;
	}
	.rich :global(a:hover) {
		border-bottom-color: var(--primary-color);
	}
	.rich :global(.cmd-name) {
		color: var(--primary-color);
		font-weight: bold;
	}
	.rich :global(.sk-cat) {
		color: var(--neon-green);
		font-weight: bold;
	}
	.rich :global(.nf-label) {
		color: var(--primary-color);
		font-weight: bold;
	}
	.rich :global(.nf-value) {
		color: var(--neon-green);
	}
	.rich :global(.song-title) {
		color: var(--primary-color);
		font-weight: bold;
	}
	.rich :global(.song-artist) {
		color: var(--neon-green);
		font-style: italic;
	}

	/* ── Input line ── */
	.input-line {
		display: flex;
		align-items: center;
		gap: 0;
	}
	.input-line .prompt {
		color: var(--neon-green);
		font-weight: bold;
		margin-right: 8px;
		font-size: 0.85rem;
	}
	.term-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		color: var(--primary-color);
		font-family: inherit;
		font-size: 0.85rem;
		caret-color: var(--neon-green);
		padding: 0;
		line-height: 1.6;
	}

	/* ── Responsive ── */
	@media (max-width: 768px) {
		.line {
			font-size: 0.78rem;
		}
		.term-input {
			font-size: 0.78rem;
		}
		.terminal-body {
			max-height: 280px;
		}
	}
	@media (max-width: 480px) {
		.line {
			font-size: 0.72rem;
		}
		.term-input {
			font-size: 0.72rem;
		}
		.terminal-body {
			padding: 0.8rem 0.9rem;
			max-height: 240px;
		}
	}
</style>
