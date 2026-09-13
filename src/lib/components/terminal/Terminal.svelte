<script lang="ts">
	import { tick } from 'svelte';
	import { get } from 'svelte/store';
	import { t as tStore, baseTranslation } from '$lib/i18n';
	import type { Translation } from '$lib/i18n';
	import './terminal.css';
	import { type HistoryEntry, completableCommands, buildInitialHistory } from './terminalData';
	import { commands, type CommandContext } from './commands';

	interface Props {
		/** Fired after a valid, non-empty command is dispatched (About wires this to the neural net) */
		onCommandExecuted?: () => void;
	}
	let { onCommandExecuted }: Props = $props();

	let inputValue = $state('');
	// Seeded with baseTranslation (always English, matching the prerendered
	// static build), not the client's real language: otherwise this state's
	// first value already equals the correction effect's target, so nothing
	// visibly changes and the English markup adopted at hydration never repaints.
	let history = $state<HistoryEntry[]>(buildInitialHistory(baseTranslation));
	let terminalEl: HTMLElement;
	let terminalBody: HTMLElement;
	let inputEl: HTMLInputElement;
	let commandHistory: string[] = [];
	let historyIndex = -1;

	let inputLocked = $state(false);

	// "Pristine" = the user hasn't submitted anything yet: while pristine, the
	// opening content is regenerated on language change. Once the user types,
	// the terminal becomes theirs and is never reset.
	let pristine = true;

	// While pristine (no user commands yet), the opening content follows the
	// active language; after the first submit the history belongs to the user.
	$effect(() => {
		const tr = $tStore;
		if (pristine) {
			history = buildInitialHistory(tr);
		}
	});

	/* ── Sequential output helpers (exposed to commands via CommandContext) ── */
	function delay(ms: number): Promise<void> {
		return new Promise((r) => setTimeout(r, ms));
	}

	// Terminal HTML is developer-controlled; echo and cowsay output are rendered as text.
	async function pushLine(entry: HistoryEntry) {
		history.push(entry);
		// Limit history to 1000 entries to prevent memory issues
		if (history.length > 1000) {
			history = history.slice(-1000);
		}
		await tick();
		if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
	}

	async function pushLines(entries: HistoryEntry[], delayMs: number) {
		for (const entry of entries) {
			await pushLine(entry);
			await delay(delayMs);
		}
	}

	function focusInput() {
		inputEl?.focus();
	}

	function makeContext(args: string[], tr: Translation): CommandContext {
		return {
			args,
			tr,
			historyLength: history.length,
			pushLine,
			pushLines,
			pushRaw: (entry) => {
				history.push(entry);
			},
			setHistoryEntry: async (index, entry) => {
				history[index] = entry;
				await tick();
				if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
			},
			clearHistory: () => {
				history = [];
			},
			lockInput: (locked) => {
				inputLocked = locked;
			},
			focusInput
		};
	}

	/* ── Command dispatch (registry lives in commands.ts) ── */
	function executeCommand(raw: string): HistoryEntry[] | 'async' {
		const trimmed = raw.trim();
		if (!trimmed) return [];

		const parts = trimmed.split(/\s+/);
		const cmd = parts[0].toLowerCase();
		const args = parts.slice(1);
		const tr = get(tStore);

		const handler = commands[cmd];
		if (!handler) {
			return [{ type: 'error', text: `${tr.term_notFound} ${cmd}. ${tr.term_typeHelp}` }];
		}
		return handler(makeContext(args, tr));
	}

	async function handleSubmit() {
		if (inputLocked) return;
		const raw = inputValue;
		inputValue = '';
		historyIndex = -1;
		pristine = false;

		if (raw.trim()) {
			commandHistory = [raw.trim(), ...commandHistory];
		}

		history.push({ type: 'input', text: raw });

		const result = executeCommand(raw);

		// Notify the host (About) only for valid, non-empty commands
		const trimmed = raw.trim();
		if (trimmed) {
			const cmdName = trimmed.split(/\s+/)[0].toLowerCase();
			if (commands[cmdName]) onCommandExecuted?.();
		}

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

	function handleWheel(e: WheelEvent) {
		const el = terminalBody;
		if (!el) return;
		const atTop = el.scrollTop <= 0 && e.deltaY < 0;
		const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
		if (!atTop && !atBottom) {
			e.stopPropagation();
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="terminal" onclick={focusInput} bind:this={terminalEl}>
	<div class="terminal-bar">
		<span class="dot red"></span>
		<span class="dot yellow"></span>
		<span class="dot green"></span>
		<span class="bar-title">giuseppe@portfolio:~</span>
	</div>
	<div
		class="terminal-body"
		role="log"
		aria-live="polite"
		bind:this={terminalBody}
		onwheel={handleWheel}
	>
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
				aria-label={$tStore.term_typeHelp}
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
