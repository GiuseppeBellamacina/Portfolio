<script lang="ts">
	import { onMount } from 'svelte';

	// Only snap: when user scrolls DOWN while in the Hero section,
	// smoothly scroll to About. Everything else is free native scroll.

	const DELTA_THRESHOLD = 50;

	let locked = false;
	let accDelta = 0;
	let resetTimer: ReturnType<typeof setTimeout>;

	function easeInOutCubic(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
	}

	function smoothScrollTo(target: number) {
		locked = true;
		const start = window.scrollY;
		const dist = target - start;
		if (Math.abs(dist) < 2) {
			locked = false;
			return;
		}
		const duration = Math.min(600, Math.max(350, Math.abs(dist) * 0.3));
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
		// Only act on downward scroll
		if (e.deltaY <= 0) return;
		if (locked) {
			e.preventDefault();
			return;
		}

		const hero = document.getElementById('home');
		const about = document.getElementById('about');
		if (!hero || !about) return;

		// Only snap if we're inside the hero section
		const heroBottom = hero.offsetTop + hero.offsetHeight;
		if (window.scrollY > heroBottom - window.innerHeight * 0.5) return;

		// Accumulate delta to avoid accidental snaps
		e.preventDefault();
		accDelta += e.deltaY;
		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => {
			accDelta = 0;
		}, 300);
		if (accDelta < DELTA_THRESHOLD) return;

		accDelta = 0;
		smoothScrollTo(about.offsetTop);
	}

	onMount(() => {
		window.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			window.removeEventListener('wheel', onWheel);
			clearTimeout(resetTimer);
		};
	});
</script>
