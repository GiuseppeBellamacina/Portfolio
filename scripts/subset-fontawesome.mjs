import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import subsetFont from 'subset-font';
import * as fontkitNs from 'fontkit';

const fontkit = fontkitNs.default ?? fontkitNs.fontkit ?? fontkitNs;

const root = resolve(import.meta.dirname, '..');
const cssUrl = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
const families = { solid: 'fa-solid-900', brands: 'fa-brands-400', regular: 'fa-regular-400' };

// Scan sources for `fas|fab|far fa-name` usages, remembering the prefix so each
// glyph is subset into the correct family (a hardcoded name list would
// misclassify e.g. fa-youtube as solid).
const files = [];
for await (const file of glob('src/**/*.{svelte,ts}', {
	cwd: root,
	exclude: (p) => p.includes('.svelte-kit')
}))
	files.push(file);
const source = (await Promise.all(files.map((f) => readFile(join(root, f), 'utf8')))).join('\n');
const iconPrefixes = new Map();
for (const m of source.matchAll(/\b(fa[bsr])\s+fa-([a-z0-9-]+)/g)) {
	if (!iconPrefixes.has(m[2])) iconPrefixes.set(m[2], m[1]);
}
console.log(`Font Awesome icons found: ${iconPrefixes.size}`);

const cssResponse = await fetch(cssUrl);
if (!cssResponse.ok) throw new Error(`Unable to download Font Awesome CSS (${cssResponse.status})`);
const css = await cssResponse.text();

// Map every icon name to its codepoint. Icon rules in all.min.css are often
// comma-joined alias groups (e.g. `.fa-graduation-cap:before,.fa-mortar-board:before{...}`),
// so parse the full selector list of each rule instead of assuming
// name-then-brace — first names of a group would otherwise be missed.
const codepoints = new Map();
for (const rule of css.matchAll(/([^{}]+)\{[^{}]*content:\s*"\\([0-9a-f]+)"/g)) {
	const cp = String.fromCodePoint(parseInt(rule[2], 16));
	for (const selector of rule[1].split(',')) {
		const m = selector.trim().match(/^\.fa-([a-z0-9-]+):before$/);
		if (m) codepoints.set(m[1], cp);
	}
}

// FA5-style names still used in this codebase. FA6 kept their codepoints;
// listed as a safety net in case the CSS parsing can't resolve a rename.
const FALLBACK_CODEPOINTS = {
	home: 'f015',
	'external-link-alt': 'f35d',
	'graduation-cap': 'f19d'
};
for (const [name, hex] of Object.entries(FALLBACK_CODEPOINTS)) {
	if (!codepoints.has(name)) codepoints.set(name, String.fromCodePoint(parseInt(hex, 16)));
}

const familyOf = (prefix) => (prefix === 'fab' ? 'brands' : prefix === 'far' ? 'regular' : 'solid');
const used = { solid: new Set(), brands: new Set(), regular: new Set() };
const unresolved = [];
for (const [icon, prefix] of iconPrefixes) {
	const cp = codepoints.get(icon);
	if (cp) {
		used[familyOf(prefix)].add(cp);
	} else {
		unresolved.push(icon);
	}
}
if (unresolved.length) {
	console.warn(
		`⚠️  No codepoint found for: ${unresolved.join(', ')} — fix the name or add a fallback`
	);
}

/** Returns the codepoint chars NOT present in the font buffer */
function missingGlyphs(buffer, codepointChars) {
	const font = fontkit.create(buffer);
	return codepointChars.filter((ch) => !font.hasGlyphForCodePoint(ch.codePointAt(0)));
}

const outDir = join(root, 'static', 'fonts');
await mkdir(outDir, { recursive: true });

const fontFiles = {}; // family -> shipped filename (for CSS emission)
let totalOriginal = 0;
let totalShipped = 0;

for (const [family, filename] of Object.entries(families)) {
	if (!used[family].size) continue;

	// Locate the @font-face whose src mentions this family's font file
	const face = new RegExp(
		`@font-face\\s*\\{[^}]*src:\\s*url\\(([^)]*${filename}[^)]*)\\)`,
		's'
	).exec(css);
	if (!face) throw new Error(`Font face not found: ${filename}`);
	const fontUrl = new URL(face[1].replace(/["']/g, ''), cssUrl);
	const response = await fetch(fontUrl);
	if (!response.ok) throw new Error(`Unable to download ${filename} (${response.status})`);
	const full = Buffer.from(await response.arrayBuffer());
	totalOriginal += full.length;

	const chars = [...used[family]];
	const fullMissing = missingGlyphs(full, chars);
	if (fullMissing.length) {
		console.warn(
			`⚠️  ${filename}: FULL font itself lacks ${fullMissing.length} requested codepoints!`
		);
	}

	const text = chars.join('');
	let shipped = null;
	let shippedName = null;

	// Attempt 1: plain subset, then VERIFY the glyphs actually made it in
	try {
		const subset = await subsetFont(full, text, { targetFormat: 'woff2' });
		const missing = missingGlyphs(subset, chars);
		if (!missing.length) {
			shipped = subset;
			shippedName = `${filename}.subset.woff2`;
			console.log(`${filename}: subset verified (${chars.length} glyphs)`);
		} else {
			console.warn(
				`⚠️  ${filename}: subset dropped ${missing.length}/${chars.length} glyphs — retrying with noLayout`
			);
			// Attempt 2: icon fonts need no GSUB/GPOS layout tables
			const subset2 = await subsetFont(full, text, { targetFormat: 'woff2', noLayout: true });
			const missing2 = missingGlyphs(subset2, chars);
			if (!missing2.length) {
				shipped = subset2;
				shippedName = `${filename}.subset.woff2`;
				console.log(`${filename}: subset verified with noLayout (${chars.length} glyphs)`);
			}
		}
	} catch (err) {
		console.warn(`⚠️  ${filename}: subsetting failed (${err.message})`);
	}

	if (!shipped) {
		// Fallback: ship the full font — guaranteed correct, just heavier
		shipped = full;
		shippedName = `${filename}.woff2`;
		console.warn(`⚠️  ${filename}: shipping FULL font as a safe fallback`);
		try {
			await unlink(join(outDir, `${filename}.subset.woff2`));
		} catch {}
	} else {
		try {
			await unlink(join(outDir, `${filename}.woff2`));
		} catch {}
	}

	await writeFile(join(outDir, shippedName), shipped);
	totalShipped += shipped.length;
	fontFiles[family] = shippedName;
	console.log(`   -> ${shippedName}: ${(shipped.length / 1024).toFixed(1)} KB`);
}

const rules = [...iconPrefixes.keys()]
	.filter((i) => codepoints.has(i))
	.map((i) => `.fa-${i}::before { content: "\\${codepoints.get(i).codePointAt(0).toString(16)}"; }`)
	.join('\n');

const faces = [];
if (fontFiles.solid) {
	faces.push(
		`@font-face { font-family: "Font Awesome 6 Free"; font-style: normal; font-weight: 900; font-display: block; src: url("/fonts/${fontFiles.solid}") format("woff2"); }`
	);
}
if (fontFiles.brands) {
	faces.push(
		`@font-face { font-family: "Font Awesome 6 Brands"; font-style: normal; font-weight: 400; font-display: block; src: url("/fonts/${fontFiles.brands}") format("woff2"); }`
	);
}
if (fontFiles.regular) {
	faces.push(
		`@font-face { font-family: "Font Awesome 6 Free"; font-style: normal; font-weight: 400; font-display: block; src: url("/fonts/${fontFiles.regular}") format("woff2"); }`
	);
}

// Base rules mirror the real Font Awesome CSS. `<i>` elements default to
// font-style: italic — without this reset the browser synthesizes an
// oblique (slanted) version of every glyph.
const baseSelectors = ['.fa', '.fas'];
if (fontFiles.brands) baseSelectors.push('.fab');
if (fontFiles.regular) baseSelectors.push('.far');
const baseClasses = [
	`${baseSelectors.join(', ')} { -moz-osx-font-smoothing: grayscale; -webkit-font-smoothing: antialiased; display: inline-block; font-style: normal; font-variant: normal; line-height: 1; text-rendering: auto; }`,
	'.fas { font-family: "Font Awesome 6 Free"; font-weight: 900; }'
];
if (fontFiles.brands) {
	baseClasses.push('.fab { font-family: "Font Awesome 6 Brands"; font-weight: 400; }');
}
if (fontFiles.regular) {
	baseClasses.push('.far { font-family: "Font Awesome 6 Free"; font-weight: 400; }');
}

const cssOut = `${faces.join('\n')}\n${baseClasses.join('\n')}\n${rules}\n`;
await writeFile(join(root, 'static', 'fa-subset.css'), cssOut);
console.log(
	`Total: ${(totalOriginal / 1024).toFixed(1)} KB -> ${(totalShipped / 1024).toFixed(1)} KB; saved ${((totalOriginal - totalShipped) / 1024).toFixed(1)} KB`
);
