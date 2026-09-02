import type { Lang } from '$lib/i18n';

export interface TimelineItem {
	type: 'work' | 'education';
	icon: string;
	date: string;
	title: string;
	subtitle: string;
	description: string;
	highlights: string[];
	logo?: string;
	linkedinUrl?: string;
	/** Hardcoded localized label for completed experiences, e.g. "6 months" */
	durationFixed?: string;
	/** Start date [year, month 1-12] for ongoing experiences — duration auto-calculated */
	durationSince?: [number, number];
}

/** Language-specific text for a timeline entry */
interface TimelineText {
	date: string;
	title: string;
	description: string;
	highlights: string[];
	durationFixed?: string;
}

/**
 * Single source of truth: shared, non-localized data lives once per entry,
 * localized texts are grouped per language. No positional alignment between
 * separate EN/IT arrays to keep in sync.
 */
interface TimelineEntry {
	type: 'work' | 'education';
	icon: string;
	/** Company / school — identical across languages */
	subtitle: string;
	logo?: string;
	linkedinUrl?: string;
	/** Start date [year, month 1-12] for ongoing experiences — duration auto-calculated */
	durationSince?: [number, number];
	text: Record<Lang, TimelineText>;
}

const timelineData: TimelineEntry[] = [
	{
		type: 'education',
		icon: 'fas fa-graduation-cap',
		subtitle: 'Università degli Studi di Catania',
		logo: '/experience_logos/unict.jpeg',
		text: {
			en: {
				date: '2025 - Present',
				title: "Master's Degree in Machine Learning and Artificial Intelligence",
				description: 'Advanced studies in cutting-edge AI technologies and methodologies',
				highlights: [
					'Deep Learning and Neural Network Architectures',
					'Natural Language Processing and Computer Vision',
					'Reinforcement Learning and Multi-Agent Systems'
				]
			},
			it: {
				date: '2025 - Presente',
				title: 'Laurea Magistrale in Machine Learning e Intelligenza Artificiale',
				description: "Studi avanzati in tecnologie e metodologie AI all'avanguardia",
				highlights: [
					'Deep Learning e Architetture di Reti Neurali',
					'Elaborazione del Linguaggio Naturale e Computer Vision',
					'Reinforcement Learning e Sistemi Multi-Agente'
				]
			}
		}
	},
	{
		type: 'work',
		icon: 'fas fa-laptop-code',
		subtitle: 'RICCA IT',
		logo: '/experience_logos/ricca.jpeg',
		linkedinUrl: 'https://www.linkedin.com/company/ricca-s-r-l-/',
		durationSince: [2025, 9],
		text: {
			en: {
				date: 'September 2025 - Present',
				title: 'AI Software Engineer',
				description:
					'Design and development of LLM-based AI systems and multi-agent architectures for complex reasoning and decision-making workflows',
				highlights: [
					'Design and development of LLM-based AI systems and multi-agent architectures for complex reasoning and decision-making workflows',
					'Development of scalable Retrieval-Augmented Generation (RAG) pipelines, including data ingestion, indexing, retrieval orchestration, and contextual reasoning',
					'Implementation of structured reasoning workflows integrating vector search, SQL querying, graph databases, and semantic systems',
					'Architectural refactoring and integration of distributed AI modules into cohesive, production-ready systems focused on scalability and maintainability',
					'Research, evaluation, and prototyping of emerging AI techniques to improve robustness, interpretability, and system reliability under real operational constraints',
					'Collaboration with cross-functional teams for end-to-end development, validation, and deployment of AI solutions'
				]
			},
			it: {
				date: 'Settembre 2025 - Presente',
				title: 'AI Software Engineer',
				description:
					'Progettazione e sviluppo di sistemi AI basati su LLM e architetture multi-agente per workflow di ragionamento complesso e decision-making',
				highlights: [
					'Progettazione e sviluppo di sistemi AI basati su LLM e architetture multi-agente per workflow di ragionamento complesso e decision-making',
					'Sviluppo di pipeline Retrieval-Augmented Generation (RAG) scalabili, inclusi ingestione dati, indicizzazione, orchestrazione del retrieval e ragionamento contestuale',
					'Implementazione di workflow di ragionamento strutturato che integrano vector search, query SQL, database a grafo e sistemi semantici',
					'Refactoring architetturale e integrazione di moduli AI distribuiti in sistemi coesi e production-ready, con focus su scalabilità e manutenibilità',
					'Ricerca, valutazione e prototipazione di tecniche AI emergenti per migliorare robustezza, interpretabilità e affidabilità del sistema in condizioni operative reali',
					'Collaborazione con team cross-funzionali per lo sviluppo end-to-end, la validazione e il deploy di soluzioni AI'
				]
			}
		}
	},
	{
		type: 'work',
		icon: 'fas fa-briefcase',
		subtitle: 'IntelliSync',
		logo: '/experience_logos/intellisync.jpeg',
		linkedinUrl: 'https://www.linkedin.com/company/intellisync/',
		text: {
			en: {
				date: 'June 2023 - July 2025',
				title: 'AI/ML Engineer',
				description:
					'Research and development of AI solutions based on LLMs and multi-agent architectures, with a focus on scalable and domain-specific systems',
				highlights: [
					'Research and development of AI solutions based on LLMs and multi-agent architectures, with a focus on scalable and domain-specific systems',
					'Design and implementation of Retrieval-Augmented Generation (RAG) pipelines and functional prototypes for validating AI-driven workflows and technical approaches',
					'Development of predictive models and anomaly detection systems on large-scale industrial datasets from wind turbines, using neural networks and machine learning techniques',
					'Analysis of operational and telemetry data to identify energy losses, anomalous patterns, and predictive maintenance signals',
					'Collaboration on AI solutions and data-driven systems connected to industrial and operational environments'
				],
				durationFixed: '2 years 2 months'
			},
			it: {
				date: 'Giugno 2023 - Luglio 2025',
				title: 'AI/ML Engineer',
				description:
					'Ricerca e sviluppo di soluzioni AI basate su LLM e architetture multi-agente, con focus su sistemi scalabili e specifici per dominio',
				highlights: [
					'Ricerca e sviluppo di soluzioni AI basate su LLM e architetture multi-agente, con focus su sistemi scalabili e specifici per dominio',
					'Progettazione e implementazione di pipeline Retrieval-Augmented Generation (RAG) e prototipi funzionali per la validazione di workflow AI-driven e approcci tecnici',
					'Sviluppo di modelli predittivi e sistemi di rilevamento anomalie su dataset industriali su larga scala da turbine eoliche, usando reti neurali e tecniche di machine learning',
					'Analisi di dati operativi e telemetrici per identificare perdite energetiche, pattern anomali e segnali di manutenzione predittiva',
					'Collaborazione su soluzioni AI e sistemi data-driven connessi ad ambienti industriali e operativi'
				],
				durationFixed: '2 anni 2 mesi'
			}
		}
	},
	{
		type: 'education',
		icon: 'fas fa-graduation-cap',
		subtitle: 'Università degli Studi di Catania',
		logo: '/experience_logos/unict.jpeg',
		text: {
			en: {
				date: '2021 - 2024',
				title: "Bachelor's Degree in Computer Science",
				description: 'Graduated with honors, specialization in Data Elaboration and Applications',
				highlights: [
					'Graduation Grade: 110 cum Laude',
					'Focus on Artificial Intelligence, Machine Learning, and Data Science',
					'Advanced coursework in Neural Networks and Deep Learning'
				]
			},
			it: {
				date: '2021 - 2024',
				title: 'Laurea Triennale in Informatica',
				description: 'Laureato con lode, specializzazione in Elaborazione Dati e Applicazioni',
				highlights: [
					'Voto di Laurea: 110 e Lode',
					'Focus su Intelligenza Artificiale, Machine Learning e Data Science',
					'Corsi avanzati in Reti Neurali e Deep Learning'
				]
			}
		}
	},
	{
		type: 'education',
		icon: 'fas fa-school',
		subtitle: 'Liceo Archimede, Acireale (CT)',
		text: {
			en: {
				date: '2016 - 2021',
				title: 'High School Diploma',
				description: 'Strong foundation in mathematics and sciences',
				highlights: []
			},
			it: {
				date: '2016 - 2021',
				title: 'Diploma di Maturità',
				description: 'Solida formazione in matematica e scienze',
				highlights: []
			}
		}
	}
];

export function getTimelineItems(lang: Lang): TimelineItem[] {
	return timelineData.map(({ text, ...shared }) => {
		const t = text[lang];
		return {
			...shared,
			date: t.date,
			title: t.title,
			description: t.description,
			highlights: t.highlights,
			durationFixed: t.durationFixed
		};
	});
}

/** Machine-readable work periods for cumulative experience calculation */
const workPeriods: { start: [number, number]; end?: [number, number] }[] = [
	// [year, month(1-12)]
	{ start: [2023, 6], end: [2025, 7] }, // Intellisync
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
