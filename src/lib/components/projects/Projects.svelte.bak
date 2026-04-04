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

	// Funzione retry con backoff esponenziale
	async function fetchWithRetry(url: string, retries = 2, backoff = 1000) {
		for (let i = 0; i <= retries; i++) {
			try {
				const response = await fetchWithTimeout(url, 5000);
				if (response.ok) {
					return response;
				}
				// Se la risposta è 403 (rate limit) o 404, non ritentare
				if (response.status === 403 || response.status === 404) {
					throw new Error(`HTTP ${response.status}`);
				}
			} catch (error) {
				if (i === retries) throw error;
				// Backoff esponenziale
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

	// ─── Marquee Carousel ───────────────────────────────────────────────────────

	type ProjectWithIdx = Project & { _idx: number };
	const enriched: ProjectWithIdx[] = [...initialProjects].map((p, i) => ({ ...p, _idx: i }));
	const row0: ProjectWithIdx[] = enriched.filter((_, i) => i % 2 === 0);
	const row1: ProjectWithIdx[] = enriched.filter((_, i) => i % 2 === 1);

	// ── Drag-scroll state ──────────────────────────────────────────────────────
	const CARD_W = 280;
	const GAP = 20;
	const STEP = CARD_W + GAP; // pixels per card slot

	// Each strip holds 2 copies → half-width is N * STEP
	const halfW = [row0.length * STEP, row1.length * STEP];

	let stripEls: (HTMLElement | null)[] = [null, null];
	// pos[0] starts at 0 (scrolls left → decrements)
	// pos[1] starts at -halfW[1] (scrolls right → increments)
	let pos = [0, -halfW[1]];
	let vel = [0, 0];
	const AUTO = [-0.45, 0.5]; // px/frame auto-speed (negative = scroll left, positive = right)

	let dragging = $state(-1); // which row is being dragged (-1 = none)
	let dragLastX = 0;
	let dragStartX = 0;
	let dragVel = 0;
	let dragMoved = $state(false); // true once mouse moved > threshold
	let dragTargetEl: HTMLElement | null = null;
	let rafId = 0;
	let sectionEl: HTMLElement;

	// ── Hover state ────────────────────────────────────────────────────────────
	let hoveredProject: ProjectWithIdx | null = $state.raw(null);

	function loop() {
		const paused = !!hoveredProject || !!expandedProject;
		for (let i = 0; i < 2; i++) {
			if (dragging !== -1) {
				// While any row is being dragged, both rows freeze auto-scroll
				if (dragging === i) vel[i] *= 0.85;
			} else if (!paused) {
				// Auto-scroll, paused on hover or expand
				vel[i] = vel[i] * 0.93 + AUTO[i] * 0.07;
				pos[i] += vel[i];
			}
			// Infinite wrap
			if (pos[i] <= -halfW[i]) pos[i] += halfW[i];
			if (pos[i] >= 0) pos[i] -= halfW[i];
			if (stripEls[i]) stripEls[i]!.style.transform = `translateX(${pos[i]}px)`;
		}
		// Clear hover when strips are visibly moving (dragging or inertia)
		if (hoveredProject && (dragging !== -1 || Math.abs(vel[0]) > 0.8 || Math.abs(vel[1]) > 0.8)) {
			hoveredProject = null;
		}
		rafId = requestAnimationFrame(loop);
	}

	function startDrag(e: MouseEvent, row: number) {
		if (e.button !== 0) return;
		dragging = row;
		dragStartX = e.clientX;
		dragLastX = e.clientX;
		dragVel = 0;
		dragMoved = false;
		dragTargetEl = (e.target as HTMLElement).closest('.pcard') as HTMLElement | null;
	}
	function startDragTouch(e: TouchEvent, row: number) {
		if (e.touches.length !== 1) return;
		const t = e.touches[0];
		dragging = row;
		dragStartX = t.clientX;
		dragLastX = t.clientX;
		dragVel = 0;
		dragMoved = false;
		dragTargetEl = (e.target as HTMLElement).closest('.pcard') as HTMLElement | null;
	}
	function onMouseMove(e: MouseEvent) {
		if (dragging === -1) return;
		const dx = e.clientX - dragLastX;
		if (!dragMoved) {
			if (Math.abs(e.clientX - dragStartX) < 6) return; // below threshold
			dragMoved = true;
		}
		dragLastX = e.clientX;
		dragVel = dx;
		// Move dragged row + counter-rotate the other row
		const other = dragging === 0 ? 1 : 0;
		pos[dragging] += dx;
		pos[other] -= dx;
		for (const i of [dragging, other]) {
			if (pos[i] <= -halfW[i]) pos[i] += halfW[i];
			if (pos[i] >= 0) pos[i] -= halfW[i];
		}
	}
	function onTouchMove(e: TouchEvent) {
		if (dragging === -1 || e.touches.length !== 1) return;
		const t = e.touches[0];
		const dx = t.clientX - dragLastX;
		if (!dragMoved) {
			if (Math.abs(t.clientX - dragStartX) < 6) return;
			dragMoved = true;
		}
		e.preventDefault();
		dragLastX = t.clientX;
		dragVel = dx;
		const other = dragging === 0 ? 1 : 0;
		pos[dragging] += dx;
		pos[other] -= dx;
		for (const i of [dragging, other]) {
			if (pos[i] <= -halfW[i]) pos[i] += halfW[i];
			if (pos[i] >= 0) pos[i] -= halfW[i];
		}
	}
	function endDrag() {
		if (dragging === -1) return;
		const i = dragging;
		const other = i === 0 ? 1 : 0;
		if (!dragMoved) {
			// It was a click — open the card that was pressed
			if (dragTargetEl) {
				// Find the project from the target element's data
				const title = dragTargetEl.getAttribute('aria-label');
				const p = enriched.find((e) => e.title === title);
				if (p) openCard(p);
			}
		} else {
			vel[i] = dragVel;
			vel[other] = -dragVel; // counter-rotate inertia
		}
		dragVel = 0;
		dragging = -1;
		dragMoved = false;
		dragTargetEl = null;
	}

	// ── Hover highlight + 3D tilt ──────────────────────────────────────────────
	let tiltStyle = $state('');

	function onCardEnter(p: ProjectWithIdx) {
		hoveredProject = p;
	}
	function onCardLeave() {
		hoveredProject = null;
		tiltStyle = '';
	}
	function onCardMouseMove(e: MouseEvent, p: ProjectWithIdx) {
		if (hoveredProject !== p) return;
		const card = e.currentTarget as HTMLElement;
		const rect = card.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;
		const ry = (x - 0.5) * 16;
		const rx = (0.5 - y) * 16;
		tiltStyle = `--tilt-rx:${rx.toFixed(1)}deg;--tilt-ry:${ry.toFixed(1)}deg;--shine-x:${(x * 100).toFixed(0)}%;--shine-y:${(y * 100).toFixed(0)}%`;
	}

	// ── Expand state ────────────────────────────────────────────────────────
	let expandedProject: ProjectWithIdx | null = $state.raw(null);
	let panelExpanded = $state(false);

	async function openCard(p: ProjectWithIdx) {
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
		}, 380);
	}
	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') closePanel();
	}

	function getCardBg(p: ProjectWithIdx): string {
		if (p.accentColor) return p.accentColor;
		return cardGradients[p._idx % cardGradients.length];
	}
	function getLinkLabel(type: string): string {
		if (type === 'download') return 'Download';
		if (type === 'youtube') return 'Watch';
		if (type === 'hackathon') return 'Hackathon';
		return 'Demo';
	}

	onMount(() => {
		rafId = requestAnimationFrame(loop);
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', endDrag);
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('touchend', endDrag);
		window.addEventListener('keydown', onKeyDown);
		const io = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => {
					if (e.isIntersecting && !isVisible) {
						isVisible = true;
						fetchGitHubStars();
					}
				}),
			{ threshold: 0.05, rootMargin: '100px' }
		);
		io.observe(sectionEl);
		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', endDrag);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', endDrag);
			window.removeEventListener('keydown', onKeyDown);
			io.disconnect();
		};
	});
</script>

<section id="projects" class="projects" bind:this={sectionEl}>
	<div class="container">
		<h2 class="section-title">Personal Projects</h2>
		<p class="proj-hint">← Drag to explore →</p>
	</div>

	<!-- ─── Row 0 ────────────────────────────────────────────────────────────── -->
	<div class="strip-outer">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="strip-wrap"
			class:dragging-active={dragging === 0}
			onmousedown={(e) => startDrag(e, 0)}
			ontouchstart={(e) => startDragTouch(e, 0)}
		>
			<div class="strip" bind:this={stripEls[0]}>
				{#each [...row0, ...row0] as project}
					<article
						class="pcard"
						class:is-hovered={hoveredProject === project && !dragMoved}
						class:is-dimmed={hoveredProject !== null && hoveredProject !== project}
						style={`${!project.image ? `--card-grad:${getCardBg(project)};` : ''}${hoveredProject === project ? tiltStyle : ''}`}
						onmouseenter={() => onCardEnter(project)}
						onmouseleave={onCardLeave}
						onmousemove={(e) => onCardMouseMove(e, project)}
						aria-label={project.title}
					>
						<div class="pcard-bg">
							{#if project.image}
								<img src={project.image} alt={project.title} loading="lazy" decoding="async" />
							{/if}
						</div>
						<div class="pcard-overlay"></div>
						<div class="pcard-shine"></div>
						{#if project.isHackathonWinner}
							<span class="pcard-badge">🏆 Winner</span>
						{/if}
						{#if project.starsLoaded && project.stars !== undefined && project.stars > 0}
							<span class="pcard-stars">⭐ {project.stars}</span>
						{/if}
						<div class="pcard-body">
							<span class="pcard-icon">{project.icon}</span>
							<h3 class="pcard-title">{project.title}</h3>
							<div class="pcard-tags">
								{#each project.techTags.slice(0, 3) as t}
									<span class="pcard-tag">{t}</span>
								{/each}
							</div>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</div>

	<!-- ─── Row 1 ────────────────────────────────────────────────────────────── -->
	<div class="strip-outer">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="strip-wrap"
			class:dragging-active={dragging === 1}
			onmousedown={(e) => startDrag(e, 1)}
			ontouchstart={(e) => startDragTouch(e, 1)}
		>
			<div class="strip" bind:this={stripEls[1]}>
				{#each [...row1, ...row1] as project}
					<article
						class="pcard"
						class:is-hovered={hoveredProject === project && !dragMoved}
						class:is-dimmed={hoveredProject !== null && hoveredProject !== project}
						style={`${!project.image ? `--card-grad:${getCardBg(project)};` : ''}${hoveredProject === project ? tiltStyle : ''}`}
						onmouseenter={() => onCardEnter(project)}
						onmouseleave={onCardLeave}
						onmousemove={(e) => onCardMouseMove(e, project)}
						aria-label={project.title}
					>
						<div class="pcard-bg">
							{#if project.image}
								<img src={project.image} alt={project.title} loading="lazy" decoding="async" />
							{/if}
						</div>
						<div class="pcard-overlay"></div>
						<div class="pcard-shine"></div>
						{#if project.isHackathonWinner}
							<span class="pcard-badge">🏆 Winner</span>
						{/if}
						{#if project.starsLoaded && project.stars !== undefined && project.stars > 0}
							<span class="pcard-stars">⭐ {project.stars}</span>
						{/if}
						<div class="pcard-body">
							<span class="pcard-icon">{project.icon}</span>
							<h3 class="pcard-title">{project.title}</h3>
							<div class="pcard-tags">
								{#each project.techTags.slice(0, 3) as t}
									<span class="pcard-tag">{t}</span>
								{/each}
							</div>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</div>

	<!-- ─── Expanded card panel ─────────────────────────────────────────────── -->
	{#if expandedProject}
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="exp-backdrop" class:is-visible={panelExpanded} onclick={closePanel}></div>

		<!-- Panel — always centred, enters with scale-up -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<aside class="exp-panel" class:is-open={panelExpanded}>
			<!-- visual header = same bg as card -->
			<div
				class="exp-visual"
				style={expandedProject.image
					? `background-image:url('${expandedProject.image}')`
					: `background:${getCardBg(expandedProject)}`}
			>
				<div class="exp-voverlay"></div>
				<!-- Close button -->
				<button class="exp-close" onclick={closePanel} aria-label="Close">✕</button>
				{#if expandedProject.isHackathonWinner}
					<span class="exp-trophy">🏆 Hackathon Winner</span>
				{/if}
				<div class="exp-title-area">
					<span class="exp-icon">{expandedProject.icon}</span>
					<h3 class="exp-title">{expandedProject.title}</h3>
				</div>
			</div>

			<!-- body: fades in once expanded -->
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
