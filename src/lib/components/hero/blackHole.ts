// Optimized Black Hole (vgpu example): the ray traversal is baked once into a G-buffer, then
// reused for disk shading, stars, AA and bloom. Replaces the three.js galaxy in the Hero.
// Returns a cleanup, or undefined when WebGPU is unavailable / the user prefers reduced motion.
export async function initBlackHole(
	container: HTMLElement,
	options: { onAbort?: () => void } = {}
): Promise<(() => void) | undefined> {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	if (!('gpu' in navigator)) return;

	const { createRenderer } = await import('./blackhole/renderer');
	const canvas = document.createElement('canvas');
	canvas.setAttribute('aria-hidden', 'true');
	canvas.style.cssText =
		'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 0.8s ease;pointer-events:none';
	container.prepend(canvas);

	const renderer = createRenderer({ canvas });
	let disposed = false;
	const cleanup = () => {
		disposed = true;
		renderer.dispose();
		canvas.remove();
	};
	try {
		await renderer.ready;
	} catch {
		// The renderer already disposed itself; hand the CSS background back
		canvas.remove();
		options.onAbort?.();
		return;
	}
	if (!disposed) canvas.style.opacity = '1';
	return cleanup;
}
