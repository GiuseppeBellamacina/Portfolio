<script lang="ts">
	import { onMount } from 'svelte';

	let canvasElement: HTMLCanvasElement;
	let aboutSection: HTMLElement;
	let isVisible = false;
	let isSmallScreen = false;

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

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		opacity: number;
		hue: number;
	}

	function createSimpleAnimation() {
		if (!canvasElement || !aboutSection) return;

		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		function resizeCanvas() {
			canvasElement.width = aboutSection.offsetWidth;
			canvasElement.height = aboutSection.offsetHeight;
		}
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		const particles: Particle[] = [];
		const particleCount = 25;

		// Create particles
		for (let i = 0; i < particleCount; i++) {
			particles.push({
				x: Math.random() * canvasElement.width,
				y: Math.random() * canvasElement.height,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				radius: Math.random() * 2 + 1,
				opacity: Math.random() * 0.5 + 0.3,
				hue: Math.random() * 60 + 160 // Cyan to green
			});
		}

		function animate() {
			if (!isVisible) {
				requestAnimationFrame(animate);
				return;
			}

			if (!ctx) return;

			ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

			// Draw connections between nearby particles
			particles.forEach((p1, i) => {
				particles.slice(i + 1).forEach((p2) => {
					const dx = p2.x - p1.x;
					const dy = p2.y - p1.y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < 150) {
						const opacity = (1 - dist / 150) * 0.2;
						ctx.strokeStyle = `hsla(${(p1.hue + p2.hue) / 2}, 70%, 60%, ${opacity})`;
						ctx.lineWidth = 0.5;
						ctx.beginPath();
						ctx.moveTo(p1.x, p1.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.stroke();
					}
				});
			});

			// Update and draw particles
			particles.forEach((particle) => {
				particle.x += particle.vx;
				particle.y += particle.vy;

				// Bounce off walls
				if (particle.x < 0 || particle.x > canvasElement.width) particle.vx *= -1;
				if (particle.y < 0 || particle.y > canvasElement.height) particle.vy *= -1;

				// Keep particles in bounds
				particle.x = Math.max(0, Math.min(canvasElement.width, particle.x));
				particle.y = Math.max(0, Math.min(canvasElement.height, particle.y));

				// Draw particle
				ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
				ctx.shadowBlur = 10;
				ctx.shadowColor = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
				ctx.beginPath();
				ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
				ctx.fill();
				ctx.shadowBlur = 0;
			});

			if (isVisible) {
				requestAnimationFrame(animate);
			}
		}

		animate();

		return () => {
			window.removeEventListener('resize', resizeCanvas);
		};
	}

	function createNeuralNetwork() {
		if (!canvasElement || !aboutSection) return;

		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		function resizeCanvas() {
			canvasElement.width = aboutSection.offsetWidth;
			canvasElement.height = aboutSection.offsetHeight;
		}
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// Define feedforward network structure: 5 layers
		const layers = [
			{ nodes: 5, x: 0.15 }, // Input layer
			{ nodes: 8, x: 0.35 }, // Hidden layer 1
			{ nodes: 6, x: 0.55 }, // Hidden layer 2
			{ nodes: 4, x: 0.75 }, // Hidden layer 3
			{ nodes: 3, x: 0.9 } // Output layer
		];

		const neurons: Neuron[] = [];
		const connections: Connection[] = [];

		// Create neurons for each layer
		layers.forEach((layer, layerIndex) => {
			const layerNeurons: Neuron[] = [];
			const spacing = canvasElement.height / (layer.nodes + 1);

			for (let i = 0; i < layer.nodes; i++) {
				const neuron: Neuron = {
					x: layer.x * canvasElement.width,
					y: (i + 1) * spacing,
					layer: layerIndex,
					radius: 6,
					glow: 0
				};
				neurons.push(neuron);
				layerNeurons.push(neuron);
			}

			// Create connections to previous layer
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

		// Impulse system for forward propagation
		const impulses: Impulse[] = [];
		const maxImpulses = 25; // Limita numero impulsi contemporanei per performance

		setInterval(() => {
			if (!isVisible || impulses.length > maxImpulses) return;

			// Create impulses from input layer - uno alla volta in modo più distribuito
			const inputNeurons = neurons.filter((n) => n.layer === 0);
			// Seleziona casualmente 1-2 neuroni input
			const selectedNeurons = inputNeurons
				.sort(() => Math.random() - 0.5)
				.slice(0, Math.random() > 0.7 ? 2 : 1);

			selectedNeurons.forEach((neuron) => {
				if (impulses.length < maxImpulses) {
					// Seleziona solo 2-3 connessioni casuali invece di tutte
					const nextConnections = connections.filter((c) => c.from === neuron);
					const selectedConnections = nextConnections
						.sort(() => Math.random() - 0.5)
						.slice(0, Math.floor(Math.random() * 2) + 2); // 2-3 connessioni

					selectedConnections.forEach((conn) => {
						impulses.push({
							from: conn.from,
							to: conn.to,
							progress: 0,
							speed: 0.012 + Math.random() * 0.008, // Velocità più uniforme
							trail: []
						});
					});
				}
			});
		}, 800); // Intervallo leggermente più lungo per effetto più fluido

		function animate() {
			if (!isVisible) {
				requestAnimationFrame(animate);
				return;
			}

			if (!ctx) return;

			ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
			time += 0.01;

			// Draw connections with subtle pulse
			connections.forEach((conn) => {
				const opacity = 0.15 + Math.sin(time + conn.weight * 10) * 0.05;
				ctx.strokeStyle = `rgba(0, 217, 255, ${opacity})`;
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

				// Add to trail (5 punti come l'originale)
				impulse.trail.push({ x, y });
				if (impulse.trail.length > 5) {
					impulse.trail.shift();
				}

				// Draw trail
				impulse.trail.forEach((point, idx) => {
					const trailOpacity = (idx / impulse.trail.length) * 0.8;
					ctx.fillStyle = `rgba(0, 255, 157, ${trailOpacity})`;
					ctx.beginPath();
					ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
					ctx.fill();
				});

				// Draw main impulse
				ctx.fillStyle = 'rgba(0, 255, 157, 1)';
				ctx.shadowBlur = 10;
				ctx.shadowColor = 'rgba(0, 255, 157, 0.8)';
				ctx.beginPath();
				ctx.arc(x, y, 3, 0, Math.PI * 2);
				ctx.fill();
				ctx.shadowBlur = 0;

				// Neuron glow on impact
				if (impulse.progress >= 1) {
					impulse.to.glow = 1;

					// Propagazione più controllata: 40-60% chance basata sul peso della connessione
					const nextConnections = connections.filter((c) => c.from === impulse.to);

					// Seleziona solo alcune connessioni in modo più intelligente
					const propagationChance = 0.4 + impulse.to.layer * 0.1; // Aumenta probabilità nei layer più avanti
					const numToPropagete = Math.floor(nextConnections.length * propagationChance);

					if (numToPropagete > 0 && impulses.length < maxImpulses) {
						// Seleziona le connessioni con peso maggiore (più probabilità)
						const selectedConnections = nextConnections
							.sort((a, b) => {
								// Mix tra peso e casualità
								const weightA = a.weight + Math.random() * 0.3;
								const weightB = b.weight + Math.random() * 0.3;
								return weightB - weightA;
							})
							.slice(0, numToPropagete);

						// Aggiungi un piccolo delay per rendere la propagazione più naturale
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
							}, idx * 50); // 50ms di delay tra ogni impulso propagato
						});
					}

					impulses.splice(i, 1);
				}
			}

			// Draw neurons with glow effect
			neurons.forEach((neuron) => {
				// Decay glow
				if (neuron.glow > 0) {
					neuron.glow -= 0.02;
				}

				// Determine color based on layer
				let color;
				if (neuron.layer === 0) {
					color = 'rgba(0, 255, 157, '; // Input - green
				} else if (neuron.layer === layers.length - 1) {
					color = 'rgba(255, 0, 255, '; // Output - magenta
				} else {
					color = 'rgba(0, 217, 255, '; // Hidden - cyan
				}

				// Base neuron
				ctx.fillStyle = color + '0.6)';
				ctx.beginPath();
				ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
				ctx.fill();

				// Glow effect
				if (neuron.glow > 0) {
					ctx.fillStyle = color + neuron.glow + ')';
					ctx.shadowBlur = 20;
					ctx.shadowColor = color + '1)';
					ctx.beginPath();
					ctx.arc(neuron.x, neuron.y, neuron.radius + 4, 0, Math.PI * 2);
					ctx.fill();
					ctx.shadowBlur = 0;
				}

				// Neuron border
				ctx.strokeStyle = color + '1)';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
				ctx.stroke();
			});

			if (isVisible) {
				requestAnimationFrame(animate);
			}
		}

		animate();

		return () => {
			window.removeEventListener('resize', resizeCanvas);
		};
	}

	onMount(() => {
		// Controlla la dimensione dello schermo
		const checkScreenSize = () => {
			isSmallScreen = window.innerWidth < 768;
		};
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);

		// IntersectionObserver per lazy loading
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (!isVisible) {
							isVisible = true;
							// Avvia animazione appropriata in base alla dimensione dello schermo
							setTimeout(() => {
								if (isSmallScreen) {
									createSimpleAnimation();
								} else {
									createNeuralNetwork();
								}
							}, 0);
						} else {
							// Riprendi animazioni
							isVisible = true;
						}
					} else {
						// Pausa quando completamente fuori viewport
						isVisible = false;
					}
				});
			},
			{ threshold: 0.05, rootMargin: '50px' }
		);

		if (aboutSection) {
			observer.observe(aboutSection);
		}

		return () => {
			window.removeEventListener('resize', checkScreenSize);
			if (aboutSection) {
				observer.unobserve(aboutSection);
			}
		};
	});
</script>

<section id="about" class="about" bind:this={aboutSection}>
	<canvas class="neural-canvas" bind:this={canvasElement}></canvas>
	<div class="container">
		<h2 class="section-title">💫 About Me</h2>
		<div class="about-content">
			<div class="about-text">
				<p>
					Hi there! 👋 I'm Giuseppe, a Computer Science student at the University of Catania. I'm
					passionate about Artificial Intelligence and Cybersecurity, always diving into new
					challenges and exploring the unknown.
				</p>
				<p>
					Most of the time, I just end up doing weird stuff because, well... <strong
						>Sbaddu Supecchiu</strong
					>.
				</p>
				<p>
					I'm a huge fan of Marvel and Star Wars universe, but I'm just as obsessed with anime and
					way too many other things to list here. I also have a deep love for video games.
				</p>
				<p>
					Oh, and I have a thing for cars. I drive. <em>(Yes, I'm Ryan Gosling)</em>.
				</p>

				<div class="currently-working">
					<h3>🚀 Currently Working On</h3>
					<ul>
						<li>
							<strong
								><a href="https://github.com/GiuseppeBellamacina/Image-Enhancement" target="_blank"
									>Image Enhancement</a
								></strong
							>
							- Exploring advanced techniques for image quality improvement
						</li>
						<li>
							<strong
								><a
									href="https://github.com/GiuseppeBellamacina/Warehouse-Swarm-Intelligence-System"
									target="_blank">Warehouse Swarm Intelligence System</a
								></strong
							>
							- Designing a multi-agent system for optimizing warehouse operations
						</li>
						<li>
							<strong>Trip Planner</strong>
							- Trip Planner PWA (Progressive Web App)
						</li>
						<li>An <strong>AI to conquer the world</strong> (I'm joking... maybe)</li>
						<li><strong>Survive</strong></li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.neural-canvas {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		height: 80%;
		max-width: 1400px;
		max-height: 800px;
		pointer-events: none;
		z-index: 1;
	}
</style>
