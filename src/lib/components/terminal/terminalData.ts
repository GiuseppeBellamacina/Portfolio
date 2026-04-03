export interface HistoryEntry {
	type: 'input' | 'output' | 'html' | 'error' | 'ascii';
	text: string;
}

export interface Song {
	title: string;
	artist: string;
	lyrics: string[];
	url?: string;
}

export const projectEntries: HistoryEntry[] = [
	{
		type: 'html',
		text: '<span class="file">grpo-strict-gen/</span>    <span class="cmt"># <a href="https://github.com/GiuseppeBellamacina/GRPO-strict-generation" target="_blank" rel="noopener noreferrer">RL-based LLM alignment for strict JSON/code</a></span>'
	},
	{
		type: 'html',
		text: '<span class="file">image-enhancement/</span>  <span class="cmt"># <a href="https://github.com/GiuseppeBellamacina/Image-Enhancement" target="_blank" rel="noopener noreferrer">Advanced image quality improvement</a></span>'
	},
	{
		type: 'html',
		text: '<span class="file">warehouse-swarm/</span>    <span class="cmt"># <a href="https://github.com/GiuseppeBellamacina/Warehouse-Swarm-Intelligence-System" target="_blank" rel="noopener noreferrer">Multi-agent warehouse optimization</a></span>'
	},
	{
		type: 'html',
		text: '<span class="file">trip-planner/</span>        <span class="cmt"># PWA for trip planning</span>'
	},
	{
		type: 'html',
		text: '<span class="file">world-domination-ai/</span> <span class="cmt"># I\'m joking... maybe</span>'
	},
	{
		type: 'html',
		text: '<span class="file">survive.sh</span>           <span class="cmt"># chmod +x survive.sh && ./survive.sh</span>'
	}
];

export const bootLines: HistoryEntry[] = [
	{ type: 'output', text: 'giuseppe@portfolio:~$ ls projects/' },
	...projectEntries,
	{ type: 'output', text: '' },
	{ type: 'output', text: 'Type "help" for available commands.' }
];

export const completableCommands = [
	'help',
	'about',
	'skills',
	'contact',
	'projects',
	'ls',
	'socials',
	'whoami',
	'date',
	'echo',
	'clear',
	'neofetch',
	'anime',
	'music',
	'musica',
	'daftpunk',
	'tameimpala',
	'kavinsky'
];

export const musicCatalog: Record<string, Song[]> = {
	daftpunk: [
		{
			title: 'Around the World',
			artist: 'Daft Punk',
			url: 'https://www.youtube.com/watch?v=K0HSD_i2DvA',
			lyrics: [
				'Around the world, around the world',
				'Around the world, around the world',
				'Around the world, around the world',
				'Around the world, around the world',
				'Around the world, around the world...'
			]
		},
		{
			title: 'Something About Us',
			artist: 'Daft Punk',
			url: 'https://youtu.be/sOS9aOIXPEk',
			lyrics: [
				'It might not be the right time',
				'I might not be the right one',
				"But there's something about us I want to say",
				"'Cause there's something between us anyway"
			]
		},
		{
			title: 'Harder, Better, Faster, Stronger',
			artist: 'Daft Punk',
			url: 'https://youtu.be/gAjR4_CbPpQ',
			lyrics: [
				'Work it harder, make it better',
				'Do it faster, makes us stronger',
				'More than ever, hour after hour',
				'Work is never over'
			]
		}
	],
	tameimpala: [
		{
			title: 'Let It Happen',
			artist: 'Tame Impala',
			url: 'https://youtu.be/pFptt7Cargc',
			lyrics: [
				"It's always around me, all this noise",
				'But not really as loud as the voice saying',
				'Let it happen, let it happen',
				"It's gonna feel so good",
				'Just let it happen, let it happen'
			]
		},
		{
			title: 'Let It Happen',
			artist: 'Tame Impala',
			url: 'https://youtu.be/pFptt7Cargc',
			lyrics: [
				"Baby, now I'm ready, moving on",
				'Oh, but maybe I was ready all along',
				"Oh, I'm ready for the moment and the sound",
				'Oh, but maybe I was ready all along',
				"Oh, baby, now I'm ready, moving on"
			]
		},
		{
			title: 'Let It Happen',
			artist: 'Tame Impala',
			url: 'https://youtu.be/pFptt7Cargc',
			lyrics: [
				'I cannot vanish, you will not scare me',
				'Try to get through it, try to push through it',
				'You were not thinking that I will not do it',
				"They be lovin\u2032 someone and I'm another story",
				'Take the next ticket, get the next train',
				"Why would I do it? Anyone'd think that"
			]
		},
		{
			title: 'Dracula',
			artist: 'Tame Impala',
			url: 'https://youtu.be/xnP7qKxwzjg',
			lyrics: [
				'The morning light is turning blue, the feeling is bizarre',
				"The night is almost over, I still don't know where you are",
				'The shadows, yeah, they keep me pretty like a movie star',
				'Daylight makes me feel like Dracula'
			]
		},
		{
			title: 'The Less I Know the Better',
			artist: 'Tame Impala',
			url: 'https://youtu.be/2SUwOgmvzK4',
			lyrics: [
				"I was doin' fine without you",
				"'Til I saw your face, now I can't erase",
				"Givin' in to all his bullshit",
				'Is this what you want? Is this who you are?',
				"I was doin' fine without you",
				"'Til I saw your eyes turn away from mine",
				'Oh, sweet darling, where he wants you',
				'Said, "Come on Superman, say your stupid line"'
			]
		},
		{
			title: 'Eventually',
			artist: 'Tame Impala',
			url: 'https://youtu.be/GHe8kKO8uds',
			lyrics: [
				"But I know that I'll be happier",
				'And I know you will too',
				"Said, I know that I'll be happier",
				'And I know you will too'
			]
		}
	],
	kavinsky: [
		{
			title: 'Nightcall',
			artist: 'Kavinsky',
			url: 'https://youtu.be/MV_3Dpw-BRY',
			lyrics: [
				"There's something inside you",
				"It's hard to explain",
				"They're talking about you, boy",
				"But you're still the same"
			]
		}
	]
};
