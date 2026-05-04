import type { Lang } from '$lib/i18n';

export interface TimelineItem {
	type: 'work' | 'education';
	icon: string;
	date: string;
	title: string;
	subtitle: string;
	description: string;
	highlights: string[];
	/** Hardcoded localized label for completed experiences, e.g. "6 months" */
	durationFixed?: string;
	/** Start date [year, month 1-12] for ongoing experiences — duration auto-calculated */
	durationSince?: [number, number];
}

const timelineItemsEN: TimelineItem[] = [
	{
		type: 'education',
		icon: 'fas fa-graduation-cap',
		date: '2025 - Present',
		title: "Master's Degree in Machine Learning and Artificial Intelligence",
		subtitle: 'Università degli Studi di Catania',
		description: 'Advanced studies in cutting-edge AI technologies and methodologies',
		highlights: [
			'Deep Learning and Neural Network Architectures',
			'Natural Language Processing and Computer Vision',
			'Reinforcement Learning and Multi-Agent Systems'
		]
	},
	{
		type: 'work',
		icon: 'fas fa-laptop-code',
		date: 'September 2025 - Present',
		title: 'AI Software Engineer',
		subtitle: 'RICCA IT',
		description:
			'Building LLM-based systems, multi-agent architectures, and RAG pipelines for production environments',
		highlights: [
			'Designed and deployed LLM-based systems for real-world applications, including solutions used by ASP (Azienda Sanitaria Provinciale)',
			'Built multi-agent architectures for complex reasoning tasks, separating planning, execution, and validation into coordinated components',
			'Developed end-to-end RAG pipelines (data ingestion, indexing, retrieval, reranking, generation) with focus on scalability and latency',
			'Integrated heterogeneous AI modules into cohesive, production-ready systems, improving reliability and maintainability',
			'Applied model adaptation techniques including fine-tuning, reinforcement learning (GRPO), knowledge distillation, and domain adaptation',
			'Evaluated LLM systems beyond standard benchmarks, focusing on robustness, consistency, and behavior under real-world constraints'
		],
		durationSince: [2025, 9]
	},
	{
		type: 'work',
		icon: 'fas fa-briefcase',
		date: 'December 2024 - May 2025',
		title: 'Artificial Intelligence Engineer & Data Scientist',
		subtitle: 'Intellisync',
		description:
			'AI Research and Development with focus on multi-agent systems, RAG architectures, and predictive analytics',
		highlights: [
			'Developed LLM-based and multi-agent solutions, including systems used by the Italian Air Force Academy (Accademia Aeronautica Militare Italiana)',
			'Designed and implemented RAG architectures, from requirement analysis to system design and deployment',
			'Built agentic pipelines translating natural language into executable queries across SQL, graph databases (Cypher), semantic systems (SPARQL), and vector search',
			'Developed predictive models on large-scale wind turbine datasets, including anomaly detection and energy loss forecasting',
			'Contributed to solutions later integrated into Yokogawa products through collaboration with BaxEnergy and Farsight',
			'Performed advanced data analysis to support operational decision-making'
		],
		durationFixed: '6 months'
	},
	{
		type: 'work',
		icon: 'fas fa-code',
		date: 'June 2024 - November 2024',
		title: 'AI Research and Development',
		subtitle: 'Intellisync - Corporate Internship',
		description: 'Design and development of advanced RAG-based chatbot systems',
		highlights: [
			'Chatbot development based on Retrieval-Augmented Generation (RAG) techniques',
			'Analysis of customer needs to define system architecture',
			'Definition of functional requirements and technical specifications'
		],
		durationFixed: '6 months'
	},
	{
		type: 'education',
		icon: 'fas fa-graduation-cap',
		date: '2021 - 2024',
		title: "Bachelor's Degree in Computer Science",
		subtitle: 'Università degli Studi di Catania',
		description: 'Graduated with honors, specialization in Data Elaboration and Applications',
		highlights: [
			'Graduation Grade: 110 cum Laude',
			'Focus on Artificial Intelligence, Machine Learning, and Data Science',
			'Advanced coursework in Neural Networks and Deep Learning'
		]
	},
	{
		type: 'education',
		icon: 'fas fa-school',
		date: '2016 - 2021',
		title: 'High School Diploma',
		subtitle: 'Liceo Archimede, Acireale (CT)',
		description: 'Strong foundation in mathematics and sciences',
		highlights: []
	}
];

const timelineItemsIT: TimelineItem[] = [
	{
		type: 'education',
		icon: 'fas fa-graduation-cap',
		date: '2025 - Presente',
		title: 'Laurea Magistrale in Machine Learning e Intelligenza Artificiale',
		subtitle: 'Università degli Studi di Catania',
		description: "Studi avanzati in tecnologie e metodologie AI all'avanguardia",
		highlights: [
			'Deep Learning e Architetture di Reti Neurali',
			'Elaborazione del Linguaggio Naturale e Computer Vision',
			'Reinforcement Learning e Sistemi Multi-Agente'
		]
	},
	{
		type: 'work',
		icon: 'fas fa-laptop-code',
		date: 'Settembre 2025 - Presente',
		title: 'AI Software Engineer',
		subtitle: 'RICCA IT',
		description:
			'Sviluppo di sistemi basati su LLM, architetture multi-agente e pipeline RAG per ambienti di produzione',
		highlights: [
			"Progettazione e deploy di sistemi LLM per applicazioni reali, incluse soluzioni utilizzate dall'ASP (Azienda Sanitaria Provinciale)",
			'Sviluppo di architetture multi-agente per ragionamento complesso, separando pianificazione, esecuzione e validazione in componenti coordinati',
			'Implementazione di pipeline RAG end-to-end (ingestione, indicizzazione, retrieval, reranking, generazione) con focus su scalabilità e latenza',
			'Integrazione di moduli AI eterogenei in sistemi coesi e production-ready, migliorando affidabilità e manutenibilità',
			'Applicazione di tecniche di adattamento del modello: fine-tuning, reinforcement learning (GRPO), knowledge distillation e domain adaptation',
			'Valutazione di sistemi LLM oltre i benchmark standard, con focus su robustezza, consistenza e comportamento in scenari reali'
		],
		durationSince: [2025, 9]
	},
	{
		type: 'work',
		icon: 'fas fa-briefcase',
		date: 'Dicembre 2024 - Maggio 2025',
		title: 'Artificial Intelligence Engineer & Data Scientist',
		subtitle: 'Intellisync',
		description:
			'Ricerca e Sviluppo AI con focus su sistemi multi-agente, architetture RAG e analisi predittiva',
		highlights: [
			"Sviluppo di soluzioni LLM-based e multi-agente, inclusi sistemi in uso presso l'Accademia Aeronautica Militare Italiana",
			"Progettazione e implementazione di architetture RAG, dall'analisi dei requisiti fino al design di sistema e al deploy",
			'Sviluppo di pipeline agentiche per la traduzione del linguaggio naturale in query eseguibili su SQL, grafi (Cypher), sistemi semantici (SPARQL) e vector search',
			'Sviluppo di modelli predittivi su dataset di turbine eoliche su larga scala, inclusi rilevamento anomalie e previsione perdite energetiche',
			'Contributo a soluzioni successivamente integrate nei prodotti Yokogawa tramite collaborazione con BaxEnergy e Farsight',
			'Analisi avanzata dei dati a supporto delle decisioni operative'
		],
		durationFixed: '6 mesi'
	},
	{
		type: 'work',
		icon: 'fas fa-code',
		date: 'Giugno 2024 - Novembre 2024',
		title: 'Ricerca e Sviluppo AI',
		subtitle: 'Intellisync - Tirocinio Aziendale',
		description: 'Progettazione e sviluppo di sistemi chatbot avanzati basati su RAG',
		highlights: [
			'Sviluppo di chatbot basati su tecniche di Retrieval-Augmented Generation (RAG)',
			"Analisi delle esigenze del cliente per definire l'architettura del sistema",
			'Definizione dei requisiti funzionali e delle specifiche tecniche'
		],
		durationFixed: '6 mesi'
	},
	{
		type: 'education',
		icon: 'fas fa-graduation-cap',
		date: '2021 - 2024',
		title: 'Laurea Triennale in Informatica',
		subtitle: 'Università degli Studi di Catania',
		description: 'Laureato con lode, specializzazione in Elaborazione Dati e Applicazioni',
		highlights: [
			'Voto di Laurea: 110 e Lode',
			'Focus su Intelligenza Artificiale, Machine Learning e Data Science',
			'Corsi avanzati in Reti Neurali e Deep Learning'
		]
	},
	{
		type: 'education',
		icon: 'fas fa-school',
		date: '2016 - 2021',
		title: 'Diploma di Maturità',
		subtitle: 'Liceo Archimede, Acireale (CT)',
		description: 'Solida formazione in matematica e scienze',
		highlights: []
	}
];

export function getTimelineItems(lang: Lang): TimelineItem[] {
	return lang === 'it' ? timelineItemsIT : timelineItemsEN;
}

/** Machine-readable work periods for cumulative experience calculation */
const workPeriods: { start: [number, number]; end?: [number, number] }[] = [
	// [year, month(1-12)]
	{ start: [2024, 6], end: [2024, 11] }, // Intellisync Internship
	{ start: [2024, 12], end: [2025, 5] }, // Intellisync
	{ start: [2025, 9] } // RICCA IT — ongoing
];

/** Returns total work experience as { years, months } computed against today */
export function getTotalWorkExperience(): { years: number; months: number } {
	const now = new Date();
	const nowY = now.getFullYear();
	const nowM = now.getMonth() + 1; // 1-based

	let totalMonths = 0;
	for (const p of workPeriods) {
		const [sy, sm] = p.start;
		const [ey, em] = p.end ?? [nowY, nowM];
		totalMonths += (ey - sy) * 12 + (em - sm) + 1; // inclusive of both start and end month
	}

	const years = Math.floor(totalMonths / 12);
	const months = totalMonths % 12;
	return { years, months };
}
