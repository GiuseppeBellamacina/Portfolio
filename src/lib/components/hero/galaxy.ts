// vgpu galaxy for the Hero: same view as the original three.js galaxy (disc seen at ~55 degrees),
// its centre locked to the centre of the profile photo. Returns a cleanup, or undefined when
// WebGPU is unavailable / the user prefers reduced motion.
export async function initGalaxy(
	container: HTMLElement,
	hero: HTMLElement,
	options: { onAbort?: () => void } = {}
): Promise<(() => void) | undefined> {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	if (!('gpu' in navigator)) return;

	const { createGalaxyRenderer } = await import('./galaxy/renderer');
	const canvas = document.createElement('canvas');
	canvas.setAttribute('aria-hidden', 'true');
	canvas.style.cssText =
		'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 0.8s ease;pointer-events:none';
	container.prepend(canvas);

	const light = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
	// Photo centre relative to the canvas, as NDC
	const getCenter = (): [number, number] => {
		const photo = hero.querySelector('.profile-container');
		const c = canvas.getBoundingClientRect();
		if (!photo || c.width === 0 || c.height === 0) return [0, 0];
		const p = photo.getBoundingClientRect();
		return [
			((p.left + p.width / 2 - c.left) / c.width) * 2 - 1,
			1 - ((p.top + p.height / 2 - c.top) / c.height) * 2
		];
	};

	const renderer = createGalaxyRenderer({ canvas, light, interaction: hero, getCenter });
	// The entrance animation moves the photo a little: frame again once it has settled
	const reframe = () => renderer.reframe();
	const timers = [setTimeout(reframe, 400), setTimeout(reframe, 1500)];
	window.addEventListener('resize', reframe);
	let disposed = false;
	const cleanup = () => {
		disposed = true;
		timers.forEach(clearTimeout);
		window.removeEventListener('resize', reframe);
		renderer.dispose();
		canvas.remove();
	};
	try {
		await renderer.ready;
	} catch {
		// The renderer already disposed itself; hand the CSS background back
		cleanup();
		options.onAbort?.();
		return;
	}
	if (!disposed) canvas.style.opacity = '1';
	return cleanup;
}
