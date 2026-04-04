<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { projects as initialProjects, cardGradients, type Project } from './projectsData';
	import './projects.css';

	let isVisible = false;
	let projects = $state<Project[]>([...initialProjects]);

	// ─── GitHub stars fetch ─────────────────────────────────────────────────────
	function fetchWithTimeout(url: string, timeout = 5000) {
		return Promise.race([
			fetch(url),
			new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
		]);
	}

	async function fetchWithRetry(url: string, retries = 2, backoff = 1000) {
		for (let i = 0; i <= retries; i++) {
			try {
				const response = await fetchWithTimeout(url, 5000);
				if (response.ok) return response;
				if (response.status === 403 || response.status === 404) {
					throw new Error(`HTTP ${response.status}`);
				}
			} catch (error) {
				if (i === retries) throw error;
				await new Promise((resolve) => setTimeout(resolve, backoff * Math.pow(2, i)));
			}
		}
		throw new Error('Max retries reached');
	}

	async function fetchGitHubStars() {
		const fetchPromises = projects.map(async (project) => {
			try {
				const cacheKey = `github_stars_${project.githubUrl}`;
				const cached = localStorage.getItem(cacheKey);
				if (cached) {
					try {
						const { stars, timestamp } = JSON.parse(cached);
						if (Date.now() - timestamp < 3600000) {
							project.stars = stars;
							project.starsLoaded = true;
							projects = [...projects];
							return;
						}
					} catch {
						localStorage.removeItem(cacheKey);
					}
				}
				const match = project.githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
				if (match) {
					const [, owner, repo] = match;
					const response = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}`);
					const data = await response.json();
					project.stars = data.stargazers_count;
					project.starsLoaded = true;
					localStorage.setItem(
						cacheKey,
						JSON.stringify({ stars: data.stargazers_count, timestamp: Date.now() })
					);
					projects = [...projects];
				}
			} catch {
				project.starsLoaded = true;
				project.stars = undefined;
				projects = [...projects];
			}
		});
		await Promise.all(fetchPromises);
	}

	// ─── 3D Carousel ────────────────────────────────────────────────────────────

	let activeIndex = $state(0);
	let smoothOffset = $state(0); // Fractional offset for smooth auto-scroll
	let isAnimating = $state(false);
	let dragStartX = 0;
	let dragDelta = $state(0);
	let isDragging = $state(false);
	let dragMoved = false;
	let sectionEl: HTMLElement;

	const DRAG_THRESHOLD = 50;

	function goTo(idx: number) {
		if (isAnimating) return;
		isAnimating = true;
		smoothOffset = 0;
		activeIndex = ((idx % projects.length) + projects.length) % projects.length;
		setTimeout(() => (isAnimating = false), 500);
	}

	function prev() {
		goTo(activeIndex - 1);
	}
	function next() {
		goTo(activeIndex + 1);
	}

	function getCardStyle(i: number): string {
		const n = projects.length;
		let diff = i - activeIndex;

		if (diff > n / 2) diff -= n;
		if (diff < -n / 2) diff += n;

		// Smooth auto-scroll offset + drag offset
		const dragOffset = isDragging ? dragDelta / 400 : 0;
		const d = diff + dragOffset - smoothOffset;
		const absd = Math.abs(d);

		if (absd > 4.5) return 'visibility:hidden; opacity:0; pointer-events:none;';

		// ─── MATEMATICA CONCAVA ───
		const theta = 24;
		const angleDeg = d * theta;
		const angleRad = angleDeg * (Math.PI / 180);
		const R = 1100;

		// X: fattore 1.15 per evitare overlap con card 480px
		const tx = R * Math.sin(angleRad) * 1.15;

		// Z: il centro parte da -1100, le laterali salgono verso Z=0
		const tz = -R * Math.cos(angleRad) + 350;

		// Rotazione: guardano verso il centro
		const ry = -angleDeg;

		const brightness = Math.max(0.4, 1 - absd * 0.15);
		const opacity = absd > 3.5 ? Math.max(0, 1 - (absd - 3.5)) : 1;

		return `transform: translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg); opacity:${opacity}; filter: brightness(${brightness});`;
	}

	function onPointerDown(e: PointerEvent) {
		if (isAnimating) return;
		isDragging = true;
		dragStartX = e.clientX;
		dragDelta = 0;
		dragMoved = false;
		stopAutoPlay();
	}
	function onPointerMove(e: PointerEvent) {
		if (!isDragging) return;
		dragDelta = e.clientX - dragStartX;
		if (Math.abs(dragDelta) > 15) dragMoved = true;
	}
	function onPointerUp() {
		if (!isDragging) return;
		isDragging = false;
		if (Math.abs(dragDelta) > DRAG_THRESHOLD) {
			if (dragDelta > 0) prev();
			else next();
		}
		dragDelta = 0;
		startAutoPlay();
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') closePanel();
	}

	// ── Auto-play (smooth continuous) ──────────────────────────────────────
	let autoPlayRaf: number | null = null;
	let lastTime = 0;
	const AUTO_SPEED = 0.12; // Cards per second

	function autoPlayLoop(time: number) {
		if (lastTime > 0) {
			const dt = (time - lastTime) / 1000;
			smoothOffset += dt * AUTO_SPEED;

			// When we've scrolled a full card, snap to the next index
			if (smoothOffset >= 1) {
				smoothOffset = 0;
				activeIndex = (activeIndex + 1) % projects.length;
			}
		}
		lastTime = time;
		autoPlayRaf = requestAnimationFrame(autoPlayLoop);
	}

	function startAutoPlay() {
		stopAutoPlay();
		lastTime = 0;
		autoPlayRaf = requestAnimationFrame(autoPlayLoop);
	}
	function stopAutoPlay() {
		if (autoPlayRaf) {
			cancelAnimationFrame(autoPlayRaf);
			autoPlayRaf = null;
		}
		// Snap to nearest card instead of jumping back
		if (smoothOffset > 0.5) {
			activeIndex = (activeIndex + 1) % projects.length;
		}
		smoothOffset = 0;
		lastTime = 0;
	}

	// ── Expand state ────────────────────────────────────────────────────────
	let expandedProject: Project | null = $state.raw(null);
	let panelExpanded = $state(false);

	async function openCard(p: Project, i: number) {
		if (dragMoved) return;
		stopAutoPlay();
		if (i !== activeIndex) {
			goTo(i);
			// Wait for animation to finish then open
			setTimeout(async () => {
				expandedProject = p;
				panelExpanded = false;
				await tick();
				requestAnimationFrame(() =>
					requestAnimationFrame(() => {
						panelExpanded = true;
					})
				);
			}, 550);
			return;
		}
		expandedProject = p;
		panelExpanded = false;
		await tick();
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				panelExpanded = true;
			})
		);
	}
	function closePanel() {
		panelExpanded = false;
		setTimeout(() => {
			expandedProject = null;
			startAutoPlay();
		}, 380);
	}

	function getCardBg(i: number): string {
		const p = projects[i];
		if (p.accentColor) return p.accentColor;
		return cardGradients[i % cardGradients.length];
	}
	function getLinkLabel(type: string): string {
		if (type === 'download') return 'Download';
		if (type === 'youtube') return 'Watch';
		if (type === 'hackathon') return 'Hackathon';
		return 'Demo';
	}

	onMount(() => {
		window.addEventListener('keydown', onKeyDown);
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting && !isVisible) {
						isVisible = true;
						fetchGitHubStars();
					}
					if (e.isIntersecting) startAutoPlay();
					else stopAutoPlay();
				}),
			{ threshold: 0.05, rootMargin: '100px' }
		);
		io.observe(sectionEl);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			stopAutoPlay();
			io.disconnect();
		};
	});
</script>

<section id="projects" class="projects" bind:this={sectionEl}>
	<div class="container">
		<h2 class="section-title">Personal Projects</h2>
	</div>

	<!-- 3D Carousel -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="carousel-viewport"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		<div class="carousel-stage">
			{#each projects as project, i}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="carousel-card"
					class:is-active={i === activeIndex}
					style={getCardStyle(i)}
					onclick={() => openCard(project, i)}
				>
					<div class="carousel-card-bg">
						{#if project.image}
							<img src={project.image} alt={project.title} loading="lazy" decoding="async" />
						{:else}
							<div class="carousel-card-grad" style="background:{getCardBg(i)}"></div>
						{/if}
					</div>
					<div class="carousel-card-overlay"></div>
					{#if project.isHackathonWinner}
						<span class="carousel-badge">🏆 Winner</span>
					{/if}
					{#if project.starsLoaded && project.stars !== undefined && project.stars > 0}
						<span class="carousel-stars">⭐ {project.stars}</span>
					{/if}
					<div class="carousel-card-body">
						<span class="carousel-card-icon">{project.icon}</span>
						<h3 class="carousel-card-title">{project.title}</h3>
						<div class="carousel-card-tags">
							{#each project.techTags.slice(0, 4) as t}
								<span class="carousel-card-tag">{t}</span>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Expanded card panel -->
	{#if expandedProject}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="exp-backdrop" class:is-visible={panelExpanded} onclick={closePanel}></div>

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<aside class="exp-panel" class:is-open={panelExpanded}>
			<div
				class="exp-visual"
				style={expandedProject.image
					? `background-image:url('${expandedProject.image}')`
					: `background:${getCardBg(activeIndex)}`}
			>
				<div class="exp-voverlay"></div>
				<button class="exp-close" onclick={closePanel} aria-label="Close">✕</button>
				{#if expandedProject.isHackathonWinner}
					<span class="exp-trophy">🏆 Hackathon Winner</span>
				{/if}
				<div class="exp-title-area">
					<span class="exp-icon">{expandedProject.icon}</span>
					<h3 class="exp-title">{expandedProject.title}</h3>
				</div>
			</div>

			<div class="exp-body">
				<p class="exp-desc">{@html expandedProject.description}</p>
				<div class="exp-tags">
					{#each expandedProject.techTags as t}
						<span class="exp-tag">{t}</span>
					{/each}
				</div>
				<div class="exp-footer">
					{#if expandedProject.starsLoaded && expandedProject.stars !== undefined}
						<span class="exp-stars">⭐ {expandedProject.stars} stars</span>
					{:else}
						<span></span>
					{/if}
					<div class="exp-links">
						{#if expandedProject.externalLink}
							<a
								href={expandedProject.externalLink.url}
								target="_blank"
								rel="noopener noreferrer"
								class="exp-link"
								download={expandedProject.externalLink.type === 'download' ? true : undefined}
							>
								<i class={expandedProject.externalLink.icon}></i>
								{getLinkLabel(expandedProject.externalLink.type)}
							</a>
						{/if}
						<a
							href={expandedProject.githubUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="exp-link exp-link-primary"
						>
							<i class="fab fa-github"></i> View on GitHub
						</a>
					</div>
				</div>
			</div>
		</aside>
	{/if}

	<div class="container">
		<div class="view-all">
			<a
				href="https://github.com/GiuseppeBellamacina?tab=repositories"
				target="_blank"
				class="btn btn-primary"
			>
				View All Projects on GitHub
			</a>
		</div>
	</div>
</section>
