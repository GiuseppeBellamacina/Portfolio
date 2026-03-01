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
				{ name: 'TensorFlow', icon: 'tensorflow.png', url: 'https://www.tensorflow.org/' },
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
				{
					name: 'Google Colab',
					icon: 'google-colab-icon.webp',
					url: 'https://colab.research.google.com/'
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

	// Shooting stars
	function createShootingStars() {
		if (!skillsSection) return;

		setInterval(() => {
			if (Math.random() > 0.4) {
				const star = document.createElement('div');
				star.className = 'shooting-star';
				star.style.cssText = `
							position: absolute;
							top: ${Math.random() * 60}%;
							left: ${Math.random() * 100}%;
							width: 2px;
							height: 2px;
							background: white;
							border-radius: 50%;
							box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8);
							animation: shootingStar ${0.8 + Math.random() * 1.5}s linear forwards;
							pointer-events: none;
							z-index: 1;
						`;
				skillsSection.appendChild(star);

				setTimeout(() => {
					if (star.parentNode) {
						star.parentNode.removeChild(star);
					}
				}, 2500);
			}
		}, 1800);
	}

	// Constellations
	function createConstellations() {
		if (!skillsSection) return;

		const constellationContainer = document.createElement('div');
		constellationContainer.className = 'constellation-container';
		constellationContainer.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			pointer-events: none;
			z-index: 1;
		`;
		skillsSection.appendChild(constellationContainer);

		const constellations = [
			{ stars: 5, x: 15, y: 15 },
			{ stars: 4, x: 35, y: 20 },
			{ stars: 6, x: 55, y: 18 },
			{ stars: 5, x: 75, y: 22 },
			{ stars: 4, x: 90, y: 25 },
			{ stars: 5, x: 10, y: 45 },
			{ stars: 6, x: 30, y: 50 },
			{ stars: 4, x: 50, y: 48 },
			{ stars: 5, x: 70, y: 52 },
			{ stars: 6, x: 88, y: 55 },
			{ stars: 4, x: 20, y: 75 },
			{ stars: 5, x: 42, y: 78 },
			{ stars: 6, x: 62, y: 72 },
			{ stars: 4, x: 80, y: 80 },
			{ stars: 3, x: 95, y: 85 }
		];

		constellations.forEach((constellation) => {
			const constGroup = document.createElement('div');
			constGroup.style.cssText = `
				position: absolute;
				left: ${constellation.x}%;
				top: ${constellation.y}%;
			`;

			const starPositions: { x: number; y: number }[] = [];

			for (let i = 0; i < constellation.stars; i++) {
				const starX = Math.random() * 100;
				const starY = Math.random() * 100;
				starPositions.push({ x: starX, y: starY });

				const star = document.createElement('div');
				star.className = 'constellation-star';
				star.style.cssText = `
					position: absolute;
					left: ${starX}px;
					top: ${starY}px;
					width: ${2 + Math.random() * 2}px;
					height: ${2 + Math.random() * 2}px;
					background: rgba(255, 255, 255, 0.9);
					border-radius: 50%;
					box-shadow: 0 0 8px 2px rgba(100, 200, 255, 0.6);
					animation: constellationTwinkle 3s ease-in-out infinite;
					animation-delay: ${Math.random() * 2}s;
				`;
				constGroup.appendChild(star);
			}

			// Lines connecting stars
			for (let i = 0; i < starPositions.length - 1; i++) {
				const from = starPositions[i];
				const to = starPositions[i + 1];
				const dx = to.x - from.x;
				const dy = to.y - from.y;
				const length = Math.sqrt(dx * dx + dy * dy);
				const angle = Math.atan2(dy, dx) * (180 / Math.PI);

				const line = document.createElement('div');
				line.className = 'constellation-line';
				line.style.cssText = `
					position: absolute;
					left: ${from.x}px;
					top: ${from.y}px;
					width: ${length}px;
					height: 1px;
					background: linear-gradient(90deg, rgba(100, 200, 255, 0.3), rgba(100, 200, 255, 0.5), rgba(100, 200, 255, 0.3));
					transform: rotate(${angle}deg);
					transform-origin: left center;
					animation: constellationLinePulse 3s ease-in-out infinite;
					animation-delay: ${Math.random() * 2}s;
				`;
				constGroup.appendChild(line);
			}

			constellationContainer.appendChild(constGroup);
		});
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
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isVisible) {
						isVisible = true;
						createShootingStars();
						createConstellations();
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
	:global(.shooting-star::after) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 80px;
		height: 1px;
		background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), transparent);
		transform: translateX(-80px) translateY(0px) rotate(45deg);
	}

	:global {
		@keyframes shootingStar {
			0% {
				transform: translate(0, 0) scale(1);
				opacity: 1;
			}
			70% {
				opacity: 1;
			}
			100% {
				transform: translate(300px, 300px) scale(0);
				opacity: 0;
			}
		}

		@keyframes constellationTwinkle {
			0%,
			100% {
				opacity: 0.6;
				transform: scale(1);
			}
			50% {
				opacity: 1;
				transform: scale(1.3);
			}
		}

		@keyframes constellationLinePulse {
			0%,
			100% {
				opacity: 0.3;
			}
			50% {
				opacity: 0.6;
			}
		}
	}
</style>
