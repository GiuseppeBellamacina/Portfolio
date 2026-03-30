<script lang="ts">
	import { onMount, tick } from 'svelte';

	let isVisible = false;

	interface Project {
		icon: string;
		title: string;
		description: string;
		techTags: string[];
		githubUrl: string;
		image?: string;
		accentColor?: string;
		isHackathonWinner?: boolean;
		externalLink?: {
			url: string;
			type: 'demo' | 'download' | 'youtube' | 'hackathon';
			icon: string;
		};
		stars?: number;
		starsLoaded?: boolean;
	}

	// Fallback dark cyberpunk gradients for cards without images
	const cardGradients = [
		'linear-gradient(135deg, #0b0d17 0%, #1e1b4b 100%)',
		'linear-gradient(135deg, #0f0d1a 0%, #312e81 100%)',
		'linear-gradient(135deg, #0c0a18 0%, #1e1b4b 100%)',
		'linear-gradient(135deg, #0a0d1b 0%, #1e3a5f 100%)',
		'linear-gradient(135deg, #111025 0%, #3b0764 100%)',
		'linear-gradient(135deg, #0b0e17 0%, #1a2744 100%)',
		'linear-gradient(135deg, #0b0d17 0%, #1f2937 100%)'
	];

	let projects: Project[] = [
		{
			icon: '🤖',
			title: 'Guardian',
			description:
				"🏆 Won <strong>NeoData Hackatania 2.0</strong> — Catania, November 2024.<br>Multimodal AI chatbot for Law Enforcement: processes text queries and <strong>license-plate images</strong> to retrieve sensitive real-time data.<br><strong>Key capabilities:</strong><ul><li>Instant access to criminal records and conviction history</li><li>Vehicle data from plate images via LLM vision</li><li>Graph-based navigation with <strong>GraphRAG</strong> on Neo4j (schools, employers, associates)</li><li>Pseudo <strong>risk coefficient</strong> computed from personal and associates' crime severity</li></ul>Agentic tool orchestration via <strong>LangChain + LangGraph</strong>. Developed with Salvatore Iurato.",
			techTags: ['Neo4j', 'LangGraph', 'LLM'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/Guardian',
			isHackathonWinner: true,
			externalLink: {
				url: 'https://devpost.com/software/guardian-p2g0df',
				type: 'hackathon',
				icon: 'fas fa-trophy'
			},
			image: '/assets/projects/guardian.webp'
		},
		{
			icon: '🧬',
			title: 'GRPO Strict Generation',
			description:
				'Reinforcement Learning project for the RL university module.<br>Applies <strong>Group Relative Policy Optimization (GRPO)</strong> to fine-tune a small open-weight LLM (~0.5B–1.5B params) so that it generates <strong>syntactically valid JSON and Python code</strong>.<br><strong>Key design choices:</strong><ul><li>Programmatic reward functions via <code>json.loads</code> and <code>ast.parse</code> — strict binary signal, no neural reward model</li><li><strong>LoRA / PEFT</strong> for memory-efficient training</li><li><strong>Unsloth</strong> for fast fine-tuning, <strong>vLLM</strong> for high-throughput inference</li><li>Evaluation on <strong>Pass@k</strong> metrics comparing pre- and post-training syntactic adherence</li></ul>Synthetic dataset generated programmatically. Full architecture and results in the formal report.',
			techTags: ['GRPO', 'TRL', 'Unsloth', 'vLLM', 'LoRA'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/GRPO-strict-generation',
			image: '/assets/projects/grpo.webp'
		},
		{
			icon: '📸',
			title: 'Image Enhancement',
			description:
				'Systematic comparison of CNN image restoration architectures on the <strong>DIV2K dataset</strong> (800 train / 100 val at 2K resolution).<br><strong>Architectures implemented:</strong><ul><li><strong>UNet</strong> — encoder-decoder with skip connections (~7.8M params)</li><li><strong>Residual UNet</strong> — predicts noise residual for faster convergence</li><li><strong>Attention UNet</strong> — selective focus via attention gates (~13.7M params)</li><li><strong>DnCNN</strong> — feed-forward CNN with batch norm for blind denoising</li><li><strong>Denoising Autoencoder</strong> — bottleneck encoder-decoder trained to reconstruct clean images</li><li><strong>Pix2Pix GAN</strong> — conditional adversarial network for image-to-image translation</li></ul><strong>Degradations:</strong> Gaussian noise (σ=100), quantization dithering (2–8 bit), salt &amp; pepper.<br>Training: AMP mixed precision · L1+SSIM+VGG16 perceptual loss · cosine warmup scheduler · early stopping · sliding-window full-resolution inference.<br>Metrics: <strong>PSNR</strong> and <strong>SSIM</strong>. 4-person team project.',
			techTags: ['PyTorch', 'UNet', 'GAN', 'Computer Vision'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/Image-Enhancement',
			image: '/assets/projects/imageEnhancement.webp'
		},
		{
			icon: '🚚',
			title: 'Warehouse Swarm Intelligence System',
			description:
				'Designing a multi-agent system for optimizing warehouse operations.<br>Real-time swarm simulation — Multi-Agent Systems course project.<br><strong>Three specialised agent roles:</strong><ul><li>🟢 <strong>Scout</strong> — explores the map, reports object locations to coordinators</li><li>🔵 <strong>Coordinator</strong> — assigns retrieval tasks, manages agent recharging</li><li>🟡 <strong>Retriever</strong> — navigates to objects, carries them to the deposit zone</li></ul><strong>Core algorithms:</strong> A* with dynamic replanning · frontier-based &amp; random-walk exploration · priority collision avoidance · ClearWayMessage negotiation protocol · FIFO task queue with multi-carry optimisation.<br>Stack: <strong>Python / FastAPI</strong> + Socket.IO → <strong>React / TypeScript</strong> with HTML5 Canvas, resizable panels and a built-in map editor. Deployed on Render + Vercel.',
			techTags: ['Python', 'Swarm Intelligence', 'Multi-Agent', 'Optimization'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/Warehouse-Swarm-Intelligence-System',
			externalLink: {
				url: 'https://warehouse-swarm-intelligence-system.vercel.app',
				type: 'demo',
				icon: 'fas fa-external-link-alt'
			},
			image: '/assets/projects/warehouse.webp'
		},
		{
			icon: '🖼️',
			title: 'Steganography WebApp',
			description:
				'Full-stack web app to hide and recover data (text, images, binary files) inside carrier images — backed by a formal <strong>LaTeX scientific report</strong>.<br><strong>Three algorithms:</strong><ul><li><strong>LSB</strong> — least significant bit modification; up to 3 bpp; PSNR &gt;50 dB; fast but fragile to JPEG compression</li><li><strong>DWT</strong> — wavelet frequency-domain embedding; JPEG-robust; PSNR 35–45 dB</li><li><strong>PVD</strong> — pixel-value differencing; adaptive capacity; PSNR 45–55 dB; SSIM &gt;0.95</li></ul>Features: intelligent <strong>parameter auto-backup</strong> for recovery, RGB/RGBA/Grayscale auto-conversion, live <strong>PSNR &amp; SSIM</strong> quality feedback, and a clean modular architecture with CI (Black, isort, ruff).',
			techTags: ['Steganography', 'Streamlit'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/Steganography-WebApp',
			externalLink: {
				url: 'https://steg-app.streamlit.app',
				type: 'demo',
				icon: 'fas fa-external-link-alt'
			},
			image: '/assets/projects/stegapp.webp'
		},
		{
			icon: '🧠',
			title: 'Neural Sudoku',
			description:
				'End-to-end neural approach to Sudoku solving in two phases.<br><strong>Phase 1 — Data generation:</strong> a classic <strong>backtracking solver</strong> based on constraint propagation generates large labeled puzzle datasets (given → solution pairs).<br><strong>Phase 2 — Neural solver:</strong> a <strong>PyTorch network</strong> is trained purely on examples to predict the complete 9×9 solution from a partial grid, learning Sudoku rules implicitly.<br>Ongoing work: architecture refinement, NumPy-based grid manipulation, and a systematic evaluation framework measuring digit-level and full-puzzle accuracy.',
			techTags: ['PyTorch', 'Deep Learning', 'Sudoku'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/Neural-Sudoku',
			image: '/assets/projects/sudoku.webp'
		},
		{
			icon: '🎮',
			title: 'The Legend of Turi',
			description:
				'A <strong>top-down action-adventure</strong> game inspired by The Legend of Zelda — with a distinctly Sicilian soul, built entirely in <strong>Unity</strong> (C#).<br><strong>Features:</strong><ul><li>Hand-crafted tile maps and multi-room exploration</li><li>Enemy AI with patrol and chase behaviours</li><li>Combat system with weapons, hitboxes and health management</li><li>Dialogue system and interactive NPCs</li><li>Original story following the hero Turi across the Sicilian countryside</li></ul>Packaged as a standalone Windows executable — downloadable directly from the GitHub release.',
			techTags: ['C#', 'Unity'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/The-Legend-of-Turi',
			externalLink: {
				url: 'https://github.com/GiuseppeBellamacina/The-Legend-of-Turi/releases/download/game/Turi.zip',
				type: 'download',
				icon: 'fas fa-download'
			},
			image: '/assets/projects/turi.webp'
		},
		{
			icon: '🔍',
			title: 'Kagi ML Dev Challenge',
			description:
				'Entry for the <strong>Kagi ML Dev Challenge</strong>: build an API that re-ranks Hacker News articles by user interest and expands search queries with ML.<br><strong>Technical journey (9 phases):</strong><ul><li>FAISS on 1,200 stories → poor quality</li><li>Scaled to a <strong>4M-post HuggingFace dataset</strong>, filtered to 300K HTTPS stories</li><li>CPU FAISS (2s) → GPU FAISS (1s, lower quality) → <strong>Weaviate Cloud</strong> (0.2–0.7s)</li><li><strong>GPT-4o-mini</strong> query expansion with FewShot LangChain prompts: bio → multiple subqueries</li><li>Custom <strong>HuggingFace Inference API</strong> embedder to fit Render 512MB RAM limit</li><li>Streaming both LLM tokens and DB results to cut perceived latency</li></ul>Deployed: Streamlit Cloud · Render API.',
			techTags: ['LangChain', 'Weaviate', 'HuggingFace'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/Kagi-ML-dev-challenge',
			externalLink: {
				url: 'https://www.youtube.com/watch?v=ubm9zkNf8jM',
				type: 'youtube',
				icon: 'fab fa-youtube'
			},
			image: '/assets/projects/kagi.webp'
		},
		{
			icon: '📊',
			title: 'Sales Store Forecasting',
			description:
				'Kaggle competition: <strong>Store Sales — Time Series Forecasting</strong>.<br>Goal: predict daily sales for <strong>54 stores × 33 product families</strong> in Ecuador using 4+ years of historical transaction data from Corporación Favorita.<br><strong>Approach:</strong><ul><li>EDA: seasonal decomposition, holiday &amp; oil-price impact analysis</li><li>Feature engineering: lag features, rolling averages, cyclical date encodings</li><li>Models: ensemble of classical ML regressors</li><li>Evaluation metric: <strong>RMSLE</strong> (Root Mean Squared Log Error)</li></ul>',
			techTags: ['Python', 'Machine Learning'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/Sales-Store-Time-Series-Forecasting',
			image: '/assets/projects/sales.webp'
		},
		{
			icon: '👤',
			title: 'Celebrity ResNet18',
			description:
				'<strong>Data Mining</strong> university project: celebrity face recognition via deep transfer learning.<br><strong>Pipeline:</strong><ul><li>Dataset: curated labeled celebrity face images, stratified train/val/test split</li><li>Model: <strong>ResNet18</strong> pretrained on ImageNet — classifier head replaced and fine-tuned</li><li>Augmentation: random crop, horizontal flip, colour jitter, normalisation</li><li>Training: <strong>SGD with momentum</strong>, step LR decay, cross-entropy loss</li></ul>Demonstrates how transfer learning dramatically reduces data requirements for visual classification — strong top-1 accuracy with a compact dataset.',
			techTags: ['PyTorch', 'ResNet', 'Face Recognition'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/Celebrity-ResNet18',
			image: '/assets/projects/celebrity.webp'
		},
		{
			icon: '🤖',
			title: 'OmniBot V2',
			description:
				'Evolution of OmniBot — rebuilt around a <strong>LangGraph graph-based RAG</strong> architecture called <strong>GraphOfThoughts</strong>.<br><strong>What changed vs V1:</strong><ul><li>Knowledge graph built and navigated at query time for richer contextual retrieval</li><li><strong>Text-to-Speech</strong> output: the bot now vocalises its answers in real time</li><li><strong>Multi-process pipeline</strong>: LLM text generation and TTS audio rendering run concurrently for lower latency</li><li>Fully customisable: retrieval strategy, response style and TTS voice all configurable</li></ul>Bring your own data (no dataset included). Built in collaboration with Drake9098.',
			techTags: ['RAG', 'LangChain', 'LangGraph'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/OmniBot-V2',
			image: '/assets/projects/omnibot.webp'
		},
		{
			icon: '🧪',
			title: 'Little Language Model',
			description:
				'From-scratch <strong>GPT-style Transformer</strong> implemented in PyTorch and trained on <strong>Dante Alighieri\'s Divina Commedia</strong> — the resulting model is called <strong>DanteGPT</strong>.<br><strong>Architecture:</strong> 6 layers · 8 attention heads · 512 embedding dim · character-level tokeniser · positional encoding · layer normalisation.<br><strong>Training:</strong> AdamW optimiser · temperature-controlled sampling · 10% corpus held out for validation.<br>Given an opening verse — e.g. <em>"Nel mezzo del cammin di nostra vita"</em> — the model continuously generates Italian text mimicking Dante\'s terza rima style.<br>Implementation follows <em>"Attention is All You Need"</em> (Vaswani et al., 2017).',
			techTags: ['PyTorch', 'Transformers', 'LLM'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/Little_Language_Model',
			image: '/assets/projects/dante.webp'
		},
		{
			icon: '🔒',
			title: 'VulnerabilityBot',
			description:
				'Local client/server system for AI-assisted <strong>cybersecurity Q&amp;A</strong> — built with Drake9098.<br><strong>Three-layer architecture:</strong><ul><li>🖥️ <strong>Streamlit frontend</strong> — submit queries via text input or file upload; browse answers in the DB view</li><li>⚙️ <strong>Quart + Uvicorn async backend</strong> — receives queries, fans them out to the AI, persists results in SQLite</li><li>🤖 <strong>LangChain LLM agent</strong> — searches the vulnerability database and formats structured answers</li></ul>The number of concurrent AI queries is configurable via <code>config.yaml</code> (default: 3).<br>Useful for rapidly triaging CVE datasets and exploring vulnerability landscapes.',
			techTags: ['Cybersecurity', 'LLM'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/VulnerabilityBot',
			image: '/assets/projects/vulnerability.webp'
		},
		{
			icon: '📚',
			title: 'EPUB Translator',
			description:
				'CLI tool that translates entire <strong>EPUB</strong> e-books using LLMs, preserving every structural detail of the original.<br><strong>How it works:</strong><ul><li>Parses the EPUB spine and extracts per-chapter HTML content</li><li>Sends chapters to the LLM in batches, keeping all HTML tags, styles and formatting intact</li><li>Uses context overlap between chunks to maintain narrative coherence across batch boundaries</li><li>Reassembles translated chapters into a valid EPUB with original metadata, cover and TOC</li></ul>Handles books of any length gracefully. Useful for translating novels, technical manuals or academic papers without losing layout or structure.',
			techTags: ['EPUB', 'LLM', 'Translation'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/EPUB-Translator',
			image: '/assets/projects/epub.webp'
		},
		{
			icon: '🧹',
			title: 'SpazzApp',
			description:
				'Multi-page <strong>Streamlit</strong> web app for automatic monthly cleaning schedule generation between roommates (v2.0, fully rewritten with OOP architecture).<br><strong>Scheduling algorithm scores each candidate assignment:</strong><ul><li>+400 pts — room never cleaned by this person (rotation priority)</li><li>+600 pts — person has the lowest current workload (load balancing)</li><li>+30/+10 pts — weekday vs weekend preference</li><li>Dynamic absence redistribution — recalculates weekly targets automatically</li></ul><strong>Features:</strong> first-week room exclusions · max 3 assignments/day cap · exportable <strong>PNG calendar</strong> · per-person and per-room distribution statistics.',
			techTags: ['Heuristics', 'Streamlit'],
			githubUrl: 'https://github.com/GiuseppeBellamacina/SpazzApp-streamlit',
			externalLink: {
				url: 'https://spazzapp2.streamlit.app',
				type: 'demo',
				icon: 'fas fa-external-link-alt'
			},
			image: '/assets/projects/spazzapp.webp'
		}
	];

	// ─── GitHub stars fetch ─────────────────────────────────────────────────────
	function fetchWithTimeout(url: string, timeout = 5000) {
		return Promise.race([
			fetch(url),
			new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
		]);
	}

	// Funzione retry con backoff esponenziale
	async function fetchWithRetry(url: string, retries = 2, backoff = 1000) {
		for (let i = 0; i <= retries; i++) {
			try {
				const response = await fetchWithTimeout(url, 5000);
				if (response.ok) {
					return response;
				}
				// Se la risposta è 403 (rate limit) o 404, non ritentare
				if (response.status === 403 || response.status === 404) {
					throw new Error(`HTTP ${response.status}`);
				}
			} catch (error) {
				if (i === retries) throw error;
				// Backoff esponenziale
				await new Promise((resolve) => setTimeout(resolve, backoff * Math.pow(2, i)));
			}
		}
		throw new Error('Max retries reached');
	}

	async function fetchGitHubStars() {
		const fetchPromises = projects.map(async (project) => {
			try {
				const cacheKey = `github_stars_${project.githubUrl}`;
				const cached = localStorage.getItem(cacheKey);
				if (cached) {
					try {
						const { stars, timestamp } = JSON.parse(cached);
						if (Date.now() - timestamp < 3600000) {
							project.stars = stars;
							project.starsLoaded = true;
							projects = [...projects];
							return;
						}
					} catch {
						localStorage.removeItem(cacheKey);
					}
				}
				const match = project.githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
				if (match) {
					const [, owner, repo] = match;
					const response = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}`);
					const data = await response.json();
					project.stars = data.stargazers_count;
					project.starsLoaded = true;
					localStorage.setItem(
						cacheKey,
						JSON.stringify({ stars: data.stargazers_count, timestamp: Date.now() })
					);
					projects = [...projects];
				}
			} catch {
				project.starsLoaded = true;
				project.stars = undefined;
				projects = [...projects];
			}
		});
		await Promise.all(fetchPromises);
	}

	// ─── Marquee Carousel ───────────────────────────────────────────────────────

	type ProjectWithIdx = Project & { _idx: number };
	const enriched: ProjectWithIdx[] = projects.map((p, i) => ({ ...p, _idx: i }));
	const row0: ProjectWithIdx[] = enriched.filter((_, i) => i % 2 === 0);
	const row1: ProjectWithIdx[] = enriched.filter((_, i) => i % 2 === 1);

	// ── Drag-scroll state ──────────────────────────────────────────────────────
	const CARD_W = 280;
	const GAP = 20;
	const STEP = CARD_W + GAP; // pixels per card slot

	// Each strip holds 2 copies → half-width is N * STEP
	let halfW = [row0.length * STEP, row1.length * STEP];

	let stripEls: (HTMLElement | null)[] = [null, null];
	// pos[0] starts at 0 (scrolls left → decrements)
	// pos[1] starts at -halfW[1] (scrolls right → increments)
	let pos = [0, -halfW[1]];
	let vel = [0, 0];
	const AUTO = [-0.45, 0.5]; // px/frame auto-speed (negative = scroll left, positive = right)

	let dragging = -1; // which row is being dragged (-1 = none)
	let dragLastX = 0;
	let dragStartX = 0;
	let dragVel = 0;
	let dragMoved = false; // true once mouse moved > threshold
	let dragTargetEl: HTMLElement | null = null;
	let rafId = 0;
	let sectionEl: HTMLElement;

	// ── Hover state ────────────────────────────────────────────────────────────
	let hoveredProject: ProjectWithIdx | null = null;

	function loop() {
		const paused = !!hoveredProject || !!expandedProject;
		for (let i = 0; i < 2; i++) {
			if (dragging !== -1) {
				// While any row is being dragged, both rows freeze auto-scroll
				if (dragging === i) vel[i] *= 0.85;
			} else if (!paused) {
				// Auto-scroll, paused on hover or expand
				vel[i] = vel[i] * 0.93 + AUTO[i] * 0.07;
				pos[i] += vel[i];
			}
			// Infinite wrap
			if (pos[i] <= -halfW[i]) pos[i] += halfW[i];
			if (pos[i] >= 0) pos[i] -= halfW[i];
			if (stripEls[i]) stripEls[i]!.style.transform = `translateX(${pos[i]}px)`;
		}
		// Clear hover when strips are visibly moving (dragging or inertia)
		if (hoveredProject && (dragging !== -1 || Math.abs(vel[0]) > 0.8 || Math.abs(vel[1]) > 0.8)) {
			hoveredProject = null;
		}
		rafId = requestAnimationFrame(loop);
	}

	function startDrag(e: MouseEvent, row: number) {
		if (e.button !== 0) return;
		dragging = row;
		dragStartX = e.clientX;
		dragLastX = e.clientX;
		dragVel = 0;
		dragMoved = false;
		dragTargetEl = (e.target as HTMLElement).closest('.pcard') as HTMLElement | null;
	}
	function startDragTouch(e: TouchEvent, row: number) {
		if (e.touches.length !== 1) return;
		const t = e.touches[0];
		dragging = row;
		dragStartX = t.clientX;
		dragLastX = t.clientX;
		dragVel = 0;
		dragMoved = false;
		dragTargetEl = (e.target as HTMLElement).closest('.pcard') as HTMLElement | null;
	}
	function onMouseMove(e: MouseEvent) {
		if (dragging === -1) return;
		const dx = e.clientX - dragLastX;
		if (!dragMoved) {
			if (Math.abs(e.clientX - dragStartX) < 6) return; // below threshold
			dragMoved = true;
		}
		dragLastX = e.clientX;
		dragVel = dx;
		// Move dragged row + counter-rotate the other row
		const other = dragging === 0 ? 1 : 0;
		pos[dragging] += dx;
		pos[other] -= dx;
		for (const i of [dragging, other]) {
			if (pos[i] <= -halfW[i]) pos[i] += halfW[i];
			if (pos[i] >= 0) pos[i] -= halfW[i];
		}
	}
	function onTouchMove(e: TouchEvent) {
		if (dragging === -1 || e.touches.length !== 1) return;
		const t = e.touches[0];
		const dx = t.clientX - dragLastX;
		if (!dragMoved) {
			if (Math.abs(t.clientX - dragStartX) < 6) return;
			dragMoved = true;
		}
		e.preventDefault();
		dragLastX = t.clientX;
		dragVel = dx;
		const other = dragging === 0 ? 1 : 0;
		pos[dragging] += dx;
		pos[other] -= dx;
		for (const i of [dragging, other]) {
			if (pos[i] <= -halfW[i]) pos[i] += halfW[i];
			if (pos[i] >= 0) pos[i] -= halfW[i];
		}
	}
	function endDrag() {
		if (dragging === -1) return;
		const i = dragging;
		const other = i === 0 ? 1 : 0;
		if (!dragMoved) {
			// It was a click — open the card that was pressed
			if (dragTargetEl) {
				// Find the project from the target element's data
				const title = dragTargetEl.getAttribute('aria-label');
				const p = enriched.find((e) => e.title === title);
				if (p) openCard(p);
			}
		} else {
			vel[i] = dragVel;
			vel[other] = -dragVel; // counter-rotate inertia
		}
		dragVel = 0;
		dragging = -1;
		dragMoved = false;
		dragTargetEl = null;
	}

	// ── Hover highlight ────────────────────────────────────────────────────────
	function onCardEnter(p: ProjectWithIdx) {
		hoveredProject = p;
	}
	function onCardLeave() {
		hoveredProject = null;
	}

	// ── Expand state ────────────────────────────────────────────────────────
	let expandedProject: ProjectWithIdx | null = null;
	let panelExpanded = false;

	async function openCard(p: ProjectWithIdx) {
		expandedProject = p;
		panelExpanded = false;
		await tick();
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				panelExpanded = true;
			})
		);
	}
	function closePanel() {
		panelExpanded = false;
		setTimeout(() => {
			expandedProject = null;
		}, 380);
	}
	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') closePanel();
	}

	function getCardBg(p: ProjectWithIdx): string {
		if (p.accentColor) return p.accentColor;
		return cardGradients[p._idx % cardGradients.length];
	}
	function getLinkLabel(type: string): string {
		if (type === 'download') return 'Download';
		if (type === 'youtube') return 'Watch';
		if (type === 'hackathon') return 'Hackathon';
		return 'Demo';
	}

	onMount(() => {
		rafId = requestAnimationFrame(loop);
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', endDrag);
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('touchend', endDrag);
		window.addEventListener('keydown', onKeyDown);
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting && !isVisible) {
						isVisible = true;
						fetchGitHubStars();
					}
				}),
			{ threshold: 0.05, rootMargin: '100px' }
		);
		io.observe(sectionEl);
		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', endDrag);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', endDrag);
			window.removeEventListener('keydown', onKeyDown);
			io.disconnect();
		};
	});
</script>

<section id="projects" class="projects" bind:this={sectionEl}>
	<div class="container">
		<h2 class="section-title">Personal Projects</h2>
	</div>

	<!-- ─── Row 0 ────────────────────────────────────────────────────────────── -->
	<div class="strip-outer">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="strip-wrap"
			class:dragging-active={dragging === 0}
			on:mousedown={(e) => startDrag(e, 0)}
			on:touchstart={(e) => startDragTouch(e, 0)}
		>
			<div class="strip" bind:this={stripEls[0]}>
				{#each [...row0, ...row0] as project}
					<article
						class="pcard"
						class:is-hovered={hoveredProject === project && !dragMoved}
						class:is-dimmed={hoveredProject !== null && hoveredProject !== project}
						style={!project.image ? `--card-grad:${getCardBg(project)}` : ''}
						on:mouseenter={() => onCardEnter(project)}
						on:mouseleave={onCardLeave}
						aria-label={project.title}
					>
						<div class="pcard-bg">
							{#if project.image}
								<img src={project.image} alt={project.title} loading="lazy" decoding="async" />
							{/if}
						</div>
						<div class="pcard-overlay"></div>
						{#if project.isHackathonWinner}
							<span class="pcard-badge">🏆 Winner</span>
						{/if}
						<div class="pcard-body">
							<span class="pcard-icon">{project.icon}</span>
							<h3 class="pcard-title">{project.title}</h3>
							<div class="pcard-tags">
								{#each project.techTags.slice(0, 3) as t}
									<span class="pcard-tag">{t}</span>
								{/each}
							</div>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</div>

	<!-- ─── Row 1 ────────────────────────────────────────────────────────────── -->
	<div class="strip-outer">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="strip-wrap"
			class:dragging-active={dragging === 1}
			on:mousedown={(e) => startDrag(e, 1)}
			on:touchstart={(e) => startDragTouch(e, 1)}
		>
			<div class="strip" bind:this={stripEls[1]}>
				{#each [...row1, ...row1] as project}
					<article
						class="pcard"
						class:is-hovered={hoveredProject === project && !dragMoved}
						class:is-dimmed={hoveredProject !== null && hoveredProject !== project}
						style={!project.image ? `--card-grad:${getCardBg(project)}` : ''}
						on:mouseenter={() => onCardEnter(project)}
						on:mouseleave={onCardLeave}
						aria-label={project.title}
					>
						<div class="pcard-bg">
							{#if project.image}
								<img src={project.image} alt={project.title} loading="lazy" decoding="async" />
							{/if}
						</div>
						<div class="pcard-overlay"></div>
						{#if project.isHackathonWinner}
							<span class="pcard-badge">🏆 Winner</span>
						{/if}
						<div class="pcard-body">
							<span class="pcard-icon">{project.icon}</span>
							<h3 class="pcard-title">{project.title}</h3>
							<div class="pcard-tags">
								{#each project.techTags.slice(0, 3) as t}
									<span class="pcard-tag">{t}</span>
								{/each}
							</div>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</div>

	<!-- ─── Expanded card panel ─────────────────────────────────────────────── -->
	{#if expandedProject}
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="exp-backdrop" class:is-visible={panelExpanded} on:click={closePanel}></div>

		<!-- Panel — always centred, enters with scale-up -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<aside class="exp-panel" class:is-open={panelExpanded}>
			<!-- visual header = same bg as card -->
			<div
				class="exp-visual"
				style={expandedProject.image
					? `background-image:url('${expandedProject.image}')`
					: `background:${getCardBg(expandedProject)}`}
			>
				<div class="exp-voverlay"></div>
				<!-- Close button -->
				<button class="exp-close" on:click={closePanel} aria-label="Close">✕</button>
				{#if expandedProject.isHackathonWinner}
					<span class="exp-trophy">🏆 Hackathon Winner</span>
				{/if}
				<div class="exp-title-area">
					<span class="exp-icon">{expandedProject.icon}</span>
					<h3 class="exp-title">{expandedProject.title}</h3>
				</div>
			</div>

			<!-- body: fades in once expanded -->
			<div class="exp-body">
				<!-- svelte-ignore security_anchor_target_blank -->
				<p class="exp-desc">{@html expandedProject.description}</p>
				<div class="exp-tags">
					{#each expandedProject.techTags as t}
						<span class="exp-tag">{t}</span>
					{/each}
				</div>
				<div class="exp-footer">
					{#if expandedProject.starsLoaded && expandedProject.stars !== undefined}
						<span class="exp-stars">⭐ {expandedProject.stars} stars</span>
					{:else}
						<span></span>
					{/if}
					<div class="exp-links">
						{#if expandedProject.externalLink}
							<a
								href={expandedProject.externalLink.url}
								target="_blank"
								rel="noopener noreferrer"
								class="exp-link"
								download={expandedProject.externalLink.type === 'download' ? true : undefined}
							>
								<i class={expandedProject.externalLink.icon}></i>
								{getLinkLabel(expandedProject.externalLink.type)}
							</a>
						{/if}
						<a
							href={expandedProject.githubUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="exp-link exp-link-primary"
						>
							<i class="fab fa-github"></i> View on GitHub
						</a>
					</div>
				</div>
			</div>
		</aside>
	{/if}

	<div class="container">
		<div class="view-all">
			<a
				href="https://github.com/GiuseppeBellamacina?tab=repositories"
				target="_blank"
				class="btn btn-primary"
			>
				View All Projects on GitHub
			</a>
		</div>
	</div>
</section>

<style>
	.proj-hint {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.82rem;
		margin-top: -1.5rem;
		margin-bottom: 2.2rem;
		opacity: 0.5;
		letter-spacing: 0.04em;
	}

	/* ── Strip wrapper ───────────────────────────────────────────────────────── */
	/* Outer container: clips horizontal overflow on ALL browsers including old
	   iOS Safari, and provides the edge-fade mask. */
	.strip-outer {
		width: 100%;
		overflow: visible;
		padding: 0 0;
		mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
		-webkit-mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 6%,
			black 94%,
			transparent 100%
		);
	}
	/* Inner wrap: overflow visible so the hover scale is NOT clipped. */
	.strip-wrap {
		width: 100%;
		overflow: visible;
		padding: 12px 0;
		margin-bottom: 0;
		cursor: grab;
		user-select: none;
	}
	.strip-wrap.dragging-active {
		cursor: grabbing;
	}

	.strip {
		display: flex;
		gap: 20px;
		width: max-content;
		padding: 20px 0 8px;
		will-change: transform;
	}

	/* ── Project card ─────────────────────────────────────────────────────────── */
	.pcard {
		position: relative;
		width: 280px;
		height: 300px;
		border-radius: 16px;
		overflow: hidden;
		flex-shrink: 0;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.07);
		transition:
			transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.25s ease,
			box-shadow 0.25s ease,
			opacity 0.25s ease,
			filter 0.25s ease;
		will-change: transform;
	}
	/* Hover: lift and glow, stays in the strip */
	.pcard.is-hovered {
		transform: translateY(-12px) scale(1.08);
		border-color: rgba(129, 140, 248, 0.4);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.6),
			0 0 30px rgba(99, 102, 241, 0.1),
			0 0 0 1px rgba(129, 140, 248, 0.15);
		z-index: 10;
	}
	/* Dim siblings while one is hovered */
	.pcard.is-dimmed {
		opacity: 0.45;
		filter: saturate(0.6);
	}

	.pcard-bg {
		position: absolute;
		inset: 0;
		background-image: var(--card-grad, none);
		background-size: cover;
		background-position: center;
		transition: transform 0.5s ease;
	}
	.pcard-bg img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		display: block;
	}
	.pcard.is-hovered .pcard-bg {
		transform: scale(1.03);
	}

	.pcard-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to top,
			rgba(4, 5, 18, 0.97) 0%,
			rgba(4, 5, 18, 0.5) 45%,
			rgba(4, 5, 18, 0.1) 100%
		);
	}

	.pcard-badge {
		position: absolute;
		top: 1rem;
		left: 1rem;
		font-size: 0.6rem;
		font-weight: 700;
		background: linear-gradient(135deg, #f59e0b, #fbbf24);
		color: #0b0d17;
		padding: 3px 9px;
		border-radius: 20px;
		z-index: 2;
	}

	.pcard-body {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1.1rem 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		z-index: 2;
	}
	.pcard-icon {
		font-size: 2rem;
		line-height: 1;
	}
	.pcard-title {
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
		margin: 0;
		line-height: 1.25;
	}
	.pcard-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.22rem;
	}
	.pcard-tag {
		font-size: 0.56rem;
		color: var(--primary-color);
		background: rgba(99, 102, 241, 0.08);
		border: 1px solid rgba(129, 140, 248, 0.2);
		padding: 2px 7px;
		border-radius: 20px;
		line-height: 1.7;
	}

	/* ══════════════════════════════════════════════════════════════════════════ */
	/* ── Expanded panel: animates from card rect → screen centre ──────────────── */
	/* ══════════════════════════════════════════════════════════════════════════ */
	/* Backdrop */
	.exp-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0);
		z-index: 9998;
		transition: background 0.35s ease;
		pointer-events: none;
	}
	.exp-backdrop.is-visible {
		background: rgba(0, 0, 0, 0.72);
		pointer-events: all;
	}
	.exp-panel {
		position: fixed;
		top: 50%;
		left: 50%;
		width: min(560px, calc(100vw - 40px));
		height: min(680px, calc(100vh - 40px));
		border-radius: 20px;
		overflow: hidden;
		background: rgba(11, 13, 23, 0.97);
		border: 1px solid rgba(129, 140, 248, 0.2);
		box-shadow:
			0 0 0 1px rgba(129, 140, 248, 0.08),
			0 40px 100px rgba(0, 0, 0, 0.8);
		z-index: 9999;
		backdrop-filter: blur(20px);
		pointer-events: none;
		opacity: 0;
		transform: translate(-50%, -50%) scale(0.92);
		transition:
			transform 0.35s cubic-bezier(0.34, 1.28, 0.64, 1),
			opacity 0.25s ease;
		display: flex;
		flex-direction: column;
	}
	.exp-panel.is-open {
		opacity: 1;
		pointer-events: all;
		transform: translate(-50%, -50%) scale(1);
	}

	/* Close button */
	.exp-close {
		position: absolute;
		top: 0.65rem;
		right: 0.65rem;
		z-index: 10;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(0, 0, 0, 0.45);
		color: rgba(255, 255, 255, 0.75);
		font-size: 0.7rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s,
			color 0.15s;
		padding: 0;
		line-height: 1;
	}
	.exp-close:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
	}

	/* Visual header: fixed-height, expands naturally when panel expands */
	.exp-visual {
		position: relative;
		width: 100%;
		height: 240px;
		flex-shrink: 0;
		background-size: cover;
		background-position: center;
	}
	.exp-voverlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to top,
			rgba(5, 7, 22, 0.98) 0%,
			rgba(5, 7, 22, 0.25) 55%,
			transparent 100%
		);
	}
	.exp-trophy {
		position: absolute;
		top: 0.75rem;
		left: 0.9rem;
		z-index: 2;
		font-size: 0.62rem;
		font-weight: 700;
		background: linear-gradient(135deg, #f59e0b, #fbbf24);
		color: #0b0d17;
		padding: 2px 9px;
		border-radius: 20px;
	}
	.exp-title-area {
		position: absolute;
		bottom: 0.85rem;
		left: 1rem;
		right: 1rem;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.exp-icon {
		font-size: 2.2rem;
		line-height: 1;
		flex-shrink: 0;
	}
	.exp-title {
		font-size: 1.15rem;
		font-weight: 800;
		color: #fff;
		margin: 0;
		letter-spacing: -0.02em;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
	}

	/* Body content: hidden until panel is open */
	.exp-body {
		padding: 1.1rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 0.22s ease 0.22s,
			transform 0.22s ease 0.22s;
		overflow-y: auto;
	}
	.exp-panel.is-open .exp-body {
		opacity: 1;
		transform: translateY(0);
	}

	.exp-desc {
		font-size: 0.78rem;
		color: var(--text-muted);
		line-height: 1.6;
		margin: 0;
	}
	.exp-desc :global(strong) {
		color: #fff;
		font-weight: 700;
	}
	.exp-desc :global(a) {
		color: var(--primary-color);
		text-decoration: underline;
	}
	.exp-desc :global(ul),
	.exp-desc :global(ol) {
		margin: 0.4em 0;
		padding-left: 1.4em;
	}
	.exp-desc :global(li) {
		margin-bottom: 0.2em;
	}
	.exp-desc :global(br) {
		display: block;
		content: '';
		margin-top: 0.3em;
	}
	.exp-desc :global(code) {
		font-family: 'Courier New', monospace;
		font-size: 0.72rem;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 4px;
		padding: 1px 5px;
		color: #e2e8f0;
	}
	.exp-desc :global(em) {
		color: #c0cfe0;
		font-style: italic;
	}
	.exp-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.exp-tag {
		font-size: 0.6rem;
		color: var(--primary-color);
		background: rgba(99, 102, 241, 0.06);
		border: 1px solid rgba(129, 140, 248, 0.2);
		padding: 2px 8px;
		border-radius: 20px;
		line-height: 1.75;
	}

	.exp-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		padding-top: 0.7rem;
		margin-top: auto;
	}
	.exp-stars {
		font-size: 0.7rem;
		color: #888;
	}
	.exp-links {
		display: flex;
		gap: 0.65rem;
		align-items: center;
	}
	.exp-link {
		font-size: 0.7rem;
		color: #777;
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 5px;
		transition: color 0.15s;
		white-space: nowrap;
	}
	.exp-link:hover {
		color: #ddd;
	}
	.exp-link-primary {
		color: var(--primary-color);
		font-weight: 700;
	}
	.exp-link-primary:hover {
		color: #fff;
	}

	/* ── View all ─────────────────────────────────────────────────────────────── */
	.view-all {
		text-align: center;
		margin-top: 2rem;
	}

	/* ── Mobile ───────────────────────────────────────────────────────────────── */
	@media (max-width: 640px) {
		.pcard {
			width: 220px;
			height: 250px;
		}
	}
</style>
