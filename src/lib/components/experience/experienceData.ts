export interface TimelineItem {
	type: 'work' | 'education';
	icon: string;
	date: string;
	title: string;
	subtitle: string;
	description: string;
	highlights: string[];
}

export const timelineItems: TimelineItem[] = [
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
