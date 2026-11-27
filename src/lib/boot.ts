// Start-up orchestration. The prerendered HTML is English and static, so everything stays behind a
// dark curtain (#boot in app.html) until the app has hydrated in the visitor's language and the
// pieces that would otherwise pop in (fonts, profile photo, galaxy) are ready or out of time.
// Opening it sets `data-ready` on <html>, which CSS keys the whole entrance off:
// background -> navbar -> hero text -> typing -> mascot.
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const booted = writable(false);

let revealed = false;
let started = false;
let resolveBooted: () => void = () => {};
const bootedPromise = new Promise<void>((resolve) => (resolveBooted = resolve));
const tasks: Promise<unknown>[] = [];

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Resolves when the curtain opens (never on the server) */
export const whenBooted = () => bootedPromise;

/** Hold the opening for `task`, but never longer than `maxMs`. Call before `startBoot()`. */
export function bootTask(task: Promise<unknown>, maxMs: number): void {
	tasks.push(Promise.race([task.catch(() => {}), delay(maxMs)]));
}

function reveal() {
	if (revealed) return;
	revealed = true;
	document.documentElement.setAttribute('data-ready', '');
	booted.set(true);
	resolveBooted();
	// Let the curtain finish fading, then drop it
	setTimeout(() => document.getElementById('boot')?.remove(), 1000);
}

export function startBoot(): void {
	if (!browser || started) return;
	started = true;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const fonts = document.fonts?.ready ?? Promise.resolve();
	void Promise.all([
		Promise.race([fonts, delay(1500)]),
		...tasks,
		// A short floor so a fast load doesn't flash the curtain for a single frame
		delay(reduced ? 0 : 350)
	]).then(reveal);
	// Whatever happens, the page opens
	setTimeout(reveal, 3000);
}
