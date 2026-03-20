<script lang="ts">
	import { onMount } from 'svelte';

	const GROUPS: string[][] = [
		['home'],
		['about'],
		['experience'],
		['projects'],
		['skills', 'contact', 'footer']
	];

	const DELTA_THRESHOLD = 40;

	let locked = false;
	let accDelta = 0;
	let parked = false;
	let resetTimer: ReturnType<typeof setTimeout>;

	interface Group {
		top: number;
		bottom: number;
		tall: boolean;
	}

	function getGroups(): Group[] {
		return GROUPS.map((ids) => {
			const els = ids
				.map((id) => document.getElementById(id))
				.filter((el): el is HTMLElement => el !== null);
			if (els.length === 0) return null;
			const top = Math.min(...els.map((el) => el.offsetTop));
			const bottom = Math.max(...els.map((el) => el.offsetTop + el.offsetHeight));
			const height = bottom - top;
			return { top, bottom, tall: height > window.innerHeight * 1.15 };
		}).filter((g): g is Group => g !== null);
	}

	function getCurrentGroupIndex(groups: Group[]): number {
		const y = window.scrollY;
		for (let i = groups.length - 1; i >= 0; i--) {
			if (y >= groups[i].top - 10) return i;
		}
		return 0;
	}

	function easeInOutCubic(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
	}

	function snapTo(target: number, fast = false) {
		locked = true;
		parked = false;
		const start = window.scrollY;
		const dist = target - start;
		if (Math.abs(dist) < 2) {
			locked = false;
			return;
		}
		const duration = fast
			? Math.min(450, Math.max(250, Math.abs(dist) * 0.25))
			: Math.min(650, Math.max(350, Math.abs(dist) * 0.35));
		let t0: number;

		function frame(ts: number) {
			if (!t0) t0 = ts;
			const p = Math.min((ts - t0) / duration, 1);
			window.scrollTo(0, start + dist * easeInOutCubic(p));
			if (p < 1) {
				requestAnimationFrame(frame);
			} else {
				locked = false;
			}
		}
		requestAnimationFrame(frame);
	}

	function onWheel(e: WheelEvent) {
		// ── SCROLLING UP → snap does NOTHING ──
		if (e.deltaY < 0) {
			parked = false;
			accDelta = 0;
			return; // native scroll, fully free
		}

		// ── During animation → eat the event ──
		if (locked) {
			e.preventDefault();
			return;
		}

		const groups = getGroups();
		const idx = getCurrentGroupIndex(groups);
		const grp = groups[idx];
		const nextTop = idx < groups.length - 1 ? groups[idx + 1].top : null;

		if (grp.tall) {
			// ── TALL SECTION ──
			const maxScroll = grp.bottom - window.innerHeight;

			if (parked) {
				// At boundary: block scroll, accumulate delta to cross
				e.preventDefault();
				accDelta += e.deltaY;
				clearTimeout(resetTimer);
				resetTimer = setTimeout(() => {
					accDelta = 0;
				}, 400);
				if (accDelta < DELTA_THRESHOLD * 1.5) return;
				accDelta = 0;
				if (nextTop !== null) snapTo(nextTop);
				return;
			}

			// Not parked yet: check if we're near the bottom boundary
			// Only park if we're within a narrow band of the boundary (approaching from above).
			// If scrollY is way past maxScroll (entered from below), don't park.
			if (window.scrollY >= maxScroll - 2 && window.scrollY <= maxScroll + 30) {
				// We've reached the bottom → park, prevent further scroll, snap to exact edge
				e.preventDefault();
				parked = true;
				accDelta = 0;
				window.scrollTo(0, maxScroll);
				return;
			}

			// Still scrolling through the tall section → let browser handle natively
		} else {
			// ── SHORT SECTION: block all down-scroll, snap to next ──
			e.preventDefault();
			accDelta += e.deltaY;
			clearTimeout(resetTimer);
			resetTimer = setTimeout(() => {
				accDelta = 0;
			}, 300);
			if (accDelta < DELTA_THRESHOLD) return;
			const strong = accDelta > DELTA_THRESHOLD * 3;
			accDelta = 0;
			if (nextTop !== null) snapTo(nextTop, strong);
		}
	}

	let lastScrollY = 0;

	// onScroll only clamps overscroll at the bottom of tall sections (going DOWN only)
	function onScroll() {
		const y = window.scrollY;
		const wasGoingDown = y > lastScrollY;
		lastScrollY = y;

		if (locked || parked || !wasGoingDown) return;

		const groups = getGroups();
		const idx = getCurrentGroupIndex(groups);
		const grp = groups[idx];
		if (!grp.tall) return;

		const maxScroll = grp.bottom - window.innerHeight;
		if (y > maxScroll && y <= maxScroll + 30) {
			// Overshot the boundary (native inertia) → clamp
			window.scrollTo(0, maxScroll);
			parked = true;
			accDelta = 0;
		}
	}

	onMount(() => {
		window.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('scroll', onScroll);
			clearTimeout(resetTimer);
		};
	});
</script>
