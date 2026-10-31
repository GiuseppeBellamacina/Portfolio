import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type TimeOfDay = 'day' | 'night';

/**
 * Day between sunrise and sunset for the date, not fixed hours: a fixed 7–19
 * window stayed "day" for two dark hours every autumn/winter evening.
 * Mirrored by the inline script in app.html — keep both in sync.
 */
// shortcut: fixed Italy position (~42°N, 12.5°E: solar noon ≈ 12:10 standard
// time), within ~15 min there but off elsewhere (seasons inverted in the southern
// hemisphere); use the Geolocation API if visitors abroad matter.
export function isDaytime(d: Date): boolean {
	const rad = Math.PI / 180;
	const dayOfYear =
		Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 864e5) + 1;
	const decl = 23.44 * rad * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);
	const lat = 42 * rad;
	const cosH =
		(Math.sin(-0.833 * rad) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
	const halfDay = Math.acos(cosH) / rad / 15;
	// Standard-time offset is the larger of January/July; the difference is the DST shift
	const standardOffset = Math.max(
		new Date(d.getFullYear(), 0, 1).getTimezoneOffset(),
		new Date(d.getFullYear(), 6, 1).getTimezoneOffset()
	);
	const noon = 12 + 10 / 60 + (standardOffset - d.getTimezoneOffset()) / 60;
	const h = d.getHours() + d.getMinutes() / 60;
	return h >= noon - halfDay && h < noon + halfDay;
}

function timeOfDayNow(): TimeOfDay {
	return isDaytime(new Date()) ? 'day' : 'night';
}

// In memory only: a reload always goes back to the real sunrise/sunset
let manualOverride: TimeOfDay | null = null;

/**
 * Mirrors the inline script in app.html (sets tod-day/tod-night on <body>
 * before first paint) — keep both in sync. Computed eagerly, same reasoning
 * as seasonStore's calendarSeason(): the store's first value already matches
 * <body>, so there's nothing to "correct" after mount, and no flash.
 */
function computeTimeOfDay(): TimeOfDay {
	if (!browser) return 'day';
	return manualOverride ?? timeOfDayNow();
}

export const timeOfDay = writable<TimeOfDay>(computeTimeOfDay());

/** Call from onMount in the root layout to start the periodic re-check. */
export function initTimeOfDay() {
	if (!browser) return;

	// Cheap periodic re-check so a tab left open across the day/night boundary
	// updates on its own; a manual override takes precedence until cleared.
	setInterval(
		() => {
			timeOfDay.set(manualOverride ?? timeOfDayNow());
		},
		5 * 60 * 1000
	);
}

/** Force a time of day until reload or resetTimeOfDay() (terminal `day`/`night` commands). */
export function setTimeOfDay(mode: TimeOfDay) {
	manualOverride = mode;
	timeOfDay.set(mode);
}

/** Clear the manual override and go back to clock-based detection (terminal `default`/`autotheme`). */
export function resetTimeOfDay() {
	manualOverride = null;
	timeOfDay.set(timeOfDayNow());
}
