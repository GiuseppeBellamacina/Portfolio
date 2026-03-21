<script lang="ts">
	import { onMount } from 'svelte';

	let skillsSection: HTMLElement;
	let isVisible = false;

	interface TechIcon {
		name: string;
		icon: string;
		url: string;
	}

	interface SkillCategory {
		title: string;
		emoji: string;
		icons: TechIcon[];
	}

	const skillCategories: SkillCategory[] = [
		{
			title: 'Languages',
			emoji: '🔤',
			icons: [
				{ name: 'Python', icon: 'python-original.svg', url: 'https://www.python.org/' },
				{
					name: 'C',
					icon: 'c-original.svg',
					url: 'https://en.wikipedia.org/wiki/C_(programming_language)'
				},
				{ name: 'C++', icon: 'cplusplus-original.svg', url: 'https://isocpp.org/' },
				{
					name: 'C#',
					icon: 'csharp-original.svg',
					url: 'https://docs.microsoft.com/en-us/dotnet/csharp/'
				},
				{
					name: 'Java',
					icon: 'java-original-wordmark-removebg-preview.png',
					url: 'https://www.java.com/'
				},
				{
					name: 'JavaScript',
					icon: 'js.png',
					url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
				},
				{
					name: 'TypeScript',
					icon: 'Typescript_logo_2020.svg.png',
					url: 'https://www.typescriptlang.org/'
				},
				{ name: 'Bash', icon: 'bash.png', url: 'https://www.gnu.org/software/bash/' },
				{ name: 'Markdown', icon: 'markdown.svg', url: 'https://www.markdownguide.org/' },
				{
					name: 'HTML',
					icon: 'white_bg_HTML5_logo_and_wordmark.svg.png',
					url: 'https://developer.mozilla.org/en-US/docs/Web/HTML'
				},
				{ name: 'CSS', icon: 'css.png', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
				{
					name: 'LaTeX',
					icon: 'white_bg_latex-original.png',
					url: 'https://www.latex-project.org/'
				}
			]
		},
		{
			title: 'AI/ML & Data Science',
			emoji: '🤖',
			icons: [
				{ name: 'PyTorch', icon: 'pytorch-original.svg', url: 'https://pytorch.org/' },
				{ name: 'PyTorch Lightning', icon: 'lightning.png', url: 'https://lightning.ai/' },
				{ name: 'TensorFlow', icon: 'tensorflow.png', url: 'https://www.tensorflow.org/' },
				{ name: 'Weights & Biases', icon: 'wandb.png', url: 'https://wandb.ai/' },
				{ name: 'Keras', icon: 'keras-original.svg', url: 'https://keras.io/' },
				{
					name: 'Scikit-learn',
					icon: 'white_bg_scikitlearn-original.png',
					url: 'https://scikit-learn.org/'
				},
				{ name: 'NumPy', icon: 'numpy-original.svg', url: 'https://numpy.org/' },
				{ name: 'Pandas', icon: 'white_bg_pandas-original.png', url: 'https://pandas.pydata.org/' },
				{ name: 'Polars', icon: 'polars.png', url: 'https://www.pola.rs/' },
				{ name: 'Matplotlib', icon: 'matplotlib-original.svg', url: 'https://matplotlib.org/' },
				{ name: 'Seaborn', icon: 'seaborn-1.svg', url: 'https://seaborn.pydata.org/' },
				{ name: 'Plotly', icon: 'plotly.png', url: 'https://plotly.com/' },
				{ name: 'OpenCV', icon: 'opencv-original.svg', url: 'https://opencv.org/' },
				{ name: 'spaCy', icon: 'spacy.png', url: 'https://spacy.io/' },
				{ name: 'NLTK', icon: 'nltk.png', url: 'https://www.nltk.org/' },
				{ name: 'LangChain', icon: 'langchain.jpg', url: 'https://www.langchain.com/' },
				{
					name: 'LangGraph',
					icon: 'langgraph-color.jpg',
					url: 'https://langchain-ai.github.io/langgraph/'
				},
				{
					name: 'LangSmith',
					icon: 'langsmith-color.jpg',
					url: 'https://www.langchain.com/langsmith'
				},
				{
					name: 'HuggingFace',
					icon: 'huggingface-2-removebg-preview.png',
					url: 'https://huggingface.co/'
				},
				{ name: 'Kaggle', icon: 'kaggle-original-wordmark.svg', url: 'https://www.kaggle.com/' },
				{
					name: 'Google Colab',
					icon: 'google-colab-icon.webp',
					url: 'https://colab.research.google.com/'
				},
				{ name: 'Ollama', icon: 'white_bg_ollamalogo.png', url: 'https://ollama.com/' },
				{ name: 'Meta', icon: 'meta-6871457_1280.webp', url: 'https://ai.meta.com/' },
				{ name: 'OpenAI', icon: 'white_bg_openai-2.png', url: 'https://openai.com/' },
				{
					name: 'Model Context Protocol',
					icon: 'mcp.jpg',
					url: 'https://modelcontextprotocol.io/'
				},
				{ name: 'Chroma', icon: 'chroma.png', url: 'https://www.trychroma.com/' },
				{ name: 'Weaviate', icon: 'weaviate.png', url: 'https://weaviate.io/' }
			]
		},
		{
			title: 'Frameworks & Libraries',
			emoji: '🌐',
			icons: [
				{ name: 'React', icon: 'react.png', url: 'https://react.dev/' },
				{
					name: 'Node.js',
					icon: 'free-node-js-icon-svg-download-png-1174935.webp',
					url: 'https://nodejs.org/'
				},
				{ name: 'FastAPI', icon: 'fastapi.svg', url: 'https://fastapi.tiangolo.com/' },
				{
					name: 'Flask',
					icon: 'white_bg_flask-original-wordmark.png',
					url: 'https://flask.palletsprojects.com/'
				},
				{ name: 'Quart', icon: 'quart.png', url: 'https://quart.palletsprojects.com/' },
				{ name: 'Uvicorn', icon: 'white_bg_uvicorn.png', url: 'https://www.uvicorn.org/' },
				{ name: 'Streamlit', icon: 'streamlit-mark-color.svg', url: 'https://streamlit.io/' },
				{ name: 'Gradio', icon: 'gradio-color.png', url: 'https://www.gradio.app/' },
				{
					name: 'Requests',
					icon: 'Requests_Python_Logo.png',
					url: 'https://requests.readthedocs.io/'
				},
				{ name: 'Selenium', icon: 'selenium-original.svg', url: 'https://www.selenium.dev/' },
				{ name: 'Pytest', icon: 'pytest.png', url: 'https://pytest.org/' }
			]
		},
		{
			title: 'Databases',
			emoji: '🗃️',
			icons: [
				{
					name: 'MySQL',
					icon: 'mysql-original-wordmark-removebg-preview.png',
					url: 'https://www.mysql.com/'
				},
				{
					name: 'PostgreSQL',
					icon: 'Postgresql_elephant.svg.png',
					url: 'https://www.postgresql.org/'
				},
				{
					name: 'SQLite',
					icon: 'white_bg_sqlite-original-wordmark.png',
					url: 'https://www.sqlite.org/'
				},
				{
					name: 'Neo4j',
					icon: 'white_bg_neo4j-icon-452x512-b63ajo4a.png',
					url: 'https://neo4j.com/'
				},
				{
					name: 'PHPMyAdmin',
					icon: 'white_bg_phpmyadmin-thumb.png',
					url: 'https://www.phpmyadmin.net/'
				},
				{
					name: 'SQLAlchemy',
					icon: 'white_bg_sqlalchemy-original-wordmark.png',
					url: 'https://www.sqlalchemy.org/'
				}
			]
		},
		{
			title: 'DevOps & Tools',
			emoji: '🛠️',
			icons: [
				{ name: 'Git', icon: 'white_bg_git-original-wordmark.png', url: 'https://git-scm.com/' },
				{
					name: 'GitHub',
					icon: 'github-original-wordmark-removebg-preview.png',
					url: 'https://github.com/'
				},
				{
					name: 'GitHub Actions',
					icon: 'github-actions.png',
					url: 'https://github.com/features/actions'
				},
				{ name: 'Docker', icon: 'docker-original.svg', url: 'https://www.docker.com/' },
				{ name: 'VirtualBox', icon: 'virtualbox.png', url: 'https://www.virtualbox.org/' },
				{ name: 'AWS', icon: 'aws.webp', url: 'https://aws.amazon.com/' },
				{
					name: 'Anaconda',
					icon: 'white_bg_anaconda-original.png',
					url: 'https://www.anaconda.com/'
				},
				{ name: 'Poetry', icon: 'poetry.png', url: 'https://python-poetry.org/' },
				{ name: 'uv', icon: 'uv.svg', url: 'https://docs.astral.sh/uv/' },
				{ name: 'npm', icon: 'npm.webp', url: 'https://www.npmjs.com/' },
				{ name: 'Bun', icon: 'bun.png', url: 'https://bun.sh/' }
			]
		},
		{
			title: 'IDEs & Editors',
			emoji: '🖥️',
			icons: [
				{ name: 'VSCode', icon: 'vscode-original.svg', url: 'https://code.visualstudio.com/' },
				{
					name: 'Visual Studio',
					icon: 'visualstudio-original.svg',
					url: 'https://visualstudio.microsoft.com/'
				},
				{
					name: 'Jupyter',
					icon: 'jupyter-original-wordmark-removebg-preview.png',
					url: 'https://jupyter.org/'
				},
				{ name: 'Unity', icon: 'white_bg_unity-original.png', url: 'https://unity.com/' },
				{
					name: 'Blender',
					icon: 'blender-original-removebg-preview.png',
					url: 'https://www.blender.org/'
				}
			]
		},
		{
			title: 'Operating Systems & Security',
			emoji: '💻',
			icons: [
				{
					name: 'Windows',
					icon: 'white_bg_windows11-original.png',
					url: 'https://www.microsoft.com/windows'
				},
				{ name: 'Linux', icon: 'linux-original.svg', url: 'https://www.linux.org/' },
				{ name: 'Debian', icon: 'white_bg_Debian_logo.png', url: 'https://www.debian.org/' },
				{ name: 'Ubuntu', icon: 'ubuntu-original.svg', url: 'https://ubuntu.com/' },
				{
					name: 'Kali Linux',
					icon: 'white_bg_kalilinux-original-wordmark.png',
					url: 'https://www.kali.org/'
				},
				{ name: 'Wireshark', icon: 'Wireshark_icon_new.png', url: 'https://www.wireshark.org/' }
			]
		}
	];

	// Shooting stars & Constellations — rendered on a single canvas (saves ~150+ DOM nodes)
	// Canvas pauses when section is off-screen to save CPU
	let effectsCanvas: HTMLCanvasElement | null = null;
	let canvasRunning = false;

	function createCanvasEffects() {
		if (!skillsSection) return;

		const canvas = document.createElement('canvas');
		canvas.style.cssText = `
			position: absolute; inset: 0; width: 100%; height: 100%;
			pointer-events: none; z-index: 1;
		`;
		skillsSection.appendChild(canvas);
		effectsCanvas = canvas;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let W = (canvas.width = skillsSection.offsetWidth);
		let H = (canvas.height = skillsSection.offsetHeight);

		const resizeObs = new ResizeObserver(() => {
			W = canvas.width = skillsSection.offsetWidth;
			H = canvas.height = skillsSection.offsetHeight;
		});
		resizeObs.observe(skillsSection);

		// — Constellations (reduced count for performance) —
		interface ConstellationStar {
			x: number;
			y: number;
			r: number;
			phase: number;
		}
		interface ConstellationLine {
			x1: number;
			y1: number;
			x2: number;
			y2: number;
			phase: number;
		}
		const cStars: ConstellationStar[] = [];
		const cLines: ConstellationLine[] = [];

		const constellations = [
			{ stars: 4, x: 15, y: 15 },
			{ stars: 3, x: 45, y: 20 },
			{ stars: 4, x: 75, y: 18 },
			{ stars: 3, x: 10, y: 50 },
			{ stars: 4, x: 50, y: 48 },
			{ stars: 3, x: 88, y: 55 },
			{ stars: 4, x: 30, y: 78 },
			{ stars: 3, x: 70, y: 75 }
		];

		for (const c of constellations) {
			const pts: { x: number; y: number }[] = [];
			for (let i = 0; i < c.stars; i++) {
				const sx = (c.x / 100) * W + Math.random() * 100;
				const sy = (c.y / 100) * H + Math.random() * 100;
				pts.push({ x: sx, y: sy });
				cStars.push({
					x: sx,
					y: sy,
					r: 1 + Math.random() * 1.5,
					phase: Math.random() * Math.PI * 2
				});
			}
			for (let i = 0; i < pts.length - 1; i++) {
				cLines.push({
					x1: pts[i].x,
					y1: pts[i].y,
					x2: pts[i + 1].x,
					y2: pts[i + 1].y,
					phase: Math.random() * Math.PI * 2
				});
			}
		}

		// — Shooting stars —
		interface ShootingStar {
			x: number;
			y: number;
			vx: number;
			vy: number;
			life: number;
			maxLife: number;
		}
		const shootingStars: ShootingStar[] = [];
		let spawnTimer = 0;
		let raf = 0;

		function tick(t: number) {
			if (!canvasRunning) return;

			ctx!.clearRect(0, 0, W, H);

			// Draw constellations — batch fill calls
			ctx!.shadowBlur = 8;
			ctx!.shadowColor = 'rgba(100,200,255,0.6)';
			for (const s of cStars) {
				const alpha = 0.6 + 0.4 * Math.sin(t * 0.002 + s.phase);
				ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
				ctx!.beginPath();
				ctx!.arc(s.x, s.y, s.r * (0.85 + 0.15 * Math.sin(t * 0.002 + s.phase)), 0, Math.PI * 2);
				ctx!.fill();
			}
			ctx!.shadowBlur = 0;

			for (const l of cLines) {
				const alpha = 0.3 + 0.3 * Math.sin(t * 0.002 + l.phase);
				ctx!.strokeStyle = `rgba(100,200,255,${alpha})`;
				ctx!.lineWidth = 1;
				ctx!.beginPath();
				ctx!.moveTo(l.x1, l.y1);
				ctx!.lineTo(l.x2, l.y2);
				ctx!.stroke();
			}

			// Spawn shooting stars (less frequently)
			spawnTimer += 16;
			if (spawnTimer > 2500 && Math.random() > 0.5) {
				spawnTimer = 0;
				const speed = 3 + Math.random() * 4;
				shootingStars.push({
					x: Math.random() * W,
					y: Math.random() * H * 0.6,
					vx: speed,
					vy: speed,
					life: 0,
					maxLife: 40 + Math.random() * 40
				});
			}

			// Draw shooting stars
			for (let i = shootingStars.length - 1; i >= 0; i--) {
				const s = shootingStars[i];
				s.x += s.vx;
				s.y += s.vy;
				s.life++;
				const alpha = 1 - s.life / s.maxLife;
				if (alpha <= 0) {
					shootingStars.splice(i, 1);
					continue;
				}

				ctx!.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
				ctx!.lineWidth = 2;
				ctx!.beginPath();
				ctx!.moveTo(s.x, s.y);
				ctx!.lineTo(s.x - s.vx * 6, s.y - s.vy * 6);
				ctx!.stroke();

				ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
				ctx!.beginPath();
				ctx!.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
				ctx!.fill();
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
		visObs.observe(skillsSection);
		canvasRunning = true;
		raf = requestAnimationFrame(tick);

		return () => {
			canvasRunning = false;
			cancelAnimationFrame(raf);
			resizeObs.disconnect();
			visObs.disconnect();
			canvas.remove();
		};
	}

	// Subtle parallax on hover (CSS handles the scale, JS adds micro-shift)
	function addParallaxEffect() {
		const icons = document.querySelectorAll('.tech-icon') as NodeListOf<HTMLElement>;

		icons.forEach((icon) => {
			icon.addEventListener('mouseleave', () => {
				icon.style.transform = '';
			});

			icon.addEventListener('mousemove', (e) => {
				const rect = icon.getBoundingClientRect();
				const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
				const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
				icon.style.transform = `scale(1.18) translateY(-3px) translate(${x * 4}px, ${y * 4}px)`;
			});
		});
	}

	// Setup fade-in animations for skills categories and icons
	function setupSkillsAnimations() {
		// Fade-in for categories
		const categories = document.querySelectorAll('.skills-category') as NodeListOf<HTMLElement>;
		const categoryObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
		);

		categories.forEach((category) => {
			categoryObserver.observe(category);
		});

		// Fade-in for tech icons with stagger
		const icons = document.querySelectorAll('.tech-icon') as NodeListOf<HTMLElement>;
		const iconObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry, index) => {
					if (entry.isIntersecting) {
						setTimeout(() => {
							entry.target.classList.add('visible');
						}, index * 50); // 50ms stagger delay
					}
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
		);

		icons.forEach((icon) => {
			iconObserver.observe(icon);
		});
	}

	onMount(() => {
		let cleanupCanvas: (() => void) | undefined;
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isVisible) {
						isVisible = true;
						cleanupCanvas = createCanvasEffects();
						setTimeout(() => {
							addParallaxEffect();
							setupSkillsAnimations();
						}, 100);
					}
				});
			},
			{ threshold: 0.05, rootMargin: '100px' }
		);

		if (skillsSection) {
			observer.observe(skillsSection);
		}

		return () => {
			if (skillsSection) {
				observer.unobserve(skillsSection);
			}
			cleanupCanvas?.();
		};
	});
</script>

<section id="skills" class="skills" bind:this={skillsSection}>
	<div class="container">
		<h2 class="section-title">💻 Tech Stack</h2>

		{#each skillCategories as category}
			<div class="skills-category">
				<h3>{category.emoji} {category.title}</h3>
				<div class="skills-grid">
					{#each category.icons as icon}
						<a href={icon.url} target="_blank" rel="noopener noreferrer" class="tech-icon-link">
							<div class="tech-icon" data-title={icon.name}>
								<span class="tech-name">{icon.name}</span>
								<img src="/assets/icons/{icon.icon}" alt={icon.name} loading="lazy" />
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
</style>
