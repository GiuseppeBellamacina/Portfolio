import sharp from 'sharp';
import { writeFileSync } from 'fs';

const sizes = [16, 32, 48];
const pngs = [];

for (const size of sizes) {
	const buf = await sharp('static/favicons/favicon.svg').resize(size, size).png().toBuffer();
	pngs.push({ size, buf });
	console.log(`Rendered ${size}x${size}: ${buf.length} bytes`);
}

// Build ICO binary
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);

const dirEntrySize = 16;
const dataOffset = 6 + dirEntrySize * pngs.length;

const entries = [];
let offset = dataOffset;
for (const { size, buf } of pngs) {
	const entry = Buffer.alloc(dirEntrySize);
	entry.writeUInt8(size, 0); // width
	entry.writeUInt8(size, 1); // height
	entry.writeUInt8(0, 2); // color count
	entry.writeUInt8(0, 3); // reserved
	entry.writeUInt16LE(1, 4); // planes
	entry.writeUInt16LE(32, 6); // bit depth
	entry.writeUInt32LE(buf.length, 8); // data size
	entry.writeUInt32LE(offset, 12); // data offset
	entries.push(entry);
	offset += buf.length;
}

const ico = Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
writeFileSync('static/favicon.ico', ico);
console.log(`\nfavicon.ico scritto: ${ico.length} bytes (16x16 + 32x32 + 48x48)`);
