<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { get } from 'svelte/store';
	import { lang, t } from '$lib/i18n';
	import type { Translations } from '$lib/i18n';
	import { skillCategories } from '$lib/components/skills/skillsData';
	import { projects } from '$lib/components/projects/projectsData';
	import { CHARACTER_IDS, type CharacterId, type Expression, type ModelId } from './characters';
	import { step, isResting, type Body, type Bounds } from './physics';
	import {
		anchors,
		sectionLines,
		projectLines,
		categoryLine,
		categoryLines,
		allSkillsLine,
		complaints,
		angryLines,
		backLines,
		placeLines,
		clickLines,
		ideaLines,
		idleLines,
		triviaLines,
		streakLines,
		annoyedLines,
		backTabLines,
		konamiLines,
		sceneLines,
		pick,
		friendLines,
		swapLines,
		projectsViewLines,
		elevatorLines,
		rideShouts,
		rideEndLines,
		seasonLines,
		shoutLines,
		unmuteLine,
		parseLine,
		experienceLines,
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
	// Font size of the strip's text, by how long the line is (its box has a fixed height)
	let fit = $derived.by(() => {
		const n = runs.reduce((sum, r) => sum + r.text.length, 0);
		return n <= 70 ? 'fit-l' : n <= 115 ? 'fit-m' : 'fit-s';
	});
	let speaking = $state(false);
	/** Short scream shown while it flies, when normal lines are held back */
	let shout = $state<string | null>(null);
	let shoutEl: HTMLDivElement | undefined = $state();
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
	// Round robin per list: every line comes out once, in shuffled order, before any repeats
	const GAGS = ['tape', 'speaker', 'off'] as const;
	const KONAMI_SCENES = ['jump', 'daft'] as const;
	// The synth's LED matrix is a face grid: these patterns light it up on the beat
	const SYNTH_LEDS: Expression[] = ['happy', 'wow', 'dizzy', 'star', 'love', 'angry', 'tired'];
	// Which kind of line a tap or a quiet spell gets, also from a bag: the repeats set the mix
	// (a tap: 8 in 20 its own lines, 4 the friend, 3 an idea, 3 the season, 2 trivia)
	const TAP_KINDS = [
		...Array<'click'>(8).fill('click'),
		...Array<'friend'>(4).fill('friend'),
		...Array<'idea'>(3).fill('idea'),
		...Array<'season'>(3).fill('season'),
		...Array<'trivia'>(2).fill('trivia')
	];
	const IDLE_KINDS = [
		...Array<'trivia'>(11).fill('trivia'),
		...Array<'idea'>(4).fill('idea'),
		...Array<'idle'>(5).fill('idle')
	];
	const GLANCES: Expression[] = ['wink', 'think', 'happy', 'smug', 'shy', 'worried'];

	let character: CharacterId = 'turi';

	const TOTAL_PROJECTS = projects.length;
	const HIGHLIGHTS = projects.filter((p) => p.importance === 3).length;

	function fill(text: string) {
		const name = character === 'turi' ? 'Turi' : get(lang) === 'it' ? 'l’Arancino' : 'the Arancino';
		return text
			.replace('{n}', String(TOTAL_SKILLS))
			.replace('{p}', String(TOTAL_PROJECTS))
			.replace('{h}', String(HIGHLIGHTS))
			.replace('{name}', name);
	}

	// Section lines come from a shuffle bag too, so coming back to a section doesn't repeat itself
	const sectionLine = (id: SectionId): Line => pick(sectionLines[get(lang)][id]);

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

	// During a swap the newcomer speaks too: the bubble, the face and the mouth follow it
	let speaker: 'main' | 'guest' = 'main';
	const speakerEngine = () => (speaker === 'guest' ? guestEngine : engine);

	function say(line: string, face: Expression = 'normal') {
		if (traveling) {
			queued = { line, face };
			return;
		}
		speakerEngine()?.setExpression(face);
		if (muted || !visible) return;
		lastSayAt = performance.now();
		clearInterval(typeTimer);
		clearTimeout(hideTimer);
		speaking = true;
		const done = () => {
			speakerEngine()?.setTalking(false);
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
		speakerEngine()?.setTalking(true);
		typeTimer = setInterval(() => {
			shown++;
			if (shown >= total) {
				clearInterval(typeTimer);
				done();
			}
		}, 22);
	}

	// A line from the sets: it may carry its own face ('tired|text'), else `fallback`
	function sayRaw(raw: string, fallback: Expression = 'normal') {
		const l = parseLine(raw, fallback);
		say(fill(l.text), l.face);
	}

	// The shout is plain text: no bold markers
	const plain = (s: string) => s.replaceAll('**', '');

	function mute() {
		muted = true;
		speaking = false;
		clearInterval(typeTimer);
		engine?.setTalking(false);
		engine?.setGag(pick(GAGS));
		store(MUTE_KEY, '1');
	}

	// ── Motion: docked (spring to the section anchor), held, flying (physics), returning ──
	type Mode = 'docked' | 'held' | 'flying' | 'returning' | 'launching';
	let mode: Mode = 'docked';
	const body: Body = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, spin: 0 };
	let size = 170;
	let radius = 48;
	let compact = false;
	// Under this width the mascot lives in a strip under the navbar, with its own reserved
	// space for what it says, instead of floating over the page
	const STRIP_BELOW = 768;
	const STRIP_H = 84;
	const STRIP_H_MUTED = 52;
	let strip = $state(false);
	let stripEl: HTMLDivElement | undefined = $state();
	let navBottom = NAV_H;
	/** The middle of the strip's dock: where the mascot sits on a phone */
	let dock = { x: 52, y: NAV_H + STRIP_H / 2 };
	const stripHeight = () => (muted ? STRIP_H_MUTED : STRIP_H);

	// The page reads these two to leave room for the strip (hero padding, scroll offsets, panels)
	function updateStripVars() {
		navBottom = Math.round(
			document.querySelector('.navbar')?.getBoundingClientRect().bottom ?? NAV_H
		);
		const h = strip && visible ? stripHeight() : 0;
		const root = document.documentElement.style;
		root.setProperty('--turi-nav', `${navBottom}px`);
		root.setProperty('--turi-strip', `${h}px`);
		dock = { x: 52, y: navBottom + stripHeight() / 2 };
	}

	function applyLayout() {
		compact = innerWidth < 1360;
		strip = innerWidth < STRIP_BELOW;
		// The model fills ~78% of the box: the rest is room to lean, squash and shake
		size = strip ? 88 : compact ? 166 : 214;
		radius = Math.round(size * 0.25);
		el.style.width = el.style.height = `${size}px`;
		updateStripVars();
	}

	let resizeTimer: ReturnType<typeof setTimeout> | undefined;
	function onResize() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(applyLayout, 120);
	}

	// Visible, muted or not: the strip's height changes, and with it the page's room
	$effect(() => {
		void [visible, muted, strip];
		untrack(updateStripVars);
	});
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
		const top = strip ? navBottom + stripHeight() : NAV_H;
		return { width: document.documentElement.clientWidth, height: innerHeight, radius, top };
	}

	function anchor() {
		const a = baseAnchor();
		if (reducedMotion) return a;
		// Never perfectly still: a slow hover around the resting point (and, on a rocket ride,
		// dragged behind the page that rushes up)
		return { x: a.x + Math.sin(clock * 0.7) * 7, y: a.y + Math.sin(clock * 1.1) * 9 + rideLag };
	}

	function baseAnchor() {
		// A scene is directing it (leaving the stage, taking its place)
		if (sceneGoal) return sceneGoal;
		// Phones: in the strip under the navbar, always (after a drag it goes back there)
		if (strip) return dock;
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

	// A celebratory jump: it lands without complaining
	let playful = false;

	function onImpact(speed: number) {
		hits++;
		engine?.bump(Math.min(1, speed / 2500));
		if (playful) return;
		const now = performance.now();
		if (now - lastComplaint < 900) return;
		lastComplaint = now;
		const c = parseLine(pick(complaints[get(lang)]), 'angry');
		say(c.text, hits >= 3 || speed > 2600 ? 'dizzy' : c.face);
	}

	// The shout trails the mascot: it closes SHOUT_FOLLOW of the gap per second, and never
	// moves faster than a share of the mascot's own speed (plus a gentle drift), so it
	// stays readable during a throw and doesn't sprint to catch up as the mascot stops
	const SHOUT_FOLLOW = 4;
	const SHOUT_DRIFT = 60; // px/s, so it still arrives when the mascot is nearly still
	const SHOUT_SPEED_SHARE = 0.8;
	let shoutX: number | null = null;
	let shoutY = 0;
	let shoutPhase = 0;

	function place(dt = 0) {
		el.style.transform = `translate3d(${body.x - size / 2}px, ${body.y - size / 2}px, 0)`;
		if (shoutEl) {
			const w = shoutEl.offsetWidth;
			const tx = Math.max(8, Math.min(innerWidth - w - 8, body.x - w / 2));
			const ty = Math.max(NAV_H + 8, body.y - size * 0.36 - shoutEl.offsetHeight - 6);
			if (shoutX === null) {
				shoutX = tx;
				shoutY = ty;
			} else {
				// On a rocket ride the text drifts after it slowly, so it stays easy to read
				const k = 1 - Math.exp(-(riding ? 1.2 : SHOUT_FOLLOW) * dt);
				let mx = (tx - shoutX) * k;
				let my = (ty - shoutY) * k;
				const share = riding ? 0.3 : SHOUT_SPEED_SHARE;
				const maxStep = (SHOUT_DRIFT + share * Math.hypot(body.vx, body.vy)) * dt;
				const len = Math.hypot(mx, my);
				if (len > maxStep) {
					mx *= maxStep / len;
					my *= maxStep / len;
				}
				shoutX += mx;
				shoutY += my;
			}
			shoutEl.style.transform = `translate3d(${shoutX}px, ${shoutY}px, 0)`;
			// The wobble follows the mascot too: quick while it flies, a slow sway as it settles
			const share = riding ? 0.12 : Math.min(1, Math.hypot(body.vx, body.vy) / 1500);
			shoutPhase += dt * (3 + 22 * share);
			shoutEl.style.rotate = `${Math.sin(shoutPhase) * 6 * (0.3 + 0.7 * share)}deg`;
		} else shoutX = null;
		if (!bubbleEl || !speaking || traveling) return;
		const w = bubbleEl.offsetWidth;
		const h = bubbleEl.offsetHeight;
		const half = size * 0.36; // half the visible model, inside the padded box
		const sp = speaker === 'guest' ? guest : body;
		const onLeft = sp.x > innerWidth / 2;
		// The edge nearest the mascot is pinned, so a line growing as it types
		// extends away from it, never over it
		let edge = onLeft ? sp.x + half * 0.5 : sp.x - half * 0.5;
		let y = sp.y - half - h - 4;
		if (guestShown) {
			// Two bots side by side: above them if there is room for a long line, else below.
			// Decided once, so the bubble doesn't flip sides as a line grows or the bots bob
			duoBelow ??= sp.y - half - 150 < NAV_H + 8;
			if (duoBelow) y = sp.y + half + 4;
		} else if (y < NAV_H + 8) {
			// No room above: beside it, on the side facing the page
			edge = onLeft ? sp.x - half - 4 : sp.x + half + 4;
			y = sp.y - h / 2;
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
		if (mode === 'flying' || mode === 'launching') moving = true;
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
				shout = null;
				playful = false;
				// Unwind the spin by the shortest way round
				body.angle = Math.atan2(Math.sin(body.angle), Math.cos(body.angle));
				// A complaint from the landing beats the generic "back to my spot"
				if (!queued) {
					const b = parseLine(pick(backLines[get(lang)]), 'normal');
					queued = { line: b.text, face: b.face };
				}
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
		} else if (mode === 'launching') {
			// Straight up on the rocket, a little shaky, until it is off the screen
			launchT += dt;
			body.vy -= 2800 * dt;
			body.y += body.vy * dt;
			body.vx = Math.sin(launchT * 16) * 60;
			body.x += body.vx * dt;
			body.angle = Math.sin(launchT * 11) * 0.07;
			if (body.y < -(size / 2 + launchTail)) {
				const done = launchDone;
				launchDone = null;
				done?.();
			}
		} else if (mode === 'held' && performance.now() - lastDrag > 90) {
			// Held still: no pointer moves, so it is not moving either
			body.vx = body.vy = 0;
		}
		// On a rocket ride it lags behind the page: the faster the page, the further back
		const lagTarget = riding ? Math.min(innerHeight * 0.28, scrollSpeed * 0.09) : 0;
		rideLag += (lagTarget - rideLag) * (1 - Math.exp(-dt * 3));
		updateQuiet(dtMs);
		if (visible) {
			place(dt);
			engine?.tick(dtMs, { vx: body.vx, vy: body.vy + (riding ? -2400 : 0), angle: body.angle });
			if (guestShown && guestEngine && guestEl) {
				// The newcomer settles beside the one on stage and stays there
				const gx = guestTargetX();
				const k = 24;
				const c = 2 * Math.sqrt(k);
				guest.vx += ((gx - guest.x) * k - guest.vx * c) * dt;
				guest.vy += ((guestTargetY() - guest.y) * k - guest.vy * c) * dt;
				const v = Math.hypot(guest.vx, guest.vy);
				if (v > GLIDE_MAX) {
					guest.vx *= GLIDE_MAX / v;
					guest.vy *= GLIDE_MAX / v;
				}
				guest.x += guest.vx * dt;
				guest.y += guest.vy * dt;
				guestEl.style.transform = `translate3d(${guest.x - size / 2}px, ${guest.y - size / 2}px, 0)`;
				guestEngine.tick(dtMs, { vx: guest.vx, vy: guest.vy, angle: 0 });
			}
			synthEngine?.tick(dtMs, { vx: 0, vy: 0, angle: 0 });
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
		sayRaw(pick(angryLines[get(lang)]), 'angry');
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
			shout = null;
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
		if (strip && !reducedMotion && speed < THROW_SPEED) {
			// Carried, not thrown: on a phone it never stays over the page, it goes back to the strip
			body.vx = body.vy = 0;
			mode = 'returning';
			sayRaw(pick(backLines[get(lang)]), 'normal');
			return;
		}
		if (reducedMotion || speed < THROW_SPEED) {
			// Carried, not thrown: it stays where it was put
			const b = bounds();
			placed = { fx: body.x / b.width, fy: body.y / b.height };
			body.vx = body.vy = 0;
			mode = 'docked';
			sayRaw(pick(placeLines[get(lang)]), 'happy');
			return;
		}
		body.spin = (body.vx / radius) * 0.35;
		hits = 0;
		restMs = 0;
		mode = 'flying';
		if (!muted) shout = plain(pick(shoutLines[get(lang)]));
	}

	// Taps in a row (each within 2.5 s of the last) end in a line of their own
	let tapStreak = 0;
	let calmTimer: ReturnType<typeof setTimeout> | undefined;
	let lastTap = 0;
	let totalTaps = 0;

	function onTap() {
		engine?.bump(0.35);
		if (muted) {
			muted = false;
			engine?.setGag('none');
			store(MUTE_KEY, null);
			sayRaw(unmuteLine[get(lang)], 'shy');
			return;
		}
		const now = performance.now();
		tapStreak = now - lastTap < 2500 ? tapStreak + 1 : 1;
		lastTap = now;
		totalTaps++;
		const l = get(lang);
		const streakVariants = streakLines[l][tapStreak];
		if (streakVariants) {
			const streak = pick(streakVariants);
			if (streak.anger) {
				// Red and sparky for a few seconds, then it cools down on its own
				engine?.setAngry(true);
				clearTimeout(calmTimer);
				calmTimer = setTimeout(() => {
					if (!dragging) engine?.setAngry(false);
				}, 3600);
			}
			say(streak.text, streak.face);
			if (tapStreak >= 14) tapStreak = 0;
			return;
		}
		// Between milestones, past the fifth tap, it has had enough
		if (tapStreak > 5) {
			sayRaw(pick(annoyedLines[l]), 'angry');
			return;
		}
		const s = season();
		// The third tap always tells about the other bot, so nobody misses it
		const kind = totalTaps === 3 ? 'friend' : pick(TAP_KINDS);
		let pool = clickLines[l];
		// Every line brings its own face; this one is only for a line that has none
		let face: Expression = 'happy';
		if (kind === 'friend') {
			pool = friendLines[l][character];
			face = 'smug'; // a bit of complicity: "psst, I have a friend"
		} else if (kind === 'trivia') {
			pool = triviaLines[l];
			face = 'wink';
		} else if (kind === 'idea') {
			pool = ideaLines[l];
			face = 'tired';
		} else if (s && kind === 'season') {
			pool = seasonLines[l][s];
			face = s === 'night' ? 'sleepy' : 'happy';
		}
		sayRaw(pick(pool), face);
	}

	// ── Personality: it speaks up when left alone, and when you come back ──
	const IDLE_MS = 30000; // no interaction for this long
	const IDLE_GAP_MS = 45000; // and at most one such line per this
	const DOZE_MS = 75000; // no interaction for this long and it dozes off
	let lastActivity = performance.now();
	let lastIdleLine = -IDLE_GAP_MS;
	let dozing = false;

	// Any sign of life: remember it, and wake up if it was dozing
	function touch(now = performance.now()) {
		lastActivity = now;
		if (!dozing) return;
		dozing = false;
		engine?.setExpression('wow');
		setTimeout(() => {
			if (!dozing && !speaking && mode === 'docked') engine?.setExpression('normal');
		}, 1400);
	}
	let hiddenAt = 0;
	let idleTimer: ReturnType<typeof setInterval> | undefined;

	function onIdleCheck() {
		const now = performance.now();
		if (
			document.hidden ||
			!visible ||
			muted ||
			mode !== 'docked' ||
			traveling ||
			speaking ||
			swapping
		)
			return;
		if (!dozing && now - lastActivity > DOZE_MS) {
			dozing = true;
			engine?.setExpression('sleepy');
			return;
		}
		// Asleep: no chatter until something wakes it
		if (dozing) return;
		if (dragging || now - lastActivity < IDLE_MS || now - lastIdleLine < IDLE_GAP_MS) return;
		lastIdleLine = now;
		const l = get(lang);
		const kind = pick(IDLE_KINDS);
		const pool = kind === 'trivia' ? triviaLines[l] : kind === 'idea' ? ideaLines[l] : idleLines[l];
		sayRaw(pick(pool), pool === ideaLines[l] ? 'tired' : 'wink');
	}

	function onActivity() {
		touch();
	}

	function onVisibility() {
		const now = performance.now();
		if (document.hidden) {
			hiddenAt = now;
			return;
		}
		touch(now);
		if (hiddenAt && now - hiddenAt > 60000 && visible && !muted && mode === 'docked')
			sayRaw(pick(backTabLines[get(lang)]), 'happy');
		hiddenAt = 0;
	}

	// ↑↑↓↓←→←→BA (outside text fields): a jump, a spin, a line on landing
	const KONAMI = [
		'arrowup',
		'arrowup',
		'arrowdown',
		'arrowdown',
		'arrowleft',
		'arrowright',
		'arrowleft',
		'arrowright',
		'b',
		'a'
	];
	let konamiKeys: string[] = [];

	function onKey(e: KeyboardEvent) {
		touch();
		const t = e.target as HTMLElement | null;
		if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
		konamiKeys = [...konamiKeys, e.key.toLowerCase()].slice(-KONAMI.length);
		if (konamiKeys.length < KONAMI.length || !konamiKeys.every((k, i) => k === KONAMI[i])) return;
		konamiKeys = [];
		if (!visible || muted || mode !== 'docked' || reducedMotion) return;
		// Not only the jump: sometimes a scene (never on phones, never over another one)
		const pickScene = pick(KONAMI_SCENES);
		if (pickScene === 'daft' && engine && !strip && !swapping && !riding) {
			void runDaftPunk();
			return;
		}
		const k = parseLine(pick(konamiLines[get(lang)]), 'star');
		queued = { line: k.text, face: k.face };
		playful = true;
		hits = 0;
		restMs = 0;
		body.vy = -1500;
		body.vx = (Math.random() < 0.5 ? -1 : 1) * 300;
		body.spin = 18;
		engine?.bump(1);
		mode = 'flying';
	}

	function onWindowPointerMove(e: PointerEvent) {
		touch();
		engine?.lookAt(e.clientX - body.x, e.clientY - body.y);
		// In a scene everyone on stage follows the pointer; the synth keeps its tilt from above
		guestEngine?.lookAt(e.clientX - guest.x, e.clientY - guest.y);
		synthEngine?.lookAt(e.clientX - synthAt.x, 250 + (e.clientY - synthAt.y) * 0.5);
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
		touch(now);
		const dt = now - lastScrollT;
		const instant = dt > 0 && dt < 400 ? (Math.abs(scrollY - lastScrollY) / dt) * 1000 : 0;
		scrollSpeed = scrollSpeed * 0.6 + instant * 0.4;
		lastScrollY = scrollY;
		lastScrollT = now;
		clearTimeout(settleTimer);
		settleTimer = setTimeout(settle, 280);
		if (riding && scrollY < 24) endRide();
	}

	function onSectionInView(id: SectionId) {
		inView = id;
		if (scrollSpeed < SLOW_SCROLL) settle();
	}

	function settle() {
		// The page stopped: the ride is over, wherever it got to. The speed is only measured
		// on scroll events, so it would stay at its last value after a flick (phones): reset it,
		// or a card comment waiting for a slow page would wait forever
		scrollSpeed = 0;
		if (riding) endRide();
		if (pendingCard !== null) tryCardComment();
		if (inView === section) return;
		section = inView;
		if (mode !== 'docked') return;
		// Leave first, talk on arrival: the line is queued until the glide ends
		const a = baseAnchor();
		if (!reducedMotion && Math.hypot(a.x - body.x, a.y - body.y) > ARRIVED) traveling = true;
		// A back-to-top quip is still pending: it is the one to hear on arrival
		if (performance.now() < quipUntil) return;
		const line = sectionLine(section);
		say(fill(line.text), line.face);
	}

	// Only a project the visitor opens (carousel or mosaic) gets a comment; while the
	// carousel turns on its own he stays quiet
	function onProjectOpen(e: Event) {
		const line = projectLines[get(lang)][(e as CustomEvent<string>).detail];
		if (!line || mode !== 'docked') return;
		sayRaw(line, 'wow');
	}

	function onProjectsView(e: Event) {
		const view = (e as CustomEvent<'grid' | 'carousel'>).detail;
		sayRaw(pick(projectsViewLines[get(lang)][view]), view === 'grid' ? 'wow' : 'happy');
	}

	// ── Back to top: a lift for a short hop, a rocket ride (and a scream) from far down ──
	let riding = false;
	let rideLag = 0;
	/** Until then the section's own line stays quiet, so the quip about the trip is heard */
	let quipUntil = 0;
	let rideTimer: ReturnType<typeof setTimeout> | undefined;

	function onBackToTop(e: Event) {
		if (!visible || !engine || riding || swapping || mode !== 'docked') return;
		const from = (e as CustomEvent<{ from: number }>).detail.from;
		const l = get(lang);
		quipUntil = performance.now() + 5000;
		if (reducedMotion || from < innerHeight * 2) {
			sayRaw(pick(elevatorLines[l]), 'happy');
			return;
		}
		riding = true;
		launchTail = Math.round(size * 0.95);
		canvas.style.height = `${size + launchTail}px`;
		engine.setRocket(true);
		engine.setThrust(true);
		engine.bump(0.7);
		engine.setExpression('wow');
		engine.setTalking(true);
		if (!muted) shout = plain(pick(rideShouts[l]));
		// Safety net: the page may never report that it stopped
		rideTimer = setTimeout(endRide, 9000);
	}

	function endRide() {
		if (!riding) return;
		riding = false;
		quipUntil = performance.now() + 4000;
		clearTimeout(rideTimer);
		shout = null;
		engine?.setTalking(false);
		engine?.setThrust(false);
		// The rocket stays on a moment, then is gone
		setTimeout(() => {
			if (riding || swapping) return;
			engine?.setRocket(false);
			canvas.style.height = '';
		}, 700);
		sayRaw(pick(rideEndLines[get(lang)]), 'dizzy');
	}

	// ── Experience cards: a comment on each as it passes the middle of the screen ──
	const seenCards = new Set<number>();
	let pendingCard: number | null = null;
	let cardRetry: ReturnType<typeof setTimeout> | undefined;
	let lastSayAt = 0;

	function onExperienceCard(e: Event) {
		pendingCard = (e as CustomEvent<number>).detail;
		tryCardComment();
	}

	function tryCardComment() {
		clearTimeout(cardRetry);
		const idx = pendingCard;
		if (idx === null || seenCards.has(idx) || !visible || muted) return;
		const lines = experienceLines[get(lang)][idx];
		// Left the section, or no lines for this card: nothing to say
		if (!lines || inView !== 'experience') {
			pendingCard = null;
			return;
		}
		// Not while it is busy, the page rushes by, or it has just spoken: try again shortly
		const busy =
			mode !== 'docked' ||
			swapping ||
			riding ||
			scrollSpeed >= SLOW_SCROLL ||
			performance.now() - lastSayAt < 4500;
		if (busy) {
			cardRetry = setTimeout(tryCardComment, 1200);
			return;
		}
		seenCards.add(idx);
		pendingCard = null;
		sayRaw(pick(lines), 'wink');
	}

	// Alive even when nobody is talking to it: a quick glance, a wink, then back to normal
	let glanceTimer: ReturnType<typeof setInterval> | undefined;

	function onGlance() {
		if (document.hidden || !visible || mode !== 'docked' || traveling || speaking) return;
		if (dozing || swapping || riding || Math.random() < 0.4) return;
		engine?.setExpression(pick(GLANCES));
		setTimeout(() => {
			if (!speaking && !dozing && mode === 'docked') engine?.setExpression('normal');
		}, 1400);
	}

	function onSkillsCategory(e: Event) {
		const key = (e as CustomEvent<keyof Translations | null>).detail;
		const l = get(lang);
		if (key === null) {
			sayRaw(pick(allSkillsLine[l]), 'star');
			return;
		}
		const n = skillCategories.find((c) => c.key === key)?.icons.length ?? 0;
		const own = categoryLines[l][key];
		const text = own ? pick(own).replace('{c}', String(n)) : categoryLine[l](get(t)[key], n);
		sayRaw(text, 'wow');
	}

	// ── Swapping bots: the new one flies in, they greet, the old one leaves on a rocket ──
	let guestEl: HTMLDivElement | undefined = $state();
	let guestCanvas: HTMLCanvasElement | undefined = $state();
	let guestShown = $state(false);
	let swapping = $state(false);
	let guestEngine: VoxelMascot | null = null;
	const guest = { x: 0, y: 0, vx: 0, vy: 0 };
	let guestSide = 1;
	let swapToken: object | null = null;
	let pendingSwap: CharacterId | null = null;
	let launchDone: (() => void) | null = null;
	let launchT = 0;
	let launchTail = 0;

	// ── Konami scene: the DJ duo (the swap's guest bot and flags are reused) ──
	let sceneGoal: { x: number; y: number } | null = null;
	let guestGoal: { x: number; y: number } | null = null;
	let sceneSwapped = false;
	let beatTimer: ReturnType<typeof setInterval> | undefined;
	let synthEl: HTMLDivElement | undefined = $state();
	let synthCanvas: HTMLCanvasElement | undefined = $state();
	let synthEngine: VoxelMascot | null = null;
	const synthAt = { x: 0, y: 0 };
	/** With two bots on stage the bubble's side (above or below them) is chosen once */
	let duoBelow: boolean | null = null;
	let synthShown = $state(false);

	function sceneKit() {
		const token = {};
		swapToken = token;
		swapping = true;
		const alive = () => swapToken === token;
		const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
		const until = async (cond: () => boolean, max: number) => {
			const t0 = performance.now();
			while (alive() && !cond() && performance.now() - t0 < max) await wait(60);
		};
		const speak = async (raw: string, fallback: Expression, who: 'main' | 'guest', ms: number) => {
			await until(() => !traveling, 2500);
			if (!alive()) return;
			engine?.setTalking(false);
			guestEngine?.setTalking(false);
			speaker = who;
			sayRaw(raw, fallback);
			await wait(ms);
		};
		return { alive, wait, until, speak };
	}

	// Turi goes for a coffee; two helmeted bots arrive, play, and leave; Turi comes back
	async function runDaftPunk() {
		const { alive, wait, until, speak } = sceneKit();
		const L = sceneLines[get(lang)].daft;
		// Turi turns up as Thomas (silver), the Arancino as Guy-Man (gold); the other one joins
		const mine: ModelId = character === 'turi' ? 'thomas' : 'guyman';
		const other: ModelId = mine === 'thomas' ? 'guyman' : 'thomas';
		try {
			const { createVoxelMascot } = await import('./voxelEngine');
			if (!alive()) return;
			const home = baseAnchor();
			const gap = size * 0.62;
			const cx = Math.max(gap + size * 0.6, Math.min(innerWidth - gap - size * 0.6, home.x));
			// Low enough that their lines fit above them
			const cy = Math.min(innerHeight - size * 0.75, Math.max(home.y, NAV_H + size * 0.36 + 160));
			// It leaves by the nearest edge and comes back disguised from the same one
			const side = home.x > innerWidth / 2 ? 1 : -1;
			const offX = side > 0 ? innerWidth + size : -size;
			const gone = () => body.x < -size * 0.6 || body.x > innerWidth + size * 0.6;
			await speak(pick(L.leave), 'smug', 'main', 2200);
			if (!alive()) return;
			sceneGoal = { x: offX, y: cy };
			await until(gone, 3500);
			if (!alive()) return;
			speaking = false;

			// The duo: its own helmet on its side, the other helmet opposite
			sceneSwapped = true;
			engine?.setCharacter(mine);
			guest.x = side > 0 ? -size : innerWidth + size;
			guest.y = cy;
			guest.vx = guest.vy = 0;
			const mainSpot = { x: cx + side * gap, y: cy };
			guestGoal = { x: cx - side * gap, y: cy };
			guestShown = true;
			synthShown = true;
			await tick();
			if (!alive() || !guestCanvas || !guestEl) return abortSwap();
			guestEl.style.width = guestEl.style.height = `${size}px`;
			// The synth stands in front of them, a little lower: a voxel model of its own,
			// still (no hover), seen a little from above
			const W = size * 1.25;
			if (synthEl && synthCanvas) {
				synthEl.style.width = synthEl.style.height = `${W}px`;
				synthEl.style.transform = `translate3d(${cx - W / 2}px, ${cy + size * 0.32 - W / 2}px, 0)`;
				synthEngine = createVoxelMascot(synthCanvas, 'synth', true);
				synthAt.x = cx;
				synthAt.y = cy + size * 0.32;
				synthEngine.lookAt(0, 500);
				synthEngine.setExpression(pick(SYNTH_LEDS));
			}
			guestEngine = createVoxelMascot(guestCanvas, other, reducedMotion);
			guestEngine.setExpression('happy');
			sceneGoal = mainSpot;
			engine?.setExpression('smug');
			await until(
				() =>
					Math.hypot(guestGoal!.x - guest.x, guestGoal!.y - guest.y) < 30 &&
					Math.hypot(mainSpot.x - body.x, mainSpot.y - body.y) < 30,
				4500
			);
			if (!alive()) return;
			beatTimer = setInterval(() => {
				engine?.bump(0.22);
				guestEngine?.bump(0.22);
				synthEngine?.bump(0.12);
				synthEngine?.setExpression(pick(SYNTH_LEDS));
			}, 480);
			for (const [i, raw] of L.chat.entries()) {
				await speak(raw, 'happy', i % 2 === 0 ? 'guest' : 'main', 2600);
				if (!alive()) return;
			}
			speaking = false;
			clearInterval(beatTimer);

			// They leave; the synth fades out as they go
			if (synthEl) synthEl.style.opacity = '0';
			sceneGoal = { x: offX, y: cy };
			guestGoal = { x: side > 0 ? -size : innerWidth + size, y: cy };
			// Both off the screen before the guest is dropped, so nobody vanishes in plain sight
			await until(
				() => gone() && (guest.x < -size * 0.6 || guest.x > innerWidth + size * 0.6),
				4500
			);
			if (!alive()) return;
			guestShown = false;
			guestEngine?.dispose();
			guestEngine = null;
			guestGoal = null;

			// Turi again, without the helmet, as if nothing had happened
			engine?.setCharacter(character);
			sceneSwapped = false;
			sceneGoal = null;
			await until(() => !traveling, 4000);
			await wait(200);
			if (!alive()) return;
			speaker = 'main';
			sayRaw(pick(L.back), 'worried');
		} catch {
			/* whatever went wrong, endSwap puts everything back */
		}
		endSwap();
	}

	// Where the newcomer stands: beside the one on stage, on the side with room
	function guestTargetX() {
		if (guestGoal) return guestGoal.x;
		// In the strip there is no room beside it: the newcomer stands just below
		if (strip) return Math.min(innerWidth - radius, body.x + size * 0.45);
		return Math.max(radius, Math.min(innerWidth - radius, body.x + guestSide * size * 0.92));
	}
	const guestTargetY = () =>
		guestGoal ? guestGoal.y : strip ? navBottom + stripHeight() + size * 0.5 : body.y;

	function endSwap() {
		if (sceneSwapped) {
			engine?.setCharacter(character);
			sceneSwapped = false;
		}
		sceneGoal = guestGoal = null;
		synthShown = false;
		synthEngine?.dispose();
		synthEngine = null;
		duoBelow = null;
		clearInterval(beatTimer);
		guestEngine?.dispose();
		guestEngine = null;
		guestShown = false;
		engine?.setThrust(false);
		engine?.setRocket(false);
		canvas.style.height = '';
		speaker = 'main';
		swapping = false;
		swapToken = null;
		launchDone = null;
		shout = null;
		if (mode === 'launching') mode = 'docked';
	}

	function abortSwap() {
		endSwap();
		pendingSwap = null;
	}

	async function runSwap(to: CharacterId) {
		const token = {};
		swapToken = token;
		swapping = true;
		const lines = swapLines[get(lang)][to];
		const alive = () => swapToken === token;
		const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
		const until = async (cond: () => boolean, max: number) => {
			const t0 = performance.now();
			while (alive() && !cond() && performance.now() - t0 < max) await wait(60);
		};
		const speak = async (raw: string, fallback: Expression, who: 'main' | 'guest', ms: number) => {
			await until(() => !traveling, 2500);
			if (!alive()) return;
			engine?.setTalking(false);
			guestEngine?.setTalking(false);
			speaker = who;
			sayRaw(raw, fallback);
			await wait(ms);
		};
		try {
			const { createVoxelMascot } = await import('./voxelEngine');
			if (!alive()) return;
			// Arrives from the screen edge on its side
			guestSide = body.x > innerWidth / 2 ? -1 : 1;
			guest.x = guestSide > 0 ? innerWidth + size : -size;
			guest.y = body.y - size * 0.5;
			guest.vx = guest.vy = 0;
			guestShown = true;
			await tick();
			if (!alive() || !guestCanvas || !guestEl) return abortSwap();
			guestEl.style.width = guestEl.style.height = `${size}px`;
			guestEngine = createVoxelMascot(guestCanvas, to, reducedMotion);
			guestEngine.setExpression('happy');
			await until(() => Math.hypot(guestTargetX() - guest.x, guestTargetY() - guest.y) < 30, 2800);
			if (!alive()) return;

			// They greet each other
			engine?.setExpression('happy');
			engine?.bump(0.5);
			guestEngine.bump(0.5);
			guestEngine.lookAt(body.x - guest.x, 0);
			await speak(pick(lines.bye), 'happy', 'main', 2500);
			if (!alive()) return;
			await speak(pick(lines.hello), 'happy', 'guest', 2300);
			if (!alive()) return;

			// Rocket on, countdown, lift-off
			speaker = 'main';
			speaking = false;
			clearInterval(typeTimer);
			engine?.setTalking(false);
			guestEngine?.setTalking(false);
			launchTail = Math.round(size * 0.95);
			canvas.style.height = `${size + launchTail}px`;
			engine?.setRocket(true);
			engine?.bump(0.7);
			engine?.setExpression('worried');
			for (const n of ['3…', '2…', '1…']) {
				shout = n;
				await wait(520);
				if (!alive()) return;
			}
			engine?.setThrust(true);
			engine?.setExpression('star');
			shout = plain(pick(lines.go));
			await wait(450);
			if (!alive()) return;
			launchT = 0;
			body.vy = -80;
			mode = 'launching';
			await Promise.race([new Promise<void>((r) => (launchDone = r)), wait(5000)]);
			if (!alive()) return;

			// The newcomer takes the stage where it stands: same model, same spot
			body.x = guest.x;
			body.y = guest.y;
			body.vx = body.vy = body.angle = body.spin = 0;
			mode = 'docked';
			character = to;
			engine?.setCharacter(to);
			queued = null;
			hits = 0;
			endSwap();
		} catch {
			// Anything unexpected: just switch, without the show
			if (swapToken === token) {
				endSwap();
				character = to;
				engine?.setCharacter(to);
			}
		}
		if (pendingSwap && pendingSwap !== character) {
			const next = pendingSwap;
			pendingSwap = null;
			void runSwap(next);
		} else pendingSwap = null;
	}

	function onMascotSet(e: Event) {
		const id = (e as CustomEvent<CharacterId | 'off'>).detail;
		store(CHAR_KEY, id);
		if (id === 'off') {
			if (swapping) abortSwap();
			visible = false;
			return;
		}
		if (swapping) {
			pendingSwap = id;
			return;
		}
		const wasVisible = visible;
		visible = true;
		if (wasVisible && id === character) {
			sayRaw(pick(clickLines[get(lang)]), 'happy');
			return;
		}
		// Both bots on screen and motion allowed: they swap with a little show
		if (wasVisible && engine && !reducedMotion && mode === 'docked' && !riding) {
			void runSwap(id);
			return;
		}
		character = id;
		if (engine) engine.setCharacter(id);
		else void start(id); // it was saved as off: load three.js only now
		sayRaw(pick(clickLines[get(lang)]), 'happy');
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
			if (muted) engine.setGag(pick(GAGS));
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
		setTimeout(greet, 900);
	}

	// The first line, said once (on a phone as soon as the strip is up, else when Turi has arrived)
	let greeted = false;
	function greet() {
		if (greeted) return;
		greeted = true;
		const s = season();
		const line = s ? parseLine(pick(seasonLines[get(lang)][s]), 'happy') : sectionLine(section);
		say(fill(line.text), line.face);
	}

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		muted = load(MUTE_KEY) === '1';
		const param = new URLSearchParams(location.search).get('mascot');
		const saved = param ?? load(CHAR_KEY);
		character = (CHARACTER_IDS as string[]).includes(saved ?? '') ? (saved as CharacterId) : 'turi';
		visible = saved !== 'off';

		applyLayout();
		// Fly in from the right edge (on a phone, straight into the strip)
		body.x = strip ? dock.x : innerWidth + size;
		body.y = strip ? -size : innerHeight * anchors.home.y;
		// The strip has room for words before three.js is there: it doesn't stay blank
		if (strip && visible) setTimeout(greet, 700);

		// Load three.js only once the page has settled, so it never competes with first paint
		const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1200));
		// Saved as off: three.js loads only if the terminal brings the mascot back
		if (visible) idle(() => void start(character), { timeout: 3000 });

		window.addEventListener('resize', onResize);
		window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('project-open', onProjectOpen);
		window.addEventListener('skills-category', onSkillsCategory);
		window.addEventListener('projects-view', onProjectsView);
		window.addEventListener('back-to-top', onBackToTop);
		window.addEventListener('experience-card', onExperienceCard);
		glanceTimer = setInterval(onGlance, 7000);
		window.addEventListener('mascot-set', onMascotSet);
		window.addEventListener('keydown', onKey);
		window.addEventListener('pointerdown', onActivity, { passive: true });
		document.addEventListener('visibilitychange', onVisibility);
		idleTimer = setInterval(onIdleCheck, 4000);
		return () => {
			cancelled = true;
			clearTimeout(resizeTimer);
			window.removeEventListener('resize', onResize);
			document.documentElement.style.removeProperty('--turi-strip');
			swapToken = null;
			guestEngine?.dispose();
			clearInterval(idleTimer);
			cancelAnimationFrame(raf);
			clearInterval(typeTimer);
			clearTimeout(hideTimer);
			clearTimeout(settleTimer);
			observer?.disconnect();
			colorObserver?.disconnect();
			engine?.dispose();
			window.removeEventListener('pointermove', onWindowPointerMove);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('project-open', onProjectOpen);
			window.removeEventListener('skills-category', onSkillsCategory);
			window.removeEventListener('projects-view', onProjectsView);
			window.removeEventListener('back-to-top', onBackToTop);
			window.removeEventListener('experience-card', onExperienceCard);
			clearInterval(glanceTimer);
			clearTimeout(cardRetry);
			clearTimeout(rideTimer);
			clearTimeout(calmTimer);
			window.removeEventListener('mascot-set', onMascotSet);
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('pointerdown', onActivity);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});
</script>

<div class="mascot" class:is-hidden={!visible} class:is-busy={swapping} bind:this={el}>
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

{#if guestShown}
	<div class="mascot mascot-guest" bind:this={guestEl}>
		<canvas bind:this={guestCanvas} aria-hidden="true"></canvas>
	</div>
{/if}

{#if synthShown}
	<div class="mascot-synth" bind:this={synthEl} aria-hidden="true">
		<canvas bind:this={synthCanvas}></canvas>
	</div>
{/if}

{#if visible && shout}
	<div class="mascot-shout" bind:this={shoutEl} aria-hidden="true">{shout}</div>
{/if}

{#if strip && visible}
	<div class="mascot-strip" class:is-muted={muted} bind:this={stripEl}>
		<span class="mascot-dock" aria-hidden="true"></span>
		<div class="mascot-say {fit}" class:is-dim={!speaking}>
			{#if muted}
				<p class="mascot-hint">
					{$lang === 'it'
						? 'Turi è in silenzio. Toccalo per riattivarlo.'
						: 'Turi is muted. Tap him to bring him back.'}
				</p>
			{:else if !runs.length}
				<p class="mascot-hint">
					{$lang === 'it' ? 'Un attimo, assemblo i cubetti…' : 'One sec, assembling my cubes…'}
				</p>
			{:else}
				<!-- The typed text is for the eyes; screen readers get the whole line once -->
				<p aria-hidden="true">
					{#each typedRuns as r}{#if r.bold}<strong>{r.text}</strong>{:else}{r.text}{/if}{/each}
				</p>
				<p class="mascot-sr" aria-live="polite">{runs.map((r) => r.text).join('')}</p>
				<button class="mascot-mute" aria-label={$lang === 'it' ? 'Zittisci' : 'Mute'} onclick={mute}
					>×</button
				>
			{/if}
		</div>
	</div>
{/if}

{#if visible && speaking && !muted && !strip}
	<div class="mascot-bubble" class:is-away={traveling} bind:this={bubbleEl}>
		<p>
			{#each typedRuns as r}{#if r.bold}<strong>{r.text}</strong>{:else}{r.text}{/if}{/each}
		</p>
		<button class="mascot-mute" aria-label={$lang === 'it' ? 'Zittisci' : 'Mute'} onclick={mute}
			>×</button
		>
	</div>
{/if}
