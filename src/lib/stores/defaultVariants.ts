/**
 * "Default mode" accent variants — blue/emerald/violet are equal-weight
 * siblings of the original violet/indigo palette, applied only when no
 * season is active. One is picked at random on every page load (see
 * +layout.svelte); terminal commands (blue/emerald/violet, and the
 * season/rainbow commands) can also apply one manually.
 *
 * Night mode is intentionally NOT part of this: --primary-color etc. only
 * ever get overridden while in day mode — body.tod-night's own CSS handles
 * night uniformly regardless of which day variant was showing.
 */

export const PALETTE_OVERRIDE_KEYS = [
	'--primary-color',
	'--secondary-color',
	'--accent-color',
	'--neon-pink',
	'--neon-blue',
	'--neon-green',
	'--neon-purple',
	'--bg-dark',
	'--bg-card',
	'--bg-main',
	'--primary-rgb',
	'--secondary-rgb',
	'--indigo-rgb',
	'--neon-pink-rgb',
	'--neon-blue-rgb',
	'--neon-green-rgb',
	'--bg-dark-rgb',
	'--bg-card-rgb',
	'--gradient-1',
	'--gradient-2',
	'--gradient-3',
	'--hero-bg-1',
	'--hero-bg-2',
	'--hero-bg-3',
	'--hero-glow-1',
	'--hero-glow-2',
	'--hero-glow-3',
	...Array.from({ length: 12 }, (_, i) => `--galaxy-c${i + 1}`)
];

export const DEFAULT_DAY_VARIANTS: Record<string, Record<string, string>> = {
	blue: {
		'--primary-color': '#0057ff',
		'--secondary-color': '#bec4cf',
		'--accent-color': '#aac0e8',
		'--neon-pink': '#3e1aff',
		'--neon-blue': '#4295fa',
		'--neon-green': '#0ce9a0',
		'--neon-purple': '#bec4cf',
		'--bg-dark': '#050810',
		'--bg-card': '#091120',
		'--bg-main': '#050810',
		'--primary-rgb': '0, 87, 255',
		'--secondary-rgb': '190, 196, 207',
		'--indigo-rgb': '0, 87, 255',
		'--neon-pink-rgb': '62, 26, 255',
		'--neon-blue-rgb': '66, 149, 250',
		'--neon-green-rgb': '12, 233, 160',
		'--bg-dark-rgb': '5, 8, 16',
		'--bg-card-rgb': '9, 17, 32',
		'--gradient-1': 'linear-gradient(135deg, #0038a3 0%, #0057ff 100%)',
		'--gradient-2': 'linear-gradient(135deg, #aac0e8 0%, #0057ff 100%)',
		'--gradient-3': 'linear-gradient(135deg, #0057ff 0%, #bec4cf 100%)',
		'--hero-bg-1': '#050810',
		'--hero-bg-2': '#0c1322',
		'--hero-bg-3': '#101113',
		'--hero-glow-1': 'rgba(0, 87, 255, 0.12)',
		'--hero-glow-2': 'rgba(190, 196, 207, 0.09)',
		'--hero-glow-3': 'rgba(62, 26, 255, 0.06)',
		'--galaxy-c1': '#ffffff',
		'--galaxy-c2': '#dae0e9',
		'--galaxy-c3': '#b4c5e5',
		'--galaxy-c4': '#85a7e9',
		'--galaxy-c5': '#4c86f7',
		'--galaxy-c6': '#3b7bf7',
		'--galaxy-c7': '#4880ea',
		'--galaxy-c8': '#5584dd',
		'--galaxy-c9': '#6288d0',
		'--galaxy-c10': '#6f8cc3',
		'--galaxy-c11': '#7d91b5',
		'--galaxy-c12': '#8a94a8'
	},
	emerald: {
		'--primary-color': '#26fac2',
		'--secondary-color': '#f8e7c9',
		'--accent-color': '#d4fbc2',
		'--neon-pink': '#30ceff',
		'--neon-blue': '#42aafa',
		'--neon-green': '#0ce987',
		'--neon-purple': '#f8e7c9',
		'--bg-dark': '#05100d',
		'--bg-card': '#0a1f19',
		'--bg-main': '#05100d',
		'--primary-rgb': '38, 250, 194',
		'--secondary-rgb': '248, 231, 201',
		'--indigo-rgb': '38, 250, 194',
		'--neon-pink-rgb': '48, 206, 255',
		'--neon-blue-rgb': '66, 170, 250',
		'--neon-green-rgb': '12, 233, 135',
		'--bg-dark-rgb': '5, 16, 13',
		'--bg-card-rgb': '10, 31, 25',
		'--gradient-1': 'linear-gradient(135deg, #04c08e 0%, #26fac2 100%)',
		'--gradient-2': 'linear-gradient(135deg, #d4fbc2 0%, #26fac2 100%)',
		'--gradient-3': 'linear-gradient(135deg, #26fac2 0%, #f8e7c9 100%)',
		'--hero-bg-1': '#05100d',
		'--hero-bg-2': '#0c221c',
		'--hero-bg-3': '#19140b',
		'--hero-glow-1': 'rgba(38, 250, 194, 0.12)',
		'--hero-glow-2': 'rgba(248, 231, 201, 0.09)',
		'--hero-glow-3': 'rgba(48, 206, 255, 0.06)',
		'--galaxy-c1': '#ffffff',
		'--galaxy-c2': '#dfece9',
		'--galaxy-c3': '#c0e8dd',
		'--galaxy-c4': '#9aebd5',
		'--galaxy-c5': '#6cf5d1',
		'--galaxy-c6': '#56faaf',
		'--galaxy-c7': '#54f779',
		'--galaxy-c8': '#61f452',
		'--galaxy-c9': '#92f150',
		'--galaxy-c10': '#c2ee4e',
		'--galaxy-c11': '#ebe44c',
		'--galaxy-c12': '#e8af4a'
	},
	violet: {
		'--primary-color': '#6a00f4',
		'--secondary-color': '#ffd6a5',
		'--accent-color': '#9ffacb',
		'--neon-pink': '#f01aff',
		'--neon-blue': '#4284fa',
		'--neon-green': '#0ce9b4',
		'--neon-purple': '#ffd6a5',
		'--bg-dark': '#090510',
		'--bg-card': '#130920',
		'--bg-main': '#090510',
		'--primary-rgb': '106, 0, 244',
		'--secondary-rgb': '255, 214, 165',
		'--indigo-rgb': '106, 0, 244',
		'--neon-pink-rgb': '240, 26, 255',
		'--neon-blue-rgb': '66, 132, 250',
		'--neon-green-rgb': '12, 233, 180',
		'--bg-dark-rgb': '9, 5, 16',
		'--bg-card-rgb': '19, 9, 32',
		'--gradient-1': 'linear-gradient(135deg, #420098 0%, #6a00f4 100%)',
		'--gradient-2': 'linear-gradient(135deg, #9ffacb 0%, #6a00f4 100%)',
		'--gradient-3': 'linear-gradient(135deg, #6a00f4 0%, #ffd6a5 100%)',
		'--hero-bg-1': '#090510',
		'--hero-bg-2': '#150c22',
		'--hero-bg-3': '#1a130a',
		'--hero-glow-1': 'rgba(106, 0, 244, 0.12)',
		'--hero-glow-2': 'rgba(255, 214, 165, 0.09)',
		'--hero-glow-3': 'rgba(240, 26, 255, 0.06)',
		'--galaxy-c1': '#ffffff',
		'--galaxy-c2': '#e0d9e8',
		'--galaxy-c3': '#c7b1e3',
		'--galaxy-c4': '#ac7fe8',
		'--galaxy-c5': '#9143f6',
		'--galaxy-c6': '#3a29ff',
		'--galaxy-c7': '#2b97ff',
		'--galaxy-c8': '#2cffea',
		'--galaxy-c9': '#2eff6f',
		'--galaxy-c10': '#69ff30',
		'--galaxy-c11': '#e3ff31',
		'--galaxy-c12': '#ffa233'
	}
};

export function clearPaletteOverrides() {
	for (const key of PALETTE_OVERRIDE_KEYS) {
		document.body.style.removeProperty(key);
	}
}

export function applyPaletteVars(vars: Record<string, string>) {
	clearPaletteOverrides();
	for (const [key, value] of Object.entries(vars)) {
		document.body.style.setProperty(key, value);
	}
}

/** True once any manual terminal command (season/rainbow/palette) has been
 *  invoked — the automatic random day-variant effect backs off until the
 *  `default` command clears it, so it never clobbers a manual choice. */
let manualOverrideActive = false;
export function setManualPaletteOverrideActive(active: boolean) {
	manualOverrideActive = active;
}
export function isManualPaletteOverrideActive() {
	return manualOverrideActive;
}
