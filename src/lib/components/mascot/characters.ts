/**
 * Voxel characters for the mascot. Each one is generated procedurally (no model files):
 * a shape function fills an integer grid, then roles drive the colours.
 * Both wear a dark screen with a shared 7×5 LED face, so they share expressions.
 */

export type Role = 'base' | 'shade' | 'accent' | 'dark' | 'glow';
export type CharacterId = 'turi' | 'arancino';
export type Hat = 'propeller' | 'santa' | 'nightcap' | 'party' | 'straw';
export type Expression =
	| 'normal'
	| 'happy'
	| 'wink'
	| 'wow'
	| 'talk'
	| 'dizzy'
	| 'angry'
	| 'blink'
	| 'sad'
	| 'tear'
	| 'smug'
	| 'love'
	| 'sleepy'
	| 'think'
	| 'shy'
	| 'worried'
	| 'star'
	| 'tired';

export interface Voxel {
	x: number;
	y: number;
	z: number;
	role: Role;
	/** Fixed colour (accessories), overrides the role palette */
	color?: string;
	/** Spins around the vertical axis through x = z = 0 (propeller blades) */
	spin?: boolean;
}

export interface Character {
	voxels: Voxel[];
	/** World position of the face grid's top-left cell (y grows upward) */
	face: { x0: number; y0: number };
	/** Role painted on the lit face cells */
	faceOn: Role;
	/** Highest y the framing reserves (room for the tallest hat), so size never jumps */
	frameTop?: number;
	palette: (
		css: (name: string, fallback: string) => string,
		night: boolean
	) => Record<Role, string>;
}

export const CHARACTER_IDS: CharacterId[] = ['turi', 'arancino'];

// 7×5 face cells, top row first ('#' = lit)
export const EXPRESSIONS: Record<Expression, string[]> = {
	normal: ['.......', '.#...#.', '.#...#.', '.......', '..###..'],
	happy: ['.......', '.#...#.', '#.#.#.#', '.#...#.', '..###..'],
	wink: ['.......', '.#.....', '.#..###', '.......', '..###..'],
	wow: ['.#...#.', '.#...#.', '...#...', '..#.#..', '...#...'],
	talk: ['.......', '.#...#.', '.#...#.', '..###..', '..###..'],
	dizzy: ['#.#.#.#', '.#...#.', '#.#.#.#', '.......', '.#.#.#.'],
	angry: ['#.....#', '.#...#.', '.#...#.', '..###..', '.#...#.'],
	blink: ['.......', '.......', '##...##', '.......', '..###..'],
	// Brows slanting up towards the middle, a frown
	sad: ['..#.#..', '.#...#.', '.#...#.', '..###..', '.#...#.'],
	// Sad, with one tear on the left cheek (it rolls down: see TEAR_DROP)
	tear: ['..#.#..', '.#...#.', '.#...#.', '#......', '..###..'],
	// Half-lidded eyes and a smirk: "we both know"
	smug: ['.......', '##...##', '.#...#.', '.....#.', '..###..'],
	// Heart eyes
	love: ['#.#.#.#', '###.###', '.#...#.', '.#...#.', '..###..'],
	// Eyes shut, a small snore
	sleepy: ['.....##', '.......', '##...##', '.......', '...#...'],
	// Eyes up and to the side, mouth off to one corner: hmm
	think: ['.#...#.', '.#...#.', '.......', '....##.', '.......'],
	// Small eyes, blushing cheeks, a tiny smile
	shy: ['.......', '.......', '.#...#.', '#.....#', '..###..'],
	// Brows up, a wobbly mouth
	worried: ['..#.#..', '.#...#.', '.#...#.', '.......', '.#.#.#.'],
	// Sparkling eyes, a wide smile
	star: ['.#...#.', '###.###', '.#...#.', '.#...#.', '..###..'],
	// Heavy lids, a drop of sweat, a flat wobble
	tired: ['.....#.', '##...##', '.......', '.......', '.#.#.#.']
};

// The tear's second frame: it has rolled down next to the mouth
export const TEAR_DROP = ['..#.#..', '.#...#.', '.#...#.', '.......', '#.###..'];

// Expressions whose eyes can blink (the others have their eyes shut, or are drawn on purpose)
export const BLINKS: Expression[] = ['normal', 'think', 'smug', 'shy', 'worried', 'star', 'love'];

// Deterministic per-voxel noise, so shading is stable across reloads
export function hash3(x: number, y: number, z: number): number {
	let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function fill(
	range: [number, number, number, number, number, number],
	inside: (x: number, y: number, z: number) => boolean,
	role: (x: number, y: number, z: number) => Role
): Voxel[] {
	const [x0, x1, y0, y1, z0, z1] = range;
	const out: Voxel[] = [];
	for (let x = x0; x <= x1; x++)
		for (let y = y0; y <= y1; y++)
			for (let z = z0; z <= z1; z++)
				if (inside(x, y, z)) out.push({ x, y, z, role: role(x, y, z) });
	return out;
}

/** Turns the front-most voxel of each (x, y) inside `area` into the dark screen */
function addScreen(voxels: Voxel[], area: (x: number, y: number) => boolean) {
	const front = new Map<string, Voxel>();
	for (const v of voxels) {
		const k = `${v.x},${v.y}`;
		if (!front.has(k) || front.get(k)!.z < v.z) front.set(k, v);
	}
	for (const v of front.values()) if (area(v.x, v.y)) v.role = 'dark';
}

/** A filled ellipse of hat voxels at height y, skipping cells the head already uses */
function disc(
	out: Voxel[],
	taken: Set<string>,
	y: number,
	rx: number,
	rz: number,
	color: (x: number, z: number) => string,
	cx = 0
) {
	const ix = Math.ceil(rx) + 1;
	for (let x = -ix; x <= ix; x++)
		for (let z = -Math.ceil(rz); z <= Math.ceil(rz); z++) {
			const px = Math.round(cx) + x;
			const k = `${px},${y},${z}`;
			if ((x / rx) ** 2 + (z / rz) ** 2 > 1 || taken.has(k)) continue;
			taken.add(k);
			out.push({ x: px, y, z, role: 'base', color: color(px, z) });
		}
}

/** A droopy cone hat (santa / nightcap) with trim and a pompom at the tip */
function cone(
	out: Voxel[],
	taken: Set<string>,
	opts: {
		trim: string;
		body: (y: number, x: number, z: number) => string;
		pompom: string;
		height: number;
		droop: number;
	}
) {
	disc(out, taken, 5, 5, 4.2, () => opts.trim);
	let tipX = 0;
	for (let i = 0; i < opts.height; i++) {
		const y = 6 + i;
		const r = Math.max(0.6, 4 * (1 - i / opts.height));
		tipX = opts.droop * i * i;
		disc(out, taken, y, r, r * 0.85, (x, z) => opts.body(y, x, z), tipX);
	}
	const top = 6 + opts.height;
	for (let dx = 0; dx <= 1; dx++)
		for (let dz = -1; dz <= 0; dz++)
			for (let dy = 0; dy <= 1; dy++)
				out.push({
					x: Math.round(tipX) + dx,
					y: top + dy - 1,
					z: dz,
					role: 'base',
					color: opts.pompom
				});
}

export function hatFor(classes: DOMTokenList): Hat {
	if (classes.contains('season-snow')) return 'santa';
	if (classes.contains('season-newyear')) return 'party';
	if (classes.contains('tod-night')) return 'nightcap';
	if (classes.contains('season-summer')) return 'straw';
	return 'propeller';
}

function addHat(head: Voxel[], hat: Hat): Voxel[] {
	const out: Voxel[] = [];
	const taken = new Set(head.map((v) => `${v.x},${v.y},${v.z}`));
	const put = (x: number, y: number, z: number, color: string, spin = false) => {
		const k = `${x},${y},${z}`;
		if (taken.has(k)) return;
		taken.add(k);
		out.push({ x, y, z, role: 'base', color, spin });
	};
	if (hat === 'propeller') {
		// Propeller beanie: striped cap, little stem, red and blue blades
		const stripes = ['#facc15', '#ef4444', '#3b82f6', '#22c55e'];
		const wedge = (x: number, z: number) =>
			stripes[Math.floor(((Math.atan2(z, x) + Math.PI) / (2 * Math.PI)) * 4) % 4];
		disc(out, taken, 5, 4.6, 3.9, wedge);
		disc(out, taken, 6, 3.4, 2.9, wedge);
		put(0, 7, 0, '#facc15');
		put(0, 8, 0, '#94a3b8', true);
		for (let x = 1; x <= 4; x++) put(x, 8, 0, '#ef4444', true);
		for (let x = -4; x <= -1; x++) put(x, 8, 0, '#3b82f6', true);
	} else if (hat === 'santa') {
		cone(out, taken, {
			trim: '#f8fafc',
			body: (y, x, z) => (hash3(x, y, z) > 0.7 ? '#b91c1c' : '#dc2626'),
			pompom: '#f8fafc',
			height: 6,
			droop: 0.16
		});
	} else if (hat === 'nightcap') {
		cone(out, taken, {
			trim: '#60a5fa',
			body: (y) => (y % 2 === 0 ? '#93c5fd' : '#e0e7ff'),
			pompom: '#fde68a',
			height: 7,
			droop: -0.17
		});
	} else if (hat === 'party') {
		const stripes = ['#f472b6', '#60a5fa', '#facc15'];
		for (let i = 0; i < 6; i++) {
			const r = 3.2 * (1 - i / 6) + 0.5;
			disc(out, taken, 5 + i, r, r, (x) => stripes[(i + x + 9) % 3]);
		}
		out.push({ x: 0, y: 11, z: 0, role: 'base', color: '#fbbf24' });
		out.push({ x: 0, y: 12, z: 0, role: 'base', color: '#fde68a' });
		// A glass of bubbly held at the right side: foot, stem, then a flute of wine
		const glass = '#e2e8f0';
		for (let x = 7; x <= 9; x++) for (let z = 1; z <= 3; z++) put(x, -5, z, glass);
		put(8, -4, 2, glass);
		put(8, -3, 2, glass);
		for (let y = -2; y <= 2; y++)
			for (let x = 7; x <= 9; x++)
				for (let z = 1; z <= 3; z++) {
					const rim = x !== 8 || z !== 2;
					// Glass walls round a column of wine, with bubbles rising through it
					if (y === 2 && !rim) continue;
					const bubble = !rim && (y === -1 || y === 1);
					put(x, y, z, rim ? (y === 2 ? glass : '#fde68a') : bubble ? '#fffbeb' : '#facc15');
				}
	} else {
		// Straw hat: wide brim, a ribbon round the crown and a little flower
		const straw = (x: number, z: number) => (hash3(x, 5, z) > 0.6 ? '#d6a94a' : '#ecc977');
		disc(out, taken, 5, 7.4, 6.6, straw);
		disc(out, taken, 6, 3.6, 3.2, () => '#4f46e5');
		disc(out, taken, 7, 3.6, 3.2, straw);
		disc(out, taken, 8, 3, 2.6, straw);
		put(3, 6, 3, '#f472b6');
		put(4, 6, 2, '#f472b6');
		put(3, 7, 3, '#f472b6');
		put(4, 6, 3, '#fde047');
	}
	return out;
}

/** Helmet-headed robot: dark visor with LED face, ear discs, a hat that follows the theme */
function turi(hat: Hat): Character {
	const head = fill(
		[-5, 5, -4, 4, -4, 4],
		(x, y, z) => (x / 5.6) ** 4 + (y / 4.6) ** 4 + (z / 4.6) ** 4 <= 1,
		(x, y, z) => ((y < -1 && hash3(x, y, z) > 0.35) || hash3(x, y, z) > 0.8 ? 'shade' : 'base')
	);
	addScreen(head, (x, y) => Math.abs(x) <= 4 && y >= -3 && y <= 2);
	const ears: Voxel[] = [];
	for (const side of [-6, 6])
		for (let y = -1; y <= 1; y++)
			for (let z = -1; z <= 1; z++)
				ears.push({ x: side, y, z, role: y === 0 && z === 0 ? 'accent' : 'shade' });
	return {
		voxels: [...head, ...ears, ...addHat(head, hat)],
		face: { x0: -3, y0: 1 },
		faceOn: 'glow',
		frameTop: 9,
		palette: (css, night) => ({
			base: css('--primary-color', '#818cf8'),
			shade: css('--mascot-shade', css('--secondary-color', '#a78bfa')),
			accent: css('--warm-accent', '#fbbf24'),
			dark: '#0b0d1c',
			glow: night ? '#ffffff' : '#a5f3fc'
		})
	};
}

/** Sicilian arancino: round base tapering to a point, crunchy crust, LED screen face */
function arancino(): Character {
	// Big enough that the screen keeps a crust border all around
	const radius = (y: number) =>
		y <= -1 ? Math.sqrt(Math.max(0, 46 - (y + 1) ** 2)) : 6.8 * (1 - (y + 1) / 11);
	const voxels = fill(
		[-7, 7, -8, 10, -7, 7],
		(x, y, z) => x * x + z * z <= radius(y) ** 2,
		(x, y, z) => {
			const n = hash3(x, y, z);
			return n > 0.86 ? 'accent' : n > 0.55 ? 'shade' : 'base';
		}
	);
	// Rounded-corner screen around the 7×5 face (x -3..3, y 0..-4)
	addScreen(
		voxels,
		(x, y) => Math.abs(x) <= 4 && y <= 1 && y >= -5 && !(Math.abs(x) === 4 && (y === 1 || y === -5))
	);
	return {
		voxels,
		face: { x0: -3, y0: 0 },
		faceOn: 'glow',
		palette: () => ({
			base: '#e9a23b',
			shade: '#c97b22',
			accent: '#f8d27a',
			dark: '#1c0f05',
			glow: '#ffe7a3'
		})
	};
}

/** Voxels keyed by position: a later write replaces the role of an earlier one */
function grid() {
	const cells = new Map<string, Voxel>();
	const put = (x: number, y: number, z: number, role: Role) =>
		cells.set(`${x},${y},${z}`, { x, y, z, role });
	const has = (x: number, y: number, z: number) => cells.has(`${x},${y},${z}`);
	return { cells, put, has };
}

/** The outer layer of a rounded head (a superellipsoid cut flat at `yCut`) */
function headShell(rx: number, ry: number, rz: number, yCut: number, p = 2.6) {
	const inside = (x: number, y: number, z: number) =>
		y >= yCut && Math.abs(x / rx) ** p + Math.abs(y / ry) ** p + Math.abs(z / rz) ** p <= 1;
	const out: [number, number, number][] = [];
	for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++)
		for (let y = yCut; y <= Math.ceil(ry); y++)
			for (let z = -Math.ceil(rz); z <= Math.ceil(rz); z++) {
				if (!inside(x, y, z)) continue;
				const open =
					!inside(x + 1, y, z) ||
					!inside(x - 1, y, z) ||
					!inside(x, y + 1, z) ||
					!inside(x, y - 1, z) ||
					!inside(x, y, z + 1) ||
					!inside(x, y, z - 1);
				if (open) out.push([x, y, z]);
			}
	return out;
}

/** An ear disc: a ring standing out of the side of the head, two layers deep */
function ear(
	put: (x: number, y: number, z: number, r: Role) => void,
	x: number,
	side: number,
	inner: number,
	outer: number,
	role: Role
) {
	for (let y = -6; y <= 4; y++)
		for (let z = -6; z <= 4; z++) {
			const r = Math.hypot(y + 1, z + 1);
			if (r >= inner && r <= outer) put(x, y, z, role);
			if (r >= inner && r <= outer - 0.9) put(x + side, y, z, role);
		}
}

// Chrome and gold are mottled like polished metal under a light
const metal = (x: number, y: number, z: number): Role => {
	const n = hash3(x, y, z);
	return n > 0.86 ? 'accent' : n > 0.5 ? 'shade' : 'base';
};

/**
 * Thomas Bangalter's helmet: a silver dome with a wide black visor band that wraps round
 * the sides, a bright rim above and below it, a chin piece, and a ring over each ear
 */
export function thomas(): Character {
	const { cells, put, has } = grid();
	for (const [x, y, z] of headShell(8, 8.5, 8.5, -7)) {
		const wrap = z > -3;
		const band = wrap && y >= -3 && y <= 1;
		const rim = wrap && (y === 2 || y === -4);
		put(x, y, z, band ? 'dark' : rim ? 'accent' : metal(x, y, z));
	}
	// The visor stands out of the face as one flat black pane, framed by the rim
	for (let x = -6; x <= 6; x++) {
		for (let y = -4; y <= 2; y++) {
			let z = 9;
			while (z > 0 && !has(x, y, z)) z--;
			put(x, y, z + 1, y === 2 || y === -4 || Math.abs(x) === 6 ? 'accent' : 'dark');
		}
	}
	// A glint on the visor
	put(-3, 0, 9, 'glow');
	put(-2, 1, 9, 'glow');
	// The chin juts out a little under the visor
	for (let x = -4; x <= 4; x++)
		for (const y of [-7, -6]) {
			let z = 9;
			while (z > 0 && !has(x, y, z)) z--;
			put(x, y, z + 1, metal(x, y, z + 1));
		}
	ear(put, 9, 1, 1.5, 3.4, 'accent');
	ear(put, -9, -1, 1.5, 3.4, 'accent');
	return {
		voxels: [...cells.values()],
		face: { x0: 200, y0: 200 },
		faceOn: 'glow',
		palette: () => ({
			base: '#b7bcc5',
			shade: '#868d99',
			accent: '#dfe3ea',
			dark: '#0b0c10',
			glow: '#aab3c2'
		})
	};
}

/**
 * Guy-Manuel de Homem-Christo's helmet: a gold egg whose whole front and crown is one
 * black glass dome, a gold collar at the base, and a large ring over each ear
 */
export function guyman(): Character {
	const { cells, put, has } = grid();
	for (const [x, y, z] of headShell(8, 9, 8.5, -6, 2.2)) {
		// The glass reaches further back the higher it goes, like a motorbike visor
		const glass = y > -5 && Math.abs(x) < 6.6 && z > -1.5 - 0.35 * Math.max(0, y);
		put(x, y, z, glass ? 'dark' : metal(x, y, z));
	}
	// A long reflection down the glass
	for (let y = 0; y <= 6; y++) {
		let z = 10;
		while (z > 0 && !has(-3, y, z)) z--;
		put(-3, y, z, 'glow');
	}
	// The collar: a thick gold ring at the bottom, wider than the head
	for (let x = -10; x <= 10; x++)
		for (let z = -10; z <= 10; z++) {
			const o = (x / 9.2) ** 2 + (z / 9.4) ** 2;
			if (o <= 1 && o > 0.62)
				for (const y of [-8, -7]) put(x, y, z, y === -8 ? 'shade' : metal(x, y, z));
		}
	ear(put, 9, 1, 1.8, 3.9, 'base');
	ear(put, -9, -1, 1.8, 3.9, 'base');
	return {
		voxels: [...cells.values()],
		face: { x0: 200, y0: 200 },
		faceOn: 'glow',
		palette: () => ({
			base: '#e3b11f',
			shade: '#b9870f',
			accent: '#f7d453',
			dark: '#0e0e12',
			glow: '#6b7383'
		})
	};
}

/** Models that are not bots: the two helmets of the Daft Punk scene */
export const MODELS = { thomas, guyman };
export type ModelId = CharacterId | keyof typeof MODELS;

export const CHARACTERS: Record<CharacterId, (hat: Hat) => Character> = { turi, arancino };

/**
 * Index of the voxel under each face cell (row-major 7×5), or -1 when the
 * shape has no voxel there.
 */
export function faceCells(c: Character): number[] {
	const cells: number[] = [];
	for (let fy = 0; fy < 5; fy++)
		for (let fx = 0; fx < 7; fx++) {
			const x = c.face.x0 + fx;
			const y = c.face.y0 - fy;
			let best = -1;
			c.voxels.forEach((v, i) => {
				// Accessories are not part of the screen
				if (v.color || v.x !== x || v.y !== y) return;
				if (best < 0 || v.z > c.voxels[best].z) best = i;
			});
			cells.push(best);
		}
	return cells;
}
