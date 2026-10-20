import type { Translations } from '$lib/i18n';

export interface TechIcon {
	name: string;
	icon: string;
	url: string;
}

export interface SkillCategory {
	key: keyof Translations;
	title: string;
	icons: TechIcon[];
}

export const skillCategories: SkillCategory[] = [
	{
		key: 'skills_languages',
		title: 'Languages',
		icons: [
			{ name: 'Python', icon: 'python.svg', url: 'https://www.python.org/' },
			{ name: 'C', icon: 'c.svg', url: 'https://en.wikipedia.org/wiki/C_(programming_language)' },
			{ name: 'C++', icon: 'cplusplus.svg', url: 'https://isocpp.org/' },
			{ name: 'C#', icon: 'csharp.svg', url: 'https://docs.microsoft.com/en-us/dotnet/csharp/' },
			{ name: 'Rust', icon: 'rust.svg', url: 'https://www.rust-lang.org/' },
			{ name: 'Go', icon: 'go.svg', url: 'https://go.dev/' },
			{ name: 'Java', icon: 'java.png', url: 'https://www.java.com/' },
			{
				name: 'JavaScript',
				icon: 'javascript.png',
				url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
			},
			{ name: 'TypeScript', icon: 'typescript.png', url: 'https://www.typescriptlang.org/' },
			{ name: 'Bash', icon: 'bash.png', url: 'https://www.gnu.org/software/bash/' },
			{ name: 'Markdown', icon: 'markdown.svg', url: 'https://www.markdownguide.org/' },
			{ name: 'HTML', icon: 'html5.png', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
			{ name: 'CSS', icon: 'css3.png', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
			{ name: 'LaTeX', icon: 'latex.png', url: 'https://www.latex-project.org/' },
			{
				name: 'PowerShell',
				icon: 'powershell.svg',
				url: 'https://learn.microsoft.com/powershell/'
			},
			{ name: 'JSON', icon: 'json.svg', url: 'https://www.json.org/' },
			{ name: 'YAML', icon: 'yaml.svg', url: 'https://yaml.org/' }
		]
	},
	{
		key: 'skills_ml',
		title: 'Machine Learning & NLP',
		icons: [
			{ name: 'PyTorch', icon: 'pytorch.svg', url: 'https://pytorch.org/' },
			{ name: 'PyTorch Lightning', icon: 'pytorch-lightning.png', url: 'https://lightning.ai/' },
			{ name: 'TensorFlow', icon: 'tensorflow.png', url: 'https://www.tensorflow.org/' },
			{ name: 'Keras', icon: 'keras.svg', url: 'https://keras.io/' },
			{ name: 'Scikit-learn', icon: 'scikitlearn.png', url: 'https://scikit-learn.org/' },
			{ name: 'spaCy', icon: 'spacy.png', url: 'https://spacy.io/' },
			{ name: 'NLTK', icon: 'nltk.png', url: 'https://www.nltk.org/' },
			{ name: 'HuggingFace', icon: 'huggingface.png', url: 'https://huggingface.co/' },
			{ name: 'TRL', icon: 'trl.png', url: 'https://huggingface.co/docs/trl/' },
			{ name: 'Unsloth', icon: 'unsloth.webp', url: 'https://unsloth.ai/' },
			{ name: 'vLLM', icon: 'vllm.svg', url: 'https://docs.vllm.ai/' },
			{ name: 'Weights & Biases', icon: 'weights-biases.png', url: 'https://wandb.ai/' },
			{ name: 'Pydantic', icon: 'pydantic.svg', url: 'https://docs.pydantic.dev/' },
			{ name: 'ONNX', icon: 'onnx.svg', url: 'https://onnx.ai/' },
			{ name: 'XGBoost', icon: 'xgboost.png', url: 'https://xgboost.ai/' },
			{ name: 'LightGBM', icon: 'lightgbm.svg', url: 'https://lightgbm.readthedocs.io/' }
		]
	},
	{
		key: 'skills_llm',
		title: 'LLMs & Agents',
		icons: [
			{ name: 'LangChain', icon: 'langchain.jpg', url: 'https://www.langchain.com/' },
			{
				name: 'LangGraph',
				icon: 'langgraph.jpg',
				url: 'https://langchain-ai.github.io/langgraph/'
			},
			{ name: 'LangSmith', icon: 'langsmith.jpg', url: 'https://www.langchain.com/langsmith' },
			{ name: 'Ollama', icon: 'ollama.png', url: 'https://ollama.com/' },
			{ name: 'OpenAI', icon: 'openai.png', url: 'https://openai.com/' },
			{ name: 'Meta', icon: 'meta.webp', url: 'https://ai.meta.com/' },
			{
				name: 'Model Context Protocol',
				icon: 'model-context-protocol.jpg',
				url: 'https://modelcontextprotocol.io/'
			},
			{ name: 'Claude', icon: 'claude.png', url: 'https://claude.com/product/claude-code' },
			{ name: 'OpenCode', icon: 'opencode.webp', url: 'https://opencode.ai/' },
			{
				name: 'GitHub Copilot',
				icon: 'github-copilot.webp',
				url: 'https://github.com/features/copilot'
			}
		]
	},
	{
		key: 'skills_datascience',
		title: 'Data Science & Vision',
		icons: [
			{ name: 'NumPy', icon: 'numpy.svg', url: 'https://numpy.org/' },
			{ name: 'Pandas', icon: 'pandas.png', url: 'https://pandas.pydata.org/' },
			{ name: 'Polars', icon: 'polars.png', url: 'https://www.pola.rs/' },
			{ name: 'Matplotlib', icon: 'matplotlib.svg', url: 'https://matplotlib.org/' },
			{ name: 'Seaborn', icon: 'seaborn.svg', url: 'https://seaborn.pydata.org/' },
			{ name: 'Plotly', icon: 'plotly.png', url: 'https://plotly.com/' },
			{ name: 'OpenCV', icon: 'opencv.svg', url: 'https://opencv.org/' },
			{ name: 'Pillow', icon: 'pillow.png', url: 'https://pillow.readthedocs.io/' },
			{ name: 'Kaggle', icon: 'kaggle.svg', url: 'https://www.kaggle.com/' },
			{ name: 'SciPy', icon: 'scipy.svg', url: 'https://scipy.org/' }
		]
	},
	{
		key: 'skills_web',
		title: 'Web & Backend',
		icons: [
			{ name: 'Svelte', icon: 'svelte.png', url: 'https://svelte.dev/' },
			{ name: 'React', icon: 'react.png', url: 'https://react.dev/' },
			{ name: 'Three.js', icon: 'threejs.png', url: 'https://threejs.org/' },
			{ name: 'Node.js', icon: 'nodejs.webp', url: 'https://nodejs.org/' },
			{ name: 'Bun', icon: 'bun.png', url: 'https://bun.sh/' },
			{ name: 'npm', icon: 'npm.webp', url: 'https://www.npmjs.com/' },
			{ name: 'Vite', icon: 'vite.svg', url: 'https://vite.dev/' },
			{ name: 'FastAPI', icon: 'fastapi.svg', url: 'https://fastapi.tiangolo.com/' },
			{ name: 'Flask', icon: 'flask.png', url: 'https://flask.palletsprojects.com/' },
			{ name: 'Quart', icon: 'quart.png', url: 'https://quart.palletsprojects.com/' },
			{ name: 'Uvicorn', icon: 'uvicorn.png', url: 'https://www.uvicorn.org/' },
			{ name: 'Streamlit', icon: 'streamlit.svg', url: 'https://streamlit.io/' },
			{ name: 'Gradio', icon: 'gradio.png', url: 'https://www.gradio.app/' },
			{ name: 'Requests', icon: 'requests.png', url: 'https://requests.readthedocs.io/' },
			{
				name: 'BeautifulSoup',
				icon: 'beautifulsoup.jpg',
				url: 'https://www.crummy.com/software/BeautifulSoup/'
			},
			{ name: 'Selenium', icon: 'selenium.svg', url: 'https://www.selenium.dev/' },
			{ name: 'Next.js', icon: 'nextjs.svg', url: 'https://nextjs.org/' },
			{ name: 'Tailwind CSS', icon: 'tailwindcss.svg', url: 'https://tailwindcss.com/' },
			{ name: 'GraphQL', icon: 'graphql.svg', url: 'https://graphql.org/' }
		]
	},
	{
		key: 'skills_databases',
		title: 'Databases',
		icons: [
			{ name: 'MySQL', icon: 'mysql.png', url: 'https://www.mysql.com/' },
			{ name: 'PostgreSQL', icon: 'postgresql.png', url: 'https://www.postgresql.org/' },
			{ name: 'SQLite', icon: 'sqlite.png', url: 'https://www.sqlite.org/' },
			{ name: 'Redis', icon: 'redis.png', url: 'https://redis.io/' },
			{ name: 'Upstash', icon: 'upstash.png', url: 'https://upstash.com/' },
			{ name: 'Neo4j', icon: 'neo4j.png', url: 'https://neo4j.com/' },
			{ name: 'SPARQL', icon: 'sparql.png', url: 'https://www.w3.org/TR/rdf-sparql-query/' },
			{ name: 'SQLAlchemy', icon: 'sqlalchemy.png', url: 'https://www.sqlalchemy.org/' }
		]
	},
	{
		key: 'skills_retrieval',
		title: 'Retrieval & Vector Search',
		icons: [
			{ name: 'Chroma', icon: 'chroma.png', url: 'https://www.trychroma.com/' },
			{ name: 'Weaviate', icon: 'weaviate.png', url: 'https://weaviate.io/' },
			{
				name: 'Elasticsearch',
				icon: 'elasticsearch.svg',
				url: 'https://www.elastic.co/elasticsearch'
			},
			{ name: 'Qdrant', icon: 'qdrant.svg', url: 'https://qdrant.tech/' },
			{ name: 'Pinecone', icon: 'pinecone.svg', url: 'https://www.pinecone.io/' },
			{ name: 'Milvus', icon: 'milvus.svg', url: 'https://milvus.io/' }
		]
	},
	{
		key: 'skills_dataeng',
		title: 'Data Engineering',
		icons: [
			{ name: 'Apache Kafka', icon: 'apachekafka.svg', url: 'https://kafka.apache.org/' },
			{ name: 'Apache Spark', icon: 'apachespark.svg', url: 'https://spark.apache.org/' },
			{ name: 'Logstash', icon: 'logstash.svg', url: 'https://www.elastic.co/logstash' },
			{ name: 'Kibana', icon: 'kibana.svg', url: 'https://www.elastic.co/kibana' },
			{ name: 'n8n', icon: 'n8n.svg', url: 'https://n8n.io/' }
		]
	},
	{
		key: 'skills_devops',
		title: 'DevOps & Tools',
		icons: [
			{ name: 'Git', icon: 'git.png', url: 'https://git-scm.com/' },
			{ name: 'GitHub', icon: 'github.png', url: 'https://github.com/' },
			{
				name: 'GitHub Actions',
				icon: 'githubactions.png',
				url: 'https://github.com/features/actions'
			},
			{ name: 'Docker', icon: 'docker.svg', url: 'https://www.docker.com/' },
			{ name: 'AWS', icon: 'amazonwebservices.webp', url: 'https://aws.amazon.com/' },
			{ name: 'Vercel', icon: 'vercel.svg', url: 'https://vercel.com/' },
			{ name: 'Render', icon: 'render.jpeg', url: 'https://render.com/' },
			{ name: 'Railway', icon: 'railway.svg', url: 'https://railway.app/' },
			{ name: 'VirtualBox', icon: 'virtualbox.png', url: 'https://www.virtualbox.org/' },
			{ name: 'Anaconda', icon: 'anaconda.png', url: 'https://www.anaconda.com/' },
			{ name: 'Kubernetes', icon: 'kubernetes.svg', url: 'https://kubernetes.io/' }
		]
	},
	{
		key: 'skills_devtooling',
		title: 'Dev Tooling',
		icons: [
			{ name: 'Pytest', icon: 'pytest.webp', url: 'https://pytest.org/' },
			{ name: 'Poetry', icon: 'poetry.png', url: 'https://python-poetry.org/' },
			{ name: 'uv', icon: 'uv.svg', url: 'https://docs.astral.sh/uv/' },
			{ name: 'Ruff', icon: 'ruff.svg', url: 'https://docs.astral.sh/ruff/' },
			{ name: 'Pyright', icon: 'pyright.png', url: 'https://microsoft.github.io/pyright/' },
			{ name: 'Playwright', icon: 'playwright.svg', url: 'https://playwright.dev/' }
		]
	},
	{
		key: 'skills_ides',
		title: 'IDEs & Editors',
		icons: [
			{ name: 'VSCode', icon: 'vscode.svg', url: 'https://code.visualstudio.com/' },
			{
				name: 'Visual Studio',
				icon: 'visualstudio.svg',
				url: 'https://visualstudio.microsoft.com/'
			},
			{ name: 'Cursor', icon: 'cursor.png', url: 'https://cursor.com/get-started' },
			{ name: 'Antigravity', icon: 'antigravity.png', url: 'https://antigravity.google' },
			{ name: 'Jupyter', icon: 'jupyter.png', url: 'https://jupyter.org/' },
			{
				name: 'Google Colab',
				icon: 'google-colab.webp',
				url: 'https://colab.research.google.com/'
			},
			{ name: 'PHPMyAdmin', icon: 'phpmyadmin.png', url: 'https://www.phpmyadmin.net/' },
			{ name: 'Unity', icon: 'unity.png', url: 'https://unity.com/' },
			{ name: 'Blender', icon: 'blender.png', url: 'https://www.blender.org/' }
		]
	},
	{
		key: 'skills_os',
		title: 'Operating Systems & Security',
		icons: [
			{ name: 'Windows', icon: 'windows11.png', url: 'https://www.microsoft.com/windows' },
			{ name: 'Linux', icon: 'linux.svg', url: 'https://www.linux.org/' },
			{ name: 'Debian', icon: 'debian.png', url: 'https://www.debian.org/' },
			{ name: 'Ubuntu', icon: 'ubuntu.svg', url: 'https://ubuntu.com/' },
			{ name: 'Kali Linux', icon: 'kali-linux.png', url: 'https://www.kali.org/' },
			{ name: 'Wireshark', icon: 'wireshark.png', url: 'https://www.wireshark.org/' },
			{ name: 'Burp Suite', icon: 'burp-suite.png', url: 'https://portswigger.net/burp' },
			{ name: 'Nmap', icon: 'nmap.jpg', url: 'https://nmap.org/' },
			{ name: 'WSL', icon: 'wsl.png', url: 'https://learn.microsoft.com/windows/wsl/' }
		]
	}
];
