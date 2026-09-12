import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Season = 'default' | 'newyear' | 'snow' | 'summer';

/**
 * Mirrors the inline script in app.html (which sets the season-* class on
 * <body> before first paint) and dateSeason() in Hero.svelte — keep all
 * three in sync. Computed eagerly (not behind onMount) so the store's very
 * first value already matches what's on <body>: no "default, then correct"
 * flash. Safe because season only ever drives body classes/inline
 * styles — never SSR-rendered text — so there's no hydration-mismatch
 * concern in starting from the real value on the client.
 */
function calendarSeason(): Season {
	if (!browser) return 'default';
	const d = new Date();
	const m = d.getMonth();
	const day = d.getDate();
	if ((m === 11 && day === 31) || (m === 0 && day <= 2)) return 'newyear';
	if ((m === 11 && day >= 1 && day <= 30) || (m === 0 && day >= 3 && day <= 6)) return 'snow';
	if (m >= 5 && m <= 7) return 'summer';
	return 'default';
}

export const currentSeason = writable<Season>(calendarSeason());

export function setSeason(season: Season) {
	currentSeason.set(season);
}

/** Back to calendar-based automatic detection (not forced to 'default'). */
export function resetSeason() {
	currentSeason.set(calendarSeason());
}
