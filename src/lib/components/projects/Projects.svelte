<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { projects as initialProjects, cardGradients, type Project } from './projectsData';
	import './projects.css';

	let isVisible = false;
	let projects = $state<Project[]>([...initialProjects]);

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
				startAutoPlay();
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

	function getCardStyle(i: number): string {
		const n = projects.length;
		let diff = i - floatIndex;
		diff = diff - n * Math.round(diff / n);
		const absd = Math.abs(diff);
		if (absd > 4.5) return 'visibility:hidden; opacity:0; pointer-events:none;';

		// Responsive concave math
		const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;
		const isMid = typeof window !== 'undefined' && window.innerWidth <= 768 && !isMobile;
		const theta = isMobile ? 30 : isMid ? 26 : 24;
		const R = isMobile ? 600 : isMid ? 850 : 1100;
		const xMul = isMobile ? 1.0 : 1.15;

		const angleDeg = diff * theta;
		const angleRad = angleDeg * (Math.PI / 180);
		const tx = R * Math.sin(angleRad) * xMul;
		const tz = -R * Math.cos(angleRad) + 350;
		const ry = -angleDeg;
		const brightness = Math.max(0.4, 1 - absd * 0.15);
		const opacity = absd > 3.5 ? Math.max(0, 1 - (absd - 3.5)) : 1;
		const scale = 1 + Math.max(0, 0.08 - absd * 0.08);
		return `transform: translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) scale(${scale.toFixed(3)}); opacity:${opacity}; filter: brightness(${brightness});`;
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
			stopAutoPlay();
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
		const MAX_VELOCITY = 8;
		const clampedV = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));
		const coastDistance = (clampedV * Math.abs(clampedV)) / (SPRING_DAMPING * 2);
		const projected = floatIndex + coastDistance;
		targetIndex = Math.round(projected);
		startSnapAnimation(clampedV);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') closePanel();
	}

	// ── Auto-play ──
	let autoPlayRaf: number | null = null;
	let autoLastTime = 0;
	const AUTO_SPEED = 0.25;

	function autoPlayLoop(time: number) {
		if (autoLastTime > 0) {
			const dt = (time - autoLastTime) / 1000;
			floatIndex += dt * AUTO_SPEED;
		}
		autoLastTime = time;
		autoPlayRaf = requestAnimationFrame(autoPlayLoop);
	}
	function startAutoPlay() {
		stopAutoPlay();
		autoLastTime = 0;
		autoPlayRaf = requestAnimationFrame(autoPlayLoop);
	}
	function stopAutoPlay() {
		if (autoPlayRaf) {
			cancelAnimationFrame(autoPlayRaf);
			autoPlayRaf = null;
		}
		autoLastTime = 0;
	}

	// ─── Grid view: parallax 3D tilt ────────────────────────────────────────────
	let hoveredProject: Project | null = $state(null);
	let tiltStyle = $state('');

	function onGridCardEnter(p: Project) {
		hoveredProject = p;
	}
	function onGridCardLeave() {
		hoveredProject = null;
		tiltStyle = '';
	}
	function onGridCardMouseMove(e: MouseEvent, p: Project) {
		if (hoveredProject !== p) return;
		const card = e.currentTarget as HTMLElement;
		const rect = card.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;
		const ry = (x - 0.5) * 16;
		const rx = (0.5 - y) * 16;
		tiltStyle = `--tilt-rx:${rx.toFixed(1)}deg;--tilt-ry:${ry.toFixed(1)}deg;--shine-x:${(x * 100).toFixed(0)}%;--shine-y:${(y * 100).toFixed(0)}%`;
	}

	// ─── Expand state (grid view) ───────────────────────────────────────────────
	let expandedProject: Project | null = $state.raw(null);
	let panelExpanded = $state(false);

	function onGridCardClick(p: Project) {
		expandedProject = p;
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
			expandedProject = null;
		}, 380);
	}

	function getCardBg(i: number): string {
		const p = projects[i];
		if (p.accentColor) return p.accentColor;
		return cardGradients[i % cardGradients.length];
	}
	function getCardBgForProject(p: Project): string {
		if (p.accentColor) return p.accentColor;
		const idx = projects.indexOf(p);
		return cardGradients[(idx >= 0 ? idx : 0) % cardGradients.length];
	}
	function getLinkLabel(type: string): string {
		if (type === 'download') return 'Download';
		if (type === 'youtube') return 'Watch';
		if (type === 'hackathon') return 'Hackathon';
		return 'Demo';
	}

	function toggleView() {
		if (viewMode === 'carousel') {
			stopAutoPlay();
			stopSnapAnimation();
			viewMode = 'grid';
		} else {
			viewMode = 'carousel';
			// Restart carousel auto-play after switching back
			tick().then(() => startAutoPlay());
		}
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
					if (e.isIntersecting && viewMode === 'carousel') startAutoPlay();
					else if (!e.isIntersecting) stopAutoPlay();
				}),
			{ threshold: 0.05, rootMargin: '100px' }
		);
		io.observe(sectionEl);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
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
		<h2 class="section-title">Personal Projects</h2>
	</div>

	{#if viewMode === 'carousel'}
		<!-- Triple 3D Carousel -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="carousel-viewport" onpointerdown={onPointerDown}>
			<div class="carousel-stage">
				{#each projects as project, i}
					<div class="carousel-card" style={getCardStyle(i)}>
						<div class="carousel-card-bg">
							{#if project.image}
								<img src={project.image} alt={project.title} loading="lazy" decoding="async" />
							{:else}
								<div
									class="carousel-card-grad"
									style="background:{getCardBgForProject(project)}"
								></div>
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
	{:else}
		<!-- Grid View -->
		<div class="grid-container">
			{#each projects as project, i}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<article
					class="pcard"
					class:is-hovered={hoveredProject === project}
					class:is-dimmed={hoveredProject !== null && hoveredProject !== project}
					style={`${!project.image ? `--card-grad:${getCardBgForProject(project)};` : ''}${hoveredProject === project ? tiltStyle : ''}`}
					onmouseenter={() => onGridCardEnter(project)}
					onmouseleave={onGridCardLeave}
					onmousemove={(e) => onGridCardMouseMove(e, project)}
					onclick={() => onGridCardClick(project)}
				>
					<div class="pcard-bg">
						{#if project.image}
							<img src={project.image} alt={project.title} loading="lazy" decoding="async" />
						{:else}
							<div class="pcard-grad"></div>
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
	{/if}

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
					: `background:${getCardBgForProject(expandedProject)}`}
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
		<div class="projects-buttons">
			<a
				href="https://github.com/GiuseppeBellamacina?tab=repositories"
				target="_blank"
				class="btn btn-primary"
			>
				<i class="fab fa-github"></i> View All Repos
			</a>
			<button class="btn btn-secondary" onclick={toggleView}>
				{#if viewMode === 'carousel'}
					<i class="fas fa-th"></i> Show Grid
				{:else}
					<i class="fas fa-stream"></i> Show Carousel
				{/if}
			</button>
		</div>
	</div>
</section>
