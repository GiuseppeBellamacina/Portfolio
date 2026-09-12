import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type TimeOfDay = 'day' | 'night';

const STORAGE_KEY = 'portfolio-tod-override';

/** SSR-safe default (the site's normal, unmodified look) — corrected in initTimeOfDay(). */
export const timeOfDay = writable<TimeOfDay>('day');

function hoursToTimeOfDay(hours: number): TimeOfDay {
	return hours >= 7 && hours < 19 ? 'day' : 'night';
}

let manualOverride: TimeOfDay | null = null;
let recheckInterval: ReturnType<typeof setInterval> | undefined;

/** Call from onMount in the root layout to detect the real time of day after hydration. */
export function initTimeOfDay() {
	if (!browser) return;

	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved === 'day' || saved === 'night') manualOverride = saved;

	const apply = () => {
		timeOfDay.set(manualOverride ?? hoursToTimeOfDay(new Date().getHours()));
	};
	apply();

	// Cheap periodic re-check so a tab left open across the day/night boundary
	// updates on its own; a manual override takes precedence until cleared.
	recheckInterval = setInterval(apply, 5 * 60 * 1000);
}

/** Force a time of day for the session (terminal `day`/`night` commands), sticky until resetTimeOfDay(). */
export function setTimeOfDay(mode: TimeOfDay) {
	manualOverride = mode;
	if (browser) localStorage.setItem(STORAGE_KEY, mode);
	timeOfDay.set(mode);
}

/** Clear the manual override and go back to clock-based detection (terminal `default`/`autotheme`). */
export function resetTimeOfDay() {
	manualOverride = null;
	if (browser) localStorage.removeItem(STORAGE_KEY);
	timeOfDay.set(hoursToTimeOfDay(new Date().getHours()));
}
