/**
 * Lightweight binary particle rain for the Experience section canvas.
 * Floating 0s and 1s that fade in/out and drift upward.
 */
export function createBinaryRain(
	canvas: HTMLCanvasElement,
	getVisible: () => boolean
): (() => void) | undefined {
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

			ctx!.globalAlpha = p.opacity;
			ctx!.font = `bold ${p.size}px 'Courier New', monospace`;
			ctx!.fillStyle = p.color;
			ctx!.shadowColor = p.color;
			ctx!.shadowBlur = 4;
			ctx!.fillText(p.ch, p.x, p.y);
		}
		ctx!.globalAlpha = 1;
		ctx!.shadowBlur = 0;

		rafId = requestAnimationFrame(frame);
	}

	COLORS = getColors();
	rafId = requestAnimationFrame(frame);

	return () => {
		cancelAnimationFrame(rafId);
	};
}
