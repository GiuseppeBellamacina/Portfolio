// vgpu galaxy: procedural stars (one instanced draw) -> gas/dust pass -> HDR bloom -> tone map.
// VGPU stays dynamically imported so it is not in the main bundle.
import type { Draw, Effect, Frame, Gpu, Surface, Target } from 'vgpu';
import bloomWgsl from '../blackhole/bloom.wgsl';
import compositeWgsl from './composite.wgsl';
import postWgsl from './post.wgsl';
import starsWgsl from './stars.wgsl';

type VgpuApi = typeof import('vgpu');

// The original three.js galaxy was seen from (0, -6.5, 4.5): ~55 degrees off the disc normal
const TILT = 0.965;
const DIST = 2.2;
const FOCAL = 3.3; // the original's 45deg fov (2.414), zoomed so the disc fills the hero like it did
const SPIN_RATE = 0.05; // rad/s of the spiral pattern
const REF_STARS = 350_000;
const MIN_FRAME_INTERVAL_MS = 1000 / 60 - 2;
const CLEAR: readonly [number, number, number, number] = [0, 0, 0, 1];

interface Options {
	canvas: HTMLCanvasElement;
	light: boolean;
	/** Centre of the galaxy on the canvas, in NDC (x right, y up) */
	getCenter: () => readonly [number, number];
}

interface Level {
	a: Target;
	b: Target;
}
interface Targets {
	stars: Target;
	scene: Target;
	levels: Level[];
}

export function createGalaxyRenderer({ canvas, light, getCenter }: Options) {
	const stars = light ? 90_000 : REF_STARS;
	let disposed = false;
	let api: VgpuApi | undefined;
	let gpu: Gpu | undefined;
	let surface: Surface | undefined;
	let starsDraw: Draw | undefined;
	let post: Effect | undefined;
	let composite: Effect | undefined;
	let steps: { fx: Effect; src: () => Target; dst: () => Target }[] = [];
	let targets: Targets | undefined;
	let sampler: GPUSampler | undefined;
	let loop: { stop(): void } | undefined;
	let observer: ResizeObserver | undefined;
	let intersection: IntersectionObserver | undefined;
	let visible = !document.hidden;
	let intersecting = true;
	let started = false;
	let center: readonly [number, number] = [0, 0];
	let time = 0;
	let lastAt: number | undefined;
	let resizeFrame = 0;
	let px = 0;
	let py = 0;
	let tiltOff = 0;
	let rollOff = 0;

	const onPointer = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') return;
		px = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
		py = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
	};
	const recenterPointer = () => {
		px = 0;
		py = 0;
	};
	const onVisibility = () => {
		if (document.hidden) recenterPointer();
		visible = !document.hidden;
		reconcile();
	};

	const camUniforms = () => ({
		res: surface!.size,
		center,
		time,
		tilt: TILT + tiltOff,
		roll: rollOff,
		dist: DIST,
		focal: FOCAL,
		spin: time * SPIN_RATE,
		gain: 0.22 * (REF_STARS / stars)
	});

	function createTargets(vgpu: VgpuApi, g: Gpu, size: readonly [number, number]): Targets {
		const [w, h] = [Math.max(1, Math.floor(size[0])), Math.max(1, Math.floor(size[1]))];
		const make = (div: number) =>
			vgpu.target(g, {
				size: [Math.max(1, Math.floor(w / div)), Math.max(1, Math.floor(h / div))],
				colors: [{ format: 'rgba16float' }]
			});
		return {
			stars: make(1),
			scene: make(1),
			levels: [2, 4, 8].map((d) => ({ a: make(d), b: make(d) }))
		};
	}

	function destroyTargets(t: Targets | undefined) {
		if (!t) return;
		for (const x of [t.stars, t.scene, ...t.levels.flatMap((l) => [l.a, l.b])]) {
			(x as { destroy?: () => void }).destroy?.();
		}
	}

	const color = (t: Target) => t.colors[0]!;

	// (Re)bind every effect to the current targets and (re)write the size-dependent uniforms
	function bind() {
		if (!targets || !post || !composite || !sampler || !surface) return;
		const t = targets;
		center = getCenter();
		post.set({ stars: color(t.stars), linearSampler: sampler });
		const threshold = 0.8;
		const knee = 0.5;
		const radius = 1.5 * (Math.min(Math.max(window.devicePixelRatio, 1), 2) / 2);
		steps.forEach((s, i) => {
			const src = s.src();
			// order: extract, blurH0, blurV0, down1, blurH1, blurV1, down2, blurH2, blurV2
			const blur = i % 3 !== 0;
			const dir = i % 3 === 1 ? [1, 0] : [0, 1];
			s.fx.set({
				source: color(src),
				linearSampler: sampler,
				bloom: {
					sourceSize: src.size,
					direction: blur ? dir : [0, 0],
					params: [i === 0 ? threshold : -1, knee, radius, blur ? 1 : 0]
				}
			});
		});
		composite.set({
			scene: color(t.scene),
			bloomNear: color(t.levels[0]!.a),
			bloomMedium: color(t.levels[1]!.a),
			bloomFar: color(t.levels[2]!.a),
			linearSampler: sampler,
			composite: { params: [0.8, 1.0, 0, 0] }
		});
	}

	function reconcile() {
		if (!started || !gpu || !api) return;
		const shouldRun = !disposed && visible && intersecting;
		if (shouldRun === Boolean(loop)) return;
		if (shouldRun) {
			lastAt = undefined;
			loop = startLoop(api, gpu);
		} else {
			loop?.stop();
			loop = undefined;
		}
	}

	function startLoop(vgpu: VgpuApi, g: Gpu): { stop(): void } {
		let stopped = false;
		let lastPresented: number | undefined;
		const tick = (now: number) => {
			if (stopped) return;
			if (lastPresented === undefined || now - lastPresented >= MIN_FRAME_INTERVAL_MS) {
				lastPresented = now;
				try {
					vgpu.frame(g, renderFrame);
				} catch (error) {
					fail(error);
				}
			}
			if (!stopped) handle = requestAnimationFrame(tick);
		};
		let handle = requestAnimationFrame(tick);
		return {
			stop() {
				stopped = true;
				cancelAnimationFrame(handle);
			}
		};
	}

	const renderFrame = (frame: Frame) => {
		if (disposed || !targets || !surface || !starsDraw || !post || !composite) return;
		const now = performance.now();
		const dt = lastAt === undefined ? 0 : Math.min((now - lastAt) / 1000, 0.1);
		lastAt = now;
		time += dt;
		// Mouse parallax: the disc leans a little towards the cursor, eased
		const k = 1 - Math.exp(-dt / 0.35);
		tiltOff += (py * 0.07 - tiltOff) * k;
		rollOff += (px * 0.1 - rollOff) * k;
		const cam = camUniforms();
		starsDraw.set({ cam });
		post.set({ cam });
		frame.pass({ target: targets.stars, clear: CLEAR }, (p) => p.draw(starsDraw!));
		frame.pass({ target: targets.scene, clear: CLEAR }, (p) => p.draw(post!));
		for (const s of steps) frame.pass({ target: s.dst(), clear: CLEAR }, (p) => p.draw(s.fx));
		frame.pass({ target: surface, clear: CLEAR }, (p) => p.draw(composite!));
	};

	const applyResize = () => {
		resizeFrame = 0;
		if (disposed || !gpu || !api || !surface) return;
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (w <= 0 || h <= 0) return;
		try {
			const next = createTargets(api, gpu, surface.size);
			const prev = targets;
			targets = next;
			bind();
			destroyTargets(prev);
		} catch (error) {
			fail(error);
		}
	};
	const scheduleResize = () => {
		if (!resizeFrame) resizeFrame = requestAnimationFrame(applyResize);
	};

	function dispose() {
		if (disposed) return;
		disposed = true;
		loop?.stop();
		if (resizeFrame) cancelAnimationFrame(resizeFrame);
		observer?.disconnect();
		intersection?.disconnect();
		window.removeEventListener('pointermove', onPointer);
		window.removeEventListener('blur', recenterPointer);
		document.removeEventListener('visibilitychange', onVisibility);
		destroyTargets(targets);
		gpu?.dispose();
	}

	function fail(error: unknown): never {
		dispose();
		throw error;
	}

	const initialize = async () => {
		const vgpu = await import('vgpu');
		if (disposed) return;
		const g = await vgpu.init();
		if (disposed) {
			g.dispose();
			return;
		}
		gpu = g;
		api = vgpu;
		surface = vgpu.surface(g, canvas, { dpr: light ? 1 : [1, 1.5] });
		sampler = vgpu.sampler(g, { minFilter: 'linear', magFilter: 'linear' });
		starsDraw = vgpu.draw(g, {
			shader: starsWgsl,
			vertices: 6,
			instances: stars,
			blend: 'additive',
			label: 'galaxy-stars'
		});
		post = vgpu.effect(g, postWgsl, { label: 'galaxy-post' });
		composite = vgpu.effect(g, compositeWgsl, { label: 'galaxy-composite' });
		targets = createTargets(vgpu, g, surface.size);
		const fx = () => vgpu.effect(g, bloomWgsl, { label: 'galaxy-bloom' });
		const L = () => targets!.levels;
		steps = [
			{ fx: fx(), src: () => targets!.scene, dst: () => L()[0]!.a },
			{ fx: fx(), src: () => L()[0]!.a, dst: () => L()[0]!.b },
			{ fx: fx(), src: () => L()[0]!.b, dst: () => L()[0]!.a },
			{ fx: fx(), src: () => L()[0]!.a, dst: () => L()[1]!.a },
			{ fx: fx(), src: () => L()[1]!.a, dst: () => L()[1]!.b },
			{ fx: fx(), src: () => L()[1]!.b, dst: () => L()[1]!.a },
			{ fx: fx(), src: () => L()[1]!.a, dst: () => L()[2]!.a },
			{ fx: fx(), src: () => L()[2]!.a, dst: () => L()[2]!.b },
			{ fx: fx(), src: () => L()[2]!.b, dst: () => L()[2]!.a }
		];
		bind();
		const hdr = { colors: [targets.scene.format] };
		await Promise.all([
			starsDraw.compile(targets.stars),
			post.compile(targets.scene),
			...steps.map((s) => s.fx.compile(hdr)),
			composite.compile({ colors: [surface.format] })
		]);
		if (disposed) return;
		observer = new ResizeObserver(scheduleResize);
		observer.observe(canvas);
		window.addEventListener('pointermove', onPointer, { passive: true });
		window.addEventListener('blur', recenterPointer);
		document.addEventListener('visibilitychange', onVisibility);
		intersection = new IntersectionObserver(
			(entries) => {
				intersecting = entries[entries.length - 1]?.isIntersecting ?? intersecting;
				reconcile();
			},
			{ threshold: 0 }
		);
		intersection.observe(canvas);
		started = true;
		visible = !document.hidden;
		reconcile();
	};

	const ready = initialize().catch((error: unknown) => {
		if (disposed) return;
		fail(error);
	});

	return {
		ready,
		dispose,
		/** The photo moved (entrance animation, layout change): recompute the centre */
		reframe() {
			if (disposed || !surface) return;
			center = getCenter();
		}
	};
}
