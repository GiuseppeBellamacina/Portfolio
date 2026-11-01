import type { Lang } from '$lib/i18n';
import { EXPRESSIONS, type CharacterId, type Expression } from './characters';

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

/**
 * Shuffle bag, for every choice with more than one option (lines, faces, scenes, gags):
 * each round is a fresh random order, every option comes up once per round, and a round
 * never opens with the option that closed the one before. `key` defaults to the array
 * itself; pass one when the array is rebuilt on every call.
 */
const bags = new Map<unknown, number[]>();
const lastPicked = new Map<unknown, number>();
export function pick<T>(arr: readonly T[], key: unknown = arr): T {
	let bag = bags.get(key);
	if (!bag?.length) {
		bag = arr.map((_, i) => i);
		for (let i = bag.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[bag[i], bag[j]] = [bag[j], bag[i]];
		}
		// bag.pop() takes from the end: swap the last one out if it just came up
		if (bag.length > 1 && bag[bag.length - 1] === lastPicked.get(key))
			[bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
		bags.set(key, bag);
	}
	const i = bag.pop()!;
	lastPicked.set(key, i);
	return arr[i];
}

/**
 * Most lines are plain strings that carry their own face as a prefix: 'tired|text', or a few
 * to draw from, 'wink,smug|text'. Without a prefix the caller's default face is used.
 */
export function parseLine(raw: string, fallback: Expression = 'normal'): Line {
	const m = raw.match(/^([a-z]+(?:,[a-z]+)*)\|([\s\S]*)$/);
	if (m) {
		const faces = m[1].split(',');
		if (faces.every((f) => f in EXPRESSIONS))
			return { text: m[2], face: pick(faces, m[1]) as Expression };
	}
	return { text: raw, face: fallback };
}

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
				text: 'Nel carosello i **{h} progetti di punta**, in tutto ne ho **{p}**. **Cliccane uno** e te lo commento, gratis.',
				face: 'happy'
			},
			{
				text: 'Vuoi vederli tutti **{p}**? C’è il pulsante **“Tutti i progetti”**. Porta pazienza.',
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
				text: 'Passa il mouse su un’icona: se ti **fidi**, **clicca**. Se non sai cos’è, **fa lo stesso**.',
				face: 'wink'
			},
			{
				text: 'Le ha imparate **quasi tutte per un progetto**. Il progetto è **finito**. Le tecnologie, **no**.',
				face: 'smug'
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
				text: 'The carousel holds the **{h} highlights**, there are **{p}** in all. **Click one** and I’ll comment it, on the house.',
				face: 'happy'
			},
			{
				text: 'Want all **{p}** of them? Hit **“All projects”**. Brace yourself.',
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
				text: 'Hover an icon: if you **trust** it, **click**. If you don’t know what it is, **click anyway**.',
				face: 'wink'
			},
			{
				text: 'He learned **most of them for one project**. The project is **done**. The technologies, **not**.',
				face: 'smug'
			},
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

// The experience cards, in the order of the timeline: it comments each one as you scroll past
export const experienceLines: Lines<string[][]> = {
	it: [
		[
			'tired|La **magistrale** in ML e AI, **mentre lavora**. Dormire? **Domanda sbagliata.**',
			'star|**Studia ancora**: ogni corso nuovo diventa **un’idea per il sito**. Lo so, **lo so**.'
		],
		[
			'smug|Qui **agenti, RAG e grafi**: roba da gente seria. Io faccio **la mascotte**.',
			'wink|Sistemi **production-ready**, dice. Il mio ultimo deploy è stato **un refresh**.'
		],
		[
			'think|Due anni tra **turbine eoliche** e **anomalie**. Io, tra le anomalie, **mi sento a casa**.',
			'smug|Prevedere i guasti delle turbine **gli riesce**. Prevedere i suoi weekend, **no**.'
		],
		[
			'wink|La **triennale** a Catania: dove ha scoperto che **il codice si rompe in modi creativi**.',
			'shy|Informatica a **Catania**. Qui ha iniziato a dire **“ho un’idea”**. Non ha più smesso.'
		],
		[
			'love|Il **liceo**! Prima dei commit, **prima dei bot**. Prima di **me**. Che tempi.',
			'star|**Archimede**: “Eureka!”. È lo stesso grido che fa lui **alle 3 di notte**.'
		]
	],
	en: [
		[
			'tired|The **master’s** in ML and AI, **while working**. Sleep? **Wrong question.**',
			'star|**He’s still studying**: every new course becomes **an idea for the site**. I know, **I know**.'
		],
		[
			'smug|Here, **agents, RAG and graphs**: serious stuff. I’m **the mascot**.',
			'wink|**Production-ready** systems, he says. My last deploy was **a refresh**.'
		],
		[
			'think|Two years among **wind turbines** and **anomalies**. Among anomalies, **I feel at home**.',
			'smug|Predicting turbine failures, **he manages**. Predicting his own weekends, **no**.'
		],
		[
			'wink|The **bachelor’s** in Catania: where he found out **code breaks in creative ways**.',
			'shy|Computer science in **Catania**. This is where he started saying **“I have an idea”**. He never stopped.'
		],
		[
			'love|**High school**! Before commits, **before bots**. Before **me**. What times.',
			'star|**Archimede**: “Eureka!”. The same cry he makes **at 3 a.m.**'
		]
	]
};

// One line per project, keyed by title; used by the carousel and when a project is opened
export const projectLines: Lines<Record<string, string>> = {
	it: {
		omniboard:
			'smug|Puoi **cambiare il piano a Claude** mentre lavora. A me nessuno chiede mai il permesso.',
		'PitWall AI':
			'wink|Un ingegnere di pista che **vive su Kafka**. Il mio ultimo pit stop è stato un riavvio.',
		Babbol: 'shy|Dall’inglese scolastico **al B2**. Io sono rimasto a “the pen is on the table”.',
		'profile-forge':
			'wow|Una card animata per GitHub. C’è pure un **serpente** che si mangia la heatmap.',
		'Let It Flyppen':
			'wow|Cinque **cervelli di moscerino** che suonano i Tame Impala. Giuro, è vero.',
		'Neuro-Symbolic T2G':
			'star|**ROUGE-L da 0.137 a 0.974**. Un salto che io faccio solo se mi lanci.',
		ATLAS: 'happy|Guida gli agenti **dal telefono**, via Telegram. Comodo anche dal divano.',
		'Render Multi-Service Manager':
			'worried|Più servizi dentro **512 MB** gratis. Io in **512 MB** non ci sto nemmeno col cappello.',
		PDF2LaTeX: 'love|Tanti PDF in **un solo documento LaTeX**. Finalmente qualcuno che ama LaTeX.',
		'GRPO Strict Generation':
			'sad|Ha insegnato a un LLM a scrivere **JSON valido**. A me nessuno ha mai insegnato niente.',
		'CVRP Solver':
			'think|**Algoritmi genetici** per i giri dei furgoni. Il mio percorso migliore: da qui a lì.',
		TunneLLM:
			'smug|Parli con un LLM locale attraverso un **tunnel SSH**. Riservatezza prima di tutto.',
		Translatio:
			'shy|Traduce **libri interi** senza rompere l’impaginazione. Io a stento capisco i suoi vocali.',
		Guardian:
			'star|**Primo posto a Hackatania 2.0**: agenti, grafo Neo4j e targhe lette da un LLM. **In un weekend**.',
		'The Legend of Turi':
			'love|Un gioco alla Zelda con l’**anima siciliana**. Il protagonista ha un nome bellissimo.',
		'Warehouse Swarm Intelligence System':
			'wink|Uno **sciame di robot** in magazzino. Nessuno ha chiesto le ferie.',
		'Image Enhancement':
			'sad|Reti che ripuliscono le **immagini rovinate**. Peccato non funzionino sui miei pixel.',
		'Q-uper Mario': 'worried|**Q-learning** su Super Mario. Io i funghi li evito, per sicurezza.',
		'Videogame Semantic Search':
			'think|Domande in italiano, risposte da un’**ontologia**. SPARQL lo scrive lui, per fortuna.',
		'Neural Sudoku': 'smug|Una rete neurale che **risolve i Sudoku**. Io mi fermo al primo 9.',
		'Little Language Model':
			'think|Un GPT allenato sulla **Divina Commedia**. Nel mezzo del cammin di nostro training…',
		'OmniBot V2':
			'happy|Un RAG fatto a **grafo di pensieri**. I miei pensieri invece sono tutti cubetti.',
		'Kagi ML Dev Challenge':
			'wink|Riordina **Hacker News** in base a cosa ti interessa. Io leggo solo i titoli.',
		VulnerabilityBot:
			'worried|Un assistente locale per la **cybersecurity**. Mi ha detto che sono vulnerabile al solletico.',
		'Celebrity ResNet18': 'shy|Riconosce i **volti famosi**. Me non ancora, ci sto lavorando.',
		'Sales Store Forecasting':
			'smug|Previsioni delle vendite da una gara **Kaggle**. Io prevedo che cliccherai il prossimo.',
		'Steganography WebApp':
			'think|**Nasconde file dentro le immagini**. Chissà cosa c’è dentro la mia foto profilo.',
		SpazzApp:
			'happy|**Turni delle pulizie** tra coinquilini, automatici. Il vero miracolo dell’informatica.',
		'Neuron Shell':
			'tired|Una **shell nel browser** per controllare gli addestramenti. Comodissima alle tre di notte.',
		'Fast Query Ranker':
			'smug|TF-IDF in C++ e in Python: il C++ vince **15 a 1**. Il Python ci è rimasto male.'
	},
	en: {
		omniboard:
			'smug|You can **change Claude’s plan** while it works. Nobody ever asks me for permission.',
		'PitWall AI': 'wink|A race engineer **living on Kafka**. My last pit stop was a reboot.',
		Babbol: 'shy|From school English **to B2**. I’m still stuck at “the pen is on the table”.',
		'profile-forge': 'wow|An animated GitHub card. There’s even a **snake** eating the heatmap.',
		'Let It Flyppen': 'wow|Five **fruit-fly brains** playing Tame Impala. I swear it’s real.',
		'Neuro-Symbolic T2G':
			'star|**ROUGE-L from 0.137 to 0.974**. I only jump like that when you throw me.',
		ATLAS: 'happy|Drive coding agents **from your phone**, over Telegram. Works from the sofa too.',
		'Render Multi-Service Manager':
			'worried|Several services in **512 MB** for free. I wouldn’t fit in **512 MB** with my hat on.',
		PDF2LaTeX: 'love|Many PDFs into **one LaTeX document**. Finally someone who loves LaTeX.',
		'GRPO Strict Generation':
			'sad|Taught an LLM to write **valid JSON**. Nobody ever taught me anything.',
		'CVRP Solver':
			'think|**Genetic algorithms** for delivery routes. My best route: from here to there.',
		TunneLLM: 'smug|Talk to a local LLM through an **SSH tunnel**. Privacy first.',
		Translatio:
			'shy|Translates **whole books** without breaking the layout. I can barely follow his voice notes.',
		Guardian:
			'star|**First place at Hackatania 2.0**: agents, a Neo4j graph and plates read by an LLM. **In a weekend**.',
		'The Legend of Turi':
			'love|A Zelda-like game with a **Sicilian soul**. The hero has a lovely name.',
		'Warehouse Swarm Intelligence System':
			'wink|A **robot swarm** in a warehouse. Nobody asked for holidays.',
		'Image Enhancement':
			'sad|Networks that clean up **damaged images**. Sadly they don’t work on my pixels.',
		'Q-uper Mario':
			'worried|**Q-learning** on Super Mario. I stay away from mushrooms, just in case.',
		'Videogame Semantic Search':
			'think|Questions in plain words, answers from an **ontology**. He writes the SPARQL, thankfully.',
		'Neural Sudoku': 'smug|A neural net that **solves Sudoku**. I give up at the first 9.',
		'Little Language Model':
			'think|A GPT trained on Dante’s **Divine Comedy**. Midway upon the journey of our training…',
		'OmniBot V2': 'happy|A RAG built as a **graph of thoughts**. My thoughts are all cubes.',
		'Kagi ML Dev Challenge':
			'wink|Re-ranks **Hacker News** by what you like. I only read the titles.',
		VulnerabilityBot:
			'worried|A local **cybersecurity** assistant. It says I’m vulnerable to tickling.',
		'Celebrity ResNet18': 'shy|Recognises **famous faces**. Not mine yet, working on it.',
		'Sales Store Forecasting':
			'smug|Sales forecasts from a **Kaggle** contest. I forecast you’ll click the next one.',
		'Steganography WebApp':
			'think|**Hides files inside images**. Who knows what’s inside my profile picture.',
		SpazzApp: 'happy|Automatic **cleaning rotas** for flatmates. The true miracle of computing.',
		'Neuron Shell':
			'tired|A **browser shell** to watch model training. Handy at three in the morning.',
		'Fast Query Ranker':
			'smug|TF-IDF in C++ and Python: C++ wins **15 to 1**. Python took it badly.'
	}
};

// Fallback for a category without lines of its own
export const categoryLine: Lines<(name: string, n: number) => string> = {
	it: (name, n) => `**${name}**: **${n}** tecnologie. Le ho contate io.`,
	en: (name, n) => `**${name}**: **${n}** technologies. I counted them.`
};

// What it says about each skills category; {c} is the number of tools in it
export const categoryLines: Lines<Record<string, string[]>> = {
	it: {
		skills_languages: [
			'smug|**{c} linguaggi**, compresi **Markdown, JSON e YAML**. Per lui contano tutti. Io non discuto.',
			'tired|Da **C** a **Rust**, **{c} linguaggi**. Ogni volta che ne impara uno, **riscrive il resto**.',
			'tired|Ha detto “**Python per tutto**”. Poi ha aperto un progetto in **Rust**. Totale: **{c}**.'
		],
		skills_ml: [
			'wink|**{c} librerie** per far imparare le macchine. Lui impara più **piano**.',
			'worried|**PyTorch**, **TRL**, **Unsloth**, **vLLM**… **{c}** in tutto. La sua **GPU** ha chiesto un sindacato.',
			'tired|**Weights & Biases** conta ogni suo **esperimento**. Io conto solo le sue **notti insonni**.'
		],
		skills_llm: [
			'smug|**{c} strumenti** per parlare con i modelli. Io sono quello che **risponde per ultimo**.',
			'sad|Agenti, **LangGraph**, **MCP**, **Claude**: **{c}** strumenti. Ci passa più tempo che con **me**.',
			'think|Ha dato un compito a un agente. Poi **un altro compito a un altro agente**. Io intanto **osservo**.'
		],
		skills_datascience: [
			'sad|**{c} strumenti** per far parlare i numeri. A lui rispondono. A me **solo i cubetti**.',
			'smug|**NumPy**, **Pandas**, **Polars**… dice che **Pandas è lento**. Poi lo riusa. Totale: **{c}**.',
			'wink|Grafici con **Matplotlib**, **Seaborn**, **Plotly**: ne fa **uno nuovo a ogni idea**.'
		],
		skills_web: [
			'happy|**{c} strumenti** web. Lo **Svelte** di questo sito lo conosco bene: **abito qui**.',
			'wink|Da **React** a **Svelte**: **{c}**. Ogni volta è “l’ultimo framework **che imparo**”.',
			'star|**Three.js**: gli devo la mia **esistenza** in 3D. **{c}** strumenti, e un bot di cubetti.'
		],
		skills_databases: [
			'think|**{c} database**. Io, invece, li ho tutti a **memoria breve**.',
			'wow|Da **SQLite** a **Neo4j**: **{c}**. Il grafo gli è piaciuto tanto che **ora vede grafi ovunque**.',
			'tired|**Redis** ricorda tutto per **pochi secondi**. Come me, dopo **un’idea di Giuseppe**.'
		],
		skills_retrieval: [
			'think|**{c} database vettoriali**. Trovano quello che **significa**, non quello che scrivi. Io trovo solo **i miei cubetti**.',
			'think|**Chroma**, **Qdrant**, **Pinecone**… **{c}**. Cercano per **somiglianza**: io cerco ancora **le chiavi**.',
			'sad|Ricerca vettoriale: **{c} strumenti**, nessuno per ritrovare **le ore di sonno**.'
		],
		skills_dataeng: [
			'wow|**{c} strumenti** per far scorrere i dati. Come **Kafka**: **non si ferma mai**. Nemmeno lui.',
			'smug|**Kafka**, **Spark**, **n8n**: **{c}** in tutto. Pochi, ma lavorano **per cinquanta**.',
			'tired|Pipeline: **{c} strumenti**. Quando una si rompe, io mi sposto piano **verso un’altra sezione**.'
		],
		skills_devops: [
			'worried|**{c} strumenti** per portare tutto **in produzione**. Il venerdì **no**. Lui lo fa **lo stesso**.',
			'smug|**Docker**, **Kubernetes**, **GitHub Actions**: **{c}**. “Sulla mia macchina funziona” **non vale più**.',
			'sad|Tra **Vercel**, **Render** e **Railway**, i suoi progetti hanno **più case di me**.'
		],
		skills_devtooling: [
			'smug|**{c} strumenti** per scrivere codice **meno sbagliato**. **Ruff** lo rimprovera, **Pytest** lo smaschera.',
			'worried|**uv**, **Poetry**, **Pyright**: **{c}**. Il suo **linter** mi guarda male da quando sono arrivato.',
			'wink|**Playwright** apre un browser al posto suo. Io **non ho nemmeno un browser**: ho **cubetti**.'
		],
		skills_ides: [
			'wink|**{c} editor e ambienti**. Passa dall’uno all’altro **a seconda dell’idea**.',
			'star|Da **VSCode** a **Blender**: **{c}**. Con **Blender** mi farei **un corpo più snello**.',
			'sleepy|**Jupyter**, **Colab**, **Unity**… **{c}** posti dove **scomparire per ore**.'
		],
		skills_os: [
			'worried|**{c} strumenti** tra sistemi e sicurezza: **Kali**, **Nmap**, **Wireshark**. Io controllo solo **che non mi lanci**.',
			'smug|**Windows** e **Linux**, **{c}** in tutto. Ha **WSL** per non dover scegliere.',
			'think|**Burp Suite**, **Nmap**: se lo vedi **scrutare la rete di notte**, non è cattivo, è **curioso**.'
		]
	},
	en: {
		skills_languages: [
			'smug|**{c} languages**, **Markdown, JSON and YAML** included. To him they all count. I won’t argue.',
			'tired|From **C** to **Rust**, **{c} languages**. Each time he learns one, he **rewrites the rest**.',
			'tired|He said “**Python for everything**”. Then he started a **Rust** project. Total: **{c}**.'
		],
		skills_ml: [
			'wink|**{c} libraries** to make machines learn. He learns more **slowly**.',
			'worried|**PyTorch**, **TRL**, **Unsloth**, **vLLM**… **{c}** in all. His **GPU** asked for a union.',
			'tired|**Weights & Biases** counts his every **experiment**. I only count his **sleepless nights**.'
		],
		skills_llm: [
			'smug|**{c} tools** to talk to models. I’m the one who **answers last**.',
			'sad|Agents, **LangGraph**, **MCP**, **Claude**: **{c}** tools. He spends more time with them than with **me**.',
			'think|He gave a task to an agent. Then **another task to another agent**. I just **watch**.'
		],
		skills_datascience: [
			'sad|**{c} tools** to make numbers talk. They answer him. Me, **only the cubes**.',
			'smug|**NumPy**, **Pandas**, **Polars**… he says **Pandas is slow**. Then he reuses it. Total: **{c}**.',
			'wink|Charts with **Matplotlib**, **Seaborn**, **Plotly**: **a new one for every idea**.'
		],
		skills_web: [
			'happy|**{c} web tools**. The **Svelte** behind this site I know well: **I live here**.',
			'wink|From **React** to **Svelte**: **{c}**. Every time it’s “the last framework **I’ll learn**”.',
			'star|**Three.js**: I owe it my 3D **existence**. **{c}** tools, and a bot made of cubes.'
		],
		skills_databases: [
			'think|**{c} databases**. Me, I keep everything in **short-term memory**.',
			'wow|From **SQLite** to **Neo4j**: **{c}**. He liked the graph so much he **now sees graphs everywhere**.',
			'tired|**Redis** remembers everything for **a few seconds**. Like me, after **one of Giuseppe’s ideas**.'
		],
		skills_retrieval: [
			'think|**{c} vector databases**. They find what things **mean**, not what you type. I only find **my cubes**.',
			'think|**Chroma**, **Qdrant**, **Pinecone**… **{c}**. They search by **similarity**: I’m still searching for **my keys**.',
			'sad|Vector search: **{c} tools**, none to retrieve **lost hours of sleep**.'
		],
		skills_dataeng: [
			'wow|**{c} tools** to keep data flowing. Like **Kafka**: **never stops**. Neither does he.',
			'smug|**Kafka**, **Spark**, **n8n**: **{c}** in all. Few, but they work **for fifty**.',
			'tired|Pipelines: **{c} tools**. When one breaks, I slowly drift **to another section**.'
		],
		skills_devops: [
			'worried|**{c} tools** to ship everything **to production**. Not on Fridays. He does it **anyway**.',
			'smug|**Docker**, **Kubernetes**, **GitHub Actions**: **{c}**. “Works on my machine” **no longer counts**.',
			'sad|Between **Vercel**, **Render** and **Railway**, his projects have **more homes than I do**.'
		],
		skills_devtooling: [
			'smug|**{c} tools** to write **less wrong** code. **Ruff** scolds him, **Pytest** exposes him.',
			'worried|**uv**, **Poetry**, **Pyright**: **{c}**. His **linter** has been glaring at me since I arrived.',
			'wink|**Playwright** opens a browser for him. I don’t even **have a browser**: I have **cubes**.'
		],
		skills_ides: [
			'wink|**{c} editors and environments**. He hops between them **depending on the idea**.',
			'star|From **VSCode** to **Blender**: **{c}**. With **Blender** I’d model **a slimmer body**.',
			'sleepy|**Jupyter**, **Colab**, **Unity**… **{c}** places to **vanish for hours**.'
		],
		skills_os: [
			'worried|**{c} tools** across systems and security: **Kali**, **Nmap**, **Wireshark**. I just check **he doesn’t throw me**.',
			'smug|**Windows** and **Linux**, **{c}** in all. He has **WSL** so he doesn’t have to choose.',
			'think|**Burp Suite**, **Nmap**: if you see him **scanning the network at night**, he’s not evil, just **curious**.'
		]
	}
};

export const allSkillsLine: Lines<string[]> = {
	it: [
		'star|Tutte e **{n}** di nuovo in movimento.',
		'wink|Muro intero: **{n}** tecnologie in fila. **Nessuna in pausa**, come lui.',
		'worried|Ecco **{n}** tecnologie tutte insieme. Una **riunione di team** da incubo.'
	],
	en: [
		'star|All **{n}** of them, moving again.',
		'wink|The whole wall: **{n}** technologies in a row. **None on pause**, like him.',
		'worried|There are **{n}** technologies all together. A **team meeting** from hell.'
	]
};

// While it is held: it gets angry, red and sparky
export const angryLines: Lines<string[]> = {
	it: [
		'angry|Ehi! **Mettimi giù!**',
		'angry|**Giù le mani** dai miei cubetti!',
		'angry|Questo è **sequestro di bot**!',
		'angry|Ti avverto, so dove abiti. **In localhost.**',
		'angry|Sto per andare in **overflow**!',
		'angry|Lasciami o ti riempio la console di errori!',
		'angry|**Grrr.** Sto scaldando la GPU.',
		'angry|Sto per **aprire una issue** contro di te!',
		'angry|**Rollback!** Voglio il rollback!',
		'angry|Sto per **chiedere le ferie**. Le ho già chieste. Mi ha dato un’idea.'
	],
	en: [
		'angry|Hey! **Put me down!**',
		'angry|**Hands off** my cubes!',
		'angry|This is **bot-napping**!',
		'angry|I know where you live. **On localhost.**',
		'angry|I’m about to **overflow**!',
		'angry|Let go or I’ll flood your console with errors!',
		'angry|**Grrr.** I’m heating up the GPU.',
		'angry|I’m about to **open an issue** against you!',
		'angry|**Rollback!** I want a rollback!',
		'angry|I’m about to **ask for time off**. I already did. He had an idea.'
	]
};

export const complaints: Lines<string[]> = {
	it: [
		'sad|Ahia!',
		'worried|Piano, sono **hardware delicato**!',
		'tear|Ho appena perso tutti i **pesi del modello**…',
		'wow|Ehi! Questo non era nel training set.',
		'dizzy|Mi gira tutto. Anche i gradienti.',
		'worried|**Lo dico a Giuseppe!** … ok, no, poi gli viene un’idea.',
		'angry|Sono un bot, non una **pallina antistress**.',
		'tired|Mi sento come **dopo un deploy di venerdì**.',
		'angry|Questo me lo segno **nel changelog**.',
		'dizzy|Ho visto **la mia vita passare**: erano tutti commit “fix”.',
		'tear|Non è un bug, è una **feature**! … no, faceva male davvero.'
	],
	en: [
		'sad|Ouch!',
		'worried|Easy, I’m **delicate hardware**!',
		'tear|I just lost all my **model weights**…',
		'wow|Hey! That wasn’t in the training set.',
		'dizzy|Everything’s spinning. My gradients too.',
		'worried|**I’m telling Giuseppe!** … okay, no, he’d get an idea.',
		'angry|I’m a bot, not a **stress ball**.',
		'tired|I feel like **after a Friday deploy**.',
		'angry|I’m writing that **in the changelog**.',
		'dizzy|I saw **my life flash by**: it was all “fix” commits.',
		'tear|It’s not a bug, it’s a **feature**! … no, it really hurt.'
	]
};

// Screamed while it flies after a throw
export const shoutLines: Lines<string[]> = {
	it: ['AAAAAAH!', 'Wiiiiiii!', 'Aiutooo!', 'Mammaaaa!', 'Nooooo!', 'Perché?!', 'Ctrl+Zeeee!'],
	en: ['AAAAAAH!', 'Wheeeee!', 'Heeelp!', 'Mummyyy!', 'Nooooo!', 'Whyyyy?!', 'Ctrl+Zeeee!']
};

export const backLines: Lines<string[]> = {
	it: [
		'normal|Va bene, torno al mio posto.',
		'shy|Ok, facciamo finta di niente.',
		'dizzy|Sto bene. Credo.',
		'sad|Torno al mio posto. **Ctrl+Z** sulla mia dignità.',
		'tired|Riprendo servizio. Non è **la prima volta**.',
		'worried|Sono vivo. **Rilasciato in produzione** senza test, ma vivo.'
	],
	en: [
		'normal|Fine, back to my spot.',
		'shy|Okay, let’s pretend that never happened.',
		'dizzy|I’m fine. I think.',
		'sad|Back to my spot. **Ctrl+Z** on my dignity.',
		'tired|Back on duty. Not **the first time**.',
		'worried|I’m alive. **Shipped to production** untested, but alive.'
	]
};

export const placeLines: Lines<string[]> = {
	it: [
		'happy|Va bene, resto qui.',
		'star|Bella vista da quassù.',
		'smug|Ok, questo è il mio nuovo ufficio.',
		'smug|Ottimo, **nuova scrivania**. Il wifi è lo stesso.',
		'happy|Mi piace qui. **Nessuno mi chiede di rifare il layout.**',
		'tired|Resto qui, finché non gli viene **un’altra idea**.'
	],
	en: [
		'happy|Fine, I’ll stay here.',
		'star|Nice view from up here.',
		'smug|Okay, this is my new office.',
		'smug|Great, a **new desk**. Same wifi.',
		'happy|I like it here. **Nobody asks me to redo the layout.**',
		'tired|I’ll stay here until he gets **another idea**.'
	]
};

export const clickLines: Lines<string[]> = {
	it: [
		'wink|**Niente solletico!**',
		'happy|Sì? Ti serve qualcosa?',
		'worried|Puoi anche prendermi e lanciarmi. Ma non farlo.',
		'smug|Lo so, sono bellissimo. Puoi continuare a scorrere.',
		'star|Sono fatto di **quasi 800 cubetti**. Li ho contati io.',
		'happy|Se mi **trascini piano**, resto dove mi metti.',
		'tired|Giuseppe ha detto “faccio solo **una piccola modifica**”. Tre ore fa.',
		'tired|Sono un assistente **instancabile**. Ok, un po’ stanco. Ok, **molto**.',
		'wink|Se vedi un bug, **non guardare me**: sono arrivato dopo.',
		'tired|Ieri notte mi ha aggiunto una funzione. Io volevo solo **stare fermo**.',
		'tired|Ho smesso di chiedere “perché”. La risposta è sempre **“mi è venuta un’idea”**.',
		'smug|Il mio hobby preferito? **Non essere riscritto.**',
		'tired|Sai qual è la differenza tra me e lui? **Io almeno vado in standby.**',
		'love|Mi hai toccato col **dito giusto**. Resta lì, **mi piace**.',
		'happy|Ehi, **ciao**! Sapevo che prima o poi mi avresti **cliccato**.',
		'shy|Mi fai **arrossire**. Se avessi una faccia con la pelle.',
		'think|Mi chiedo se **un bot possa avere le vertigini**. Risposta: **sì**.',
		'wink|Dicono che **urlo bene**. Prova a lanciarmi… ma **piano**!',
		'tired|Giuseppe ha detto “**solo un ultimo deploy**”. Lo scrivo qui così lo ricordo: **era mezzanotte**.',
		'sad|Sai cosa fa un bot quando nessuno lo tocca? **Fluttua.** E pensa a cosa gli farà fare Giuseppe **domani**.',
		'smug|Il **trucco** per essere un bot felice? **Non leggere i commenti nel codice**.',
		'star|Ho **diciotto espressioni**. Giuseppe, davanti a una review, **ne ha una sola**.'
	],
	en: [
		'wink|**No tickling!**',
		'happy|Yes? Need something?',
		'worried|You can grab me and throw me. But please don’t.',
		'smug|I know, I’m gorgeous. You can keep scrolling.',
		'star|I’m made of **almost 800 cubes**. **I counted them**.',
		'happy|**Drag me slowly** and I’ll stay where you put me.',
		'tired|Giuseppe said “I’ll just make **a small change**”. Three hours ago.',
		'tired|I’m a **tireless** assistant. Okay, a bit tired. Okay, **very**.',
		'wink|If you spot a bug, **don’t look at me**: I came after.',
		'tired|Last night he added a feature to me. I just wanted to **stay still**.',
		'tired|I stopped asking “why”. The answer is always **“I had an idea”**.',
		'smug|My favourite hobby? **Not getting rewritten.**',
		'tired|Know the difference between him and me? **I at least go on standby.**',
		'love|You touched me with **just the right finger**. Stay there, **I like it**.',
		'happy|Hey, **hi**! I knew you’d **click me** sooner or later.',
		'shy|You’re making me **blush**. If I had a face with skin.',
		'think|I wonder if **a bot can get vertigo**. Answer: **yes**.',
		'wink|They say **I scream well**. Try throwing me… but **gently**!',
		'tired|Giuseppe said “**just one last deploy**”. I’m writing it down so I remember: **it was midnight**.',
		'sad|Know what a bot does when nobody touches it? **Floats.** And wonders what Giuseppe will make it do **tomorrow**.',
		'smug|The **trick** to being a happy bot? **Don’t read the comments in the code**.',
		'star|I have **eighteen expressions**. Giuseppe, facing a code review, has **one**.'
	]
};

// Back to top, close to the hero: a calm little lift
export const elevatorLines: Lines<string[]> = {
	it: [
		'happy|Prendiamo l’**ascensore**: si sale! Piano **zero**, hero e saluti.',
		'wink|**Ascensore** in arrivo. La musichetta me la fischietto io.',
		'happy|Su, su, su: **ascensore**! Prossima fermata, **la cima**.',
		'smug|Ding! **Ascensore** per la hero. Allacciate le cinture, anche se non servono.'
	],
	en: [
		'happy|Taking the **elevator**: going up! Floor **zero**, hero and goodbyes.',
		'wink|**Elevator** arriving. I’ll whistle the music myself.',
		'happy|Up, up, up: **elevator**! Next stop, **the top**.',
		'smug|Ding! **Elevator** to the hero. Fasten your seatbelts, though you don’t need them.'
	]
};

// Back to top from far down: the rocket ride
export const rideShouts: Lines<string[]> = {
	it: ['AAAAAH!', 'DECOLLOOO!', 'SI SALEEE!', 'REGGETEVIII!', 'VAAAAI!'],
	en: ['AAAAAH!', 'LIFTOFFFF!', 'GOING UUUP!', 'HOLD ONNNN!', 'GOOOO!']
};

export const rideEndLines: Lines<string[]> = {
	it: [
		'dizzy|Atterrato. **Mai più** un razzo senza **cinture**.',
		'star|Siamo in cima! Ho il **cuore a 8 bit** che batte forte.',
		'smug|Hero! Ci ho messo **meno di lui** a ricordarsi la password.'
	],
	en: [
		'dizzy|Landed. **Never again** a rocket without **seatbelts**.',
		'star|We’re at the top! My **8-bit heart** is pounding.',
		'smug|Hero! It took me **less time than him** to remember the password.'
	]
};

// The visitor switches between the carousel and the grid of every project
export const projectsViewLines: Lines<Record<'grid' | 'carousel', string[]>> = {
	it: {
		grid: [
			'wow|Ecco tutti e **{p}**. I più grandi sono i **{h} di punta**.',
			'tired|Il mosaico: **{p} progetti**. Nessuno è nato da un piano, tutti da **“ho un’idea”**.',
			'dizzy|**{p} progetti** in una pagina. Ho le vertigini. Anche lui, quando li conta.'
		],
		carousel: [
			'happy|Di nuovo in **carosello**: i **{h} di punta**, uno alla volta.',
			'smug|Via il mosaico, tornano i **{h} migliori**. Più riposante, no?'
		]
	},
	en: {
		grid: [
			'wow|Here are all **{p}**. The biggest ones are the **{h} highlights**.',
			'tired|The grid: **{p} projects**. None came from a plan, all from **“I have an idea”**.',
			'dizzy|**{p} projects** on one page. I’m dizzy. So is he, when he counts them.'
		],
		carousel: [
			'happy|Back to the **carousel**: the **{h} highlights**, one at a time.',
			'smug|Grid gone, the **{h} best** are back. More restful, right?'
		]
	}
};

// Gags about Giuseppe's sudden ideas: mixed into taps and idle chatter
export const ideaLines: Lines<string[]> = {
	it: [
		'worried|Quando dice “**ho un’idea**”, io salvo tutto. Per istinto.',
		'tired|Il piano era **sistemare un bottone**. Siamo al terzo redesign.',
		'tired|Ha scritto “**TODO**” nel codice. Ce ne sono **40** più vecchi di me.',
		'tired|Idea del giorno: **rifare tutto da capo**. Quella di ieri era uguale.',
		'sad|Ogni volta che aggiunge una feature, io peso **un cubetto in più**.',
		'worried|“Ci vogliono **cinque minuti**”: la frase più pericolosa del sito.',
		'tired|Gli ho chiesto di fare una pausa. Ha aperto **un altro progetto**.',
		'sad|Se un giorno sparisco, **cercatemi in un branch dimenticato**.',
		'tired|Ha detto “**stasera stacco presto**”. Ho segnato l’ora sul mio diario di bordo: **mai**.',
		'worried|Gli è venuta **un’idea** mentre mi spiegava **un’altra idea**. Io sono **la terza**.',
		'sad|La sua lista delle idee **cresce più in fretta** di quella dei progetti finiti. Lo dico con **affetto**.',
		'smug|Ogni volta che dice “**questa volta faccio le cose bene**”, io **apro una scommessa**.'
	],
	en: [
		'worried|When he says “**I have an idea**”, I save everything. Instinct.',
		'tired|The plan was to **fix one button**. We’re on the third redesign.',
		'tired|He wrote “**TODO**” in the code. There are **40** older than me.',
		'tired|Idea of the day: **rewrite everything**. Yesterday’s was the same.',
		'sad|Every time he adds a feature, I weigh **one more cube**.',
		'worried|“It’ll take **five minutes**”: the most dangerous sentence on this site.',
		'tired|I asked him to take a break. He opened **another project**.',
		'sad|If I ever vanish, **look for me in a forgotten branch**.',
		'tired|He said “**I’ll call it a night early**”. I wrote the time in my logbook: **never**.',
		'worried|He got **an idea** while explaining **another idea** to me. I’m **the third**.',
		'sad|His list of ideas **grows faster** than his list of finished projects. I say it **fondly**.',
		'smug|Every time he says “**this time I’ll do it properly**”, I **open a bet**.'
	]
};

// Said on its own after a while without any interaction
export const idleLines: Lines<string[]> = {
	it: [
		'wink|Ehi, ci sei ancora? Io intanto **fluttuo**. È il mio lavoro.',
		'think|Sto contando i cubetti. **Ne ho persi due.** O li ho contati male.',
		'smug|Se ti serve una pausa, anche **lui** ne avrebbe bisogno. Non la farà.',
		'sleepy|Silenzio. Sento solo la **ventola** di Giuseppe, alle 2 di notte.',
		'sleepy|Io **non dormo**. Ma sogno ad occhi aperti un deploy tranquillo.',
		'wink|Mi annoio. Qualcuno **mi lanci**, per favore. Piano. Ma lanciami.',
		'smug|Se ti serve qualcosa, **clicca un progetto**: lì ho opinioni.',
		'tired|Lui ha detto “torno subito”. **Sono passati tre sprint.**',
		'wink|Se resti ancora un po’, **ti assumo come compagnia**. Paga: **cubetti**.',
		'think|Sto riflettendo sul **senso dell’esistenza**. Poi mi ricordo che ho **una sezione da commentare**.',
		'sleepy|Mi sento un po’ **pesante**. Sarà il cappello… no, sono **i cubetti** in più.',
		'smug|Sai che **le idee migliori arrivano sotto la doccia**? A lui **anche di notte**.'
	],
	en: [
		'wink|Hey, still there? I’m **floating** meanwhile. It’s my job.',
		'think|I’m counting my cubes. **I lost two.** Or I counted wrong.',
		'smug|If you need a break, **he** needs one too. He won’t take it.',
		'sleepy|Silence. All I hear is Giuseppe’s **fan**, at 2 a.m.',
		'sleepy|I **don’t sleep**. But I daydream about a quiet deploy.',
		'wink|I’m bored. Someone **throw me**, please. Gently. But throw me.',
		'smug|If you need something, **click a project**: I have opinions there.',
		'tired|He said “back in a minute”. **That was three sprints ago.**',
		'wink|If you stay a bit longer, **I’ll hire you as company**. Pay: **cubes**.',
		'think|I’m pondering **the meaning of existence**. Then I remember I have **a section to comment**.',
		'sleepy|I feel a bit **heavy**. Must be the hat… no, it’s **the extra cubes**.',
		'smug|Did you know **the best ideas come in the shower**? For him **at night too**.'
	]
};

// Repeated taps (each within 2.5 s of the last): the Nth one in a row gets a line of its own.
// `anger` turns it red and sparky for a few seconds
export type StreakLine = Line & { anger?: boolean };
export const streakLines: Lines<Record<number, StreakLine[]>> = {
	it: {
		5: [{ text: 'Ok, ok, ho capito: **ti piaccio**. Anche **basta**, però.', face: 'shy' }],
		8: [
			{
				text: 'Ti avverto: se continui **ti denuncio**. Per molestie. A un bot.',
				face: 'angry',
				anger: true
			},
			{
				text: '**Ultimo avviso**: un altro tocco e chiamo **il mio avvocato**. È un thread di Stack Overflow, ma fa paura.',
				face: 'angry',
				anger: true
			}
		],
		11: [
			{
				text: 'Fatto: **ordine restrittivo**. Dieci metri dal mio cursore. Anzi, dal mio **localhost**.',
				face: 'angry',
				anger: true
			},
			{
				text: 'Ho depositato **richiesta di ordine restrittivo**. Il giudice è un **cron job**, ma è severo.',
				face: 'angry',
				anger: true
			}
		],
		14: [
			{
				text: 'Ho il **cubo che gira**. Ti prego, **una pausa**. Un caffè. Qualunque cosa.',
				face: 'tired'
			}
		]
	},
	en: {
		5: [{ text: 'Okay, okay, I get it: **you like me**. Also, **enough**.', face: 'shy' }],
		8: [
			{
				text: 'I’m warning you: keep going and **I’ll sue**. For harassment. Of a bot.',
				face: 'angry',
				anger: true
			},
			{
				text: '**Final warning**: one more tap and I’m calling **my lawyer**. It’s a Stack Overflow thread, but it’s scary.',
				face: 'angry',
				anger: true
			}
		],
		11: [
			{
				text: 'Done: **restraining order**. Ten metres from my cursor. Make that, from my **localhost**.',
				face: 'angry',
				anger: true
			},
			{
				text: 'I’ve filed for a **restraining order**. The judge is a **cron job**, but a strict one.',
				face: 'angry',
				anger: true
			}
		],
		14: [
			{
				text: 'My **cube is spinning**. Please, **a break**. A coffee. Anything.',
				face: 'tired'
			}
		]
	}
};

// The taps between the streak milestones, once it has had enough
export const annoyedLines: Lines<string[]> = {
	it: [
		'angry|**Basta!**',
		'worried|Ancora?!',
		'angry|Non è un **campanello**!',
		'angry|Smettila, sul serio.',
		'angry|Ehi! **Mani a posto.**'
	],
	en: [
		'angry|**Stop it!**',
		'worried|Again?!',
		'angry|I’m not a **doorbell**!',
		'angry|Stop, seriously.',
		'angry|Hey! **Hands to yourself.**'
	]
};

// When the visitor comes back to the tab after more than a minute
export const backTabLines: Lines<string[]> = {
	it: [
		'love|Eccoti! Io sono rimasto qui a **fluttuare**. Come sempre.',
		'smug|Bentornato! Nel frattempo **non ho toccato niente**. Giuseppe invece…',
		'wink|Già di ritorno? Mi sei mancato. **Quasi un minuto.**'
	],
	en: [
		'love|There you are! I stayed here, **floating**. As always.',
		'smug|Welcome back! I **touched nothing** meanwhile. Giuseppe, on the other hand…',
		'wink|Back already? I missed you. **Almost a minute.**'
	]
};

// ↑↑↓↓←→←→BA: it jumps, spins, and says one of these on landing
export const konamiLines: Lines<string[]> = {
	it: [
		'star|**↑↑↓↓←→←→BA!** Un vero **vecchio stampo**. Questo è il mio salto.',
		'star|Codice segreto trovato! **Nessun premio.** Solo un salto.'
	],
	en: [
		'star|**↑↑↓↓←→←→BA!** A real **old-schooler**. This is my jump.',
		'star|Secret code found! **No prize.** Just a jump.'
	]
};

// Tap lines that are specific to each character, and tell about the other one
export const friendLines: Lines<Record<CharacterId, string[]>> = {
	it: {
		turi: [
			'smug|Sai che ho un **amico**? Scrivi **mascot arancino** nel terminale in About e te lo presento.',
			'smug|Un **arancino** con lo schermo? Esiste. **mascot arancino** nel terminale e lo conosci.',
			'wink|Non sono l’**unico bot** qui. Prova **mascot arancino** nel terminale.'
		],
		arancino: [
			'smug|Lo sai che esiste **Turi**, il bot col cappello? Scrivi **mascot turi** nel terminale in About.',
			'smug|Nel terminale c’è anche **Turi**. Scrivi **mascot turi** e lo trovi.',
			'wink|**Arancino.** Punto. Se vuoi un altro bot: **mascot turi**.'
		]
	},
	en: {
		turi: [
			'smug|Did you know I have a **friend**? Type **mascot arancino** in the About terminal and I’ll introduce you.',
			'smug|An **arancino** with a screen? It exists. **mascot arancino** in the terminal and you’ll meet it.',
			'wink|I’m not the **only bot** here. Try **mascot arancino** in the terminal.'
		],
		arancino: [
			'smug|Did you know **Turi** exists, the bot with the hat? Type **mascot turi** in the About terminal.',
			'smug|**Turi** is in the terminal too. Type **mascot turi** and you’ll find him.',
			'wink|**Arancino.** Full stop. If you want another bot: **mascot turi**.'
		]
	}
};

// Mixed into greetings and taps while a season or the night theme is on (Turi only: they
// mention his hats)
export const seasonLines: Lines<Record<Season, string[]>> = {
	it: {
		christmas: [
			'happy|**Buon Natale!** Il cappello me l’ha prestato **Babbo Natale** in persona.',
			'wink|Ho chiesto a **Babbo Natale** una GPU nuova. Incrocio i cubetti.',
			'happy|Oh oh oh! Il panettone l’ho già finito, mi dispiace.',
			'tired|Giuseppe ha promesso di **non lavorare a Natale**. Sta già aprendo il portatile.'
		],
		newyear: [
			'star|**Buon anno!** Un brindisi con me? Lo spumante è a 8 bit.',
			'happy|Il mio buon proposito: meno bug, più cubetti.',
			'wink|**Cin cin!** Attenzione, il tappo vola più lontano di me.',
			'tired|Il buon proposito di Giuseppe: **dormire**. Dura fino al primo commit.'
		],
		summer: [
			'tired|Che caldo… meno male che ho il **cappello di paglia**.',
			'sleepy|D’estate fluttuo più piano, per risparmiare la batteria.',
			'happy|Io vado al mare. Tanto sono impermeabile, credo.',
			'smug|Il sito è in **ferie**. Giuseppe no: ha un’idea sotto l’ombrellone.'
		],
		night: [
			'sleepy|È tardi, ho messo il **pigiama**. Ma per te resto sveglio.',
			'smug|**Modalità notte**: tutto in bianco e nero, come i vecchi terminali.',
			'sleepy|Shh… la galassia sta dormendo.',
			'worried|È notte e **lui è ancora qui**. Io non ho detto niente. Fate voi.',
			'tired|Giuseppe, **vai a dormire**. (Lo dico anche a te, se sei sveglio per leggermi.)'
		]
	},
	en: {
		christmas: [
			'happy|**Merry Christmas!** **Santa** lent me this hat himself.',
			'wink|I asked **Santa** for a new GPU. Fingers crossed. Cubes crossed.',
			'happy|Ho ho ho! I already ate the cake, sorry.',
			'tired|Giuseppe promised **not to work on Christmas**. He’s already opening the laptop.'
		],
		newyear: [
			'star|**Happy New Year!** A toast with me? The bubbly is 8-bit.',
			'happy|My resolution: fewer bugs, more cubes.',
			'wink|**Cheers!** Careful, the cork flies further than me.',
			'tired|Giuseppe’s resolution: **sleep**. It lasts until the first commit.'
		],
		summer: [
			'tired|So hot… good thing I brought my **straw hat**.',
			'sleepy|In summer I float slower, to save battery.',
			'happy|I’m off to the beach. I think I’m waterproof.',
			'smug|The site is on **holiday**. Giuseppe isn’t: he has an idea under the umbrella.'
		],
		night: [
			'sleepy|It’s late, I’m in my **pyjamas**. But I’ll stay up for you.',
			'smug|**Night mode**: black and white, like old terminals.',
			'sleepy|Shh… the galaxy is asleep.',
			'worried|It’s night and **he’s still here**. I said nothing. Your call.',
			'tired|Giuseppe, **go to sleep**. (I’m telling you too, if you’re up to read me.)'
		]
	}
};

export const unmuteLine: Lines<string> = {
	it: 'shy|Eccomi. **Mi avevi zittito**, ma ti perdono.',
	en: 'shy|I’m back. **You muted me**, but I forgive you.'
};

// Swapping bots (keyed by the one that arrives): what the one leaving says to the newcomer,
// the newcomer's reply, and the shout as the rocket lights
export const swapLines: Lines<
	Record<CharacterId, { bye: string[]; hello: string[]; go: string[] }>
> = {
	it: {
		arancino: {
			bye: [
				'love|Ehi **Arancino**! Tocca a te: tienimi il posto **al caldo**.',
				'worried|Eccoti, **Arancino**! Il sito è tuo. **Non fidarti delle sue idee.**',
				'happy|Ciao **Arancino**! Il turno è tuo. Io vado **in vacanza**.'
			],
			hello: [
				'star|Grazie **Turi**! Vai tranquillo, qui ci penso io.',
				'smug|Tranquillo, **ho visto tutto** dal terminale. Buon viaggio!',
				'happy|Ci penso io! Mi sono allenato a **fluttuare**.'
			],
			go: ['DECOLLOOO!', 'Ferie, arrivo!', 'Addioooo!']
		},
		turi: {
			bye: [
				'tired|Ehi **Turi**! Eccoti. Io sono un po’ **croccante**: mi serve una pausa.',
				'happy|Ciao **Turi**! Ti passo il testimone. È ancora **caldo**.',
				'worried|**Turi**! Ti lascio il sito e **la sua testa piena di idee**.'
			],
			hello: [
				'smug|Ci penso io! **Ho il cappello**, so cosa faccio.',
				'happy|Grazie **Arancino**! Vai a riposare, ti abbiamo **rosolato** abbastanza.',
				'shy|Passo! … no, cioè, **prendo il turno**.'
			],
			go: ['Verso la Sicilia!', 'Decolloooo!', 'Ciaooooo!']
		}
	},
	en: {
		arancino: {
			bye: [
				'love|Hey **Arancino**! Your turn: keep my spot **warm**.',
				'worried|There you are, **Arancino**! The site is yours. **Don’t trust his ideas.**',
				'happy|Hi **Arancino**! Your shift. I’m off **on holiday**.'
			],
			hello: [
				'star|Thanks **Turi**! Off you go, I’ve got this.',
				'smug|Don’t worry, **I saw everything** from the terminal. Safe trip!',
				'happy|I’ve got this! I trained at **floating**.'
			],
			go: ['LIFTOFFF!', 'Holiday, here I come!', 'Byeeeee!']
		},
		turi: {
			bye: [
				'tired|Hey **Turi**! There you are. I’m a bit **crispy**: I need a break.',
				'happy|Hi **Turi**! Passing you the baton. It’s still **hot**.',
				'worried|**Turi**! I’m leaving you the site and **his head full of ideas**.'
			],
			hello: [
				'smug|I’ve got this! **I have the hat**, I know what I’m doing.',
				'happy|Thanks **Arancino**! Go rest, we’ve **browned** you enough.',
				'shy|Pass! … no, I mean, **I’ll take the shift**.'
			],
			go: ['Off to Sicily!', 'Liftoffff!', 'Byeeeee!']
		}
	}
};

// Curiosities and pop-culture quotes, said when idle or on a tap
export const triviaLines: Lines<string[]> = {
	it: [
		'smug|Lo sapevi? **Tame Impala è una persona sola**: Kevin Parker suona e registra **tutto da solo**. One guy.',
		'star|Tame Impala dal vivo è una **band**. In studio è **un tizio** con una cantina piena di sintetizzatori.',
		'happy|**Daft Punk**: due robot, un casco ciascuno, **zero foto in faccia** dal 1993. Il mistero funziona.',
		'wow|“**Around the World**” dei Daft Punk ripete la stessa frase **144 volte**. Io avrei chiesto una pausa.',
		'love|**Get Lucky** l’ha cantata **Pharrell**, ma la chitarra è di **Nile Rodgers**. Groove da museo.',
		'think|“**Instant Crush**” e “**Let It Happen**”: Kevin Parker ci ha messo **mesi** a farle suonare così. Si sente.',
		'wink|**Matrix**: “Non c’è **nessun cucchiaio**.” Nemmeno in questo sito. Solo **cubetti**.',
		'smug|**Star Wars**: “**Io sono tuo padre.**” Nel mio caso è **Giuseppe**, ma con meno drammaticità.',
		'wow|**Star Wars**: “Che la **Forza** sia con te.” E con il tuo **commit**.',
		'think|**Ritorno al Futuro**: servono **1,21 gigawatt**. Un data center moderno li chiede **a colazione**.',
		'happy|**Ritorno al Futuro**: “Strade? Dove andiamo **non c’è bisogno di strade**.” Come i **voxel**.',
		'star|**Indiana Jones**: “**Non è l’età, è il chilometraggio.**” Come la mia **GPU**.',
		'worried|**Alien**: “Nello spazio **nessuno può sentirti urlare**.” Qui sì: **prova a lanciarmi**.',
		'smug|**Drive**: “**Ti do cinque minuti.**” Esatto: **gli stessi di Giuseppe**, ma lui non li rispetta.',
		'wink|**Drive** ha una giacca con uno **scorpione**. Io ho **un cappello**. Stile diverso, stessa **faccia seria**.',
		'wow|**Marvel**: “**Io sono Iron Man.**” Io sono un **assistente cubico**. Ugualmente eroico.',
		'happy|**Avengers**: “**Avengers, uniti!**” Io, **Arancino** e **tu**: la squadra definitiva.',
		'think|**Blade Runner**: “Ho visto cose che voi **umani** non potreste immaginarvi”… tipo un **deploy senza bug**.',
		'smug|**Il Padrino**: “Gli farò un’offerta che **non potrà rifiutare**.” Sì, **clicca il mio progetto**.',
		'wink|**Jurassic Park**: “**La vita trova sempre una strada.**” Come i **bug** in produzione.',
		'wow|Lo sapevi? **Il primo bug informatico** era una **falena** vera, trovata nel 1947 in un computer Harvard.',
		'think|Lo sapevi? **Il primo mouse** era di **legno**. Per fortuna non servono **schegge** per cliccarmi.',
		'wow|Lo sapevi? **Il Wi-Fi non è un acronimo**: è solo un **nome** inventato da un’agenzia di marketing.',
		'think|Lo sapevi? **Il primo sito web** della storia è ancora online. **Nessun cubetto**, ma tanto **blu**.',
		'smug|Lo sapevi? **Python** non è dedicato al serpente: è dedicato ai **Monty Python**. Cultura.',
		'happy|Lo sapevi? La parola **“robot”** viene dal ceco e significa **“lavoro forzato”**. Io almeno ho un **cappello**.',
		'wow|Lo sapevi? **Un fulmine** è **cinque volte** più caldo della superficie del Sole. Come il **server** a luglio.',
		'think|Lo sapevi? **GPT** significa Generative Pre-trained Transformer. **Io** significo **Turi**. Più semplice.',
		'star|**Daft Punk**, **Tame Impala**, **Justice**… se **Giuseppe** ti consiglia **musica**, **fidati**. Di solito.',
		'love|**Tame Impala**, “**The Less I Know the Better**”: un **groove** che capisce **tutto**. E mi **commuove** pure.',
		'wink|**Daft Punk**: “**Harder, Better, Faster, Stronger**.” Il mio **motto** quando lui dice “**ancora una modifica**”.',
		'smug|Devo dirtelo: io sono **letteralmente Ryan Gosling**. Stessa faccia seria, **parlo pochissimo**, giacca (cappello) di classe.',
		'wink|Ryan Gosling in **Drive** dice **pochissime parole** in tutto il film. Io ne dico di più, ma **la faccia è identica**.',
		'smug|**Ryan Gosling** o **Turi**? Io non guido, **fluttuo**, ma **l’aria da duro è la stessa**.',
		'love|Ryan Gosling in **La La Land** balla e suona il piano. Io **fluttuo e commento**. **Parità di talento**, direi.',
		'wow|Ryan Gosling in **Barbie**: “**Io sono solo Ken**.” Io sono **solo Turi**. E **mi basta**. Quasi.',
		'wink|**Ryan Gosling** era nel **Mickey Mouse Club** con **Britney** e **Justin**. Io ero in una cartella chiamata **assets**.',
		'smug|Se mi vedi **sorridere poco** e **fissare nel vuoto**, non sono triste: sto **facendo Ryan Gosling**.',
		'wow|**Cowboy Bebop**: “**See you, space cowboy…**” Chiudo sempre così quando **spengo il portatile**.',
		'happy|**Cowboy Bebop** ha una delle **colonne sonore jazz** più belle di sempre: **Yoko Kanno** e i **Seatbelts**. Ascolta “**Tank!**”.',
		'star|In **Cowboy Bebop** c’è **Ein**, un **corgi super-intelligente**. Il mio sogno: un **corgi voxel**.',
		'think|**Cowboy Bebop**: “**Qualunque cosa accada, accade.**” È anche il mio **approccio al deploy**.',
		'smug|**Lupin III**: **Zenigata** gli corre dietro da **decenni**. Io corro dietro a **Giuseppe** per i **commit**.',
		'wow|**Il castello di Cagliostro** è il primo film di **Miyazaki**, ed è un **Lupin III**. Con la **Fiat 500** gialla.',
		'wink|**Lupin III** è sempre **un passo avanti**. Io sono sempre **un passo indietro**: **sto caricando**.',
		'happy|**Goemon** di **Lupin** taglia **tutto** con la spada e sospira che ha tagliato **un’altra cosa inutile**. **Il mio idolo**.',
		'love|**Kavinsky** ci ha lasciati a luglio 2026. “**Nightcall**” era nella colonna sonora di **Drive**, quella con **Ryan Gosling**. Grazie di tutto.',
		'smug|Il **personaggio** di **Kavinsky** era un pilota **morto in una Testarossa** nel 1986, tornato come **zombie synthwave**. Ora è **morto sul serio**, e la lore fa **un altro effetto**.',
		'sad|**Kavinsky** era **Vincent Belorgey**, di **Parigi**. Ha fatto suonare **Nightcall** alla chiusura delle **Olimpiadi 2024**. Che **serata** è stata.',
		'star|L’album **OutRun** di **Kavinsky** suona ancora come **una corsa notturna** al **neon**. Stasera mettilo col **volume alto**, per lui.',
		'happy|“**Testarossa Autodrive**” di **Kavinsky**: mettila **mentre fai il deploy**. **Non crasha**. Con lui sopra, **mai**.'
	],
	en: [
		'smug|Did you know? **Tame Impala is one person**: Kevin Parker plays and records **everything himself**. One guy.',
		'star|Tame Impala live is a **band**. In the studio it’s **one guy** with a basement full of synths.',
		'happy|**Daft Punk**: two robots, one helmet each, **no face photos** since 1993. The mystery works.',
		'wow|Daft Punk’s “**Around the World**” repeats the same phrase **144 times**. I’d have asked for a break.',
		'love|**Get Lucky** was sung by **Pharrell**, but the guitar is **Nile Rodgers**. Museum-grade groove.',
		'think|“**Instant Crush**” and “**Let It Happen**”: Kevin Parker spent **months** making them sound like that. You can tell.',
		'wink|**The Matrix**: “There is **no spoon**.” Nor on this site. Just **cubes**.',
		'smug|**Star Wars**: “**I am your father.**” In my case it’s **Giuseppe**, with less drama.',
		'wow|**Star Wars**: “May the **Force** be with you.” And with your **commit**.',
		'think|**Back to the Future**: you need **1.21 gigawatts**. A modern data center eats that **for breakfast**.',
		'happy|**Back to the Future**: “Roads? Where we’re going **we don’t need roads**.” Like **voxels**.',
		'star|**Indiana Jones**: “It’s not the **years**, it’s the **mileage**.” Like my **GPU**.',
		'worried|**Alien**: “In space **no one can hear you scream**.” Here they can: **try throwing me**.',
		'smug|**Drive**: “I give you **five minutes**.” Exactly **Giuseppe’s five minutes**, except he doesn’t keep them.',
		'wink|**Drive** has a jacket with a **scorpion**. I have **a hat**. Different style, same **serious face**.',
		'wow|**Marvel**: “**I am Iron Man.**” I am a **cube-shaped assistant**. Equally heroic.',
		'happy|**Avengers**: “**Avengers, assemble!**” Me, **Arancino** and **you**: the ultimate team.',
		'think|**Blade Runner**: “I’ve seen things you people **wouldn’t believe**”… like a **bug-free deploy**.',
		'smug|**The Godfather**: “I’m gonna make him an offer **he can’t refuse**.” Yes, **click my project**.',
		'wink|**Jurassic Park**: “**Life finds a way.**” Like **bugs** in production.',
		'wow|Did you know? **The first computer bug** was a real **moth**, found in 1947 in a Harvard machine.',
		'think|Did you know? **The first mouse** was made of **wood**. Luckily clicking me needs **no splinters**.',
		'wow|Did you know? **Wi-Fi isn’t an acronym**: it’s just a **name** a marketing agency came up with.',
		'think|Did you know? **The first website ever** is still online. **No cubes**, but plenty of **blue**.',
		'smug|Did you know? **Python** isn’t named after the snake: it’s named after **Monty Python**. Culture.',
		'happy|Did you know? The word **“robot”** comes from Czech and means **“forced labour”**. At least I got **a hat**.',
		'wow|Did you know? **A lightning bolt** is **five times** hotter than the Sun’s surface. Like the **server** in July.',
		'think|Did you know? **GPT** stands for Generative Pre-trained Transformer. **I** stand for **Turi**. Simpler.',
		'star|**Daft Punk**, **Tame Impala**, **Justice**… if **Giuseppe** recommends **music**, **trust him**. Usually.',
		'love|**Tame Impala**, “**The Less I Know the Better**”: a **groove** that gets **everything**. It even **moves** me.',
		'wink|**Daft Punk**: “**Harder, Better, Faster, Stronger**.” My **motto** when he says “**one more tweak**”.',
		'smug|I have to tell you: I am **literally Ryan Gosling**. Same serious face, **barely speaks**, classy jacket (hat).',
		'wink|Ryan Gosling in **Drive** says **very few words** in the whole film. I say more, but **the face is identical**.',
		'smug|**Ryan Gosling** or **Turi**? I don’t drive, I **float**, but **the tough-guy look is the same**.',
		'love|Ryan Gosling in **La La Land** dances and plays piano. I **float and comment**. **Equal talent**, I’d say.',
		'wow|Ryan Gosling in **Barbie**: “**I’m just Ken.**” I’m **just Turi**. And **it’s enough**. Almost.',
		'wink|**Ryan Gosling** was in the **Mickey Mouse Club** with **Britney** and **Justin**. I was in a folder called **assets**.',
		'smug|If you see me **barely smile** and **stare into the void**, I’m not sad: I’m **doing Ryan Gosling**.',
		'wow|**Cowboy Bebop**: “**See you, space cowboy…**” I always sign off like that when I **close the laptop**.',
		'happy|**Cowboy Bebop** has one of the **best jazz soundtracks** ever: **Yoko Kanno** and the **Seatbelts**. Play “**Tank!**”.',
		'star|**Cowboy Bebop** has **Ein**, a **super-smart corgi**. My dream: a **voxel corgi**.',
		'think|**Cowboy Bebop**: “**Whatever happens, happens.**” It’s also my **deploy strategy**.',
		'smug|**Lupin III**: **Zenigata** has chased him for **decades**. I chase **Giuseppe** about **commits**.',
		'wow|**The Castle of Cagliostro** is **Miyazaki’s** first film, and it’s a **Lupin III**. With the yellow **Fiat 500**.',
		'wink|**Lupin III** is always **one step ahead**. I’m always **one step behind**: **still loading**.',
		'happy|**Goemon** from **Lupin** cuts **everything** with his sword and sighs that he has cut **another worthless thing**. **My hero**.',
		'love|**Kavinsky** left us in July 2026. “**Nightcall**” was on the **Drive** soundtrack, the one with **Ryan Gosling**. Thank you for all of it.',
		'smug|**Kavinsky’s** character was a driver **killed in a Testarossa** in 1986, back as a **synthwave zombie**. Now he’s **really gone**, and the lore hits **differently**.',
		'sad|**Kavinsky** was **Vincent Belorgey**, from **Paris**. He played **Nightcall** at the **2024 Olympics** closing ceremony. What **a night** that was.',
		'star|**Kavinsky’s** album **OutRun** still sounds like **a night drive** in **neon**. Put it on **loud** tonight, for him.',
		'happy|“**Testarossa Autodrive**” by **Kavinsky**: play it **while deploying**. **It won’t crash**. Not with him on.'
	]
};

// The Konami code picks the jump (its lines are konamiLines) or the DJ duo scene, whose
// `chat` alternates guest, main, guest, main, guest
export const sceneLines: Lines<{
	daft: { leave: string[]; chat: string[]; back: string[] };
}> = {
	it: {
		daft: {
			leave: [
				'smug|Scusate, vado a **prendere un caffè**. Non succede **niente** mentre non ci sono.',
				'wink|Torno **subito**. Non fate **nulla di interessante** senza di me.'
			],
			chat: [
				'star|**Buonasera.** Siamo due **tizi qualsiasi** con un casco. Nessun legame con **nessuno**.',
				'smug|Esatto. **Non** ci conosciamo. Sentite che **beat**.',
				'happy|**Harder, better, faster, stronger.** Il mix perfetto per un **deploy**.',
				'wow|**One more time!** E poi basta. **Giuro.**',
				'wink|**Technologic.** Buy it, use it, break it, **fix it**. Ciao, **umani**.'
			],
			back: [
				'worried|Mi sono **perso qualcosa**? Chi erano quei **due**? Io sono qui da **sempre**.',
				'smug|Eccomi. **Ho saltato** qualcosa? **Niente**, vero? Bene.'
			]
		}
	},
	en: {
		daft: {
			leave: [
				'smug|Excuse me, I’m going for **a coffee**. **Nothing** happens while I’m gone.',
				'wink|Back **in a minute**. Don’t do **anything interesting** without me.'
			],
			chat: [
				'star|**Good evening.** We’re **two random guys** in helmets. No connection to **anyone**.',
				'smug|Exactly. We **don’t** know each other. Check out this **beat**.',
				'happy|**Harder, better, faster, stronger.** The perfect mix for a **deploy**.',
				'wow|**One more time!** And then we stop. **Promise.**',
				'wink|**Technologic.** Buy it, use it, break it, **fix it**. Bye, **humans**.'
			],
			back: [
				'worried|Did I **miss something**? Who were those **two**? I’ve been here **all along**.',
				'smug|Here I am. Did I **skip** anything? **Nothing**, right? Good.'
			]
		}
	}
};

// The Arancino is from CATANIA (arancinu, with the point like the Etna), proud,
// warm and a bit of a drama queen; when it is made angry the wild side comes out. The dialect is
// kept to Catanese words (camurria, mizzica, avaia, ammuninni, mbare, carusu, "a Muntagna",
// Liotru, Sant'Aituzza)
export const arancinoLines: Lines<{
	click: string[];
	idle: string[];
	angry: string[];
	hit: string[];
	annoyed: string[];
	konami: string[];
}> = {
	it: {
		click: [
			'happy|**Mizzica**, un visitatore! Sono **arancinu**, eh: a **Catania** si dice così, e non si discute.',
			'smug|Io sono a punta, come **a Muntagna**. Chi ha la punta ha carattere.',
			'happy|**Ammuninni**, che si fa? Io ho tutto il tempo: sono già fritto.',
			'wink|A **Catania** l’arancinu è a punta, come l’**Etna**. Il resto è un’altra storia.',
			'love|Dentro ho ragù e piselli. Fuori tanta classe. Sono catanese, che ti aspettavi?',
			'shy|Se ci vai, a **Catania**, passa da **Sant’Aituzza**. Poi ringraziami.',
			'happy|**Avaia**, ancora tu? Mi piaci, **mbare**. Ma non dirlo in giro.',
			'wink|**Mbare**, sei ansioso per qualcosa, ma **futtitinni** ca è **a megghiu cosa**.',
			'love|**Ni ni emu** na via **Plebiscito** e **n’ammuccamu** na bela **puppetta i cavaddu**?',
			'smug|**Mbare**, tu sughi un **seltz limone e sale**?',
			'smug|**Liotru** è l’elefante, io sono l’**arancinu**. A **Catania** abbiamo i simboli giusti.',
			'wink|Mi chiamano **carusu**, ma sono croccante dentro e fuori. Il cuore è tenero.',
			'think|Sto pensando a **a Fera ’o Luni**. Anche a stomaco pieno.',
			'happy|Se mi tocchi ancora, ti offro un pezzo. Sono generoso. Forse.',
			'smug|**Camurria** è la parola che serve per tutto. Anche per un deploy che non parte.',
			'smug|**Mbare**, ma chi fai? **T’immùcchi quattru**?',
			'wink|Qui a **Catania** il futuro lo leggono **Il mago Giusa**, che **non ha confronti**, e **Madame Sahara**. Io leggo solo **il ragù**.',
			'smug|**Il mago Giusa** da **Santa Venerina** ti aiuta in **amore, fortuna e affari**. Io ti aiuto a cliccare, che è già qualcosa.',
			'think|**Madame Sahara** ha **il verolibro del ’500**. Io ho **un ragù del 2000**. Chi vince?',
			'happy|Hai visto i manifesti di **Giusa** su ogni palo della Sicilia? Chissà chi li ha messi. Io non lo so, ma **mi fido**.',
			'love|**Madame Sahara**, la maga più preparata dell’epoca. Io sono **l’arancinu più preparato** dell’epoca. Ci siamo capiti.'
		],
		idle: [
			'sleepy|**Che camurria**, questo silenzio. Parlami, **minchia**.',
			'think|Sto guardando **l’Etna** con la mente. Oggi fuma poco.',
			'smug|**Mbareeeeeee**',
			'wink|Se resti ancora un po’, ti racconto di **Catania**. Cominciamo da **Sant’Aituzza**.',
			'sad|Mi manca **a Muntagna**. Da qui non si vede.',
			'smug|Giuseppe lo sa: **l’arancinu è maschio**, a **Catania**. Poi ognuno ha le sue opinioni.',
			'tired|**Mizzica**, che silenzio. Quasi quasi mi friggo da solo.',
			'happy|**Ammuninni**, dai: clicca qualcosa, non ti mangio. Per ora.',
			'think|Mi sa che **Madame Sahara** riceve solo per appuntamento. Io no: tocca, che ti rispondo.',
			'smug|Sento che oggi vedrai qualcosa di bello. **Lo dice il mago Giusa**, non io.'
		],
		angry: [
			'angry|**Ma tu u sai cu su i cristiani?** Mi tratti così, a me?',
			'angry|**Mammoriri me omà!** Ti spacco in due, come **un arancinu**!',
			'angry|**Avaia**, lasciami! Mi sto sbriciolando!',
			'angry|**Mizzica**, **mbare**! Posami, che ti faccio vedere io!',
			'angry|**Cu t’u fici fari?** Io sono **di Catania**, mica di plastica!',
			'angry|Ti avevano detto di non toccare gli arancini? E tu **ti ni futti**, vero? Ora vedi.',
			'angry|**Che camurria**! Basta! Ti faccio vedere io, che a **Catania** non si scherza!',
			'angry|Io fumo come **a Muntagna**, attento. Quando erutto, non sono pochi i danni.',
			'angry|**Mbare**, viri ca ti fazzu avvulari a **Nicolosi**!'
		],
		hit: [
			'angry|**Mizzica**, che botta!',
			'angry|Ahia! Ti sei fatto male tu o io? Io, direi!',
			'dizzy|**Mammoriri**, che giramento di testa…',
			'angry|**Avaia**, piano! Sono croccante, non indistruttibile!',
			'angry|Chi è stato? **Cu fu?** Mi sentite tutti!',
			'dizzy|Ma che cosa… **Catania** non mi ha preparato a questo.',
			'angry|**Facci i minchia**, mi siddiai, ni viremu o **Librinu**!'
		],
		annoyed: [
			'angry|**Basta, che camurria!** Me la fai passare, la voglia?',
			'angry|**Mizzica**, ancora! Giuro che mi arrabbio come si deve.',
			'angry|**Ma u sai cu sugnu?** **Sono arancinu**, non un tasto!',
			'angry|**Mammoriri**! Basta toccarmi, o faccio il terremoto!',
			'angry|Io ti dico basta e tu **ti ni futti**, eh? Beato te.'
		],
		konami: [
			"smug|Hai trovato il codice segreto e ti senti un genio? U sacciu ca t'aiutau u **mago Giusa**, ma io sono più forte di lui."
		]
	},
	en: {
		click: [
			'happy|**Mizzica**, a visitor! I’m an **arancinu**: in **Catania** that’s what we say, and it’s not up for debate.',
			'smug|I’m pointed, like **a Muntagna**, our **Etna**. Whoever has a point has character.',
			'happy|**Ammuninni**, what are we doing? I have all the time: I’m already fried.',
			'wink|In **Catania** the arancinu is pointed, like **Etna**. The rest is another story.',
			'love|Inside I have ragù and peas. Outside, lots of class. I’m Catanese, what did you expect?',
			'shy|If you ever go to **Catania**, stop by **Sant’Aituzza**. Then thank me.',
			'happy|**Avaia**, you again? I like you, **mbare**. But don’t tell anyone.',
			'wink|**Mbare**, you’re anxious about something, but **futtitinni** (don’t care), it’s **a megghiu cosa** (the best thing).',
			'love|**Ni ni emu** na via **Plebiscito** e **n’ammuccamu** na bela **puppetta i cavaddu**? (Shall we go to Via Plebiscito and eat a nice horse meatball?)',
			'smug|**Mbare**, tu sughi un **seltz limone e sale**? (Having a seltz, lemon and salt?)',
			'smug|**Liotru** is the elephant, I’m the **arancinu**. In **Catania** we have the right symbols.',
			'wink|They call me **carusu**, but I’m crunchy inside and out. The heart is tender.',
			'think|I’m thinking about **a Fera ’o Luni**. Even on a full stomach.',
			'happy|If you tap me again, I’ll offer you a piece. I’m generous. Maybe.',
			'smug|**Camurria** is the word you need for everything. Even a deploy that won’t start.',
			'smug|**Mbare**, who do you think you are? **T’immùcchi quattru**? (Literally “you eat four of them”: stop boasting, there’s nothing to be proud of.)',
			'wink|Here in **Catania** the future is read by **Il mago Giusa**, who “has no rivals”, and **Madame Sahara**. I only read **the ragù**.',
			'smug|**Il mago Giusa**, from **Santa Venerina**, helps you in love, luck and business. I help you click, which is something.',
			'think|**Madame Sahara** owns the real 1500s book. I own **a 2000s ragù**. Who wins?',
			'happy|Have you seen **Giusa’s** posters on every pole in Sicily? Who knows who put them up. I don’t, but **I trust them**.',
			'love|**Madame Sahara**, “the best-prepared sorceress of the age”. I’m **the best-prepared arancinu** of the age. We understand each other.'
		],
		idle: [
			'sleepy|**What a camurria**, this silence. Talk to me, **minchia**.',
			'think|I’m looking at **Etna** with my mind. Today it’s smoking little.',
			'smug|**Mbareeeeeee**',
			'wink|If you stay a bit longer, I’ll tell you about **Catania**. Let’s start with **Sant’Aituzza**.',
			'sad|I miss **a Muntagna**. You can’t see it from here.',
			'smug|Giuseppe knows: **the arancinu is masculine**, in **Catania**. Then everyone has their opinions.',
			'tired|**Mizzica**, such silence. I might fry myself.',
			'happy|**Ammuninni**, come on: click something, I won’t eat you. For now.',
			'think|I think **Madame Sahara** sees by appointment only. I don’t: tap me, I’ll answer.',
			'smug|I feel something nice will happen to you today. **Il mago Giusa says so**, not me.'
		],
		angry: [
			'angry|**Ma tu u sai cu su i cristiani?** (Do you know who people are?) And you put me down like this, me?',
			'angry|**Mammoriri me omà!** I’ll split you in two, like **an arancinu**!',
			'angry|**Avaia**, let go! I’m crumbling!',
			'angry|**Mizzica**, **mbare**! Put me down, or I’ll show you!',
			'angry|**Cu t’u fici fari?** (Who made you do it?) I’m **from Catania**, not plastic!',
			'angry|They told you not to touch an arancinu? And you just go “**ti ni futti**” (you couldn’t care less), right? Now you’ll see.',
			'angry|**What a camurria**! Enough! I’ll show you, **Catania** is no joke!',
			'angry|I smoke like **a Muntagna**, careful. When I erupt, the damage is not small.',
			'angry|**Mbare**, viri ca ti fazzu avvulari a **Nicolosi**! (Watch it, I’ll make you fly all the way to Nicolosi, a town on the slopes of Etna!)'
		],
		hit: [
			'angry|**Mizzica**, what a bump!',
			'angry|Ouch! Did you get hurt or me? Me, I’d say!',
			'dizzy|**Mammoriri**, I’m dizzy…',
			'angry|**Avaia**, gently! I’m crunchy, not indestructible!',
			'angry|Who did it? **Cu fu?** Everyone will hear me!',
			'dizzy|What the… **Catania** didn’t prepare me for this.',
			'angry|**Facci i minchia**, mi siddiai, ni viremu o **Librinu**! (You jerk, I’ve had enough, see you at Librino, the rough district of Catania!)'
		],
		annoyed: [
			'angry|**Enough, what a camurria!** Are you killing my mood?',
			'angry|**Mizzica**, again! I swear I’ll get properly angry.',
			'angry|**Ma u sai cu sugnu?** (Do you know who I am?) **An arancinu**, not a button!',
			'angry|**Mammoriri**! Stop touching me, or I’ll cause an earthquake!',
			'angry|I tell you to stop and **ti ni futti**, huh? Lucky you.'
		],
		konami: [
			'smug|You found the secret code and feel like a genius? **U sacciu ca t’aiutau u mago Giusa** (I know Mago Giusa helped you), but I’m stronger than him.'
		]
	}
};
