import type { Lang } from '$lib/i18n';
import type { Expression } from './characters';

export type SectionId = 'home' | 'about' | 'experience' | 'projects' | 'skills' | 'contact';
export type Season = 'christmas' | 'newyear' | 'summer' | 'night';

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

export type Line = { text: string; face: Expression };
type Lines<T> = Record<Lang, T>;

// A few options per section, so coming back to one doesn't repeat itself
export const sectionLines: Lines<Record<SectionId, Line[]>> = {
	it: {
		home: [
			{
				text: 'Ciao! **Sono {name}**, il bot di Giuseppe. Scorri pure, ti faccio da guida.',
				face: 'happy'
			},
			{ text: 'Bentornato in cima. La galassia la muovi tu, col **cursore**.', face: 'wink' }
		],
		about: [
			{ text: 'Il terminale qui sotto è vero, eh. Prova a scrivere **help**.', face: 'wink' },
			{
				text: 'Psst: nel terminale c’è un comando tutto per me. Prova a scrivere **mascot**.',
				face: 'happy'
			}
		],
		experience: [
			{ text: 'Qui c’è la **roba seria**. Mi metto composto.', face: 'normal' },
			{
				text: '**Sanità pubblica, Aeronautica, parchi eolici**. Io nel frattempo ho imparato a fluttuare.',
				face: 'wow'
			}
		],
		projects: [
			{ text: 'I progetti di punta **girano da soli**. Io li commento, gratis.', face: 'happy' },
			{
				text: 'Vuoi vederli tutti? C’è il pulsante **“Tutti i progetti”**. Sono una trentina, porta pazienza.',
				face: 'wink'
			}
		],
		skills: [
			{ text: '**{n} tecnologie**. Clicca una categoria e te le metto in fila.', face: 'wow' },
			{
				text: 'Questo muro **non si ferma mai**. Un po’ come lui quando scopre una libreria nuova.',
				face: 'happy'
			}
		],
		contact: [
			{ text: '**Scrivigli!** Risponde più in fretta di me, e io sono un bot.', face: 'wink' },
			{
				text: 'Fine del giro. Se ti è piaciuto, **LinkedIn** è qui sotto. Io resto qui a fluttuare.',
				face: 'happy'
			}
		]
	},
	en: {
		home: [
			{ text: "Hi! **I'm {name}**, Giuseppe's bot. Scroll on, I'll be your guide.", face: 'happy' },
			{ text: 'Back at the top. You can stir the galaxy with **your cursor**.', face: 'wink' }
		],
		about: [
			{ text: 'The terminal below is real. Try typing **help**.', face: 'wink' },
			{
				text: 'Psst: that terminal has a command just for me. Try typing **mascot**.',
				face: 'happy'
			}
		],
		experience: [
			{ text: '**Serious stuff** here. I’ll sit up straight.', face: 'normal' },
			{
				text: '**Public healthcare, the Air Force, wind farms**. Meanwhile I learned to float.',
				face: 'wow'
			}
		],
		projects: [
			{ text: 'The highlights **spin on their own**. Commentary is on the house.', face: 'happy' },
			{
				text: 'Want them all? Hit **“All projects”**. There are about thirty, brace yourself.',
				face: 'wink'
			}
		],
		skills: [
			{ text: '**{n} technologies**. Pick a category and I’ll line them up.', face: 'wow' },
			{ text: 'This wall **never stops**. Like him when he finds a new library.', face: 'happy' }
		],
		contact: [
			{ text: '**Write to him!** He answers faster than me, and I’m a bot.', face: 'wink' },
			{
				text: 'End of the tour. **LinkedIn** is right below. I’ll keep floating here.',
				face: 'happy'
			}
		]
	}
};

// One line per project, keyed by title; used by the carousel and when a project is opened
export const projectLines: Lines<Record<string, string>> = {
	it: {
		omniboard:
			'Puoi **cambiare il piano a Claude** mentre lavora. A me nessuno chiede mai il permesso.',
		'PitWall AI':
			'Un ingegnere di pista che **vive su Kafka**. Il mio ultimo pit stop è stato un riavvio.',
		Babbol: 'Dall’inglese scolastico **al B2**. Io sono rimasto a “the pen is on the table”.',
		'profile-forge':
			'Una card animata per GitHub. C’è pure un **serpente** che si mangia la heatmap.',
		'Let It Flyppen': 'Cinque **cervelli di moscerino** che suonano i Tame Impala. Giuro, è vero.',
		'Neuro-Symbolic T2G': '**ROUGE-L da 0.137 a 0.974**. Un salto che io faccio solo se mi lanci.',
		ATLAS: 'Guida gli agenti **dal telefono**, via Telegram. Comodo anche dal divano.',
		'Render Multi-Service Manager':
			'Più servizi dentro **512 MB** gratis. Io in **512 MB** non ci sto nemmeno col cappello.',
		PDF2LaTeX: 'Tanti PDF in **un solo documento LaTeX**. Finalmente qualcuno che ama LaTeX.',
		'GRPO Strict Generation':
			'Ha insegnato a un LLM a scrivere **JSON valido**. A me nessuno ha mai insegnato niente.',
		'CVRP Solver':
			'**Algoritmi genetici** per i giri dei furgoni. Il mio percorso migliore: da qui a lì.',
		TunneLLM: 'Parli con un LLM locale attraverso un **tunnel SSH**. Riservatezza prima di tutto.',
		Translatio:
			'Traduce **libri interi** senza rompere l’impaginazione. Io a stento capisco i suoi vocali.',
		Guardian:
			'**Primo posto a Hackatania 2.0**: agenti, grafo Neo4j e targhe lette da un LLM. **In un weekend**.',
		'The Legend of Turi':
			'Un gioco alla Zelda con l’**anima siciliana**. Il protagonista ha un nome bellissimo.',
		'Warehouse Swarm Intelligence System':
			'Uno **sciame di robot** in magazzino. Nessuno ha chiesto le ferie.',
		'Image Enhancement':
			'Reti che ripuliscono le **immagini rovinate**. Peccato non funzionino sui miei pixel.',
		'Q-uper Mario': '**Q-learning** su Super Mario. Io i funghi li evito, per sicurezza.',
		'Videogame Semantic Search':
			'Domande in italiano, risposte da un’**ontologia**. SPARQL lo scrive lui, per fortuna.',
		'Neural Sudoku': 'Una rete neurale che **risolve i Sudoku**. Io mi fermo al primo 9.',
		'Little Language Model':
			'Un GPT allenato sulla **Divina Commedia**. Nel mezzo del cammin di nostro training…',
		'OmniBot V2':
			'Un RAG fatto a **grafo di pensieri**. I miei pensieri invece sono tutti cubetti.',
		'Kagi ML Dev Challenge':
			'Riordina **Hacker News** in base a cosa ti interessa. Io leggo solo i titoli.',
		VulnerabilityBot:
			'Un assistente locale per la **cybersecurity**. Mi ha detto che sono vulnerabile al solletico.',
		'Celebrity ResNet18': 'Riconosce i **volti famosi**. Me non ancora, ci sto lavorando.',
		'Sales Store Forecasting':
			'Previsioni delle vendite da una gara **Kaggle**. Io prevedo che cliccherai il prossimo.',
		'Steganography WebApp':
			'**Nasconde file dentro le immagini**. Chissà cosa c’è dentro la mia foto profilo.',
		SpazzApp:
			'**Turni delle pulizie** tra coinquilini, automatici. Il vero miracolo dell’informatica.',
		'Neuron Shell':
			'Una **shell nel browser** per controllare gli addestramenti. Comodissima alle tre di notte.',
		'Fast Query Ranker':
			'TF-IDF in C++ e in Python: il C++ vince **15 a 1**. Il Python ci è rimasto male.'
	},
	en: {
		omniboard:
			'You can **change Claude’s plan** while it works. Nobody ever asks me for permission.',
		'PitWall AI': 'A race engineer **living on Kafka**. My last pit stop was a reboot.',
		Babbol: 'From school English **to B2**. I’m still stuck at “the pen is on the table”.',
		'profile-forge': 'An animated GitHub card. There’s even a **snake** eating the heatmap.',
		'Let It Flyppen': 'Five **fruit-fly brains** playing Tame Impala. I swear it’s real.',
		'Neuro-Symbolic T2G':
			'**ROUGE-L from 0.137 to 0.974**. I only jump like that when you throw me.',
		ATLAS: 'Drive coding agents **from your phone**, over Telegram. Works from the sofa too.',
		'Render Multi-Service Manager':
			'Several services in **512 MB** for free. I wouldn’t fit in **512 MB** with my hat on.',
		PDF2LaTeX: 'Many PDFs into **one LaTeX document**. Finally someone who loves LaTeX.',
		'GRPO Strict Generation':
			'Taught an LLM to write **valid JSON**. Nobody ever taught me anything.',
		'CVRP Solver': '**Genetic algorithms** for delivery routes. My best route: from here to there.',
		TunneLLM: 'Talk to a local LLM through an **SSH tunnel**. Privacy first.',
		Translatio:
			'Translates **whole books** without breaking the layout. I can barely follow his voice notes.',
		Guardian:
			'**First place at Hackatania 2.0**: agents, a Neo4j graph and plates read by an LLM. **In a weekend**.',
		'The Legend of Turi': 'A Zelda-like game with a **Sicilian soul**. The hero has a lovely name.',
		'Warehouse Swarm Intelligence System':
			'A **robot swarm** in a warehouse. Nobody asked for holidays.',
		'Image Enhancement':
			'Networks that clean up **damaged images**. Sadly they don’t work on my pixels.',
		'Q-uper Mario': '**Q-learning** on Super Mario. I stay away from mushrooms, just in case.',
		'Videogame Semantic Search':
			'Questions in plain words, answers from an **ontology**. He writes the SPARQL, thankfully.',
		'Neural Sudoku': 'A neural net that **solves Sudoku**. I give up at the first 9.',
		'Little Language Model':
			'A GPT trained on Dante’s **Divine Comedy**. Midway upon the journey of our training…',
		'OmniBot V2': 'A RAG built as a **graph of thoughts**. My thoughts are all cubes.',
		'Kagi ML Dev Challenge': 'Re-ranks **Hacker News** by what you like. I only read the titles.',
		VulnerabilityBot: 'A local **cybersecurity** assistant. It says I’m vulnerable to tickling.',
		'Celebrity ResNet18': 'Recognises **famous faces**. Not mine yet, working on it.',
		'Sales Store Forecasting':
			'Sales forecasts from a **Kaggle** contest. I forecast you’ll click the next one.',
		'Steganography WebApp':
			'**Hides files inside images**. Who knows what’s inside my profile picture.',
		SpazzApp: 'Automatic **cleaning rotas** for flatmates. The true miracle of computing.',
		'Neuron Shell': 'A **browser shell** to watch model training. Handy at three in the morning.',
		'Fast Query Ranker': 'TF-IDF in C++ and Python: C++ wins **15 to 1**. Python took it badly.'
	}
};

export const categoryLine: Lines<(name: string, n: number) => string> = {
	it: (name, n) => `**${name}: ${n}**. **Le ho contate io**, lui si è fermato a tre.`,
	en: (name, n) => `**${name}: ${n}**. **I counted them**, he stopped at three.`
};

export const allSkillsLine: Lines<string> = {
	it: 'Tutte e **{n}** di nuovo in movimento.',
	en: 'All **{n}** of them, moving again.'
};

// While it is held: it gets angry, red and sparky
export const angryLines: Lines<string[]> = {
	it: [
		'Ehi! **Mettimi giù!**',
		'**Giù le mani** dai miei cubetti!',
		'Questo è **sequestro di bot**!',
		'Ti avverto, so dove abiti. **In localhost.**',
		'Sto per andare in **overflow**!',
		'Lasciami o ti riempio la console di errori!',
		'**Grrr.** Sto scaldando la GPU.'
	],
	en: [
		'Hey! **Put me down!**',
		'**Hands off** my cubes!',
		'This is **bot-napping**!',
		'I know where you live. **On localhost.**',
		'I’m about to **overflow**!',
		'Let go or I’ll flood your console with errors!',
		'**Grrr.** I’m heating up the GPU.'
	]
};

export const complaints: Lines<string[]> = {
	it: [
		'Ahia!',
		'Piano, sono **hardware delicato**!',
		'Ho appena perso tutti i **pesi del modello**…',
		'Ehi! Questo non era nel training set.',
		'Mi gira tutto. Anche i gradienti.',
		'**Lo dico a Giuseppe!**',
		'Sono un bot, non una **pallina antistress**.'
	],
	en: [
		'Ouch!',
		'Easy, I’m **delicate hardware**!',
		'I just lost all my **model weights**…',
		'Hey! That wasn’t in the training set.',
		'Everything’s spinning. My gradients too.',
		'**I’m telling Giuseppe!**',
		'I’m a bot, not a **stress ball**.'
	]
};

// Screamed while it flies after a throw
export const shoutLines: Lines<string[]> = {
	it: ['AAAAAAH!', 'Wiiiiiii!', 'Aiutooo!', 'Mammaaaa!', 'Nooooo!', 'Perché?!'],
	en: ['AAAAAAH!', 'Wheeeee!', 'Heeelp!', 'Mummyyy!', 'Nooooo!', 'Whyyyy?!']
};

export const backLines: Lines<string[]> = {
	it: ['Va bene, torno al mio posto.', 'Ok, facciamo finta di niente.', 'Sto bene. Credo.'],
	en: ['Fine, back to my spot.', 'Okay, let’s pretend that never happened.', 'I’m fine. I think.']
};

export const placeLines: Lines<string[]> = {
	it: ['Va bene, resto qui.', 'Bella vista da quassù.', 'Ok, questo è il mio nuovo ufficio.'],
	en: ['Fine, I’ll stay here.', 'Nice view from up here.', 'Okay, this is my new office.']
};

export const clickLines: Lines<string[]> = {
	it: [
		'**Niente solletico!**',
		'Sì? Ti serve qualcosa?',
		'Puoi anche prendermi e lanciarmi. Ma non farlo.',
		'Lo so, sono bellissimo. Puoi continuare a scorrere.',
		'Sono fatto di **quasi 800 cubetti**. Li ho contati io.',
		'Se mi **trascini piano**, resto dove mi metti.'
	],
	en: [
		'**No tickling!**',
		'Yes? Need something?',
		'You can grab me and throw me. But please don’t.',
		'I know, I’m gorgeous. You can keep scrolling.',
		'I’m made of **almost 800 cubes**. **I counted them**.',
		'**Drag me slowly** and I’ll stay where you put me.'
	]
};

// Mixed into greetings and taps while a season or the night theme is on (Turi only: they
// mention his hats)
export const seasonLines: Lines<Record<Season, string[]>> = {
	it: {
		christmas: [
			'**Buon Natale!** Il cappello me l’ha prestato **Babbo Natale** in persona.',
			'Ho chiesto a **Babbo Natale** una GPU nuova. Incrocio i cubetti.',
			'Oh oh oh! Il panettone l’ho già finito, mi dispiace.'
		],
		newyear: [
			'**Buon anno!** Un brindisi con me? Lo spumante è a 8 bit.',
			'Il mio buon proposito: meno bug, più cubetti.',
			'**Cin cin!** Attenzione, il tappo vola più lontano di me.'
		],
		summer: [
			'Che caldo… meno male che ho gli **occhiali da sole**.',
			'D’estate fluttuo più piano, per risparmiare la batteria.',
			'Io vado al mare. Tanto sono impermeabile, credo.'
		],
		night: [
			'È tardi, ho messo il **pigiama**. Ma per te resto sveglio.',
			'**Modalità notte**: tutto in bianco e nero, come i vecchi terminali.',
			'Shh… la galassia sta dormendo.'
		]
	},
	en: {
		christmas: [
			'**Merry Christmas!** **Santa** lent me this hat himself.',
			'I asked **Santa** for a new GPU. Fingers crossed. Cubes crossed.',
			'Ho ho ho! I already ate the cake, sorry.'
		],
		newyear: [
			'**Happy New Year!** A toast with me? The bubbly is 8-bit.',
			'My resolution: fewer bugs, more cubes.',
			'**Cheers!** Careful, the cork flies further than me.'
		],
		summer: [
			'So hot… good thing I brought **sunglasses**.',
			'In summer I float slower, to save battery.',
			'I’m off to the beach. I think I’m waterproof.'
		],
		night: [
			'It’s late, I’m in my **pyjamas**. But I’ll stay up for you.',
			'**Night mode**: black and white, like old terminals.',
			'Shh… the galaxy is asleep.'
		]
	}
};

export const unmuteLine: Lines<string> = {
	it: 'Eccomi. **Mi avevi zittito**, ma ti perdono.',
	en: 'I’m back. **You muted me**, but I forgive you.'
};
