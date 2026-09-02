import { writable } from 'svelte/store';

export type Season = 'default' | 'newyear' | 'snow' | 'summer';

export const currentSeason = writable<Season>('default');

export function setSeason(season: Season) {
	currentSeason.set(season);
}

export function resetSeason() {
	currentSeason.set('default');
}
