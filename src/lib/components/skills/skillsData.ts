export interface TechIcon {
	name: string;
	icon: string;
	url: string;
}

export interface SkillCategory {
	key: string;
	title: string;
	emoji: string;
	icons: TechIcon[];
}

export const skillCategories: SkillCategory[] = [
	{
		key: 'skills_languages',
		title: 'Languages',
		emoji: '🔤',
		icons: [
			{ name: 'Python', icon: 'python-original.svg', url: 'https://www.python.org/' },
			{
				name: 'C',
				icon: 'c-original.svg',
				url: 'https://en.wikipedia.org/wiki/C_(programming_language)'
			},
			{ name: 'C++', icon: 'cplusplus-original.svg', url: 'https://isocpp.org/' },
			{
				name: 'C#',
				icon: 'csharp-original.svg',
				url: 'https://docs.microsoft.com/en-us/dotnet/csharp/'
			},
			{
				name: 'Java',
				icon: 'java-original-wordmark-removebg-preview.png',
				url: 'https://www.java.com/'
			},
			{
				name: 'JavaScript',
				icon: 'js.png',
				url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
			},
			{
				name: 'TypeScript',
				icon: 'Typescript_logo_2020.svg.png',
				url: 'https://www.typescriptlang.org/'
			},
			{ name: 'Bash', icon: 'bash.png', url: 'https://www.gnu.org/software/bash/' },
			{ name: 'Markdown', icon: 'markdown.svg', url: 'https://www.markdownguide.org/' },
			{
				name: 'HTML',
				icon: 'white_bg_HTML5_logo_and_wordmark.svg.png',
				url: 'https://developer.mozilla.org/en-US/docs/Web/HTML'
			},
			{ name: 'CSS', icon: 'css.png', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
			{
				name: 'LaTeX',
				icon: 'white_bg_latex-original.png',
				url: 'https://www.latex-project.org/'
			}
		]
	},
	{
		key: 'skills_aiml',
		title: 'AI/ML & Data Science',
		emoji: '🤖',
		icons: [
			{ name: 'PyTorch', icon: 'pytorch-original.svg', url: 'https://pytorch.org/' },
			{ name: 'PyTorch Lightning', icon: 'lightning.png', url: 'https://lightning.ai/' },
			{ name: 'TensorFlow', icon: 'tensorflow.png', url: 'https://www.tensorflow.org/' },
			{ name: 'Weights & Biases', icon: 'wandb.png', url: 'https://wandb.ai/' },
			{ name: 'Keras', icon: 'keras-original.svg', url: 'https://keras.io/' },
			{
				name: 'Scikit-learn',
				icon: 'white_bg_scikitlearn-original.png',
				url: 'https://scikit-learn.org/'
			},
			{ name: 'NumPy', icon: 'numpy-original.svg', url: 'https://numpy.org/' },
			{
				name: 'Pandas',
				icon: 'white_bg_pandas-original.png',
				url: 'https://pandas.pydata.org/'
			},
			{ name: 'Polars', icon: 'polars.png', url: 'https://www.pola.rs/' },
			{ name: 'Matplotlib', icon: 'matplotlib-original.svg', url: 'https://matplotlib.org/' },
			{ name: 'Seaborn', icon: 'seaborn-1.svg', url: 'https://seaborn.pydata.org/' },
			{ name: 'Plotly', icon: 'plotly.png', url: 'https://plotly.com/' },
			{ name: 'OpenCV', icon: 'opencv-original.svg', url: 'https://opencv.org/' },
			{ name: 'spaCy', icon: 'spacy.png', url: 'https://spacy.io/' },
			{ name: 'NLTK', icon: 'nltk.png', url: 'https://www.nltk.org/' },
			{ name: 'LangChain', icon: 'langchain.jpg', url: 'https://www.langchain.com/' },
			{
				name: 'LangGraph',
				icon: 'langgraph-color.jpg',
				url: 'https://langchain-ai.github.io/langgraph/'
			},
			{
				name: 'LangSmith',
				icon: 'langsmith-color.jpg',
				url: 'https://www.langchain.com/langsmith'
			},
			{
				name: 'HuggingFace',
				icon: 'huggingface-2-removebg-preview.png',
				url: 'https://huggingface.co/'
			},
			{ name: 'TRL', icon: 'logo-trl.png', url: 'https://huggingface.co/docs/trl/' },
			{
				name: 'Unsloth',
				icon: 'unsloth.webp',
				url: 'https://unsloth.ai/'
			},
			{ name: 'vLLM', icon: 'vLLM-Full-Logo.svg', url: 'https://docs.vllm.ai/' },
			{
				name: 'Kaggle',
				icon: 'kaggle-original-wordmark.svg',
				url: 'https://www.kaggle.com/'
			},
			{
				name: 'Google Colab',
				icon: 'google-colab-icon.webp',
				url: 'https://colab.research.google.com/'
			},
			{ name: 'Ollama', icon: 'white_bg_ollamalogo.png', url: 'https://ollama.com/' },
			{ name: 'Meta', icon: 'meta-6871457_1280.webp', url: 'https://ai.meta.com/' },
			{ name: 'OpenAI', icon: 'white_bg_openai-2.png', url: 'https://openai.com/' },
			{
				name: 'Model Context Protocol',
				icon: 'mcp.jpg',
				url: 'https://modelcontextprotocol.io/'
			},
			{ name: 'Claude', icon: 'claude.png', url: 'https://claude.com/product/claude-code' },
			{
				name: 'GitHub Copilot',
				icon: 'githubcopilot.webp',
				url: 'https://github.com/features/copilot'
			},
			{ name: 'Chroma', icon: 'chroma.png', url: 'https://www.trychroma.com/' },
			{ name: 'Weaviate', icon: 'weaviate.png', url: 'https://weaviate.io/' }
		]
	},
	{
		key: 'skills_frameworks',
		title: 'Frameworks & Libraries',
		emoji: '🌐',
		icons: [
			{ name: 'React', icon: 'react.png', url: 'https://react.dev/' },
			{
				name: 'Node.js',
				icon: 'free-node-js-icon-svg-download-png-1174935.webp',
				url: 'https://nodejs.org/'
			},
			{ name: 'FastAPI', icon: 'fastapi.svg', url: 'https://fastapi.tiangolo.com/' },
			{
				name: 'Flask',
				icon: 'white_bg_flask-original-wordmark.png',
				url: 'https://flask.palletsprojects.com/'
			},
			{ name: 'Quart', icon: 'quart.png', url: 'https://quart.palletsprojects.com/' },
			{ name: 'Uvicorn', icon: 'white_bg_uvicorn.png', url: 'https://www.uvicorn.org/' },
			{ name: 'Streamlit', icon: 'streamlit-mark-color.svg', url: 'https://streamlit.io/' },
			{ name: 'Gradio', icon: 'gradio-color.png', url: 'https://www.gradio.app/' },
			{
				name: 'Requests',
				icon: 'Requests_Python_Logo.png',
				url: 'https://requests.readthedocs.io/'
			},
			{ name: 'Selenium', icon: 'selenium-original.svg', url: 'https://www.selenium.dev/' },
			{ name: 'Pytest', icon: 'pytest.png', url: 'https://pytest.org/' }
		]
	},
	{
		key: 'skills_databases',
		title: 'Databases',
		emoji: '🗃️',
		icons: [
			{
				name: 'MySQL',
				icon: 'mysql-original-wordmark-removebg-preview.png',
				url: 'https://www.mysql.com/'
			},
			{
				name: 'PostgreSQL',
				icon: 'Postgresql_elephant.svg.png',
				url: 'https://www.postgresql.org/'
			},
			{
				name: 'SQLite',
				icon: 'white_bg_sqlite-original-wordmark.png',
				url: 'https://www.sqlite.org/'
			},
			{
				name: 'Neo4j',
				icon: 'white_bg_neo4j-icon-452x512-b63ajo4a.png',
				url: 'https://neo4j.com/'
			},
			{
				name: 'PHPMyAdmin',
				icon: 'white_bg_phpmyadmin-thumb.png',
				url: 'https://www.phpmyadmin.net/'
			},
			{
				name: 'SQLAlchemy',
				icon: 'white_bg_sqlalchemy-original-wordmark.png',
				url: 'https://www.sqlalchemy.org/'
			}
		]
	},
	{
		key: 'skills_devops',
		title: 'DevOps & Tools',
		emoji: '🛠️',
		icons: [
			{
				name: 'Git',
				icon: 'white_bg_git-original-wordmark.png',
				url: 'https://git-scm.com/'
			},
			{
				name: 'GitHub',
				icon: 'github-original-wordmark-removebg-preview.png',
				url: 'https://github.com/'
			},
			{
				name: 'GitHub Actions',
				icon: 'github-actions.png',
				url: 'https://github.com/features/actions'
			},
			{ name: 'Docker', icon: 'docker-original.svg', url: 'https://www.docker.com/' },
			{ name: 'VirtualBox', icon: 'virtualbox.png', url: 'https://www.virtualbox.org/' },
			{ name: 'AWS', icon: 'aws.webp', url: 'https://aws.amazon.com/' },
			{
				name: 'Anaconda',
				icon: 'white_bg_anaconda-original.png',
				url: 'https://www.anaconda.com/'
			},
			{ name: 'Poetry', icon: 'poetry.png', url: 'https://python-poetry.org/' },
			{ name: 'uv', icon: 'uv.svg', url: 'https://docs.astral.sh/uv/' },
			{ name: 'npm', icon: 'npm.webp', url: 'https://www.npmjs.com/' },
			{ name: 'Bun', icon: 'bun.png', url: 'https://bun.sh/' }
		]
	},
	{
		key: 'skills_ides',
		title: 'IDEs & Editors',
		emoji: '🖥️',
		icons: [
			{
				name: 'VSCode',
				icon: 'vscode-original.svg',
				url: 'https://code.visualstudio.com/'
			},
			{
				name: 'Visual Studio',
				icon: 'visualstudio-original.svg',
				url: 'https://visualstudio.microsoft.com/'
			},
			{
				name: 'Antigravity',
				icon: 'antigravity-color.png',
				url: 'https://antigravity.google'
			},
			{ name: 'Cursor', icon: 'Cursor_logo.png', url: 'https://cursor.com/get-started' },
			{
				name: 'Jupyter',
				icon: 'jupyter-original-wordmark-removebg-preview.png',
				url: 'https://jupyter.org/'
			},
			{ name: 'Unity', icon: 'white_bg_unity-original.png', url: 'https://unity.com/' },
			{
				name: 'Blender',
				icon: 'blender-original-removebg-preview.png',
				url: 'https://www.blender.org/'
			}
		]
	},
	{
		key: 'skills_os',
		title: 'Operating Systems & Security',
		emoji: '💻',
		icons: [
			{
				name: 'Windows',
				icon: 'white_bg_windows11-original.png',
				url: 'https://www.microsoft.com/windows'
			},
			{ name: 'Linux', icon: 'linux-original.svg', url: 'https://www.linux.org/' },
			{ name: 'Debian', icon: 'white_bg_Debian_logo.png', url: 'https://www.debian.org/' },
			{ name: 'Ubuntu', icon: 'ubuntu-original.svg', url: 'https://ubuntu.com/' },
			{
				name: 'Kali Linux',
				icon: 'white_bg_kalilinux-original-wordmark.png',
				url: 'https://www.kali.org/'
			},
			{
				name: 'Wireshark',
				icon: 'Wireshark_icon_new.png',
				url: 'https://www.wireshark.org/'
			},
			{
				name: 'Burp Suite',
				icon: 'burp.png',
				url: 'https://portswigger.net/burp'
			}
		]
	}
];
