// vgpu galaxy for the Hero: same view as the original three.js galaxy (disc seen at ~55 degrees),
// its centre locked to the centre of the profile photo.
// Anywhere vgpu can't run it (no WebGPU, init failure, or too slow even at the lowest star count)
// the original three.js galaxy takes over, so no visitor loses the effect.
// Returns a cleanup, or undefined when nothing is running (reduced motion, or both backends gave up).
export async function initGalaxy(
	container: HTMLElement,
	hero: HTMLElement,
	options: { onAbort?: () => void } = {}
): Promise<(() => void) | undefined> {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	let disposed = false;
	let threeCleanup: (() => void) | undefined;
	let vgpuCleanup: (() => void) | undefined;

	const useThree = async () => {
		const { initGpgpuParticles } = await import('./gpgpuParticles');
		if (disposed) return;
		const cleanup = await initGpgpuParticles(container, hero, options);
		if (disposed) cleanup?.();
		else threeCleanup = cleanup;
	};
	const dispose = () => {
		disposed = true;
		vgpuCleanup?.();
		threeCleanup?.();
	};

	if (!('gpu' in navigator)) {
		await useThree();
		return threeCleanup ? dispose : undefined;
	}

	const { createGalaxyRenderer } = await import('./galaxy/renderer');
	const canvas = document.createElement('canvas');
	canvas.setAttribute('aria-hidden', 'true');
	canvas.style.cssText =
		'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
	container.prepend(canvas);

	const light = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
	// Photo centre relative to the canvas, as NDC, plus the zoom that keeps the galaxy the size it
	// would have on a hero-sized canvas (the canvas hangs below the hero, like the old one did)
	const getCenter = (): [number, number, number] => {
		const photo = hero.querySelector('.profile-container');
		const c = canvas.getBoundingClientRect();
		if (!photo || c.width === 0 || c.height === 0) return [0, 0, 1];
		const p = photo.getBoundingClientRect();
		return [
			((p.left + p.width / 2 - c.left) / c.width) * 2 - 1,
			1 - ((p.top + p.height / 2 - c.top) / c.height) * 2,
			Math.min(1, (hero.offsetHeight || c.height) / c.height)
		];
	};

	// Too slow even at the lowest star count: hand over to the three.js galaxy
	const onSlow = async () => {
		vgpuCleanup?.();
		await useThree();
		if (!disposed && !threeCleanup) options.onAbort?.();
	};

	const renderer = createGalaxyRenderer({
		canvas,
		light,
		interaction: hero,
		getCenter,
		onSlow: () => void onSlow()
	});
	// The entrance animation moves the photo a little: frame again once it has settled
	const reframe = () => renderer.reframe();
	const timers = [setTimeout(reframe, 400), setTimeout(reframe, 1500)];
	window.addEventListener('resize', reframe);
	vgpuCleanup = () => {
		timers.forEach(clearTimeout);
		window.removeEventListener('resize', reframe);
		renderer.dispose();
		canvas.remove();
		container.classList.remove('vgpu-on');
		vgpuCleanup = undefined;
	};

	try {
		await renderer.ready;
	} catch {
		// The renderer already disposed itself
		vgpuCleanup?.();
		await useThree();
		return threeCleanup ? dispose : undefined;
	}
	if (disposed) return;
	container.classList.add('vgpu-on');
	return dispose;
}
