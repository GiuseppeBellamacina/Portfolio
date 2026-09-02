/**
 * Handle returned by the canvas factories: cleanup plus a `triggerWave`
 * hook the host can fire to make the visualization react to user actions.
 */
export interface VizHandle {
	destroy: () => void;
	triggerWave: () => void;
}

/**
 * Feedforward neural network visualization with impulse propagation.
 * Renders layers of neurons with animated forward-pass impulses on Canvas 2D.
 */
export function createNeuralNetworkViz(
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
		layer: number;
		radius: number;
		glow: number;
	}
	interface Connection {
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

	const layers = [
		{ nodes: 5, x: 0.15 },
		{ nodes: 8, x: 0.35 },
		{ nodes: 6, x: 0.55 },
		{ nodes: 4, x: 0.75 },
		{ nodes: 3, x: 0.9 }
	];

	const neurons: Neuron[] = [];
	const connections: Connection[] = [];
	const layerNeurons: Neuron[][] = layers.map(() => []);

	function layoutNetwork() {
		neurons.length = 0;
		connections.length = 0;
		layerNeurons.forEach((layer) => (layer.length = 0));
		layers.forEach((layer, layerIndex) => {
			const spacing = canvas.height / (layer.nodes + 1);

			for (let i = 0; i < layer.nodes; i++) {
				const neuron: Neuron = {
					x: layer.x * canvas.width,
					y: (i + 1) * spacing,
					layer: layerIndex,
					radius: 8,
					glow: 0
				};
				neurons.push(neuron);
				layerNeurons[layerIndex].push(neuron);
			}

			if (layerIndex > 0) {
				const prevLayerNeurons = layerNeurons[layerIndex - 1];
				layerNeurons[layerIndex].forEach((neuron) => {
					prevLayerNeurons.forEach((prevNeuron) => {
						connections.push({
							from: prevNeuron,
							to: neuron,
							weight: Math.random() * 0.5 + 0.3
						});
					});
				});
			}
		});
	}
	function resizeCanvas() {
		// The canvas is anchored to the terminal wrapper (see about.css): size the
		// backing store from the element itself for a 1:1 mapping with its stage.
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
		layoutNetwork();
	}
	// Size the canvas BEFORE the first layout: without this, neurons are placed
	// in the default 300x150 backing store and the CSS stretch pixelates/zooms everything
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);

	let time = 0;
	const impulses: Impulse[] = [];
	const timeoutIds: number[] = [];
	const maxImpulses = 30;

	function spawnImpulse(from: Neuron, to: Neuron) {
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
	 * Burst of impulses from the input layer, fired on user actions (e.g. a
	 * terminal command). Also lights up the output layer for ~1s as pure visual
	 * emphasis — no coupling with the network layout math. Ignored offscreen.
	 */
	function triggerWave() {
		if (!getVisible()) return;
		const inputNeurons = layerNeurons[0];
		if (!inputNeurons?.length) return;
		const burst = 10 + Math.floor(Math.random() * 5); // 10-14 impulses
		for (let i = 0; i < burst; i++) {
			const neuron = inputNeurons[Math.floor(Math.random() * inputNeurons.length)];
			const next = connections.filter((c) => c.from === neuron);
			if (!next.length) continue;
			const conn = next[Math.floor(Math.random() * next.length)];
			// Slight stagger so the wave reads as a propagation, not a flash
			const timeoutId = window.setTimeout(() => spawnImpulse(conn.from, conn.to), i * 40);
			timeoutIds.push(timeoutId);
		}
		// Output-layer emphasis: glow decays at 0.02/frame (~0.8-1s at 60fps)
		layerNeurons[layers.length - 1].forEach((n) => (n.glow = 1));
	}

	const impulseInterval = setInterval(() => {
		if (!getVisible() || impulses.length > maxImpulses) return;

		const inputNeurons = layerNeurons[0];
		const selectedNeurons = inputNeurons
			.sort(() => Math.random() - 0.5)
			.slice(0, Math.random() > 0.7 ? 2 : 1);

		selectedNeurons.forEach((neuron) => {
			if (impulses.length < maxImpulses) {
				const nextConnections = connections.filter((c) => c.from === neuron);
				const selectedConnections = nextConnections
					.sort(() => Math.random() - 0.5)
					.slice(0, Math.floor(Math.random() * 2) + 2);

				selectedConnections.forEach((conn) => {
					spawnImpulse(conn.from, conn.to);
				});
			}
		});
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

		// Draw connections
		connections.forEach((conn) => {
			const opacity = 0.3 + Math.sin(time + conn.weight * 10) * 0.08;
			ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.moveTo(conn.from.x, conn.from.y);
			ctx.lineTo(conn.to.x, conn.to.y);
			ctx.stroke();
		});

		// Update and draw impulses
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
				ctx.fillStyle = `rgba(52, 211, 153, ${trailOpacity})`;
				ctx.beginPath();
				ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
				ctx.fill();
			});

			ctx.fillStyle = 'rgba(52, 211, 153, 0.9)';
			ctx.shadowBlur = 12;
			ctx.shadowColor = 'rgba(52, 211, 153, 0.6)';
			ctx.beginPath();
			ctx.arc(x, y, 3.5, 0, Math.PI * 2);
			ctx.fill();
			ctx.shadowBlur = 0;

			if (impulse.progress >= 1) {
				impulse.to.glow = 1;

				const nextConnections = connections.filter((c) => c.from === impulse.to);
				const propagationChance = 0.4 + impulse.to.layer * 0.1;
				const numToPropagate = Math.floor(nextConnections.length * propagationChance);

				if (numToPropagate > 0 && impulses.length < maxImpulses) {
					const selectedConnections = nextConnections
						.sort((a, b) => {
							const weightA = a.weight + Math.random() * 0.3;
							const weightB = b.weight + Math.random() * 0.3;
							return weightB - weightA;
						})
						.slice(0, numToPropagate);

					selectedConnections.forEach((conn, idx) => {
						const timeoutId = window.setTimeout(() => {
							spawnImpulse(conn.from, conn.to);
						}, idx * 50);
						timeoutIds.push(timeoutId);
					});
				}

				impulses.splice(i, 1);
			}
		}

		// Draw neurons
		neurons.forEach((neuron) => {
			if (neuron.glow > 0) {
				neuron.glow -= 0.02;
			}

			let color: string;
			if (neuron.layer === 0) {
				color = 'rgba(52, 211, 153, ';
			} else if (neuron.layer === layers.length - 1) {
				color = 'rgba(167, 139, 250, ';
			} else {
				color = 'rgba(99, 102, 241, ';
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

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		opacity: number;
		hue: number;
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
			hue: Math.random() * 40 + 230
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
					ctx.strokeStyle = `hsla(${(p1.hue + p2.hue) / 2}, 50%, 60%, ${opacity})`;
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
			ctx.fillStyle = `hsla(${particle.hue}, 50%, 60%, ${alpha})`;
			ctx.shadowBlur = 8;
			ctx.shadowColor = `hsla(${particle.hue}, 50%, 60%, ${alpha})`;
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
			window.removeEventListener('resize', resizeCanvas);
		},
		triggerWave
	};
}
