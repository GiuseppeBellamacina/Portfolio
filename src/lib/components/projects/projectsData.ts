import type { Lang } from '$lib/i18n';

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
		icon: '🕹️',
		title: 'Videogame Semantic Search',
		description:
			'Semantic web app that builds and queries an <strong>OWL 2 ontology</strong> on video games (2015-today) via an NL-to-SPARQL pipeline powered by <strong>GPT-4.1 mini</strong>.<br><strong>Architecture:</strong><ul><li><strong>Frontend (React + Tailwind + react-force-graph-2d)</strong> — interactive knowledge graph, search bar, node detail panels</li><li><strong>Backend (FastAPI)</strong> — SPARQL agent with auto-retry (max 3 attempts), OntologyService with rdflib, graph builder</li><li><strong>Ontology (OWL 2)</strong> — classes: VideoGame, Developer, Publisher, Genre, Platform, Character, Franchise, Award; data from Wikidata</li></ul><strong>SPARQL agent:</strong> converts natural language → SPARQL, validates syntax, retries on error, shows generated query.<br><strong>Knowledge graph:</strong> physics-based 2D force graph, colored nodes by type, click → detail panel, hover → highlights connections.',
		techTags: ['OWL 2', 'SPARQL', 'FastAPI', 'React', 'LLM'],
		githubUrl: 'https://github.com/GiuseppeBellamacina/Videogame-Semantic-Search',
		externalLink: {
			url: 'https://videogame-semantic-search.vercel.app',
			type: 'demo',
			icon: 'fas fa-external-link-alt'
		},
		image: '/assets/projects/videogame-semantic.webp'
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
		icon: '🍄',
		title: 'Q-uper Mario',
		description:
			'Reinforcement Learning project applying Q-learning to a custom Super Mario Bros environment built with OpenAI Gym.<br><strong>Environment:</strong> 2D grid-based Mario world with obstacles, enemies and power-ups; state represented as a feature vector of nearby tiles and entities.<br><strong>Reward structure:</strong> +100 for level completion, +10 for collecting coins, -50 for taking damage, -1 per time step to encourage efficiency.<br><strong>Results:</strong> Trained agent learns to navigate levels, avoid enemies and collect rewards — achieving consistent level completion after ~10K episodes.<br>Code modularly structured for easy experimentation with different RL algorithms and hyperparameters.',
		techTags: ['RL', 'NES', 'Super Mario'],
		githubUrl: 'https://github.com/GiuseppeBellamacina/Q-uper_Mario',
		image: '/assets/projects/q-uper-mario.webp'
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
		image: '/assets/projects/warehouse-swarm.webp'
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
	},
	{
		icon: '🐚',
		title: 'Neuron Shell',
		description:
			'Interactive online SSH shell with dashboard and commands for interacting with and monitoring the training of various deep learning models.<br><strong>Key features:</strong><ul><li>Web-based SSH terminal for remote server interaction</li><li>Real-time training dashboard with live metrics</li><li>Commands to control and monitor deep learning experiments</li></ul>Built with <strong>SvelteKit</strong> and <strong>TypeScript</strong>. Currently in active development.',
		techTags: ['SvelteKit', 'TypeScript', 'SSH', 'Deep Learning'],
		githubUrl: 'https://github.com/GiuseppeBellamacina/NeuronShell',
		image: '/assets/projects/neuronshell.webp'
	},
	{
		icon: '🔐',
		title: 'TunneLLM',
		description:
			'Communication via SSH tunnel with a locally hosted LLM, enabling private and secure message exchange.<br><strong>Architecture:</strong><ul><li><strong>Remote GPU server</strong> — runs vLLM serving Qwen2.5-14B-Instruct-AWQ (~9GB 4-bit quantized)</li><li><strong>SSH tunnel</strong> — sshtunnel/paramiko bridge between local and remote</li><li><strong>FastAPI proxy</strong> — local OpenAI-compatible API endpoint</li></ul>Exposes the model as a standard <strong>OpenAI API</strong> for VS Code extensions (Continue, Copilot). Supports streaming chat completions, health checks, and fully configurable SSH/model parameters.',
		techTags: ['Python', 'FastAPI', 'vLLM', 'SSH'],
		githubUrl: 'https://github.com/GiuseppeBellamacina/TunneLLM',
		image: '/assets/projects/tunnellm.webp'
	},
	{
		icon: '⚡',
		title: 'Fast Query Ranker',
		description:
			'Mini-project implementing a <strong>query ranker</strong> using <strong>TF-IDF</strong> and <strong>cosine similarity</strong> in both <strong>C++</strong> and <strong>Python</strong>, with comparative benchmarking.<br><strong>Features:</strong><ul><li>TF-IDF computation on a set of documents</li><li>Ranking via cosine similarity with respect to a query</li><li>Benchmark script to compare C++ and Python performance</li></ul><strong>Benchmark results:</strong> 3.3M documents → <strong>C++</strong>: 35.8s, <strong>Python</strong>: 560.9s (speedup 15.6x).',
		techTags: ['C++', 'Python', 'TF-IDF', 'Cosine Similarity'],
		githubUrl: 'https://github.com/GiuseppeBellamacina/fast-query-ranker',
		image: '/assets/projects/ranker.webp'
	}
];

const italianDescriptions: string[] = [
	// Guardian
	"🏆 Vincitore della <strong>NeoData Hackatania 2.0</strong> — Catania, Novembre 2024.<br>Chatbot AI multimodale per le Forze dell'Ordine: elabora query testuali e <strong>immagini di targhe</strong> per recuperare dati sensibili in tempo reale.<br><strong>Funzionalità chiave:</strong><ul><li>Accesso istantaneo a casellari giudiziali e precedenti penali</li><li>Dati del veicolo da immagini di targhe tramite LLM vision</li><li>Navigazione basata su grafi con <strong>GraphRAG</strong> su Neo4j (scuole, datori di lavoro, associati)</li><li>Pseudo <strong>coefficiente di rischio</strong> calcolato dalla gravità dei reati personali e degli associati</li></ul>Orchestrazione agentica degli strumenti tramite <strong>LangChain + LangGraph</strong>. Sviluppato con Salvatore Iurato.",
	// Videogame Semantic Search
	"App di semantic web che costruisce e interroga un'<strong>ontologia OWL 2</strong> sui videogiochi (dal 2015 ad oggi) tramite una pipeline NL-to-SPARQL alimentata da <strong>GPT-4.1 mini</strong>.<br><strong>Architettura:</strong><ul><li><strong>Frontend (React + Tailwind + react-force-graph-2d)</strong> — grafo di conoscenza interattivo, search bar, pannelli di dettaglio dei nodi</li><li><strong>Backend (FastAPI)</strong> — agente SPARQL con retry automatico (max 3 tentativi), OntologyService con rdflib, graph builder</li><li><strong>Ontologia (OWL 2)</strong> — classi: VideoGame, Developer, Publisher, Genre, Platform, Character, Franchise, Award; dati da Wikidata</li></ul><strong>Agente SPARQL:</strong> converte linguaggio naturale → SPARQL, valida la sintassi, effettua retry su errore, mostra la query generata.<br><strong>Grafo di conoscenza:</strong> force graph 2D physics-based, nodi colorati per tipo, click → pannello dettaglio, hover → evidenzia connessioni.",
	// GRPO Strict Generation
	"Progetto di Reinforcement Learning per il modulo universitario di RL.<br>Applica <strong>Group Relative Policy Optimization (GRPO)</strong> per il fine-tuning di un piccolo LLM open-weight (~0.5B–1.5B parametri) affinché generi <strong>JSON e codice Python sintatticamente validi</strong>.<br><strong>Scelte progettuali chiave:</strong><ul><li>Funzioni di reward programmatiche tramite <code>json.loads</code> e <code>ast.parse</code> — segnale binario rigoroso, nessun modello di reward neurale</li><li><strong>LoRA / PEFT</strong> per addestramento efficiente in memoria</li><li><strong>Unsloth</strong> per fine-tuning veloce, <strong>vLLM</strong> per inferenza ad alto throughput</li><li>Valutazione su metriche <strong>Pass@k</strong> che confrontano l'aderenza sintattica pre e post addestramento</li></ul>Dataset sintetico generato programmaticamente. Architettura completa e risultati nel report formale.",
	// Image Enhancement
	'Confronto sistematico di architetture CNN per il restauro di immagini sul dataset <strong>DIV2K</strong> (800 train / 100 val a risoluzione 2K).<br><strong>Architetture implementate:</strong><ul><li><strong>UNet</strong> — encoder-decoder con skip connections (~7.8M parametri)</li><li><strong>Residual UNet</strong> — predice il residuo di rumore per convergenza più rapida</li><li><strong>Attention UNet</strong> — attenzione selettiva tramite attention gates (~13.7M parametri)</li><li><strong>DnCNN</strong> — CNN feed-forward con batch norm per denoising cieco</li><li><strong>Denoising Autoencoder</strong> — encoder-decoder a collo di bottiglia addestrato per ricostruire immagini pulite</li><li><strong>Pix2Pix GAN</strong> — rete avversaria condizionale per traduzione immagine-immagine</li></ul><strong>Degradazioni:</strong> Rumore Gaussiano (σ=100), dithering di quantizzazione (2–8 bit), salt &amp; pepper.<br>Training: mixed precision AMP · loss L1+SSIM+VGG16 percettiva · cosine warmup scheduler · early stopping · inferenza full-resolution a finestra scorrevole.<br>Metriche: <strong>PSNR</strong> e <strong>SSIM</strong>. Progetto di gruppo di 4 persone.',
	// Q-uper Mario
	"Progetto di Reinforcement Learning che applica Q-learning a un ambiente custom di Super Mario Bros costruito con OpenAI Gym.<br><strong>Ambiente:</strong> mondo di Mario 2D a griglia con ostacoli, nemici e power-up; stato rappresentato come vettore di caratteristiche di tile ed entità vicine.<br><strong>Struttura di reward:</strong> +100 per completamento livello, +10 per raccolta monete, -50 per danno subito, -1 per step temporale per incentivare l'efficienza.<br><strong>Risultati:</strong> l'agente addestrato impara a navigare nei livelli, evitare nemici e raccogliere ricompense — raggiungendo un completamento costante del livello dopo ~10K episodi.<br>Codice strutturato modularmente per facilitare esperimenti con diversi algoritmi RL e iperparametri.",
	// Warehouse Swarm Intelligence System
	"Progettazione di un sistema multi-agente per l'ottimizzazione delle operazioni di magazzino.<br>Simulazione swarm in tempo reale — progetto del corso di Sistemi Multi-Agente.<br><strong>Tre ruoli agente specializzati:</strong><ul><li>🟢 <strong>Scout</strong> — esplora la mappa, segnala la posizione degli oggetti ai coordinatori</li><li>🔵 <strong>Coordinator</strong> — assegna compiti di recupero, gestisce la ricarica degli agenti</li><li>🟡 <strong>Retriever</strong> — naviga verso gli oggetti, li trasporta nella zona di deposito</li></ul><strong>Algoritmi principali:</strong> A* con riplanning dinamico · esplorazione basata su frontiera e random-walk · collision avoidance prioritario · protocollo di negoziazione ClearWayMessage · coda FIFO con ottimizzazione multi-carry.<br>Stack: <strong>Python / FastAPI</strong> + Socket.IO → <strong>React / TypeScript</strong> con Canvas HTML5, pannelli ridimensionabili e map editor integrato. Deploy su Render + Vercel.",
	// Steganography WebApp
	"Web app full-stack per nascondere e recuperare dati (testo, immagini, file binari) all'interno di immagini portanti — con un <strong>report scientifico formale in LaTeX</strong>.<br><strong>Tre algoritmi:</strong><ul><li><strong>LSB</strong> — modifica del bit meno significativo; fino a 3 bpp; PSNR &gt;50 dB; veloce ma fragile alla compressione JPEG</li><li><strong>DWT</strong> — embedding nel dominio delle frequenze wavelet; robusto a JPEG; PSNR 35–45 dB</li><li><strong>PVD</strong> — pixel-value differencing; capacità adattiva; PSNR 45–55 dB; SSIM &gt;0.95</li></ul>Funzionalità: <strong>auto-backup intelligente dei parametri</strong> per il recupero, conversione automatica RGB/RGBA/Grayscale, feedback <strong>PSNR &amp; SSIM</strong> in tempo reale e architettura modulare con CI (Black, isort, ruff).",
	// Neural Sudoku
	"Approccio neurale end-to-end alla risoluzione del Sudoku in due fasi.<br><strong>Fase 1 — Generazione dati:</strong> un classico <strong>risolutore backtracking</strong> basato sulla propagazione di vincoli genera grandi dataset etichettati di puzzle (dati → soluzioni).<br><strong>Fase 2 — Risolutore neurale:</strong> una <strong>rete PyTorch</strong> viene addestrata esclusivamente su esempi per predire la soluzione completa 9×9 da una griglia parziale, apprendendo implicitamente le regole del Sudoku.<br>Lavoro in corso: raffinamento dell'architettura, manipolazione della griglia basata su NumPy e framework di valutazione sistematica che misura accuratezza a livello di cifra e di puzzle completo.",
	// The Legend of Turi
	"Un gioco <strong>top-down action-adventure</strong> ispirato a The Legend of Zelda — con un'anima distintamente siciliana, costruito interamente in <strong>Unity</strong> (C#).<br><strong>Caratteristiche:</strong><ul><li>Tile map disegnate a mano ed esplorazione multi-stanza</li><li>AI nemica con comportamenti di pattuglia e inseguimento</li><li>Sistema di combattimento con armi, hitbox e gestione della salute</li><li>Sistema di dialogo e NPC interattivi</li><li>Storia originale che segue l'eroe Turi attraverso la campagna siciliana</li></ul>Distribuito come eseguibile standalone per Windows — scaricabile direttamente dalla release GitHub.",
	// Kagi ML Dev Challenge
	"Progetto per la <strong>Kagi ML Dev Challenge</strong>: costruire un'API che ri-ordina gli articoli di Hacker News per interesse dell'utente ed espande le query di ricerca con il ML.<br><strong>Percorso tecnico (9 fasi):</strong><ul><li>FAISS su 1.200 storie → scarsa qualità</li><li>Scalato a un <strong>dataset HuggingFace di 4M di post</strong>, filtrato a 300K storie HTTPS</li><li>CPU FAISS (2s) → GPU FAISS (1s, qualità inferiore) → <strong>Weaviate Cloud</strong> (0.2–0.7s)</li><li><strong>GPT-4o-mini</strong> per espansione query con prompt FewShot LangChain: bio → multiple subquery</li><li><strong>HuggingFace Inference API</strong> personalizzata per stare nel limite di 512MB RAM di Render</li><li>Streaming sia dei token LLM che dei risultati DB per ridurre la latenza percepita</li></ul>Deploy: Streamlit Cloud · Render API.",
	// Sales Store Forecasting
	"Competizione Kaggle: <strong>Store Sales — Time Series Forecasting</strong>.<br>Obiettivo: predire le vendite giornaliere per <strong>54 negozi × 33 famiglie di prodotti</strong> in Ecuador usando 4+ anni di dati storici di transazioni di Corporación Favorita.<br><strong>Approccio:</strong><ul><li>EDA: decomposizione stagionale, analisi dell'impatto di festività e prezzo del petrolio</li><li>Feature engineering: lag features, medie mobili, encoding ciclici delle date</li><li>Modelli: ensemble di regressori ML classici</li><li>Metrica di valutazione: <strong>RMSLE</strong> (Root Mean Squared Log Error)</li></ul>",
	// Celebrity ResNet18
	'Progetto universitario di <strong>Data Mining</strong>: riconoscimento facciale di celebrità tramite deep transfer learning.<br><strong>Pipeline:</strong><ul><li>Dataset: immagini etichetatte di volti di celebrità, split stratificato train/val/test</li><li>Modello: <strong>ResNet18</strong> pre-addestrato su ImageNet — testa del classificatore sostituita e sottoposta a fine-tuning</li><li>Augmentation: crop casuale, flip orizzontale, colour jitter, normalizzazione</li><li>Training: <strong>SGD con momentum</strong>, step LR decay, cross-entropy loss</li></ul>Dimostra come il transfer learning riduca drasticamente i requisiti di dati per la classificazione visiva — elevata accuratezza top-1 con un dataset compatto.',
	// OmniBot V2
	"Evoluzione di OmniBot — ricostruito attorno a un'architettura <strong>LangGraph RAG basata su grafi</strong> chiamata <strong>GraphOfThoughts</strong>.<br><strong>Cosa è cambiato vs V1:</strong><ul><li>Knowledge graph costruito e navigato al momento della query per un recupero contestuale più ricco</li><li>Output <strong>Text-to-Speech</strong>: il bot ora vocalizza le sue risposte in tempo reale</li><li><strong>Pipeline multi-processo</strong>: generazione di testo LLM e rendering audio TTS eseguiti in parallelo per minore latenza</li><li>Completamente personalizzabile: strategia di retrieval, stile di risposta e voce TTS tutti configurabili</li></ul>Porta i tuoi dati (nessun dataset incluso). Costruito in collaborazione con Drake9098.",
	// Little Language Model
	'<strong>Transformer in stile GPT</strong> implementato da zero in PyTorch e addestrato sulla <strong>Divina Commedia di Dante Alighieri</strong> — il modello risultante si chiama <strong>DanteGPT</strong>.<br><strong>Architettura:</strong> 6 layer · 8 attention head · 512 embedding dim · tokenizzatore a livello di carattere · positional encoding · layer normalisation.<br><strong>Training:</strong> ottimizzatore AdamW · sampling controllato dalla temperatura · 10% del corpus per validazione.<br>Dato un verso iniziale — es. <em>"Nel mezzo del cammin di nostra vita"</em> — il modello genera continuamente testo italiano che imita lo stile della terza rima dantesca.<br>Implementazione basata su <em>"Attention is All You Need"</em> (Vaswani et al., 2017).',
	// VulnerabilityBot
	"Sistema client/server locale per <strong>Q&amp;A di cybersecurity assistito da AI</strong> — costruito con Drake9098.<br><strong>Architettura a tre livelli:</strong><ul><li>🖥️ <strong>Frontend Streamlit</strong> — sottomissione query tramite input testuale o upload file; navigazione delle risposte nella vista DB</li><li>⚙️ <strong>Backend asincrono Quart + Uvicorn</strong> — riceve le query, le distribuisce all'AI, salva i risultati in SQLite</li><li>🤖 <strong>Agente LLM LangChain</strong> — cerca nel database delle vulnerabilità e formatta risposte strutturate</li></ul>Il numero di query AI concorrenti è configurabile tramite <code>config.yaml</code> (default: 3).<br>Utile per il triage rapido di dataset CVE e l'esplorazione di panorami di vulnerabilità.",
	// EPUB Translator
	"Strumento CLI che traduce interi e-book <strong>EPUB</strong> usando LLM, preservando ogni dettaglio strutturale dell'originale.<br><strong>Come funziona:</strong><ul><li>Analizza la spine dell'EPUB ed estrae il contenuto HTML per capitolo</li><li>Invia i capitoli all'LLM in batch, mantenendo intatti tutti i tag HTML, stili e formattazione</li><li>Usa sovrapposizione di contesto tra i chunk per mantenere la coerenza narrativa tra i confini dei batch</li><li>Riassembla i capitoli tradotti in un EPUB valido con metadati, copertina e indice originali</li></ul>Gestisce libri di qualsiasi lunghezza con eleganza. Utile per tradurre romanzi, manuali tecnici o articoli accademici senza perdere layout o struttura.",
	// SpazzApp
	"Web app <strong>Streamlit</strong> multi-pagina per la generazione automatica di turni di pulizia mensili tra coinquilini (v2.0, completamente riscritta con architettura OOP).<br><strong>L'algoritmo di scheduling assegna un punteggio a ogni candidato:</strong><ul><li>+400 pts — stanza mai pulita da questa persona (priorità di rotazione)</li><li>+600 pts — persona con il carico di lavoro corrente più basso (bilanciamento del carico)</li><li>+30/+10 pts — preferenza giorno feriale vs weekend</li><li>Ridistribuzione dinamica delle assenze — ricalcola automaticamente gli obiettivi settimanali</li></ul><strong>Funzionalità:</strong> esclusioni stanza nella prima settimana · cap di 3 assegnazioni/giorno · <strong>calendario PNG</strong> esportabile · statistiche di distribuzione per persona e per stanza.",
	// Neuron Shell
	"Shell SSH online interattiva con dashboard e comandi per interagire e monitorare l'addestramento di vari modelli di deep learning.<br><strong>Funzionalità chiave:</strong><ul><li>Terminale SSH web-based per interazione con server remoti</li><li>Dashboard di addestramento in tempo reale con metriche live</li><li>Comandi per controllare e monitorare esperimenti di deep learning</li></ul>Costruito con <strong>SvelteKit</strong> e <strong>TypeScript</strong>. Attualmente in fase di sviluppo attivo.",
	// TunneLLM
	'Comunicazione tramite tunnel SSH con un LLM hostato localmente, permettendo scambio di messaggi privato e sicuro.<br><strong>Architettura:</strong><ul><li><strong>Server GPU remoto</strong> — esegue vLLM servendo Qwen2.5-14B-Instruct-AWQ (~9GB 4-bit quantizzato)</li><li><strong>Tunnel SSH</strong> — bridge sshtunnel/paramiko tra locale e remoto</li><li><strong>Proxy FastAPI</strong> — endpoint API compatibile OpenAI in locale</li></ul>Espone il modello come <strong>API OpenAI</strong> standard per estensioni VS Code (Continue, Copilot). Supporta streaming delle chat completions, health check e parametri SSH/modello completamente configurabili.',
	// Fast Query Ranker
	'Mini-progetto che implementa un <strong>query ranker</strong> usando <strong>TF-IDF</strong> e <strong>cosine similarity</strong> sia in <strong>C++</strong> che in <strong>Python</strong>, con benchmark comparativo.<br><strong>Features:</strong><ul><li>Calcolo TF-IDF su un set di documenti</li><li>Ranking tramite similarità coseno rispetto a una query</li><li>Script di benchmark per confrontare le performance tra C++ e Python</li></ul><strong>Risultati benchmark:</strong> 3.3M documenti → <strong>C++</strong>: 35.8s, <strong>Python</strong>: 560.9s (speedup 15.6x).'
];

export function getProjects(lang: Lang): Project[] {
	if (lang === 'it') {
		return projects.map((p, i) => ({
			...p,
			description: italianDescriptions[i] ?? p.description
		}));
	}
	return projects;
}
