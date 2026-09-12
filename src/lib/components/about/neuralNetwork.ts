/**
 * Handle returned by the canvas factories: cleanup plus a `triggerWave`
 * hook the host can fire to make the visualization react to user actions.
 */
export interface VizHandle {
	destroy: () => void;
	triggerWave: () => void;
}

/**
 * Sparse neural graph visualization with impulse propagation.
 * Nodes are scattered across the whole section (min-spacing rejection sampling)
 * and each connects to 2-3 nearest neighbours; impulses travel along edges,
 * glow on arrival and propagate node-to-node. The engine is the same as the
 * old layered FNN — on a free-form graph that fills the entire section.
 */
export function createNeuralGraphViz(
	canvas: HTMLCanvasElement,
	section: HTMLElement,
	getVisible: () => boolean
): VizHandle | undefined {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	interface Neuron {
		x: number;
		y: number;
		radius: number;
		glow: number;
		/** Color role — keeps the tri-tone identity of the old layered net */
		tone: 'core' | 'in' | 'out';
		/** Last impulse departure (performance.now) — LRU bias spreads traffic */
		lastActive: number;
		/** Per-node propagation chance — organic heterogeneity, not uniform rules */
		propagation: number;
		/** Per-node quiet period after firing (ms) — hubs can't be machine-gunned */
		cooldown: number;
	}
	interface Edge {
		from: Neuron;
		to: Neuron;
		weight: number;
	}
	interface Impulse {
		from: Neuron;
		to: Neuron;
		progress: number;
		speed: number;
		trail: { x: number; y: number }[];
	}

	const neurons: Neuron[] = [];
	const edges: Edge[] = [];
	const adjacency = new Map<Neuron, Edge[]>();
	// Keep nodes away from the section borders
	const MARGIN = 48;

	/** Live theme colors (RGB triplet strings) — re-read on season/day-night class changes */
	function getThemeColors() {
		const style = getComputedStyle(document.body);
		return {
			core: style.getPropertyValue('--primary-rgb').trim() || '99, 102, 241',
			in: style.getPropertyValue('--neon-green-rgb').trim() || '52, 211, 153',
			out: style.getPropertyValue('--secondary-rgb').trim() || '167, 139, 250'
		};
	}
	let colors = getThemeColors();
	const themeObserver = new MutationObserver(() => {
		colors = getThemeColors();
	});
	themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

	function toneFor(): Neuron['tone'] {
		const r = Math.random();
		return r < 0.68 ? 'core' : r < 0.88 ? 'in' : 'out';
	}

	function pushAdj(node: Neuron, edge: Edge) {
		const list = adjacency.get(node);
		if (list) list.push(edge);
		else adjacency.set(node, [edge]);
	}

	/**
	 * Sparse organic layout: rejection-sampled node positions with a minimum
	 * spacing that scales with the section area, then each node links to 2-3
	 * nearest neighbours (deduped, globally capped) — no layers, no columns.
	 */
	function layoutGraph() {
		neurons.length = 0;
		edges.length = 0;
		adjacency.clear();

		const w = canvas.width;
		const h = canvas.height;
		// Node count scales with the section area, clamped for legibility/perf
		const target = Math.max(20, Math.min(36, Math.round((w * h) / 42000)));
		const minDist = Math.sqrt((w * h) / target) * 0.62;

		let attempts = 0;
		while (neurons.length < target && attempts < 900) {
			attempts++;
			const x = MARGIN + Math.random() * (w - 2 * MARGIN);
			const y = MARGIN + Math.random() * (h - 2 * MARGIN);
			let free = true;
			for (const n of neurons) {
				const dx = n.x - x;
				const dy = n.y - y;
				if (dx * dx + dy * dy < minDist * minDist) {
					free = false;
					break;
				}
			}
			if (free) {
				neurons.push({
					x,
					y,
					radius: 5 + Math.random() * 3.5,
					glow: 0,
					tone: toneFor(),
					lastActive: -Infinity,
					propagation: 0.45 + Math.random() * 0.25,
					cooldown: 900 + Math.random() * 1600
				});
			}
		}

		const maxEdges = Math.round(neurons.length * 1.7);
		const seen = new Set<string>();
		neurons.forEach((n, i) => {
			const nearest = neurons
				.map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
				.filter((o) => o.j !== i)
				.sort((a, b) => a.d - b.d)
				.slice(0, 2 + (Math.random() < 0.45 ? 1 : 0));
			for (const { j } of nearest) {
				const key = i < j ? `${i}:${j}` : `${j}:${i}`;
				if (seen.has(key) || edges.length >= maxEdges) continue;
				seen.add(key);
				const edge: Edge = {
					from: neurons[i],
					to: neurons[j],
					weight: Math.random() * 0.5 + 0.3
				};
				edges.push(edge);
				pushAdj(edge.from, edge);
				pushAdj(edge.to, edge);
			}
		});
	}

	function resizeCanvas() {
		// The canvas covers the whole section (see about.css): size the backing
		// store from the element itself for a 1:1 mapping.
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
		layoutGraph();
	}
	// Size the canvas BEFORE the first layout, otherwise nodes are placed in the
	// default 300x150 backing store and the CSS stretch pixelates everything
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);

	let time = 0;
	const impulses: Impulse[] = [];
	const timeoutIds: number[] = [];
	const maxImpulses = 30;

	function edgesFrom(node: Neuron): Edge[] {
		return adjacency.get(node) ?? [];
	}

	function otherEnd(edge: Edge, node: Neuron): Neuron {
		return edge.from === node ? edge.to : edge.from;
	}

	/** Among a node's edges, prefer those leading to the least recently active
	 *  neighbours (random pick within the quietest half) — spreads traffic
	 *  instead of feeding the same hubs. */
	function pickQuietEdge(list: Edge[], from: Neuron): Edge {
		if (list.length <= 1) return list[0];
		const sorted = list
			.map((edge) => ({ edge, neighbour: otherEnd(edge, from) }))
			.sort((a, b) => a.neighbour.lastActive - b.neighbour.lastActive);
		const quietest = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
		return quietest[Math.floor(Math.random() * quietest.length)].edge;
	}

	function spawnImpulseBetween(from: Neuron, to: Neuron) {
		if (impulses.length >= maxImpulses) return;
		impulses.push({
			from,
			to,
			progress: 0,
			speed: 0.012 + Math.random() * 0.008,
			trail: []
		});
	}

	/**
	 * Burst of impulses across the graph, fired on user actions (e.g. a
	 * terminal command) — the graph "processes" the event. Also bumps the glow
	 * of a third of the nodes as pure visual emphasis. Ignored offscreen.
	 */
	function triggerWave() {
		if (!getVisible() || !neurons.length) return;
		const now = performance.now();
		const burst = 10 + Math.floor(Math.random() * 5); // 10-14 impulses
		for (let i = 0; i < burst; i++) {
			const node = neurons[Math.floor(Math.random() * neurons.length)];
			const list = edgesFrom(node);
			if (!list.length) continue;
			const edge = pickQuietEdge(list, node);
			const neighbour = otherEnd(edge, node);
			node.lastActive = now;
			// Slight stagger so the wave reads as a propagation, not a flash
			const timeoutId = window.setTimeout(() => spawnImpulseBetween(node, neighbour), i * 40);
			timeoutIds.push(timeoutId);
		}
		neurons.forEach((n) => {
			if (Math.random() < 0.34) n.glow = Math.max(n.glow, 0.8);
		});
	}

	// Ambient life: impulses spark from nodes that have been quiet for a while,
	// so dormant areas wake up instead of always feeding the busiest nodes
	const impulseInterval = setInterval(() => {
		if (!getVisible() || impulses.length > maxImpulses || !neurons.length) return;
		const now = performance.now();
		const quiet = neurons.filter((n) => now - n.lastActive > 1200);
		const pool = quiet.length ? quiet : neurons;
		const sparks = Math.random() > 0.6 ? 2 : 1;
		for (let i = 0; i < sparks && impulses.length < maxImpulses; i++) {
			const node = pool[Math.floor(Math.random() * pool.length)];
			const list = edgesFrom(node);
			if (!list.length) continue;
			const edge = pickQuietEdge(list, node);
			node.lastActive = now;
			spawnImpulseBetween(node, otherEnd(edge, node));
		}
	}, 650);

	let rafId = 0;
	function animate() {
		rafId = 0;
		if (!getVisible()) {
			return;
		}

		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		time += 0.01;

		// Draw edges (same shimmer as the old connections)
		edges.forEach((edge) => {
			const opacity = 0.3 + Math.sin(time + edge.weight * 10) * 0.08;
			ctx.strokeStyle = `rgba(${colors.core}, ${opacity})`;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.moveTo(edge.from.x, edge.from.y);
			ctx.lineTo(edge.to.x, edge.to.y);
			ctx.stroke();
		});

		// Update and draw impulses (same engine: trail + glow + propagation)
		for (let i = impulses.length - 1; i >= 0; i--) {
			const impulse = impulses[i];
			impulse.progress += impulse.speed;

			const x = impulse.from.x + (impulse.to.x - impulse.from.x) * impulse.progress;
			const y = impulse.from.y + (impulse.to.y - impulse.from.y) * impulse.progress;

			impulse.trail.push({ x, y });
			if (impulse.trail.length > 5) {
				impulse.trail.shift();
			}

			impulse.trail.forEach((point, idx) => {
				const trailOpacity = (idx / impulse.trail.length) * 0.8;
				ctx.fillStyle = `rgba(${colors.in}, ${trailOpacity})`;
				ctx.beginPath();
				ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
				ctx.fill();
			});

			ctx.fillStyle = `rgba(${colors.in}, 0.9)`;
			ctx.shadowBlur = 12;
			ctx.shadowColor = `rgba(${colors.in}, 0.6)`;
			ctx.beginPath();
			ctx.arc(x, y, 3.5, 0, Math.PI * 2);
			ctx.fill();
			ctx.shadowBlur = 0;

			if (impulse.progress >= 1) {
				impulse.to.glow = 1;

				// Propagation: the arrival node may fire along its own edges —
				// gated by its personal cooldown (hub control) and probability,
				// aimed at its quietest neighbours (traffic spreading)
				const now = performance.now();
				const arrived = impulse.to;
				const next = edgesFrom(arrived);
				if (
					next.length &&
					impulses.length < maxImpulses &&
					now - arrived.lastActive > arrived.cooldown
				) {
					const roll = Math.random();
					const toFire = roll < 0.16 ? 2 : roll < arrived.propagation ? 1 : 0;
					if (toFire > 0) {
						arrived.lastActive = now;
						for (let k = 0; k < toFire; k++) {
							const edge = pickQuietEdge(next, arrived);
							const neighbour = otherEnd(edge, arrived);
							const timeoutId = window.setTimeout(
								() => spawnImpulseBetween(arrived, neighbour),
								k * 50
							);
							timeoutIds.push(timeoutId);
						}
					}
				}

				impulses.splice(i, 1);
			}
		}

		// Draw neurons (same tri-tone styling, roles instead of layers)
		neurons.forEach((neuron) => {
			if (neuron.glow > 0) {
				neuron.glow -= 0.02;
			}

			let color: string;
			if (neuron.tone === 'in') {
				color = `rgba(${colors.in}, `;
			} else if (neuron.tone === 'out') {
				color = `rgba(${colors.out}, `;
			} else {
				color = `rgba(${colors.core}, `;
			}

			ctx.fillStyle = color + '0.75)';
			ctx.beginPath();
			ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
			ctx.fill();

			if (neuron.glow > 0) {
				ctx.fillStyle = color + neuron.glow + ')';
				ctx.shadowBlur = 16;
				ctx.shadowColor = color + '1)';
				ctx.beginPath();
				ctx.arc(neuron.x, neuron.y, neuron.radius + 6, 0, Math.PI * 2);
				ctx.fill();
				ctx.shadowBlur = 0;
			}

			ctx.strokeStyle = color + '1)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
			ctx.stroke();
		});

		rafId = requestAnimationFrame(animate);
	}

	function resume() {
		if (getVisible() && !rafId) rafId = requestAnimationFrame(animate);
	}
	const visibilityObserver = new IntersectionObserver(resume);
	visibilityObserver.observe(section);
	resume();

	return {
		destroy: () => {
			clearInterval(impulseInterval);
			cancelAnimationFrame(rafId);
			timeoutIds.forEach((id) => clearTimeout(id));
			visibilityObserver.disconnect();
			themeObserver.disconnect();
			window.removeEventListener('resize', resizeCanvas);
		},
		triggerWave
	};
}

/**
 * Simple floating particles effect for mobile screens.
 */
export function createMobileParticles(
	canvas: HTMLCanvasElement,
	section: HTMLElement,
	getVisible: () => boolean
): VizHandle | undefined {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	function resizeCanvas() {
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
	}
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);

	/** Live theme colors (RGB triplet strings) — re-read on season/day-night class changes */
	function getThemeColors() {
		const style = getComputedStyle(document.body);
		return {
			core: style.getPropertyValue('--primary-rgb').trim() || '99, 102, 241',
			out: style.getPropertyValue('--secondary-rgb').trim() || '167, 139, 250'
		};
	}
	let colors = getThemeColors();
	const themeObserver = new MutationObserver(() => {
		colors = getThemeColors();
	});
	themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		opacity: number;
		tone: 'core' | 'out';
	}

	const particles: Particle[] = [];
	for (let i = 0; i < 25; i++) {
		particles.push({
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height,
			vx: (Math.random() - 0.5) * 0.5,
			vy: (Math.random() - 0.5) * 0.5,
			radius: Math.random() * 2 + 1,
			opacity: Math.random() * 0.5 + 0.3,
			tone: Math.random() < 0.5 ? 'core' : 'out'
		});
	}

	// Brief excitement pulse fired on user actions (mobile counterpart of the wave)
	let pulse = 0;
	function triggerWave() {
		if (!getVisible()) return;
		pulse = 1;
	}

	let rafId = 0;
	function animate() {
		rafId = 0;
		if (!getVisible()) {
			return;
		}

		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (pulse > 0) pulse -= 0.02;

		particles.forEach((p1, i) => {
			particles.slice(i + 1).forEach((p2) => {
				const dx = p2.x - p1.x;
				const dy = p2.y - p1.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < 150) {
					const opacity = (1 - dist / 150) * (0.2 + pulse * 0.15);
					ctx.strokeStyle = `rgba(${colors.core}, ${opacity})`;
					ctx.lineWidth = 0.5;
					ctx.beginPath();
					ctx.moveTo(p1.x, p1.y);
					ctx.lineTo(p2.x, p2.y);
					ctx.stroke();
				}
			});
		});

		particles.forEach((particle) => {
			particle.x += particle.vx;
			particle.y += particle.vy;

			if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
			if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

			particle.x = Math.max(0, Math.min(canvas.width, particle.x));
			particle.y = Math.max(0, Math.min(canvas.height, particle.y));

			const alpha = Math.min(1, particle.opacity + pulse * 0.3);
			const rgb = colors[particle.tone];
			ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
			ctx.shadowBlur = 8;
			ctx.shadowColor = `rgba(${rgb}, ${alpha})`;
			ctx.beginPath();
			ctx.arc(particle.x, particle.y, particle.radius * (1 + pulse * 0.6), 0, Math.PI * 2);
			ctx.fill();
			ctx.shadowBlur = 0;
		});

		rafId = requestAnimationFrame(animate);
	}

	function resume() {
		if (getVisible() && !rafId) rafId = requestAnimationFrame(animate);
	}
	const visibilityObserver = new IntersectionObserver(resume);
	visibilityObserver.observe(section);
	resume();

	return {
		destroy: () => {
			cancelAnimationFrame(rafId);
			visibilityObserver.disconnect();
			themeObserver.disconnect();
			window.removeEventListener('resize', resizeCanvas);
		},
		triggerWave
	};
}
