import type { Lang } from '$lib/i18n';

const baseTextsMap: Record<Lang, string[]> = {
	en: [
		'AI/ML Engineer',
		'Data Scientist',
		'Ethical Hacker',
		'Star Wars Fanatic',
		'Daft Punk Lover',
		'Tame Impala Listener',
		'Cars Enthusiast',
		'Anime Enjoyer',
		'Literally Ryan Gosling',
		'Cyberpunk Dreamer'
	],
	it: [
		'AI/ML Engineer',
		'Data Scientist',
		'Ethical Hacker',
		'Fanatico di Star Wars',
		'Fan dei Daft Punk',
		'Ascoltatore di Tame Impala',
		'Appassionato di Auto',
		'Amante degli Anime',
		'Letteralmente Ryan Gosling',
		'Sognatore Cyberpunk'
	]
};

const seasonalGreetingsMap: Record<Lang, Record<string, string[]>> = {
	en: {
		snow: ['Merry Christmas!'],
		newyear: ['Happy New Year!']
	},
	it: {
		snow: ['Buon Natale!'],
		newyear: ['Felice Anno Nuovo!']
	}
};

export function getBaseTexts(lang: Lang): string[] {
	return baseTextsMap[lang];
}

export function getSeasonalGreetings(lang: Lang): Record<string, string[]> {
	return seasonalGreetingsMap[lang];
}
