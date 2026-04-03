/**
 * Feedforward neural network visualization with impulse propagation.
 * Renders layers of neurons with animated forward-pass impulses on Canvas 2D.
 */
export function createNeuralNetworkViz(
	canvas: HTMLCanvasElement,
	section: HTMLElement,
	getVisible: () => boolean
): (() => void) | undefined {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	function resizeCanvas() {
		canvas.width = section.offsetWidth;
		canvas.height = section.offsetHeight;
	}
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);

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

	layers.forEach((layer, layerIndex) => {
		const layerNeurons: Neuron[] = [];
		const spacing = canvas.height / (layer.nodes + 1);

		for (let i = 0; i < layer.nodes; i++) {
			const neuron: Neuron = {
				x: layer.x * canvas.width,
				y: (i + 1) * spacing,
				layer: layerIndex,
				radius: 6,
				glow: 0
			};
			neurons.push(neuron);
			layerNeurons.push(neuron);
		}

		if (layerIndex > 0) {
			const prevLayerNeurons = neurons.filter((n) => n.layer === layerIndex - 1);
			layerNeurons.forEach((neuron) => {
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

	let time = 0;
	const impulses: Impulse[] = [];
	const maxImpulses = 25;

	const impulseInterval = setInterval(() => {
		if (!getVisible() || impulses.length > maxImpulses) return;

		const inputNeurons = neurons.filter((n) => n.layer === 0);
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
					impulses.push({
						from: conn.from,
						to: conn.to,
						progress: 0,
						speed: 0.012 + Math.random() * 0.008,
						trail: []
					});
				});
			}
		});
	}, 800);

	function animate() {
		if (!getVisible()) {
			requestAnimationFrame(animate);
			return;
		}

		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		time += 0.01;

		// Draw connections
		connections.forEach((conn) => {
			const opacity = 0.15 + Math.sin(time + conn.weight * 10) * 0.05;
			ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
			ctx.lineWidth = 1;
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
			ctx.shadowBlur = 8;
			ctx.shadowColor = 'rgba(52, 211, 153, 0.5)';
			ctx.beginPath();
			ctx.arc(x, y, 3, 0, Math.PI * 2);
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
						setTimeout(() => {
							if (impulses.length < maxImpulses) {
								impulses.push({
									from: conn.from,
									to: conn.to,
									progress: 0,
									speed: 0.012 + Math.random() * 0.008,
									trail: []
								});
							}
						}, idx * 50);
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

			ctx.fillStyle = color + '0.6)';
			ctx.beginPath();
			ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
			ctx.fill();

			if (neuron.glow > 0) {
				ctx.fillStyle = color + neuron.glow + ')';
				ctx.shadowBlur = 20;
				ctx.shadowColor = color + '1)';
				ctx.beginPath();
				ctx.arc(neuron.x, neuron.y, neuron.radius + 4, 0, Math.PI * 2);
				ctx.fill();
				ctx.shadowBlur = 0;
			}

			ctx.strokeStyle = color + '1)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
			ctx.stroke();
		});

		if (getVisible()) {
			requestAnimationFrame(animate);
		}
	}

	animate();

	return () => {
		clearInterval(impulseInterval);
		window.removeEventListener('resize', resizeCanvas);
	};
}

/**
 * Simple floating particles effect for mobile screens.
 */
export function createMobileParticles(
	canvas: HTMLCanvasElement,
	section: HTMLElement,
	getVisible: () => boolean
): (() => void) | undefined {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	function resizeCanvas() {
		canvas.width = section.offsetWidth;
		canvas.height = section.offsetHeight;
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

	function animate() {
		if (!getVisible()) {
			requestAnimationFrame(animate);
			return;
		}

		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		particles.forEach((p1, i) => {
			particles.slice(i + 1).forEach((p2) => {
				const dx = p2.x - p1.x;
				const dy = p2.y - p1.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < 150) {
					const opacity = (1 - dist / 150) * 0.2;
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

			ctx.fillStyle = `hsla(${particle.hue}, 50%, 60%, ${particle.opacity})`;
			ctx.shadowBlur = 8;
			ctx.shadowColor = `hsla(${particle.hue}, 50%, 60%, ${particle.opacity})`;
			ctx.beginPath();
			ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.shadowBlur = 0;
		});

		if (getVisible()) {
			requestAnimationFrame(animate);
		}
	}

	animate();

	return () => {
		window.removeEventListener('resize', resizeCanvas);
	};
}
