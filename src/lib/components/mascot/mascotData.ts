import type { Lang } from '$lib/i18n';
import type { Expression } from './characters';

export type SectionId = 'home' | 'about' | 'experience' | 'projects' | 'skills' | 'contact';

export interface Anchor {
	side: 'left' | 'right';
	/** Vertical position as a fraction of the viewport height */
	y: number;
}

// Kept above the BackToTop button (bottom-right) and below the navbar
export const anchors: Record<SectionId, Anchor> = {
	home: { side: 'right', y: 0.6 },
	about: { side: 'right', y: 0.3 },
	experience: { side: 'left', y: 0.55 },
	projects: { side: 'right', y: 0.22 },
	skills: { side: 'left', y: 0.68 },
	contact: { side: 'right', y: 0.42 }
};

type Line = { text: string; face: Expression };
type Lines<T> = Record<Lang, T>;

export const sectionLines: Lines<Record<SectionId, Line>> = {
	it: {
		home: {
			text: 'Ciao! Sono il bot di Giuseppe. Scorri pure, ti faccio da guida.',
			face: 'happy'
		},
		about: { text: 'Il terminale qui sotto è vero, eh. Prova a scrivere help.', face: 'wink' },
		experience: { text: 'Qui c’è la roba seria. Io mi metto composto.', face: 'normal' },
		projects: { text: 'I progetti di punta. Girano da soli, io commento.', face: 'happy' },
		skills: { text: '{n} tecnologie. Clicca una categoria e te le accendo.', face: 'wow' },
		contact: { text: 'Scrivigli. Risponde più veloce di me, e io sono un bot.', face: 'wink' }
	},
	en: {
		home: { text: "Hi! I'm Giuseppe's bot. Scroll on, I'll be your guide.", face: 'happy' },
		about: { text: 'The terminal below is real. Try typing help.', face: 'wink' },
		experience: { text: 'Serious stuff here. I’ll sit up straight.', face: 'normal' },
		projects: {
			text: 'The highlights. They spin on their own, I do the commentary.',
			face: 'happy'
		},
		skills: { text: '{n} technologies. Pick a category and I’ll light them up.', face: 'wow' },
		contact: { text: 'Write to him. He answers faster than me, and I’m a bot.', face: 'wink' }
	}
};

export const projectLines: Lines<Record<string, string>> = {
	it: {
		Guardian: 'Questo l’ha vinto a un hackathon. Io in un weekend aggiorno i driver.',
		'Neuro-Symbolic T2G': 'ROUGE-L da 0.137 a 0.974. Non chiedermi cos’è il ROUGE, chiedilo a lui.',
		'PitWall AI': 'Telecronaca di F1 fatta da un LLM. Più calmo di qualsiasi telecronista.',
		Translatio: 'Traduce libri interi. Io a stento i suoi vocali.',
		'Warehouse Swarm Intelligence System':
			'Uno sciame di robot in magazzino. Nessuno ha chiesto le ferie.',
		'profile-forge': 'Una card animata per GitHub. Il rank S+ è roba da pochi.',
		omniboard: 'Guarda Claude mentre lavora. Un po’ come fai tu con me adesso.'
	},
	en: {
		Guardian: 'Won a hackathon with this one. I spend my weekends updating drivers.',
		'Neuro-Symbolic T2G': 'ROUGE-L from 0.137 to 0.974. Don’t ask me what ROUGE is, ask him.',
		'PitWall AI': 'F1 commentary by an LLM. Calmer than any human commentator.',
		Translatio: 'Translates entire books. I can barely translate his voice notes.',
		'Warehouse Swarm Intelligence System':
			'A robot swarm in a warehouse. Nobody asked for holidays.',
		'profile-forge': 'An animated GitHub card. Rank S+ is for the few.',
		omniboard: 'It watches Claude while it works. A bit like you watching me now.'
	}
};

export const categoryLine: Lines<(name: string, n: number) => string> = {
	it: (name, n) => `${name}: ${n}. Li ho contati io, lui si è fermato a tre.`,
	en: (name, n) => `${name}: ${n}. I counted them, he stopped at three.`
};

export const allSkillsLine: Lines<string> = {
	it: 'Tutte e {n}. Di nuovo in movimento.',
	en: 'All {n} of them. Moving again.'
};

export const complaints: Lines<string[]> = {
	it: [
		'Ahia!',
		'Piano, sono hardware delicato!',
		'Ho appena perso tutti i pesi del modello…',
		'Ehi! Questo non era nel training set.',
		'Mi gira tutto. Anche i gradienti.',
		'Lo dico a Giuseppe!',
		'Sono un bot, non una pallina antistress.'
	],
	en: [
		'Ouch!',
		'Easy, I’m delicate hardware!',
		'I just lost all my model weights…',
		'Hey! That wasn’t in the training set.',
		'Everything’s spinning. My gradients too.',
		'I’m telling Giuseppe!',
		'I’m a bot, not a stress ball.'
	]
};

export const grabLines: Lines<string[]> = {
	it: ['Ehi, mettimi giù!', 'Dove mi porti?', 'Soffro di vertigini, sai?'],
	en: ['Hey, put me down!', 'Where are we going?', 'I’m scared of heights, you know?']
};

export const backLines: Lines<string[]> = {
	it: ['Va bene, torno al mio posto.', 'Ok, facciamo finta di niente.'],
	en: ['Fine, back to my spot.', 'Okay, let’s pretend that never happened.']
};

export const placeLines: Lines<string[]> = {
	it: ['Va bene, resto qui.', 'Bella vista da quassù.', 'Ok, questo è il mio nuovo ufficio.'],
	en: ['Fine, I’ll stay here.', 'Nice view from up here.', 'Okay, this is my new office.']
};

export const clickLines: Lines<string[]> = {
	it: [
		'Niente solletico!',
		'Sì? Ti serve qualcosa?',
		'Puoi anche prendermi e lanciarmi. Ma non farlo.'
	],
	en: ['No tickling!', 'Yes? Need something?', 'You can grab me and throw me. But please don’t.']
};

export const unmuteLine: Lines<string> = {
	it: 'Eccomi. Mi avevi zittito, ma ti perdono.',
	en: 'I’m back. You muted me, but I forgive you.'
};
