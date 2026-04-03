export interface Project {
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

export const cardGradients = [
	'linear-gradient(135deg, #0d1b2a 0%, #0f3460 100%)',
	'linear-gradient(135deg, #1a0533 0%, #2d1b69 100%)',
	'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
	'linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%)',
	'linear-gradient(135deg, #1a1f3a 0%, #4a1f6b 100%)',
	'linear-gradient(135deg, #0d1117 0%, #1b3a4b 100%)',
	'linear-gradient(135deg, #0a0e27 0%, #1f2d4a 100%)'
];

export const projects: Project[] = [
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
