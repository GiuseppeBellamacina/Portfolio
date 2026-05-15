/**
 * Interactive particle constellation effect for the Skills section.
 * Canvas 2D with physics: inter-particle repulsion, mouse connections, damping.
 */
export function createCanvasConstellation(section: HTMLElement): (() => void) | undefined {
	const canvas = document.createElement('canvas');
	canvas.style.cssText = `
		position: absolute; inset: 0; width: 100%; height: 100%;
		pointer-events: none; z-index: 1;
	`;
	section.appendChild(canvas);

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	let W = (canvas.width = section.offsetWidth);
	let H = (canvas.height = section.offsetHeight);
	let canvasRunning = false;
	let raf = 0;

	interface Node {
		index: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		r: number;
		hue: number;
		pulse: number;
		pulseSpeed: number;
	}

	const nodes: Node[] = [];
	// Scale particle count to section area (reduced: 50 particles for one viewport)
	const viewportArea = window.innerWidth * window.innerHeight;
	const sectionArea = W * H;
	const COUNT = Math.min(Math.max(Math.round(50 * (sectionArea / viewportArea)), 50), 120);
	const CONNECT_DIST = 150;
	const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;
	const REPULSE_DIST = 70;
	const REPULSE_DIST_SQ = REPULSE_DIST * REPULSE_DIST;
	const REPULSE_FORCE = 0.004;
	const MOUSE_CONNECT_DIST = 190;
	const MOUSE_REPULSE_DIST = 110;
	const MAX_VEL = 1.2;
	const DAMPING = 0.997;
	let mouse = { x: -9999, y: -9999 };

	// Spatial grid for O(n) neighbor queries
	const CELL_SIZE = CONNECT_DIST;
	let grid: Map<string, Node[]> = new Map();

	function getCellKey(x: number, y: number): string {
		const cx = Math.floor(x / CELL_SIZE);
		const cy = Math.floor(y / CELL_SIZE);
		return `${cx},${cy}`;
	}

	function updateGrid() {
		grid.clear();
		for (const n of nodes) {
			const key = getCellKey(n.x, n.y);
			if (!grid.has(key)) grid.set(key, []);
			grid.get(key)!.push(n);
		}
	}

	function getNeighbors(node: Node): Node[] {
		const cx = Math.floor(node.x / CELL_SIZE);
		const cy = Math.floor(node.y / CELL_SIZE);
		const neighbors: Node[] = [];
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				const key = `${cx + dx},${cy + dy}`;
				const cell = grid.get(key);
				if (cell) {
					neighbors.push(...cell);
				}
			}
		}
		return neighbors;
	}

	for (let i = 0; i < COUNT; i++) {
		nodes.push({
			index: i,
			x: Math.random() * W,
			y: Math.random() * H,
			vx: (Math.random() - 0.5) * 0.4,
			vy: (Math.random() - 0.5) * 0.4,
			r: Math.random() * 2 + 1,
			hue: Math.random() > 0.5 ? 235 + Math.random() * 15 : 270 + Math.random() * 20,
			pulse: Math.random() * Math.PI * 2,
			pulseSpeed: 0.02 + Math.random() * 0.02
		});
	}

	const resizeObs = new ResizeObserver(() => {
		W = canvas.width = section.offsetWidth;
		H = canvas.height = section.offsetHeight;
		for (const n of nodes) {
			if (n.x > W) n.x = Math.random() * W;
			if (n.y > H) n.y = Math.random() * H;
		}
	});
	resizeObs.observe(section);

	function onMouseMove(e: MouseEvent) {
		// Compute rect on each move to avoid stale values after scrolling
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

	function tick() {
		if (!canvasRunning) return;

		ctx!.clearRect(0, 0, W, H);

		// Update spatial grid
		updateGrid();

		// Connections + inter-particle repulsion using spatial grid
		ctx!.lineWidth = 0.6;
		for (let i = 0; i < nodes.length; i++) {
			const nodeA = nodes[i];
			const neighbors = getNeighbors(nodeA);

			for (let j = 0; j < neighbors.length; j++) {
				const nodeB = neighbors[j];
				if (nodeA === nodeB) continue;
				// Ensure we only process each pair once (by index ordering)
				if (nodeB.index <= i) continue;

				const dx = nodeB.x - nodeA.x;
				const dy = nodeB.y - nodeA.y;
				const distSq = dx * dx + dy * dy;

				if (distSq < REPULSE_DIST_SQ && distSq > 0) {
					const dist = Math.sqrt(distSq);
					const force = (1 - dist / REPULSE_DIST) * REPULSE_FORCE;
					const fx = (dx / dist) * force;
					const fy = (dy / dist) * force;
					nodeA.vx -= fx;
					nodeA.vy -= fy;
					nodeB.vx += fx;
					nodeB.vy += fy;
				}

				if (distSq < CONNECT_DIST_SQ) {
					const dist = Math.sqrt(distSq);
					const alpha = (1 - dist / CONNECT_DIST) * 0.25;
					ctx!.strokeStyle = `hsla(${(nodeA.hue + nodeB.hue) >> 1}, 60%, 60%, ${alpha})`;
					ctx!.beginPath();
					ctx!.moveTo(nodeA.x, nodeA.y);
					ctx!.lineTo(nodeB.x, nodeB.y);
					ctx!.stroke();
				}
			}
		}

		// Mouse connections (keep as-is, only ~120 nodes max)
		ctx!.lineWidth = 0.8;
		for (const n of nodes) {
			const dx = n.x - mouse.x;
			const dy = n.y - mouse.y;
			const distSq = dx * dx + dy * dy;
			if (distSq < MOUSE_CONNECT_DIST * MOUSE_CONNECT_DIST) {
				const dist = Math.sqrt(distSq);
				const alpha = (1 - dist / MOUSE_CONNECT_DIST) * 0.4;
				ctx!.strokeStyle = `hsla(${n.hue}, 65%, 65%, ${alpha})`;
				ctx!.beginPath();
				ctx!.moveTo(n.x, n.y);
				ctx!.lineTo(mouse.x, mouse.y);
				ctx!.stroke();
			}
		}

		// Nodes
		for (const n of nodes) {
			n.pulse += n.pulseSpeed;
			const glow = 0.5 + Math.sin(n.pulse) * 0.3;
			const r = n.r + Math.sin(n.pulse) * 0.5;

			ctx!.fillStyle = `hsla(${n.hue}, 55%, 65%, ${glow})`;
			ctx!.shadowBlur = 10;
			ctx!.shadowColor = `hsla(${n.hue}, 55%, 60%, 0.4)`;
			ctx!.beginPath();
			ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
			ctx!.fill();
			ctx!.shadowBlur = 0;

			// Physics
			n.x += n.vx;
			n.y += n.vy;

			// Mouse repulsion (only when mouse is close)
			const mdx = n.x - mouse.x;
			const mdy = n.y - mouse.y;
			const mdSq = mdx * mdx + mdy * mdy;
			if (mdSq < MOUSE_REPULSE_DIST * MOUSE_REPULSE_DIST && mdSq > 0) {
				const md = Math.sqrt(mdSq);
				n.vx += (mdx / md) * 0.03;
				n.vy += (mdy / md) * 0.03;
			}

			// Damping
			n.vx *= DAMPING;
			n.vy *= DAMPING;

			// Velocity cap
			const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
			if (speed > MAX_VEL) {
				n.vx = (n.vx / speed) * MAX_VEL;
				n.vy = (n.vy / speed) * MAX_VEL;
			}

			// Wrap around edges
			if (n.x < -10) n.x = W + 10;
			if (n.x > W + 10) n.x = -10;
			if (n.y < -10) n.y = H + 10;
			if (n.y > H + 10) n.y = -10;
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
