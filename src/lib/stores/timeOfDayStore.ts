import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type TimeOfDay = 'day' | 'night';

const STORAGE_KEY = 'portfolio-tod-override';

function hoursToTimeOfDay(hours: number): TimeOfDay {
	return hours >= 7 && hours < 19 ? 'day' : 'night';
}

function readManualOverride(): TimeOfDay | null {
	if (!browser) return null;
	const saved = localStorage.getItem(STORAGE_KEY);
	return saved === 'day' || saved === 'night' ? saved : null;
}

let manualOverride: TimeOfDay | null = readManualOverride();

/**
 * Mirrors the inline script in app.html (sets tod-day/tod-night on <body>
 * before first paint) — keep both in sync. Computed eagerly, same reasoning
 * as seasonStore's calendarSeason(): the store's first value already matches
 * <body>, so there's nothing to "correct" after mount, and no flash.
 */
function computeTimeOfDay(): TimeOfDay {
	if (!browser) return 'day';
	return manualOverride ?? hoursToTimeOfDay(new Date().getHours());
}

export const timeOfDay = writable<TimeOfDay>(computeTimeOfDay());

let recheckInterval: ReturnType<typeof setInterval> | undefined;

/** Call from onMount in the root layout to start the periodic re-check. */
export function initTimeOfDay() {
	if (!browser) return;

	// Cheap periodic re-check so a tab left open across the day/night boundary
	// updates on its own; a manual override takes precedence until cleared.
	recheckInterval = setInterval(
		() => {
			timeOfDay.set(manualOverride ?? hoursToTimeOfDay(new Date().getHours()));
		},
		5 * 60 * 1000
	);
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
