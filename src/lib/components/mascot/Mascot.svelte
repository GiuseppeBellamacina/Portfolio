<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { lang, t } from '$lib/i18n';
	import type { Translations } from '$lib/i18n';
	import { skillCategories } from '$lib/components/skills/skillsData';
	import { CHARACTER_IDS, type CharacterId, type Expression } from './characters';
	import { step, isResting, type Body, type Bounds } from './physics';
	import {
		anchors,
		sectionLines,
		projectLines,
		categoryLine,
		allSkillsLine,
		complaints,
		angryLines,
		backLines,
		placeLines,
		clickLines,
		seasonLines,
		unmuteLine,
		type Line,
		type Season,
		type SectionId
	} from './mascotData';
	import type { VoxelMascot } from './voxelEngine';
	import './mascot.css';

	const CHAR_KEY = 'portfolio-mascot';
	const MUTE_KEY = 'portfolio-mascot-muted';
	const NAV_H = 72;
	const SECTIONS: SectionId[] = ['home', 'about', 'experience', 'projects', 'skills', 'contact'];
	const TOTAL_SKILLS = skillCategories.reduce((n, c) => n + c.icons.length, 0);

	let el: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let bubbleEl: HTMLDivElement | undefined = $state();
	let visible = $state(false);
	let muted = $state(false);
	// A line is split on **…** into plain and bold runs; typing reveals `shown` characters
	type Run = { text: string; bold: boolean };
	let runs = $state<Run[]>([]);
	let shown = $state(0);
	let typedRuns = $derived.by(() => {
		const out: Run[] = [];
		let left = shown;
		for (const r of runs) {
			if (left <= 0) break;
			out.push({ text: r.text.slice(0, left), bold: r.bold });
			left -= r.text.length;
		}
		return out;
	});
	let speaking = $state(false);
	/** Gliding to a new spot: the bubble hides, new lines wait for the arrival */
	let traveling = $state(false);
	let queued: { line: string; face: Expression } | null = null;

	let engine: VoxelMascot | null = null;
	let reducedMotion = false;

	function load(key: string) {
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	}
	function store(key: string, value: string | null) {
		try {
			if (value === null) localStorage.removeItem(key);
			else localStorage.setItem(key, value);
		} catch {
			/* storage blocked: the choice just won't persist */
		}
	}
	const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

	let character: CharacterId = 'turi';
	const lineCursor: Partial<Record<SectionId, number>> = {};

	function fill(text: string) {
		const name = character === 'turi' ? 'Turi' : get(lang) === 'it' ? 'l’Arancino' : 'the Arancino';
		return text.replace('{n}', String(TOTAL_SKILLS)).replace('{name}', name);
	}

	// Section lines take turns, so coming back to a section doesn't repeat the same one
	function sectionLine(id: SectionId): Line {
		const lines = sectionLines[get(lang)][id];
		const i = lineCursor[id] ?? 0;
		lineCursor[id] = (i + 1) % lines.length;
		return lines[i];
	}

	function season(): Season | null {
		// Hats and seasonal quips are Turi's thing
		if (character !== 'turi') return null;
		const c = document.body.classList;
		if (c.contains('season-snow')) return 'christmas';
		if (c.contains('season-newyear')) return 'newyear';
		if (c.contains('tod-night')) return 'night';
		if (c.contains('season-summer')) return 'summer';
		return null;
	}

	// ── Speech bubble ──
	let typeTimer: ReturnType<typeof setInterval> | undefined;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	function say(line: string, face: Expression = 'normal') {
		if (traveling) {
			queued = { line, face };
			return;
		}
		engine?.setExpression(face);
		if (muted || !visible) return;
		clearInterval(typeTimer);
		clearTimeout(hideTimer);
		speaking = true;
		const done = () => {
			engine?.setTalking(false);
			hideTimer = setTimeout(() => {
				speaking = false;
				if (mode === 'docked') engine?.setExpression('normal');
			}, 6500);
		};
		runs = line
			.split('**')
			.map((text, i) => ({ text, bold: i % 2 === 1 }))
			.filter((r) => r.text);
		const total = runs.reduce((n, r) => n + r.text.length, 0);
		if (reducedMotion) {
			shown = total;
			done();
			return;
		}
		shown = 0;
		engine?.setTalking(true);
		typeTimer = setInterval(() => {
			shown++;
			if (shown >= total) {
				clearInterval(typeTimer);
				done();
			}
		}, 22);
	}

	function mute() {
		muted = true;
		speaking = false;
		clearInterval(typeTimer);
		engine?.setTalking(false);
		store(MUTE_KEY, '1');
	}

	// ── Motion: docked (spring to the section anchor), held, flying (physics), returning ──
	type Mode = 'docked' | 'held' | 'flying' | 'returning';
	let mode: Mode = 'docked';
	const body: Body = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, spin: 0 };
	let size = 170;
	let radius = 48;
	let compact = false;
	let section: SectionId = 'home';
	let hits = 0;
	let restMs = 0;
	let lastComplaint = 0;
	/** Where the user dropped it, as viewport fractions; overrides the section anchors */
	let placed: { fx: number; fy: number } | null = null;
	let clock = 0;
	// Release speed (px/s) above which a drag counts as a throw
	const THROW_SPEED = 1100;

	function bounds(): Bounds {
		// clientWidth excludes the scrollbar
		return { width: document.documentElement.clientWidth, height: innerHeight, radius, top: NAV_H };
	}

	function anchor() {
		const a = baseAnchor();
		if (reducedMotion) return a;
		// Never perfectly still: a slow hover around the resting point
		return { x: a.x + Math.sin(clock * 0.7) * 7, y: a.y + Math.sin(clock * 1.1) * 9 };
	}

	function baseAnchor() {
		const b = bounds();
		if (placed) return { x: placed.fx * b.width, y: placed.fy * b.height };
		const margin = size / 2 + 12;
		// Below ~1360px the content leaves no side margin: park in the bottom-left corner
		if (compact) return { x: margin, y: innerHeight - margin - 12 };
		const a = anchors[section];
		return {
			x: a.side === 'right' ? document.documentElement.clientWidth - margin : margin,
			y: Math.max(NAV_H + radius + 90, innerHeight * a.y)
		};
	}

	// Docked moves glide: a soft spring with a speed cap, so a far section never turns
	// into a dash across the screen
	const GLIDE_K = 30;
	const GLIDE_MAX = 2600; // px/s: about 1.1 s across the screen
	const ARRIVED = 40; // px
	// It talks only when nearly still: above these speeds the bubble hides and lines wait
	const TALK_SPEED = 90; // px/s, gliding
	const HELD_TALK_SPEED = 260; // px/s, while carried
	const QUIET_MS = 220; // still for this long before it speaks again
	let quietMs = 0;
	let lastDrag = 0;

	function onImpact(speed: number) {
		hits++;
		engine?.bump(Math.min(1, speed / 2500));
		const now = performance.now();
		if (now - lastComplaint < 900) return;
		lastComplaint = now;
		say(pick(complaints[get(lang)]), hits >= 3 || speed > 2600 ? 'dizzy' : 'angry');
	}

	function place() {
		el.style.transform = `translate3d(${body.x - size / 2}px, ${body.y - size / 2}px, 0)`;
		if (!bubbleEl || !speaking || traveling) return;
		const w = bubbleEl.offsetWidth;
		const h = bubbleEl.offsetHeight;
		const half = size * 0.36; // half the visible model, inside the padded box
		const onLeft = body.x > innerWidth / 2;
		// The edge nearest the mascot is pinned, so a line growing as it types
		// extends away from it, never over it
		let edge = onLeft ? body.x + half * 0.5 : body.x - half * 0.5;
		let y = body.y - half - h - 4;
		if (y < NAV_H + 8) {
			// No room above: beside it, on the side facing the page
			edge = onLeft ? body.x - half - 4 : body.x + half + 4;
			y = body.y - h / 2;
		}
		y = Math.max(NAV_H + 8, Math.min(innerHeight - h - 8, y));
		const x = onLeft
			? `max(8px, calc(${Math.min(innerWidth - 8, edge)}px - 100%))`
			: `${Math.max(8, Math.min(innerWidth - w - 8, edge))}px`;
		bubbleEl.style.transform = `translate3d(${x}, ${y}px, 0)`;
	}

	function updateQuiet(dtMs: number) {
		const speed = Math.hypot(body.vx, body.vy);
		let moving: boolean;
		if (mode === 'flying') moving = true;
		else if (mode === 'held') moving = speed > HELD_TALK_SPEED;
		else {
			const a = baseAnchor();
			moving = Math.hypot(a.x - body.x, a.y - body.y) > ARRIVED || speed > TALK_SPEED;
		}
		if (moving) {
			quietMs = 0;
			traveling = true;
			return;
		}
		if (!traveling) return;
		quietMs += dtMs;
		if (quietMs < QUIET_MS) return;
		traveling = false;
		if (queued) {
			const q = queued;
			queued = null;
			say(q.line, q.face);
		}
	}

	let raf = 0;
	let last = 0;
	function frame(time: number) {
		const prev = last || time - 16;
		const dtMs = Math.min(time - prev, 50);
		last = time;
		const dt = dtMs / 1000;
		clock += dt;
		if (mode === 'flying') {
			// Fixed sub-steps keep the flight real-time even when frames are slow
			let hit = 0;
			for (let left = Math.min(time - prev, 120) / 1000; left > 0; left -= 1 / 120) {
				hit = Math.max(hit, step(body, Math.min(left, 1 / 120), bounds()));
			}
			if (hit > 500) onImpact(hit);
			restMs = isResting(body, bounds()) ? restMs + dtMs : 0;
			if (restMs > 700) {
				mode = 'returning';
				// Unwind the spin by the shortest way round
				body.angle = Math.atan2(Math.sin(body.angle), Math.cos(body.angle));
				// A complaint from the landing beats the generic "back to my spot"
				if (!queued) queued = { line: pick(backLines[get(lang)]), face: 'normal' };
			}
		} else if (mode === 'docked' || mode === 'returning') {
			const a = anchor();
			if (reducedMotion) {
				body.x = a.x;
				body.y = a.y;
				body.vx = body.vy = 0;
			} else {
				const k = mode === 'returning' ? 20 : GLIDE_K;
				const c = 2 * Math.sqrt(k);
				body.vx += ((a.x - body.x) * k - body.vx * c) * dt;
				body.vy += ((a.y - body.y) * k - body.vy * c) * dt;
				const v = Math.hypot(body.vx, body.vy);
				if (v > GLIDE_MAX) {
					body.vx *= GLIDE_MAX / v;
					body.vy *= GLIDE_MAX / v;
				}
				body.x += body.vx * dt;
				body.y += body.vy * dt;
			}
			body.angle *= Math.exp(-6 * dt);
			if (mode === 'returning' && Math.hypot(a.x - body.x, a.y - body.y) < ARRIVED) {
				mode = 'docked';
				hits = 0;
			}
		} else if (mode === 'held' && performance.now() - lastDrag > 90) {
			// Held still: no pointer moves, so it is not moving either
			body.vx = body.vy = 0;
		}
		updateQuiet(dtMs);
		if (visible) {
			place();
			engine?.tick(dtMs, { vx: body.vx, vy: body.vy, angle: body.angle });
		}
		raf = requestAnimationFrame(frame);
	}

	// ── Pointer: click to talk, drag to carry, release to throw ──
	let pointerId = -1;
	let downX = 0;
	let downY = 0;
	let grabDX = 0;
	let grabDY = 0;
	let dragging = false;
	let samples: { x: number; y: number; t: number }[] = [];
	let lastRant = 0;

	function rant() {
		lastRant = performance.now();
		say(pick(angryLines[get(lang)]), 'angry');
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		pointerId = e.pointerId;
		(e.currentTarget as HTMLElement).setPointerCapture(pointerId);
		downX = e.clientX;
		downY = e.clientY;
		grabDX = body.x - e.clientX;
		grabDY = body.y - e.clientY;
		dragging = false;
		samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
	}

	function onPointerMove(e: PointerEvent) {
		if (e.pointerId !== pointerId) return;
		if (!dragging) {
			if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) return;
			dragging = true;
			mode = 'held';
			// The first rant waits until it is held still (see updateQuiet)
			traveling = true;
			quietMs = 0;
			queued = null;
			engine?.setAngry(true);
			rant();
		}
		const now = performance.now();
		lastDrag = now;
		// Keeps grumbling while it is carried around (heard whenever it slows down)
		if (now - lastRant > 3200) rant();
		samples.push({ x: e.clientX, y: e.clientY, t: now });
		while (samples.length > 2 && now - samples[0].t > 90) samples.shift();
		const first = samples[0];
		const span = Math.max(16, now - first.t) / 1000;
		body.vx = (e.clientX - first.x) / span;
		body.vy = (e.clientY - first.y) / span;
		const b = bounds();
		body.x = Math.max(radius, Math.min(b.width - radius, e.clientX + grabDX));
		body.y = Math.max(b.top + radius, Math.min(b.height - radius, e.clientY + grabDY));
	}

	function onPointerUp(e: PointerEvent) {
		if (e.pointerId !== pointerId) return;
		pointerId = -1;
		if (!dragging) {
			onTap();
			return;
		}
		dragging = false;
		engine?.setAngry(false);
		const MAX = 4500;
		const speed = Math.hypot(body.vx, body.vy);
		if (speed > MAX) {
			body.vx *= MAX / speed;
			body.vy *= MAX / speed;
		}
		if (reducedMotion || speed < THROW_SPEED) {
			// Carried, not thrown: it stays where it was put
			const b = bounds();
			placed = { fx: body.x / b.width, fy: body.y / b.height };
			body.vx = body.vy = 0;
			mode = 'docked';
			say(pick(placeLines[get(lang)]), 'happy');
			return;
		}
		body.spin = (body.vx / radius) * 0.35;
		hits = 0;
		restMs = 0;
		mode = 'flying';
	}

	function onTap() {
		engine?.bump(0.35);
		if (muted) {
			muted = false;
			store(MUTE_KEY, null);
			say(unmuteLine[get(lang)], 'happy');
		} else {
			const s = season();
			const lines = s && Math.random() < 0.4 ? seasonLines[get(lang)][s] : clickLines[get(lang)];
			say(pick(lines), 'happy');
		}
	}

	function onWindowPointerMove(e: PointerEvent) {
		engine?.lookAt(e.clientX - body.x, e.clientY - body.y);
	}

	// ── Page events: section in view, carousel and skills changes, terminal command ──
	// The section under the viewport centre is applied only once scrolling stops, so a
	// fast scroll or a jump from the navbar is one glide to the end, not a tour.
	let inView: SectionId = 'home';
	let settleTimer: ReturnType<typeof setTimeout> | undefined;
	let scrollSpeed = 0; // px/s, smoothed
	let lastScrollY = 0;
	let lastScrollT = 0;
	// Below this the reader is browsing: follow the section at once
	const SLOW_SCROLL = 1400;

	function onScroll() {
		const now = performance.now();
		const dt = now - lastScrollT;
		const instant = dt > 0 && dt < 400 ? (Math.abs(scrollY - lastScrollY) / dt) * 1000 : 0;
		scrollSpeed = scrollSpeed * 0.6 + instant * 0.4;
		lastScrollY = scrollY;
		lastScrollT = now;
		clearTimeout(settleTimer);
		settleTimer = setTimeout(settle, 280);
	}

	function onSectionInView(id: SectionId) {
		inView = id;
		if (scrollSpeed < SLOW_SCROLL) settle();
	}

	function settle() {
		if (inView === section) return;
		section = inView;
		if (mode !== 'docked') return;
		// Leave first, talk on arrival: the line is queued until the glide ends
		const a = baseAnchor();
		if (!reducedMotion && Math.hypot(a.x - body.x, a.y - body.y) > ARRIVED) traveling = true;
		const line = sectionLine(section);
		say(fill(line.text), line.face);
	}

	let lastProjectLine = 0;
	function onProjectActive(e: Event) {
		// The carousel advances every few seconds: comment at most every 12 s
		if (section !== 'projects' || mode !== 'docked' || traveling) return;
		if (performance.now() - lastProjectLine < 12000) return;
		const line = projectLines[get(lang)][(e as CustomEvent<string>).detail];
		if (!line) return;
		lastProjectLine = performance.now();
		say(line, 'happy');
	}

	// A project opened from the carousel or the mosaic always gets a comment
	function onProjectOpen(e: Event) {
		const line = projectLines[get(lang)][(e as CustomEvent<string>).detail];
		if (!line || mode !== 'docked') return;
		lastProjectLine = performance.now();
		say(line, 'wow');
	}

	function onSkillsCategory(e: Event) {
		const key = (e as CustomEvent<keyof Translations | null>).detail;
		const l = get(lang);
		if (key === null) {
			say(allSkillsLine[l].replace('{n}', String(TOTAL_SKILLS)), 'happy');
			return;
		}
		const n = skillCategories.find((c) => c.key === key)?.icons.length ?? 0;
		say(categoryLine[l](get(t)[key], n), 'wow');
	}

	function onMascotSet(e: Event) {
		const id = (e as CustomEvent<CharacterId | 'off'>).detail;
		store(CHAR_KEY, id);
		if (id === 'off') {
			visible = false;
			return;
		}
		visible = true;
		character = id;
		if (engine) engine.setCharacter(id);
		else void start(id); // it was saved as off: load three.js only now
		say(pick(clickLines[get(lang)]), 'happy');
	}

	let cancelled = false;
	let starting = false;
	let observer: IntersectionObserver | undefined;
	let colorObserver: MutationObserver | undefined;

	async function start(character: CharacterId) {
		if (starting) return;
		starting = true;
		try {
			const { createVoxelMascot } = await import('./voxelEngine');
			if (cancelled) return;
			engine = createVoxelMascot(canvas, character, reducedMotion);
		} catch {
			visible = false; // no WebGL: no mascot
			return;
		}
		// Season, night and terminal palettes all land on body class/style
		colorObserver = new MutationObserver(() => engine?.refreshColors());
		colorObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
		observer = new IntersectionObserver(
			(entries) =>
				entries.forEach((entry) => {
					if (entry.isIntersecting) onSectionInView(entry.target.id as SectionId);
				}),
			{ rootMargin: '-45% 0px -45% 0px' }
		);
		for (const id of SECTIONS) {
			const s = document.getElementById(id);
			if (s) observer.observe(s);
		}
		raf = requestAnimationFrame(frame);
		setTimeout(() => {
			const s = season();
			const line = s
				? { text: pick(seasonLines[get(lang)][s]), face: 'happy' as const }
				: sectionLine(section);
			say(fill(line.text), line.face);
		}, 900);
	}

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		muted = load(MUTE_KEY) === '1';
		const param = new URLSearchParams(location.search).get('mascot');
		const saved = param ?? load(CHAR_KEY);
		character = (CHARACTER_IDS as string[]).includes(saved ?? '') ? (saved as CharacterId) : 'turi';
		visible = saved !== 'off';

		compact = innerWidth < 1360;
		// The model fills ~78% of the box: the rest is room to lean, squash and shake
		size = innerWidth < 640 ? 132 : compact ? 166 : 214;
		radius = Math.round(size * 0.25);
		el.style.width = el.style.height = `${size}px`;
		// Fly in from the right edge
		body.x = innerWidth + size;
		body.y = innerHeight * anchors.home.y;

		// Load three.js only once the page has settled, so it never competes with first paint
		const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1200));
		// Saved as off: three.js loads only if the terminal brings the mascot back
		if (visible) idle(() => void start(character), { timeout: 3000 });

		window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('project-active', onProjectActive);
		window.addEventListener('project-open', onProjectOpen);
		window.addEventListener('skills-category', onSkillsCategory);
		window.addEventListener('mascot-set', onMascotSet);
		return () => {
			cancelled = true;
			cancelAnimationFrame(raf);
			clearInterval(typeTimer);
			clearTimeout(hideTimer);
			clearTimeout(settleTimer);
			observer?.disconnect();
			colorObserver?.disconnect();
			engine?.dispose();
			window.removeEventListener('pointermove', onWindowPointerMove);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('project-active', onProjectActive);
			window.removeEventListener('project-open', onProjectOpen);
			window.removeEventListener('skills-category', onSkillsCategory);
			window.removeEventListener('mascot-set', onMascotSet);
		};
	});
</script>

<div class="mascot" class:is-hidden={!visible} bind:this={el}>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
	<button
		class="mascot-hit"
		aria-label={$lang === 'it'
			? 'Mascotte: clicca per farla parlare, trascinala per lanciarla'
			: 'Mascot: click to talk, drag to throw'}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onTap();
			}
		}}
	></button>
</div>

{#if visible && speaking && !muted}
	<div class="mascot-bubble" class:is-away={traveling} bind:this={bubbleEl}>
		<p>
			{#each typedRuns as r}{#if r.bold}<strong>{r.text}</strong>{:else}{r.text}{/if}{/each}
		</p>
		<button class="mascot-mute" aria-label={$lang === 'it' ? 'Zittisci' : 'Mute'} onclick={mute}
			>×</button
		>
	</div>
{/if}
