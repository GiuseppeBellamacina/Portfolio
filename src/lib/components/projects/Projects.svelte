<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { t, lang } from '$lib/i18n';
	import { getProjects, cardGradients, type Project } from './projectsData';
	import './projects.css';

	let isVisible = false;
	let projects = $state<Project[]>([...getProjects('en')]);
	let starsLoading = $state(false);

	// Keep projects in sync with language
	$effect(() => {
		const currentLang = $lang;
		const newProjects = getProjects(currentLang);
		const oldProjects = untrack(() => projects);
		projects = newProjects.map((p, i) => ({
			...p,
			stars: oldProjects[i]?.stars,
			starsLoaded: oldProjects[i]?.starsLoaded
		}));
	});

	// ─── View mode ──────────────────────────────────────────────────────────────
	let viewMode = $state<'carousel' | 'grid'>('carousel');

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
		if (starsLoading) return;
		starsLoading = true;
		const fetchPromises = projects.map(async (project) => {
			if (project.skipStars) {
				project.starsLoaded = true;
				project.stars = undefined;
				projects = [...projects];
				return;
			}
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
		starsLoading = false;
	}

	// ─── Carousel (highlights only) ────────────────────────────────────────────
	// Concave 3D ring; each card is tinted with its own colour and a matching glow

	let featured = $derived(projects.filter((p) => p.importance === 3));

	let floatIndex = $state(0);
	let targetIndex = $state(0);
	let dragStartX = 0;
	let dragStartIndex = 0;
	let isDragging = $state(false);
	let dragMoved = false;
	let sectionEl: HTMLElement;

	let lastPointerX = 0;
	let lastPointerTime = 0;
	let velocity = 0;

	const DRAG_SENSITIVITY = 300;
	const CLICK_MOVE_THRESHOLD = 10;

	const mod = (a: number, n: number) => ((a % n) + n) % n;
	let activeIndex = $derived(featured.length ? mod(Math.round(floatIndex), featured.length) : 0);

	// Spring physics
	let snapRaf: number | null = null;
	let snapLastTime = 0;
	let snapVelocity = 0;
	const SPRING_STIFFNESS = 120;
	const SPRING_DAMPING = 14;
	const SPRING_SETTLE = 0.003;

	function startSnapAnimation(initialVelocity = 0) {
		stopSnapAnimation();
		snapVelocity = initialVelocity;
		snapLastTime = 0;
		function springTick(time: number) {
			if (snapLastTime === 0) {
				snapLastTime = time;
				snapRaf = requestAnimationFrame(springTick);
				return;
			}
			const dt = Math.min((time - snapLastTime) / 1000, 0.05);
			snapLastTime = time;
			const displacement = floatIndex - targetIndex;
			const springForce = -SPRING_STIFFNESS * displacement - SPRING_DAMPING * snapVelocity;
			snapVelocity += springForce * dt;
			floatIndex += snapVelocity * dt;
			if (Math.abs(displacement) < SPRING_SETTLE && Math.abs(snapVelocity) < SPRING_SETTLE) {
				floatIndex = targetIndex;
				snapRaf = null;
				return;
			}
			snapRaf = requestAnimationFrame(springTick);
		}
		snapRaf = requestAnimationFrame(springTick);
	}
	function stopSnapAnimation() {
		if (snapRaf) {
			cancelAnimationFrame(snapRaf);
			snapRaf = null;
		}
	}

	let vw = $state(1440);

	// Card size, shared by the transforms below and the CSS (--card-w/--card-h)
	let cardSize = $derived.by(() => {
		if (vw <= 768) return { w: Math.min(vw * 0.78, 330), h: 430 };
		const w = Math.min(640, vw * 0.44);
		return { w, h: Math.round(w * 0.68) };
	});

	// Concave ring: the cards sit on the inside of a cylinder, so the neighbours turn
	// towards you. The centre card is pushed back just enough to keep it large while
	// the sides stay readable next to it.
	function getCardStyle(i: number): string {
		const n = featured.length;
		let diff = i - floatIndex;
		diff = diff - n * Math.round(diff / n);
		const absd = Math.abs(diff);
		if (absd > 2.6) return 'visibility:hidden; opacity:0;';
		const mobile = vw <= 768;
		const theta = mobile ? 34 : 28;
		const R = (mobile ? 1.9 : 1.55) * cardSize.w;
		const depth = mobile ? 160 : 260;
		const a = (diff * theta * Math.PI) / 180;
		const tx = R * Math.sin(a) * 1.08;
		const tz = R * (1 - Math.cos(a)) * 0.55 - depth;
		const ry = -diff * theta;
		const brightness = Math.max(0.45, 1 - absd * 0.28);
		const opacity = absd > 1.6 ? Math.max(0, 2.6 - absd) : 1;
		return `transform: translate3d(${tx.toFixed(1)}px, 0, ${tz.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg); opacity:${opacity.toFixed(3)}; filter: brightness(${brightness.toFixed(2)}); z-index:${10 - Math.round(absd)};`;
	}

	function goTo(i: number) {
		const n = featured.length;
		let d = i - activeIndex;
		d -= n * Math.round(d / n);
		targetIndex = Math.round(floatIndex) + d;
		progress = 0;
		startSnapAnimation();
	}

	function onCardClick(i: number) {
		if (dragMoved) return;
		if (i === activeIndex) onGridCardClick(featured[i]);
		else goTo(i);
	}

	// ── Drag ──
	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		dragStartX = e.clientX;
		dragStartIndex = floatIndex;
		dragMoved = false;
		isDragging = false;
		velocity = 0;
		lastPointerX = e.clientX;
		lastPointerTime = performance.now();
		window.addEventListener('pointermove', onPointerMoveGlobal);
		window.addEventListener('pointerup', onPointerUpGlobal);
		window.addEventListener('pointercancel', onPointerUpGlobal);
	}
	function onPointerMoveGlobal(e: PointerEvent) {
		const dx = e.clientX - dragStartX;
		if (!isDragging) {
			if (Math.abs(dx) < CLICK_MOVE_THRESHOLD) return;
			isDragging = true;
			dragMoved = true;
			progress = 0;
			stopSnapAnimation();
			dragStartX = e.clientX;
			dragStartIndex = floatIndex;
		}
		const now = performance.now();
		const dt = (now - lastPointerTime) / 1000;
		if (dt > 0.001) {
			const instantV = -(e.clientX - lastPointerX) / DRAG_SENSITIVITY / dt;
			velocity = velocity * 0.6 + instantV * 0.4;
			lastPointerX = e.clientX;
			lastPointerTime = now;
		}
		floatIndex = dragStartIndex - (e.clientX - dragStartX) / DRAG_SENSITIVITY;
	}
	function onPointerUpGlobal() {
		const wasDragging = isDragging;
		isDragging = false;
		window.removeEventListener('pointermove', onPointerMoveGlobal);
		window.removeEventListener('pointerup', onPointerUpGlobal);
		window.removeEventListener('pointercancel', onPointerUpGlobal);
		if (!wasDragging) return;
		const MAX_VELOCITY = 4;
		const clampedV = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));
		const coastDistance = (clampedV * Math.abs(clampedV)) / (SPRING_DAMPING * 2);
		targetIndex = Math.round(floatIndex + coastDistance);
		startSnapAnimation(clampedV);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') closePanel();
	}
	function onCarouselKeyDown(e: KeyboardEvent) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		goTo(activeIndex + (e.key === 'ArrowRight' ? 1 : -1));
	}

	// ── Auto-play: one step every AUTO_MS, the active dot fills as progress ──
	const AUTO_MS = 5000;
	let progress = $state(0);
	// Only keyboard focus pauses it: the mouse never does, and a click focuses the viewport
	let focused = false;
	let reducedMotion = false;
	let autoPlayRaf: number | null = null;
	let autoLastTime = 0;

	function autoPlayLoop(time: number) {
		if (autoLastTime > 0 && !focused && !isDragging && expandedProjectIndex === null) {
			progress += (time - autoLastTime) / AUTO_MS;
			if (progress >= 1) {
				progress = 0;
				targetIndex = Math.round(floatIndex) + 1;
				startSnapAnimation();
			}
		}
		autoLastTime = time;
		autoPlayRaf = requestAnimationFrame(autoPlayLoop);
	}
	function startAutoPlay() {
		stopAutoPlay();
		if (reducedMotion) return;
		autoPlayRaf = requestAnimationFrame(autoPlayLoop);
	}
	function stopAutoPlay() {
		if (autoPlayRaf) {
			cancelAnimationFrame(autoPlayRaf);
			autoPlayRaf = null;
		}
		autoLastTime = 0;
	}

	// First paragraph of the long HTML description, as plain text
	function summary(html: string): string {
		return html
			.split('<br>')[0]
			.replace(/<[^>]+>/g, '')
			.replace(/&amp;/g, '&')
			.replace(/&nbsp;/g, ' ')
			.trim();
	}

	// ─── All projects: mosaic, highlights first and twice as wide ──────────────
	let mosaic = $derived([...projects].sort((a, b) => (b.importance ?? 1) - (a.importance ?? 1)));

	// ─── Expand state (grid view) ───────────────────────────────────────────────
	// Store the index so the panel reacts to language changes via $derived
	let expandedProjectIndex = $state<number | null>(null);
	let expandedProject = $derived(
		expandedProjectIndex !== null ? projects[expandedProjectIndex] : null
	);
	let panelExpanded = $state(false);

	// The section's containment (performance.css) would make it the containing block of the
	// fixed panel, centering it on the section: render the panel in <body> instead
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}

	// Lock page scroll while a project panel is open
	$effect(() => {
		if (!expandedProject) return;
		const root = document.documentElement;
		const prev = root.style.overflow;
		root.style.overflow = 'hidden';
		return () => {
			root.style.overflow = prev;
		};
	});

	function onGridCardClick(p: Project) {
		window.dispatchEvent(new CustomEvent('project-open', { detail: p.title }));
		expandedProjectIndex = projects.indexOf(p);
		panelExpanded = false;
		tick().then(() => {
			requestAnimationFrame(() =>
				requestAnimationFrame(() => {
					panelExpanded = true;
				})
			);
		});
	}
	function closePanel() {
		panelExpanded = false;
		setTimeout(() => {
			expandedProjectIndex = null;
		}, 380);
	}

	function getCardBgForProject(p: Project): string {
		if (p.accentColor) return p.accentColor;
		const idx = projects.indexOf(p);
		return cardGradients[(idx >= 0 ? idx : 0) % cardGradients.length];
	}
	function getLinkLabel(type: string): string {
		const tr = $t;
		if (type === 'download') return tr.proj_download;
		if (type === 'youtube') return tr.proj_watch;
		if (type === 'hackathon') return tr.proj_hackathon;
		return tr.proj_demo;
	}

	function toggleView() {
		// The mascot comments the switch
		window.dispatchEvent(
			new CustomEvent('projects-view', { detail: viewMode === 'carousel' ? 'grid' : 'carousel' })
		);
		if (viewMode === 'carousel') {
			stopAutoPlay();
			stopSnapAnimation();
			viewMode = 'grid';
			tick().then(() => {
				sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			});
		} else {
			viewMode = 'carousel';
			tick().then(() => {
				startAutoPlay();
				sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			});
		}
	}

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		vw = window.innerWidth;
		const onResize = () => (vw = window.innerWidth);
		window.addEventListener('resize', onResize);
		window.addEventListener('keydown', onKeyDown);
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting && !isVisible) {
						isVisible = true;
						fetchGitHubStars();
						if (viewMode === 'carousel') startAutoPlay();
					} else if (!e.isIntersecting && isVisible) {
						isVisible = false;
						stopAutoPlay();
						stopSnapAnimation();
					}
				}),
			{ threshold: 0.05, rootMargin: '100px' }
		);
		io.observe(sectionEl);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('pointermove', onPointerMoveGlobal);
			window.removeEventListener('pointerup', onPointerUpGlobal);
			window.removeEventListener('pointercancel', onPointerUpGlobal);
			stopAutoPlay();
			stopSnapAnimation();
			io.disconnect();
		};
	});
</script>

<section
	id="projects"
	class="projects"
	class:grid-active={viewMode === 'grid'}
	bind:this={sectionEl}
>
	<div class="container">
		<h2 class="section-title">{$t.proj_title}</h2>
	</div>

	{#if viewMode === 'carousel'}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<!-- WAI-ARIA carousel pattern: focusable region so keyboard users can arrow-navigate -->
		<div
			class="carousel-viewport"
			style="--card-w:{cardSize.w}px; --card-h:{cardSize.h}px"
			tabindex="0"
			role="region"
			aria-roledescription="carousel"
			aria-label={$t.nav_projects}
			onpointerdown={onPointerDown}
			onkeydown={onCarouselKeyDown}
			onfocusin={(e) => (focused = (e.target as HTMLElement).matches(':focus-visible'))}
			onfocusout={() => (focused = false)}
		>
			{#each featured as project, i (project.title)}
				{@const active = i === activeIndex}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
				<article
					class="carousel-card"
					class:is-active={active}
					style={getCardStyle(i)}
					aria-hidden={!active}
					onclick={() => onCardClick(i)}
				>
					<div class="carousel-card-bg">
						{#if project.image}
							<img src={project.image} alt="" loading="lazy" decoding="async" draggable="false" />
						{:else}
							<div
								class="carousel-card-grad"
								style="background:{getCardBgForProject(project)}"
							></div>
						{/if}
					</div>
					<div class="carousel-card-overlay"></div>
					{#if project.isWip}
						<span class="wip-tape"><span>🚧 {$t.proj_wip}</span></span>
					{/if}
					{#if project.isHackathonWinner}
						<span class="carousel-badge">🏆 {$t.proj_winner}</span>
					{/if}
					{#if project.starsLoaded && project.stars !== undefined && project.stars > 0}
						<span class="carousel-stars">★ {project.stars}</span>
					{/if}
					<div class="carousel-card-body">
						{#if project.metric}
							<span class="carousel-metric">{project.metric}</span>
						{/if}
						<h3 class="carousel-card-title">{project.title}</h3>
						<p class="carousel-card-desc">{summary(project.description)}</p>
						<div class="carousel-card-actions">
							<button
								class="carousel-cta"
								tabindex={active ? 0 : -1}
								onclick={(e) => {
									e.stopPropagation();
									if (!dragMoved) onGridCardClick(project);
								}}
							>
								{$t.proj_details}
							</button>
							<a
								class="carousel-code"
								href={project.githubUrl}
								target="_blank"
								rel="noopener noreferrer"
								tabindex={active ? 0 : -1}
								onclick={(e) => e.stopPropagation()}
							>
								<i class="fab fa-github"></i> GitHub
							</a>
						</div>
					</div>
				</article>
			{/each}
		</div>
		<div class="carousel-nav">
			<button
				class="carousel-arrow"
				aria-label="Previous project"
				onclick={() => goTo(activeIndex - 1)}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
					><path d="M15 6l-6 6 6 6" /></svg
				>
			</button>
			<div class="carousel-dots">
				{#each featured as project, i}
					<button
						class="carousel-dot"
						class:is-active={i === activeIndex}
						style={i === activeIndex ? `--p:${progress}` : ''}
						aria-label={project.title}
						aria-current={i === activeIndex}
						onclick={() => goTo(i)}
					></button>
				{/each}
			</div>
			<button
				class="carousel-arrow"
				aria-label="Next project"
				onclick={() => goTo(activeIndex + 1)}
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
					><path d="M9 6l6 6-6 6" /></svg
				>
			</button>
		</div>
	{:else}
		<!-- All projects: uniform mosaic; only the highlights are wider -->
		<div class="grid-container">
			{#each mosaic as project}
				<button
					class="pcard"
					class:is-featured={project.importance === 3}
					onclick={() => onGridCardClick(project)}
				>
					{#if project.image}
						<img src={project.image} alt="" loading="lazy" decoding="async" />
					{:else}
						<span class="pcard-grad" style="background:{getCardBgForProject(project)}"></span>
					{/if}
					<span class="pcard-shade"></span>
					{#if project.isWip}
						<span class="pcard-flag pcard-wip">WIP</span>
					{:else if project.isHackathonWinner}
						<span class="pcard-flag">🏆</span>
					{/if}
					<span class="pcard-body">
						<span class="pcard-title">{project.title}</span>
						<span class="pcard-sum">{summary(project.description)}</span>
					</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Expanded card panel -->
	{#if expandedProject}
		<div use:portal>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="exp-backdrop" class:is-visible={panelExpanded} onclick={closePanel}></div>

			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<aside class="exp-panel" class:is-open={panelExpanded}>
				<div
					class="exp-visual"
					style={expandedProject.image
						? `background-image:url('${expandedProject.image}')`
						: `background:${getCardBgForProject(expandedProject)}`}
				>
					<div class="exp-voverlay"></div>
					{#if expandedProject.isWip}
						<span class="wip-tape"><span>🚧 {$t.proj_wip}</span></span>
					{/if}
					<button class="exp-close" onclick={closePanel} aria-label="Close">✕</button>
					{#if expandedProject.isHackathonWinner}
						<span class="exp-trophy">{$t.proj_hackathonWinner}</span>
					{/if}
					<div class="exp-title-area">
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
							<span class="exp-stars">⭐ {expandedProject.stars} {$t.proj_stars}</span>
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
								<i class="fab fa-github"></i>
								{$t.proj_viewOnGithub}
							</a>
						</div>
					</div>
				</div>
			</aside>
		</div>
	{/if}

	<div class="container">
		<div class="projects-buttons">
			<a
				href="https://github.com/GiuseppeBellamacina?tab=repositories"
				target="_blank"
				class="btn btn-primary"
			>
				<i class="fab fa-github"></i>
				{$t.proj_viewAllRepos}
			</a>
			<button class="btn btn-secondary" onclick={toggleView}>
				{#if viewMode === 'carousel'}
					<i class="fas fa-th"></i> {$t.proj_showAll}
				{:else}
					<i class="fas fa-stream"></i> {$t.proj_showHighlights}
				{/if}
			</button>
		</div>
	</div>
</section>
