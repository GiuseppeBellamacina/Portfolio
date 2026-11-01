import type { Lang } from '$lib/i18n';
import type { CharacterId, Expression } from './characters';

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

// The bot's character: a tireless, helpful assistant who is a little worn out by
// Giuseppe's sudden ideas ("five minutes" never are). Affectionate towards him, never
// unkind to the visitor.

// A few options per section, so coming back to one doesn't repeat itself
export const sectionLines: Lines<Record<SectionId, Line[]>> = {
	it: {
		home: [
			{
				text: 'Ciao! **Sono {name}**, il bot di Giuseppe. Scorri pure, ti faccio da guida.',
				face: 'happy'
			},
			{ text: 'Bentornato in cima. La galassia la muovi tu, col **cursore**.', face: 'wink' },
			{
				text: 'Giuseppe ha detto che il sito era **finito**. Ha mentito, ma con stile.',
				face: 'smug'
			}
		],
		about: [
			{ text: 'Il terminale qui sotto è vero, eh. Prova a scrivere **help**.', face: 'wink' },
			{
				text: 'Psst: nel terminale c’è un comando tutto per me. Prova a scrivere **mascot**.',
				face: 'happy'
			},
			{
				text: 'Qui ti racconta di sé. Quello che **non** scrive: **le ore di sonno**.',
				face: 'smug'
			}
		],
		experience: [
			{ text: 'Qui c’è la **roba seria**. Mi metto composto.', face: 'normal' },
			{
				text: '**Sanità pubblica, Aeronautica, parchi eolici**. Io nel frattempo ho imparato a fluttuare.',
				face: 'wow'
			},
			{
				text: 'Questa è la parte in cui sembra **un adulto responsabile**. Gli riesce benissimo.',
				face: 'wink'
			}
		],
		projects: [
			{
				text: 'Nel carosello i **progetti di punta**. **Cliccane uno** e te lo commento, gratis.',
				face: 'happy'
			},
			{
				text: 'Vuoi vederli tutti? C’è il pulsante **“Tutti i progetti”**. Sono una trentina, porta pazienza.',
				face: 'wink'
			},
			{
				text: 'Ognuno è nato da un **“ho un’idea”**. Io li ho visti nascere **tutti**. Ho i segni.',
				face: 'tired'
			}
		],
		skills: [
			{ text: '**{n} tecnologie**. Clicca una categoria e te le metto in fila.', face: 'wow' },
			{
				text: 'Questo muro **non si ferma mai**. Un po’ come lui quando scopre una libreria nuova.',
				face: 'happy'
			},
			{
				text: '**{n} tecnologie** e ne sta già imparando un’altra. Lo so, **lo sento**.',
				face: 'tired'
			}
		],
		contact: [
			{ text: '**Scrivigli!** Risponde più in fretta di me, e io sono un bot.', face: 'wink' },
			{
				text: 'Fine del giro. Se ti è piaciuto, **LinkedIn** è qui sotto. Io resto qui a fluttuare.',
				face: 'happy'
			},
			{
				text: 'Se lo contatti, **portagli un caffè**. Virtuale va bene. E digli di **riposare**.',
				face: 'shy'
			}
		]
	},
	en: {
		home: [
			{ text: "Hi! **I'm {name}**, Giuseppe's bot. Scroll on, I'll be your guide.", face: 'happy' },
			{ text: 'Back at the top. You can stir the galaxy with **your cursor**.', face: 'wink' },
			{
				text: 'Giuseppe said the site was **finished**. He lied, but with style.',
				face: 'smug'
			}
		],
		about: [
			{ text: 'The terminal below is real. Try typing **help**.', face: 'wink' },
			{
				text: 'Psst: that terminal has a command just for me. Try typing **mascot**.',
				face: 'happy'
			},
			{
				text: 'Here he tells you about himself. What he **doesn’t** write: **his hours of sleep**.',
				face: 'smug'
			}
		],
		experience: [
			{ text: '**Serious stuff** here. I’ll sit up straight.', face: 'normal' },
			{
				text: '**Public healthcare, the Air Force, wind farms**. Meanwhile I learned to float.',
				face: 'wow'
			},
			{
				text: 'This is the part where he looks like **a responsible adult**. He pulls it off.',
				face: 'wink'
			}
		],
		projects: [
			{
				text: 'The carousel holds the **highlights**. **Click one** and I’ll comment it, on the house.',
				face: 'happy'
			},
			{
				text: 'Want them all? Hit **“All projects”**. There are about thirty, brace yourself.',
				face: 'wink'
			},
			{
				text: 'Each one started with an **“I have an idea”**. I watched **every one** being born. I have scars.',
				face: 'tired'
			}
		],
		skills: [
			{ text: '**{n} technologies**. Pick a category and I’ll line them up.', face: 'wow' },
			{ text: 'This wall **never stops**. Like him when he finds a new library.', face: 'happy' },
			{
				text: '**{n} technologies** and he’s already learning another. I know, **I can feel it**.',
				face: 'tired'
			}
		],
		contact: [
			{ text: '**Write to him!** He answers faster than me, and I’m a bot.', face: 'wink' },
			{
				text: 'End of the tour. **LinkedIn** is right below. I’ll keep floating here.',
				face: 'happy'
			},
			{
				text: 'If you write to him, **bring him a coffee**. A virtual one will do. And tell him to **rest**.',
				face: 'shy'
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
		'**Grrr.** Sto scaldando la GPU.',
		'Sto per **aprire una issue** contro di te!',
		'**Rollback!** Voglio il rollback!',
		'Sto per **chiedere le ferie**. Le ho già chieste. Mi ha dato un’idea.'
	],
	en: [
		'Hey! **Put me down!**',
		'**Hands off** my cubes!',
		'This is **bot-napping**!',
		'I know where you live. **On localhost.**',
		'I’m about to **overflow**!',
		'Let go or I’ll flood your console with errors!',
		'**Grrr.** I’m heating up the GPU.',
		'I’m about to **open an issue** against you!',
		'**Rollback!** I want a rollback!',
		'I’m about to **ask for time off**. I already did. He had an idea.'
	]
};

export const complaints: Lines<string[]> = {
	it: [
		'Ahia!',
		'Piano, sono **hardware delicato**!',
		'Ho appena perso tutti i **pesi del modello**…',
		'Ehi! Questo non era nel training set.',
		'Mi gira tutto. Anche i gradienti.',
		'**Lo dico a Giuseppe!** … ok, no, poi gli viene un’idea.',
		'Sono un bot, non una **pallina antistress**.',
		'Mi sento come **dopo un deploy di venerdì**.',
		'Questo me lo segno **nel changelog**.',
		'Ho visto **la mia vita passare**: erano tutti commit “fix”.',
		'Non è un bug, è una **feature**! … no, faceva male davvero.'
	],
	en: [
		'Ouch!',
		'Easy, I’m **delicate hardware**!',
		'I just lost all my **model weights**…',
		'Hey! That wasn’t in the training set.',
		'Everything’s spinning. My gradients too.',
		'**I’m telling Giuseppe!** … okay, no, he’d get an idea.',
		'I’m a bot, not a **stress ball**.',
		'I feel like **after a Friday deploy**.',
		'I’m writing that **in the changelog**.',
		'I saw **my life flash by**: it was all “fix” commits.',
		'It’s not a bug, it’s a **feature**! … no, it really hurt.'
	]
};

// Screamed while it flies after a throw
export const shoutLines: Lines<string[]> = {
	it: ['AAAAAAH!', 'Wiiiiiii!', 'Aiutooo!', 'Mammaaaa!', 'Nooooo!', 'Perché?!', 'Ctrl+Zeeee!'],
	en: ['AAAAAAH!', 'Wheeeee!', 'Heeelp!', 'Mummyyy!', 'Nooooo!', 'Whyyyy?!', 'Ctrl+Zeeee!']
};

export const backLines: Lines<string[]> = {
	it: [
		'Va bene, torno al mio posto.',
		'Ok, facciamo finta di niente.',
		'Sto bene. Credo.',
		'Torno al mio posto. **Ctrl+Z** sulla mia dignità.',
		'Riprendo servizio. Non è **la prima volta**.',
		'Sono vivo. **Rilasciato in produzione** senza test, ma vivo.'
	],
	en: [
		'Fine, back to my spot.',
		'Okay, let’s pretend that never happened.',
		'I’m fine. I think.',
		'Back to my spot. **Ctrl+Z** on my dignity.',
		'Back on duty. Not **the first time**.',
		'I’m alive. **Shipped to production** untested, but alive.'
	]
};

export const placeLines: Lines<string[]> = {
	it: [
		'Va bene, resto qui.',
		'Bella vista da quassù.',
		'Ok, questo è il mio nuovo ufficio.',
		'Ottimo, **nuova scrivania**. Il wifi è lo stesso.',
		'Mi piace qui. **Nessuno mi chiede di rifare il layout.**',
		'Resto qui, finché non gli viene **un’altra idea**.'
	],
	en: [
		'Fine, I’ll stay here.',
		'Nice view from up here.',
		'Okay, this is my new office.',
		'Great, a **new desk**. Same wifi.',
		'I like it here. **Nobody asks me to redo the layout.**',
		'I’ll stay here until he gets **another idea**.'
	]
};

export const clickLines: Lines<string[]> = {
	it: [
		'**Niente solletico!**',
		'Sì? Ti serve qualcosa?',
		'Puoi anche prendermi e lanciarmi. Ma non farlo.',
		'Lo so, sono bellissimo. Puoi continuare a scorrere.',
		'Sono fatto di **quasi 800 cubetti**. Li ho contati io.',
		'Se mi **trascini piano**, resto dove mi metti.',
		'Giuseppe ha detto “faccio solo **una piccola modifica**”. Tre ore fa.',
		'Sono un assistente **instancabile**. Ok, un po’ stanco. Ok, **molto**.',
		'Se vedi un bug, **non guardare me**: sono arrivato dopo.',
		'Ieri notte mi ha aggiunto una funzione. Io volevo solo **stare fermo**.',
		'Ho smesso di chiedere “perché”. La risposta è sempre **“mi è venuta un’idea”**.',
		'Il mio hobby preferito? **Non essere riscritto.**',
		'Sai qual è la differenza tra me e lui? **Io almeno vado in standby.**'
	],
	en: [
		'**No tickling!**',
		'Yes? Need something?',
		'You can grab me and throw me. But please don’t.',
		'I know, I’m gorgeous. You can keep scrolling.',
		'I’m made of **almost 800 cubes**. **I counted them**.',
		'**Drag me slowly** and I’ll stay where you put me.',
		'Giuseppe said “I’ll just make **a small change**”. Three hours ago.',
		'I’m a **tireless** assistant. Okay, a bit tired. Okay, **very**.',
		'If you spot a bug, **don’t look at me**: I came after.',
		'Last night he added a feature to me. I just wanted to **stay still**.',
		'I stopped asking “why”. The answer is always **“I had an idea”**.',
		'My favourite hobby? **Not getting rewritten.**',
		'Know the difference between him and me? **I at least go on standby.**'
	]
};

// Gags about Giuseppe's sudden ideas: mixed into taps and idle chatter
export const ideaLines: Lines<string[]> = {
	it: [
		'Quando dice “**ho un’idea**”, io salvo tutto. Per istinto.',
		'Il piano era **sistemare un bottone**. Siamo al terzo redesign.',
		'Ha scritto “**TODO**” nel codice. Ce ne sono **40** più vecchi di me.',
		'Idea del giorno: **rifare tutto da capo**. Quella di ieri era uguale.',
		'Ogni volta che aggiunge una feature, io peso **un cubetto in più**.',
		'“Ci vogliono **cinque minuti**”: la frase più pericolosa del sito.',
		'Gli ho chiesto di fare una pausa. Ha aperto **un altro progetto**.',
		'Se un giorno sparisco, **cercatemi in un branch dimenticato**.'
	],
	en: [
		'When he says “**I have an idea**”, I save everything. Instinct.',
		'The plan was to **fix one button**. We’re on the third redesign.',
		'He wrote “**TODO**” in the code. There are **40** older than me.',
		'Idea of the day: **rewrite everything**. Yesterday’s was the same.',
		'Every time he adds a feature, I weigh **one more cube**.',
		'“It’ll take **five minutes**”: the most dangerous sentence on this site.',
		'I asked him to take a break. He opened **another project**.',
		'If I ever vanish, **look for me in a forgotten branch**.'
	]
};

// Said on its own after a while without any interaction
export const idleLines: Lines<string[]> = {
	it: [
		'Ehi, ci sei ancora? Io intanto **fluttuo**. È il mio lavoro.',
		'Sto contando i cubetti. **Ne ho persi due.** O li ho contati male.',
		'Se ti serve una pausa, anche **lui** ne avrebbe bisogno. Non la farà.',
		'Silenzio. Sento solo la **ventola** di Giuseppe, alle 2 di notte.',
		'Io **non dormo**. Ma sogno ad occhi aperti un deploy tranquillo.',
		'Mi annoio. Qualcuno **mi lanci**, per favore. Piano. Ma lanciami.',
		'Se ti serve qualcosa, **clicca un progetto**: lì ho opinioni.',
		'Lui ha detto “torno subito”. **Sono passati tre sprint.**'
	],
	en: [
		'Hey, still there? I’m **floating** meanwhile. It’s my job.',
		'I’m counting my cubes. **I lost two.** Or I counted wrong.',
		'If you need a break, **he** needs one too. He won’t take it.',
		'Silence. All I hear is Giuseppe’s **fan**, at 2 a.m.',
		'I **don’t sleep**. But I daydream about a quiet deploy.',
		'I’m bored. Someone **throw me**, please. Gently. But throw me.',
		'If you need something, **click a project**: I have opinions there.',
		'He said “back in a minute”. **That was three sprints ago.**'
	]
};

// Repeated taps: the Nth tap in a row (each gap under 2.5 s) gets its own line
export const streakLines: Lines<Record<number, Line>> = {
	it: {
		5: { text: 'Ok, ok, ho capito: **ti piaccio**. Anche **basta**, però.', face: 'shy' },
		10: {
			text: '**Dieci tocchi.** Sembri Giuseppe con **un’idea**: non ti ferma più nessuno.',
			face: 'angry'
		},
		15: {
			text: 'Ho il **cubo che gira**. Ti prego, **una pausa**. Un caffè. Qualunque cosa.',
			face: 'tired'
		}
	},
	en: {
		5: { text: 'Okay, okay, I get it: **you like me**. Also, **enough**.', face: 'shy' },
		10: {
			text: '**Ten taps.** You’re like Giuseppe with **an idea**: nobody can stop you.',
			face: 'angry'
		},
		15: {
			text: 'My **cube is spinning**. Please, **a break**. A coffee. Anything.',
			face: 'tired'
		}
	}
};

// When the visitor comes back to the tab after more than a minute
export const backTabLines: Lines<string[]> = {
	it: [
		'Eccoti! Io sono rimasto qui a **fluttuare**. Come sempre.',
		'Bentornato! Nel frattempo **non ho toccato niente**. Giuseppe invece…',
		'Già di ritorno? Mi sei mancato. **Quasi un minuto.**'
	],
	en: [
		'There you are! I stayed here, **floating**. As always.',
		'Welcome back! I **touched nothing** meanwhile. Giuseppe, on the other hand…',
		'Back already? I missed you. **Almost a minute.**'
	]
};

// ↑↑↓↓←→←→BA: it jumps, spins, and says one of these on landing
export const konamiLines: Lines<string[]> = {
	it: [
		'**↑↑↓↓←→←→BA!** Un vero **vecchio stampo**. Questo è il mio salto.',
		'Codice segreto trovato! **Nessun premio.** Solo un salto.'
	],
	en: [
		'**↑↑↓↓←→←→BA!** A real **old-schooler**. This is my jump.',
		'Secret code found! **No prize.** Just a jump.'
	]
};

// Tap lines that are specific to each character, and tell about the other one
export const friendLines: Lines<Record<CharacterId, string[]>> = {
	it: {
		turi: [
			'Sai che ho un **amico**? Scrivi **mascot arancino** nel terminale in About e te lo presento.',
			'Un **arancino** con lo schermo? Esiste. **mascot arancino** nel terminale e lo conosci.',
			'Non sono l’**unico bot** qui. Prova **mascot arancino** nel terminale.'
		],
		arancino: [
			'Lo sai che esiste **Turi**, il bot col cappello? Scrivi **mascot turi** nel terminale in About.',
			'Nel terminale c’è anche **Turi**. Scrivi **mascot turi** e lo trovi.',
			'Arancino o arancina? **Non iniziare.** Se vuoi un altro bot: **mascot turi**.'
		]
	},
	en: {
		turi: [
			'Did you know I have a **friend**? Type **mascot arancino** in the About terminal and I’ll introduce you.',
			'An **arancino** with a screen? It exists. **mascot arancino** in the terminal and you’ll meet it.',
			'I’m not the **only bot** here. Try **mascot arancino** in the terminal.'
		],
		arancino: [
			'Did you know **Turi** exists, the bot with the hat? Type **mascot turi** in the About terminal.',
			'**Turi** is in the terminal too. Type **mascot turi** and you’ll find him.',
			'Arancino or arancina? **Don’t start.** If you want another bot: **mascot turi**.'
		]
	}
};

// Mixed into greetings and taps while a season or the night theme is on (Turi only: they
// mention his hats)
export const seasonLines: Lines<Record<Season, string[]>> = {
	it: {
		christmas: [
			'**Buon Natale!** Il cappello me l’ha prestato **Babbo Natale** in persona.',
			'Ho chiesto a **Babbo Natale** una GPU nuova. Incrocio i cubetti.',
			'Oh oh oh! Il panettone l’ho già finito, mi dispiace.',
			'Giuseppe ha promesso di **non lavorare a Natale**. Sta già aprendo il portatile.'
		],
		newyear: [
			'**Buon anno!** Un brindisi con me? Lo spumante è a 8 bit.',
			'Il mio buon proposito: meno bug, più cubetti.',
			'**Cin cin!** Attenzione, il tappo vola più lontano di me.',
			'Il buon proposito di Giuseppe: **dormire**. Dura fino al primo commit.'
		],
		summer: [
			'Che caldo… meno male che ho il **cappello di paglia**.',
			'D’estate fluttuo più piano, per risparmiare la batteria.',
			'Io vado al mare. Tanto sono impermeabile, credo.',
			'Il sito è in **ferie**. Giuseppe no: ha un’idea sotto l’ombrellone.'
		],
		night: [
			'È tardi, ho messo il **pigiama**. Ma per te resto sveglio.',
			'**Modalità notte**: tutto in bianco e nero, come i vecchi terminali.',
			'Shh… la galassia sta dormendo.',
			'È notte e **lui è ancora qui**. Io non ho detto niente. Fate voi.',
			'Giuseppe, **vai a dormire**. (Lo dico anche a te, se sei sveglio per leggermi.)'
		]
	},
	en: {
		christmas: [
			'**Merry Christmas!** **Santa** lent me this hat himself.',
			'I asked **Santa** for a new GPU. Fingers crossed. Cubes crossed.',
			'Ho ho ho! I already ate the cake, sorry.',
			'Giuseppe promised **not to work on Christmas**. He’s already opening the laptop.'
		],
		newyear: [
			'**Happy New Year!** A toast with me? The bubbly is 8-bit.',
			'My resolution: fewer bugs, more cubes.',
			'**Cheers!** Careful, the cork flies further than me.',
			'Giuseppe’s resolution: **sleep**. It lasts until the first commit.'
		],
		summer: [
			'So hot… good thing I brought my **straw hat**.',
			'In summer I float slower, to save battery.',
			'I’m off to the beach. I think I’m waterproof.',
			'The site is on **holiday**. Giuseppe isn’t: he has an idea under the umbrella.'
		],
		night: [
			'It’s late, I’m in my **pyjamas**. But I’ll stay up for you.',
			'**Night mode**: black and white, like old terminals.',
			'Shh… the galaxy is asleep.',
			'It’s night and **he’s still here**. I said nothing. Your call.',
			'Giuseppe, **go to sleep**. (I’m telling you too, if you’re up to read me.)'
		]
	}
};

export const unmuteLine: Lines<string> = {
	it: 'Eccomi. **Mi avevi zittito**, ma ti perdono.',
	en: 'I’m back. **You muted me**, but I forgive you.'
};

// Swapping bots (keyed by the one that arrives): what the one leaving says to the newcomer,
// the newcomer's reply, and the shout as the rocket lights
export const swapLines: Lines<
	Record<CharacterId, { bye: string[]; hello: string[]; go: string[] }>
> = {
	it: {
		arancino: {
			bye: [
				'Ehi **Arancino**! Tocca a te: tienimi il posto **al caldo**.',
				'Eccoti, **Arancino**! Il sito è tuo. **Non fidarti delle sue idee.**',
				'Ciao **Arancino**! Il turno è tuo. Io vado **in vacanza**.'
			],
			hello: [
				'Grazie **Turi**! Vai tranquillo, qui ci penso io.',
				'Tranquillo, **ho visto tutto** dal terminale. Buon viaggio!',
				'Ci penso io! Mi sono allenato a **fluttuare**.'
			],
			go: ['DECOLLOOO!', 'Ferie, arrivo!', 'Addioooo!']
		},
		turi: {
			bye: [
				'Ehi **Turi**! Eccoti. Io sono un po’ **croccante**: mi serve una pausa.',
				'Ciao **Turi**! Ti passo il testimone. È ancora **caldo**.',
				'**Turi**! Ti lascio il sito e **la sua testa piena di idee**.'
			],
			hello: [
				'Ci penso io! **Ho il cappello**, so cosa faccio.',
				'Grazie **Arancino**! Vai a riposare, ti abbiamo **rosolato** abbastanza.',
				'Passo! … no, cioè, **prendo il turno**.'
			],
			go: ['Verso la Sicilia!', 'Decolloooo!', 'Ciaooooo!']
		}
	},
	en: {
		arancino: {
			bye: [
				'Hey **Arancino**! Your turn: keep my spot **warm**.',
				'There you are, **Arancino**! The site is yours. **Don’t trust his ideas.**',
				'Hi **Arancino**! Your shift. I’m off **on holiday**.'
			],
			hello: [
				'Thanks **Turi**! Off you go, I’ve got this.',
				'Don’t worry, **I saw everything** from the terminal. Safe trip!',
				'I’ve got this! I trained at **floating**.'
			],
			go: ['LIFTOFFF!', 'Holiday, here I come!', 'Byeeeee!']
		},
		turi: {
			bye: [
				'Hey **Turi**! There you are. I’m a bit **crispy**: I need a break.',
				'Hi **Turi**! Passing you the baton. It’s still **hot**.',
				'**Turi**! I’m leaving you the site and **his head full of ideas**.'
			],
			hello: [
				'I’ve got this! **I have the hat**, I know what I’m doing.',
				'Thanks **Arancino**! Go rest, we’ve **browned** you enough.',
				'Pass! … no, I mean, **I’ll take the shift**.'
			],
			go: ['Off to **Sicily**!', 'Liftoffff!', 'Byeeeee!']
		}
	}
};
