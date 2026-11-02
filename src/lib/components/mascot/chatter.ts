import type { Expression } from './characters';
import type { Line } from './mascotData';

/**
 * Which line Turi says when it has something to say on its own (a tap, a quiet spell).
 *
 * Several sources compete (its own lines, curiosities, the current section, the season…), and
 * the choice is made in two steps, source first and then line, so a big set can't drown a
 * small one and a small one can't come back every few taps:
 *
 *  - Freshness of a line: 0.12 to the power of how many times it was said, where the count
 *    fades with a ten-minute half-life, so a repeat is strongly discouraged and becomes
 *    possible again only slowly. Everything lives in memory: a refresh forgets it all.
 *  - Health of a source: the mean freshness of its lines. A source weighs health^1.5, and a
 *    small set (fewer than eight lines) below 0.4 sits out until its lines recover.
 *  - Fatigue of a source: each line it says adds one, which fades with a 90 s half-life.
 *  - Variety: the source that spoke last counts less, and so does a line that shares a
 *    keyword (a bold word: an artist, a film, a place) with the last few lines.
 *  - Size: a set with fewer than eight lines counts for less, however much it is wanted.
 *  - Context: the caller can boost a source (the section's lines after a while in it).
 */

export type Source = {
	id: string;
	lines: readonly (string | Line)[];
	weight: number;
	face: Expression;
	/** Context multiplier chosen by the caller, 1 by default */
	boost?: number;
};

export type Choice = { raw: string; face: Expression; source: string };

const COUNT_HALF_LIFE = 600_000;
const FATIGUE_HALF_LIFE = 90_000;
const REPEAT_PENALTY = 0.12;
const RECENT = 6;
const KEYWORD_WINDOW = 3;

const text = (l: string | Line) => (typeof l === 'string' ? l : l.text);

// The bold words of a line, lowercased: its topics
const topicCache = new Map<string, string[]>();
function topics(raw: string): string[] {
	let t = topicCache.get(raw);
	if (!t) {
		t = [...raw.matchAll(/\*\*(.+?)\*\*/g)]
			.map((m) =>
				m[1]
					.toLowerCase()
					.replace(/[“”".,!?:;]/g, '')
					.trim()
			)
			.filter((w) => w.length > 2);
		topicCache.set(raw, t);
	}
	return t;
}

export function createChooser(now: () => number = () => performance.now(), rand = Math.random) {
	const lines = new Map<string, { count: number; at: number }>();
	const sources = new Map<string, { fatigue: number; at: number }>();
	let recent: { raw: string; source: string }[] = [];

	const decay = (since: number, half: number) => 0.5 ** ((now() - since) / half);

	function freshness(raw: string): number {
		const r = lines.get(raw);
		if (!r) return 1;
		return REPEAT_PENALTY ** (r.count * decay(r.at, COUNT_HALF_LIFE));
	}

	function fatigue(id: string): number {
		const s = sources.get(id);
		return s ? s.fatigue * decay(s.at, FATIGUE_HALF_LIFE) : 0;
	}

	/** Remember that a line was said (also for lines said outside `choose`, like a greeting) */
	function note(raw: string, source = 'other') {
		const r = lines.get(raw);
		// Fold the faded count in before adding the new one
		const count = r ? r.count * decay(r.at, COUNT_HALF_LIFE) : 0;
		lines.set(raw, { count: count + 1, at: now() });
		const f = fatigue(source) + 1;
		sources.set(source, { fatigue: f, at: now() });
		recent = [{ raw, source }, ...recent].slice(0, RECENT);
	}

	function choose(candidates: Source[]): Choice | null {
		const pool = candidates.filter((s) => s.lines.length);
		if (!pool.length) return null;

		// Topics shared by many lines say nothing (a place name in half the Arancino's lines)
		const total = pool.reduce((a, s) => a + s.lines.length, 0);
		const freq = new Map<string, number>();
		for (const s of pool)
			for (const l of s.lines)
				for (const k of new Set(topics(text(l)))) freq.set(k, (freq.get(k) ?? 0) + 1);
		const specific = (k: string) => (freq.get(k) ?? 0) <= Math.max(3, total * 0.1);
		const lastTopics = new Set(
			recent
				.slice(0, KEYWORD_WINDOW)
				.flatMap((r) => topics(r.raw))
				.filter(specific)
		);
		const lastSource = recent[0]?.source;
		const beforeSource = recent[1]?.source;
		const recentRaws = new Set(recent.map((r) => r.raw));

		const scored = pool.map((s) => {
			const w = s.lines.map((l) => {
				const raw = text(l);
				if (recentRaws.has(raw)) return 0;
				const shared = topics(raw).some((k) => lastTopics.has(k) && specific(k));
				return freshness(raw) * (shared ? 0.35 : 1);
			});
			const health = w.reduce((a, x) => a + x, 0) / s.lines.length;
			const size = Math.min(1, s.lines.length / 8) ** 0.8;
			let score = s.weight * (s.boost ?? 1) * size * health ** 1.5;
			// A small set that has been heard sits out its turn until its lines recover
			if (s.lines.length < 8 && health < 0.4) score = 0;
			score /= 1 + 0.8 * fatigue(s.id);
			if (s.id === lastSource) score *= 0.55;
			else if (s.id === beforeSource) score *= 0.8;
			return { s, w, score };
		});

		let sum = scored.reduce((a, x) => a + x.score, 0);
		let pick = scored[scored.length - 1];
		if (sum > 1e-9) {
			let r = rand() * sum;
			pick = scored.find((x) => (r -= x.score) <= 0) ?? pick;
		} else {
			// Everything has just been said: the least stale line anywhere, not silence
			pick = scored.reduce((a, x) => (Math.max(...x.w) > Math.max(...a.w) ? x : a));
			sum = 0;
		}

		const lw = pick.w;
		const lsum = lw.reduce((a, x) => a + x, 0);
		let i = lw.length - 1;
		if (lsum > 1e-9) {
			let r = rand() * lsum;
			i = lw.findIndex((x) => (r -= x) <= 0);
			if (i < 0) i = lw.length - 1;
		} else i = lw.indexOf(Math.max(...lw));
		const line = pick.s.lines[i];
		const raw = text(line);
		note(raw, pick.s.id);
		return { raw, face: typeof line === 'string' ? pick.s.face : line.face, source: pick.s.id };
	}

	return { choose, note, freshness };
}
