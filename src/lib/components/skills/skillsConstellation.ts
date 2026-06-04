/**
 * Interactive particle constellation effect for the Skills section.
 * Canvas 2D with physics: inter-particle repulsion, mouse connections, damping.
 * Optimized: no shadowBlur, batched draw calls, typed arrays for grid.
 */
export function createCanvasConstellation(section: HTMLElement): (() => void) | undefined {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const canvas = document.createElement('canvas');
	canvas.style.cssText = `
		position: absolute; inset: 0; width: 100%; height: 100%;
		pointer-events: none; z-index: 1;
	`;
	section.appendChild(canvas);

	const ctx = canvas.getContext('2d', { alpha: true });
	if (!ctx) return;

	let W = (canvas.width = section.offsetWidth);
	let H = (canvas.height = section.offsetHeight);
	let canvasRunning = false;
	let raf = 0;

	// Node data stored in flat typed arrays for cache efficiency
	const viewportArea = window.innerWidth * window.innerHeight;
	const sectionArea = W * H;
	const COUNT = Math.min(Math.max(Math.round(50 * (sectionArea / viewportArea)), 50), 100);
	const CONNECT_DIST = 150;
	const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;
	const REPULSE_DIST = 70;
	const REPULSE_DIST_SQ = REPULSE_DIST * REPULSE_DIST;
	const REPULSE_FORCE = 0.004;
	const MOUSE_CONNECT_DIST = 190;
	const MOUSE_CONNECT_DIST_SQ = MOUSE_CONNECT_DIST * MOUSE_CONNECT_DIST;
	const MOUSE_REPULSE_DIST = 110;
	const MOUSE_REPULSE_DIST_SQ = MOUSE_REPULSE_DIST * MOUSE_REPULSE_DIST;
	const MAX_VEL = 1.2;
	const MAX_VEL_SQ = MAX_VEL * MAX_VEL;
	const DAMPING = 0.997;

	// SoA layout for better cache performance
	const px = new Float32Array(COUNT);
	const py = new Float32Array(COUNT);
	const vx = new Float32Array(COUNT);
	const vy = new Float32Array(COUNT);
	const radii = new Float32Array(COUNT);
	const hues = new Uint16Array(COUNT);
	const pulse = new Float32Array(COUNT);
	const pulseSpeed = new Float32Array(COUNT);

	for (let i = 0; i < COUNT; i++) {
		px[i] = Math.random() * W;
		py[i] = Math.random() * H;
		vx[i] = (Math.random() - 0.5) * 0.4;
		vy[i] = (Math.random() - 0.5) * 0.4;
		radii[i] = Math.random() * 2 + 1;
		hues[i] = Math.random() > 0.5 ? (235 + Math.random() * 15) | 0 : (270 + Math.random() * 20) | 0;
		pulse[i] = Math.random() * Math.PI * 2;
		pulseSpeed[i] = 0.02 + Math.random() * 0.02;
	}

	let mouse = { x: -9999, y: -9999 };

	// Spatial grid using flat structure
	const CELL_SIZE = CONNECT_DIST;
	let gridCols = 0;
	let gridRows = 0;
	let cellCount = 0;
	// Each cell stores up to 8 node indices (enough for typical density)
	const MAX_PER_CELL = 8;
	let cellData: Int16Array;
	let cellLen: Uint8Array;

	function initGrid() {
		gridCols = Math.ceil(W / CELL_SIZE) + 1;
		gridRows = Math.ceil(H / CELL_SIZE) + 1;
		cellCount = gridCols * gridRows;
		cellData = new Int16Array(cellCount * MAX_PER_CELL);
		cellLen = new Uint8Array(cellCount);
	}
	initGrid();

	function updateGrid() {
		cellLen.fill(0);
		for (let i = 0; i < COUNT; i++) {
			const cx = (px[i] / CELL_SIZE) | 0;
			const cy = (py[i] / CELL_SIZE) | 0;
			if (cx < 0 || cx >= gridCols || cy < 0 || cy >= gridRows) continue;
			const cellIdx = cy * gridCols + cx;
			const len = cellLen[cellIdx];
			if (len < MAX_PER_CELL) {
				cellData[cellIdx * MAX_PER_CELL + len] = i;
				cellLen[cellIdx] = len + 1;
			}
		}
	}

	const resizeObs = new ResizeObserver(() => {
		W = canvas.width = section.offsetWidth;
		H = canvas.height = section.offsetHeight;
		initGrid();
		for (let i = 0; i < COUNT; i++) {
			if (px[i] > W) px[i] = Math.random() * W;
			if (py[i] > H) py[i] = Math.random() * H;
		}
	});
	resizeObs.observe(section);

	function onMouseMove(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		mouse.x = e.clientX - rect.left;
		mouse.y = e.clientY - rect.top;
	}
	function onMouseLeave() {
		mouse.x = -9999;
		mouse.y = -9999;
	}

	section.addEventListener('mousemove', onMouseMove);
	section.addEventListener('mouseleave', onMouseLeave);

	// Pre-compute alpha buckets for batched line drawing (5 levels)
	const ALPHA_LEVELS = 5;

	function tick() {
		if (!canvasRunning) return;

		ctx!.clearRect(0, 0, W, H);
		updateGrid();

		// --- Connections (batched by alpha level) + physics ---
		// We batch lines into alpha groups to reduce strokeStyle changes
		const lineBatches: { ax: number; ay: number; bx: number; by: number }[][] = [];
		for (let l = 0; l < ALPHA_LEVELS; l++) lineBatches.push([]);

		for (let i = 0; i < COUNT; i++) {
			const nax = px[i];
			const nay = py[i];
			const cx = (nax / CELL_SIZE) | 0;
			const cy = (nay / CELL_SIZE) | 0;

			// Check 3x3 neighborhood
			for (let dcx = -1; dcx <= 1; dcx++) {
				const ncx = cx + dcx;
				if (ncx < 0 || ncx >= gridCols) continue;
				for (let dcy = -1; dcy <= 1; dcy++) {
					const ncy = cy + dcy;
					if (ncy < 0 || ncy >= gridRows) continue;
					const cellIdx = ncy * gridCols + ncx;
					const len = cellLen[cellIdx];
					const base = cellIdx * MAX_PER_CELL;

					for (let k = 0; k < len; k++) {
						const j = cellData[base + k];
						if (j <= i) continue;

						const dx = px[j] - nax;
						const dy = py[j] - nay;
						const distSq = dx * dx + dy * dy;

						if (distSq < REPULSE_DIST_SQ && distSq > 0) {
							const invDist = 1 / Math.sqrt(distSq);
							const dist = distSq * invDist;
							const force = (1 - dist / REPULSE_DIST) * REPULSE_FORCE;
							const fx = dx * invDist * force;
							const fy = dy * invDist * force;
							vx[i] -= fx;
							vy[i] -= fy;
							vx[j] += fx;
							vy[j] += fy;
						}

						if (distSq < CONNECT_DIST_SQ) {
							const dist = Math.sqrt(distSq);
							const alpha = (1 - dist / CONNECT_DIST) * 0.25;
							const level = (alpha * ALPHA_LEVELS * 4) | 0; // 0-4
							const clamped = level >= ALPHA_LEVELS ? ALPHA_LEVELS - 1 : level;
							lineBatches[clamped].push({ ax: nax, ay: nay, bx: px[j], by: py[j] });
						}
					}
				}
			}
		}

		// Draw batched connection lines
		ctx!.lineWidth = 0.6;
		for (let l = 0; l < ALPHA_LEVELS; l++) {
			const batch = lineBatches[l];
			if (batch.length === 0) continue;
			const alpha = ((l + 0.5) / ALPHA_LEVELS) * 0.25;
			ctx!.strokeStyle = `hsla(252, 60%, 60%, ${alpha.toFixed(3)})`;
			ctx!.beginPath();
			for (let k = 0; k < batch.length; k++) {
				ctx!.moveTo(batch[k].ax, batch[k].ay);
				ctx!.lineTo(batch[k].bx, batch[k].by);
			}
			ctx!.stroke();
		}

		// Mouse connections (batched)
		if (mouse.x > -9000) {
			ctx!.lineWidth = 0.8;
			ctx!.strokeStyle = 'hsla(252, 65%, 65%, 0.25)';
			ctx!.beginPath();
			let hasMouseLines = false;
			for (let i = 0; i < COUNT; i++) {
				const dx = px[i] - mouse.x;
				const dy = py[i] - mouse.y;
				const distSq = dx * dx + dy * dy;
				if (distSq < MOUSE_CONNECT_DIST_SQ) {
					ctx!.moveTo(px[i], py[i]);
					ctx!.lineTo(mouse.x, mouse.y);
					hasMouseLines = true;
				}
			}
			if (hasMouseLines) ctx!.stroke();
		}

		// Nodes — draw all as single batch (no shadowBlur, use double-circle for glow)
		for (let i = 0; i < COUNT; i++) {
			pulse[i] += pulseSpeed[i];
			const sinP = Math.sin(pulse[i]);
			const glow = 0.5 + sinP * 0.3;
			const r = radii[i] + sinP * 0.5;

			// Outer glow (larger, semi-transparent)
			ctx!.fillStyle = `hsla(${hues[i]}, 55%, 60%, ${(glow * 0.3).toFixed(3)})`;
			ctx!.beginPath();
			ctx!.arc(px[i], py[i], r + 3, 0, Math.PI * 2);
			ctx!.fill();

			// Core
			ctx!.fillStyle = `hsla(${hues[i]}, 55%, 65%, ${glow.toFixed(3)})`;
			ctx!.beginPath();
			ctx!.arc(px[i], py[i], r, 0, Math.PI * 2);
			ctx!.fill();

			// Physics update
			px[i] += vx[i];
			py[i] += vy[i];

			// Mouse repulsion
			if (mouse.x > -9000) {
				const mdx = px[i] - mouse.x;
				const mdy = py[i] - mouse.y;
				const mdSq = mdx * mdx + mdy * mdy;
				if (mdSq < MOUSE_REPULSE_DIST_SQ && mdSq > 0) {
					const invMd = 1 / Math.sqrt(mdSq);
					vx[i] += mdx * invMd * 0.03;
					vy[i] += mdy * invMd * 0.03;
				}
			}

			// Damping
			vx[i] *= DAMPING;
			vy[i] *= DAMPING;

			// Velocity cap (avoid sqrt when below threshold)
			const speedSq = vx[i] * vx[i] + vy[i] * vy[i];
			if (speedSq > MAX_VEL_SQ) {
				const invSpeed = MAX_VEL / Math.sqrt(speedSq);
				vx[i] *= invSpeed;
				vy[i] *= invSpeed;
			}

			// Wrap edges
			if (px[i] < -10) px[i] = W + 10;
			else if (px[i] > W + 10) px[i] = -10;
			if (py[i] < -10) py[i] = H + 10;
			else if (py[i] > H + 10) py[i] = -10;
		}

		raf = requestAnimationFrame(tick);
	}

	// Visibility observer — pause/resume canvas when off-screen
	const visObs = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting && !canvasRunning) {
					canvasRunning = true;
					raf = requestAnimationFrame(tick);
				} else if (!entry.isIntersecting && canvasRunning) {
					canvasRunning = false;
					cancelAnimationFrame(raf);
				}
			}
		},
		{ threshold: 0 }
	);
	visObs.observe(section);
	canvasRunning = true;
	raf = requestAnimationFrame(tick);

	return () => {
		canvasRunning = false;
		cancelAnimationFrame(raf);
		resizeObs.disconnect();
		visObs.disconnect();
		section.removeEventListener('mousemove', onMouseMove);
		section.removeEventListener('mouseleave', onMouseLeave);
		canvas.remove();
	};
}
