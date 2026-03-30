<script lang="ts">
	import { onMount } from 'svelte';

	// When the viewport is inside the Hero section, ALL scrolling is blocked.
	// Any scroll/swipe gesture (any direction, any intensity) snaps to About.
	// Once outside the Hero, normal scrolling is free.
	// Returning to the Hero re-enables the lock.

	let snapping = false; // true while the snap animation is running
	let inHero = true; // true when viewport is inside the Hero
	let touchStartY = 0;
	let snapCooldown = false; // brief cooldown after snap to avoid re-lock

	function easeInOutCubic(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
	}

	function smoothScrollTo(target: number, cb?: () => void) {
		snapping = true;
		const start = window.scrollY;
		const dist = target - start;
		if (Math.abs(dist) < 2) {
			snapping = false;
			cb?.();
			return;
		}
		const duration = Math.min(600, Math.max(350, Math.abs(dist) * 0.3));
		let t0: number;

		function frame(ts: number) {
			if (!t0) t0 = ts;
			const p = Math.min((ts - t0) / duration, 1);
			window.scrollTo({ top: start + dist * easeInOutCubic(p), behavior: 'instant' });
			if (p < 1) {
				requestAnimationFrame(frame);
			} else {
				snapping = false;
				snapCooldown = true;
				setTimeout(() => {
					snapCooldown = false;
				}, 200);
				cb?.();
			}
		}
		requestAnimationFrame(frame);
	}

	/** Check whether the viewport is currently within the Hero section */
	function checkHero(): boolean {
		const hero = document.getElementById('home');
		if (!hero) return false;
		const heroBottom = hero.offsetTop + hero.offsetHeight;
		return window.scrollY < heroBottom - window.innerHeight * 0.5;
	}

	function snapToAbout() {
		const about = document.getElementById('about');
		if (!about) return;
		smoothScrollTo(about.offsetTop, () => {
			inHero = false;
		});
	}

	// ── Wheel ───────────────────────────────────────────────────────────────
	function onWheel(e: WheelEvent) {
		if (!inHero) return;
		e.preventDefault();
		if (snapping) return;
		if (e.deltaY > 0) snapToAbout();
	}

	// ── Touch ───────────────────────────────────────────────────────────────
	function onTouchStart(e: TouchEvent) {
		if (!inHero) return;
		if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
	}
	function onTouchMove(e: TouchEvent) {
		if (!inHero) return;
		e.preventDefault();
		if (snapping) return;
		if (e.touches.length !== 1) return;
		const dy = touchStartY - e.touches[0].clientY;
		if (dy > 10) snapToAbout();
	}

	// ── Detect enter/leave Hero (e.g. user clicks nav link or scrolls) ─────
	function onScroll() {
		if (snapping || snapCooldown) return;
		const nowInHero = checkHero();
		// Left the Hero (e.g. navbar click scrolled to another section)
		if (inHero && !nowInHero) {
			inHero = false;
		}
		// Returned to Hero (e.g. user scrolled back to top)
		if (!inHero && nowInHero && window.scrollY <= 5) {
			inHero = true;
		}
	}

	// ── Keyboard: block arrow/space/page keys while in Hero ────────────────
	function onKeyDown(e: KeyboardEvent) {
		if (!inHero) return;
		const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'];
		if (scrollKeys.includes(e.key)) {
			e.preventDefault();
			if (!snapping && (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ')) {
				snapToAbout();
			}
		}
	}

	onMount(() => {
		// Determine initial state (page might be refreshed mid-scroll)
		inHero = checkHero();

		window.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('keydown', onKeyDown);
		};
	});
</script>
