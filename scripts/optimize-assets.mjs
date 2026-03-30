#!/usr/bin/env node
/**
 * Asset optimization script for the Portfolio project.
 * Uses sharp to resize and compress raster images (PNG, JPG, JPEG, WEBP).
 * SVGs are left untouched.
 *
 * Usage:
 *   node scripts/optimize-assets.mjs                 # dry-run (default)
 *   node scripts/optimize-assets.mjs --apply         # apply optimizations in-place
 *   node scripts/optimize-assets.mjs --apply --icons  # only optimize icons
 *   node scripts/optimize-assets.mjs --apply --projects # only optimize project images
 *
 * Options:
 *   --apply       Actually write optimized files (without this flag, only reports)
 *   --icons       Only process static/assets/icons/
 *   --projects    Only process static/assets/projects/
 *   --profile     Only process static/assets/ root (profile images etc.)
 *   --max-size N  Override max dimension in px (default: 128 for icons, 800 for projects, 256 for profile)
 */

import sharp from 'sharp';
import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIC = join(ROOT, 'static', 'assets');

const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');
const onlyIcons = args.includes('--icons');
const onlyProjects = args.includes('--projects');
const onlyProfile = args.includes('--profile');
const maxSizeIdx = args.indexOf('--max-size');
const customMaxSize = maxSizeIdx !== -1 ? parseInt(args[maxSizeIdx + 1], 10) : null;

const RASTER_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

/** @typedef {{ path: string, originalKB: number, optimizedKB: number, skipped: boolean, reason?: string }} Result */

/**
 * Optimize a single raster image.
 * @param {string} filePath
 * @param {number} maxDim - max width or height in px
 * @param {boolean} dryRun
 * @returns {Promise<Result>}
 */
async function optimizeImage(filePath, maxDim, dryRun) {
	const originalBuf = await readFile(filePath);
	const originalKB = originalBuf.length / 1024;
	const ext = extname(filePath).toLowerCase();

	try {
		let pipeline = sharp(originalBuf);
		const meta = await pipeline.metadata();

		// Skip if already small enough
		if ((meta.width ?? 0) <= maxDim && (meta.height ?? 0) <= maxDim && originalKB < 15) {
			return {
				path: filePath,
				originalKB,
				optimizedKB: originalKB,
				skipped: true,
				reason: 'already small'
			};
		}

		// Resize if larger than maxDim
		if ((meta.width ?? 0) > maxDim || (meta.height ?? 0) > maxDim) {
			pipeline = pipeline.resize({
				width: maxDim,
				height: maxDim,
				fit: 'inside',
				withoutEnlargement: true
			});
		}

		// Compress based on format
		let outputBuf;
		if (ext === '.png') {
			outputBuf = await pipeline.png({ quality: 85, compressionLevel: 9, effort: 10 }).toBuffer();
		} else if (ext === '.jpg' || ext === '.jpeg') {
			outputBuf = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
		} else if (ext === '.webp') {
			outputBuf = await pipeline.webp({ quality: 80, effort: 6 }).toBuffer();
		} else {
			return {
				path: filePath,
				originalKB,
				optimizedKB: originalKB,
				skipped: true,
				reason: 'unsupported format'
			};
		}

		const optimizedKB = outputBuf.length / 1024;

		// Only write if we actually saved space (at least 5%)
		if (optimizedKB < originalKB * 0.95) {
			if (!dryRun) {
				await writeFile(filePath, outputBuf);
			}
			return { path: filePath, originalKB, optimizedKB, skipped: false };
		} else {
			return {
				path: filePath,
				originalKB,
				optimizedKB: originalKB,
				skipped: true,
				reason: 'no significant savings'
			};
		}
	} catch (err) {
		return {
			path: filePath,
			originalKB,
			optimizedKB: originalKB,
			skipped: true,
			reason: `error: ${err.message}`
		};
	}
}

/**
 * Process all raster images in a directory.
 * @param {string} dir
 * @param {number} maxDim
 * @param {boolean} dryRun
 * @returns {Promise<Result[]>}
 */
async function processDir(dir, maxDim, dryRun) {
	const entries = await readdir(dir);
	const results = [];

	for (const entry of entries) {
		const filePath = join(dir, entry);
		const fileStat = await stat(filePath);
		if (!fileStat.isFile()) continue;

		const ext = extname(entry).toLowerCase();
		if (!RASTER_EXTS.has(ext)) continue;

		const result = await optimizeImage(filePath, maxDim, dryRun);
		results.push(result);
	}

	return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
	console.log(
		`\n🖼️  Asset Optimization ${dryRun ? '(DRY RUN — use --apply to write)' : '(APPLYING CHANGES)'}\n`
	);

	/** @type {Result[]} */
	let allResults = [];

	const processAll = !onlyIcons && !onlyProjects && !onlyProfile;

	// Icons (max 128px — 2x retina for 50px CSS display)
	if (processAll || onlyIcons) {
		const iconsDir = join(STATIC, 'icons');
		const maxDim = customMaxSize ?? 128;
		console.log(`📁 Icons (${iconsDir}) — max ${maxDim}px`);
		const results = await processDir(iconsDir, maxDim, dryRun);
		allResults = allResults.concat(results);
	}

	// Projects (max 800px — reasonable for project thumbnails)
	if (processAll || onlyProjects) {
		const projectsDir = join(STATIC, 'projects');
		const maxDim = customMaxSize ?? 800;
		console.log(`📁 Projects (${projectsDir}) — max ${maxDim}px`);
		const results = await processDir(projectsDir, maxDim, dryRun);
		allResults = allResults.concat(results);
	}

	// Profile & root assets (max 256px)
	if (processAll || onlyProfile) {
		const maxDim = customMaxSize ?? 256;
		console.log(`📁 Profile (${STATIC}) — max ${maxDim}px`);
		const results = await processDir(STATIC, maxDim, dryRun);
		allResults = allResults.concat(results);
	}

	// Report
	console.log('\n' + '─'.repeat(80));
	console.log('RESULTS:\n');

	const optimized = allResults.filter((r) => !r.skipped);
	const skipped = allResults.filter((r) => r.skipped);

	if (optimized.length > 0) {
		console.log(`✅ ${dryRun ? 'Would optimize' : 'Optimized'} ${optimized.length} files:\n`);
		let totalSaved = 0;
		for (const r of optimized) {
			const saved = r.originalKB - r.optimizedKB;
			totalSaved += saved;
			const rel = r.path.replace(ROOT, '').replace(/\\/g, '/');
			console.log(
				`   ${rel}  ${r.originalKB.toFixed(1)}KB → ${r.optimizedKB.toFixed(1)}KB  (-${saved.toFixed(1)}KB, -${((saved / r.originalKB) * 100).toFixed(0)}%)`
			);
		}
		console.log(
			`\n   Total savings: ${totalSaved.toFixed(1)}KB (${(totalSaved / 1024).toFixed(2)}MB)`
		);
	}

	if (skipped.length > 0) {
		console.log(`\n⏭️  Skipped ${skipped.length} files:`);
		for (const r of skipped) {
			const rel = r.path.replace(ROOT, '').replace(/\\/g, '/');
			console.log(`   ${rel}  (${r.reason})`);
		}
	}

	console.log('');
}

main().catch((err) => {
	console.error('❌ Error:', err);
	process.exit(1);
});
