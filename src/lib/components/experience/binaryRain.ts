/**
 * Lightweight binary particle rain for the Experience section canvas.
 * Floating 0s and 1s that fade in/out and drift upward.
 */
export function createBinaryRain(
	canvas: HTMLCanvasElement,
	getVisible: () => boolean
): (() => void) | undefined {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	interface Particle {
		x: number;
		y: number;
		ch: string;
		color: string;
		speed: number;
		opacity: number;
		fade: number;
		size: number;
	}

	const MAX_PARTICLES = 25;
	let particles: Particle[] = [];
	let rafId = 0;

	function getColors(): string[] {
		const style = getComputedStyle(document.documentElement);
		return [
			style.getPropertyValue('--primary-color').trim() || '#818cf8',
			style.getPropertyValue('--secondary-color').trim() || '#a78bfa',
			style.getPropertyValue('--neon-green').trim() || '#34d399'
		];
	}

	let COLORS = getColors();
	const themeObserver = new MutationObserver(() => {
		COLORS = getColors();
	});
	themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

	/* Pre-rendered glow sprites (one per color+char pair): drawn once with
	   shadowBlur on an offscreen canvas, then blitted per frame via drawImage. */
	const spriteCache = new Map<string, HTMLCanvasElement>();

	function getSprite(color: string, ch: string): HTMLCanvasElement {
		const key = `${color}|${ch}`;
		let sprite = spriteCache.get(key);
		if (!sprite) {
			const S = 48; // 2x the largest particle size, keeps glow padding crisp
			sprite = document.createElement('canvas');
			sprite.width = S;
			sprite.height = S;
			const g = sprite.getContext('2d')!;
			g.font = `bold 32px ui-monospace, 'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace`;
			g.textAlign = 'center';
			g.textBaseline = 'middle';
			g.shadowColor = color;
			g.shadowBlur = 8;
			g.fillStyle = color;
			g.fillText(ch, S / 2, S / 2);
			spriteCache.set(key, sprite);
		}
		return sprite;
	}

	function spawnParticle(): Particle {
		return {
			x: Math.random() * canvas.width,
			y: Math.random() * canvas.height,
			ch: Math.random() > 0.5 ? '1' : '0',
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			speed: 3 + Math.random() * 6,
			opacity: 0,
			fade: 0.001 + Math.random() * 0.002,
			size: 11 + Math.random() * 6
		};
	}

	function frame() {
		// Skip all rendering while off-screen or in a background tab.
		if (!getVisible() || document.hidden) {
			rafId = 0;
			return;
		}
		const w = canvas.width;
		const h = canvas.height;
		ctx!.clearRect(0, 0, w, h);

		if (particles.length < MAX_PARTICLES && Math.random() < 0.12) {
			particles.push(spawnParticle());
		}

		for (let i = particles.length - 1; i >= 0; i--) {
			const p = particles[i];
			p.y -= p.speed * 0.016;
			p.opacity += p.fade;
			if (p.opacity > 0.55) p.fade = -Math.abs(p.fade);
			if (p.opacity <= 0) {
				particles.splice(i, 1);
				continue;
			}

			// Blit the pre-rendered glow sprite: one drawImage, no per-frame shadow cost
			ctx!.globalAlpha = p.opacity;
			const s = p.size * 1.5;
			ctx!.drawImage(getSprite(p.color, p.ch), p.x - s / 2, p.y - s / 2, s, s);
		}
		ctx!.globalAlpha = 1;

		rafId = requestAnimationFrame(frame);
	}
	const visibilityObserver = new IntersectionObserver(() => {
		if (getVisible() && !document.hidden && !rafId) rafId = requestAnimationFrame(frame);
	});
	visibilityObserver.observe(canvas);

	rafId = requestAnimationFrame(frame);

	return () => {
		cancelAnimationFrame(rafId);
		visibilityObserver.disconnect();
		themeObserver.disconnect();
	};
}
