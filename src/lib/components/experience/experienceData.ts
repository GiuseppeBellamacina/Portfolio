import type { Lang } from '$lib/i18n';

export interface TimelineItem {
	type: 'work' | 'education';
	icon: string;
	date: string;
	title: string;
	subtitle: string;
	description: string;
	highlights: string[];
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
		title: 'AI Developer',
		subtitle: 'RICCA IT',
		description: 'Developing innovative AI solutions and intelligent systems',
		highlights: [
			'Design and implementation of AI-powered applications',
			'Integration of machine learning models into production systems',
			'Collaboration with cross-functional teams on AI projects'
		]
	},
	{
		type: 'work',
		icon: 'fas fa-briefcase',
		date: 'December 2024 - May 2025',
		title: 'Artificial Intelligence Engineer & Data Scientist',
		subtitle: 'Intellisync',
		description:
			'AI Research and Development with focus on multi-agent systems and predictive analytics',
		highlights: [
			'Development and optimization of multi-agent architectures',
			'Analysis and research of new application fields for innovative AI technologies',
			'Design and implementation of functional prototypes to validate technical approaches',
			'Data Science & Predictive Analytics: Advanced analysis of wind turbine data',
			'Development of predictive models for energy loss estimation and failure prediction',
			'Pattern and anomaly identification using neural networks and machine learning'
		]
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
		]
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
		title: 'AI Developer',
		subtitle: 'RICCA IT',
		description: 'Sviluppo di soluzioni AI innovative e sistemi intelligenti',
		highlights: [
			'Progettazione e implementazione di applicazioni basate su AI',
			'Integrazione di modelli di machine learning in sistemi di produzione',
			'Collaborazione con team interfunzionali su progetti AI'
		]
	},
	{
		type: 'work',
		icon: 'fas fa-briefcase',
		date: 'Dicembre 2024 - Maggio 2025',
		title: 'Artificial Intelligence Engineer & Data Scientist',
		subtitle: 'Intellisync',
		description: 'Ricerca e Sviluppo AI con focus su sistemi multi-agente e analisi predittiva',
		highlights: [
			'Sviluppo e ottimizzazione di architetture multi-agente',
			'Analisi e ricerca di nuovi campi applicativi per tecnologie AI innovative',
			'Progettazione e implementazione di prototipi funzionali per validare approcci tecnici',
			'Data Science & Analisi Predittiva: Analisi avanzata di dati eolici',
			'Sviluppo di modelli predittivi per stima delle perdite energetiche e previsione guasti',
			'Identificazione di pattern e anomalie tramite reti neurali e machine learning'
		]
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
		]
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
