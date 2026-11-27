// vgpu galaxy: procedural stars (one instanced draw) -> gas/dust pass -> HDR bloom -> tone map.
// VGPU stays dynamically imported so it is not in the main bundle.
import type { Draw, Effect, Frame, Gpu, Surface, Target } from 'vgpu';
import bloomWgsl from '../blackhole/bloom.wgsl';
import compositeWgsl from './composite.wgsl';
import postWgsl from './post.wgsl';
import starsWgsl from './stars.wgsl';

type VgpuApi = typeof import('vgpu');

// The original three.js galaxy was seen from (0, -6.5, 4.5): ~55 degrees off the disc normal
// (the camera sits on the -y side, so the disc's far edge is its +y one: a negative tilt)
const TILT = -0.965;
const FOCAL = 2.414; // 1 / tan(22.5deg): the original's 45deg vertical fov
const GALAXY_R = 1.5; // the original's radius of 8, scaled down
const SCALE = GALAXY_R / 8;
const DIST = 7.9 * SCALE; // the original's camera distance, in the same units
const SPIN_RATE = 0.05; // rad/s of the spiral pattern
const REF_STARS = 350_000;
// Star counts, richest first: the renderer steps down when frames come too slowly
const LEVELS_DESKTOP = [350_000, 180_000, 90_000];
const LEVELS_LIGHT = [90_000, 45_000];
const SLOW_FRAME_MS = 26; // median presented frame above this (< ~38 fps): drop a level
const GIVE_UP_FRAME_MS = 50; // ...and above this at the lowest level: give up (< 20 fps)
const MIN_FRAME_INTERVAL_MS = 1000 / 60 - 2;
const CLEAR: readonly [number, number, number, number] = [0, 0, 0, 1];

interface Options {
	canvas: HTMLCanvasElement;
	light: boolean;
	/** Element the cursor is tracked on (the Hero) */
	interaction: HTMLElement;
	/** Centre of the galaxy on the canvas in NDC (x right, y up), and the zoom for a canvas taller than the hero */
	getCenter: () => readonly [number, number, number];
	/** Called once when even the lowest star count can't hold ~20 fps */
	onSlow: () => void;
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

export function createGalaxyRenderer({ canvas, light, interaction, getCenter, onSlow }: Options) {
	const levels = light ? LEVELS_LIGHT : LEVELS_DESKTOP;
	let level = 0;
	let stars = levels[0]!;
	// Phones frame the disc from further away (the original's zoom of 1.6 on a radius of 6 vs 8)
	const dist = light ? DIST * 1.6 * (8 / 6) : DIST;
	const gaps: number[] = [];
	let warm = 0;
	let gaveUp = false;
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
	let center: readonly [number, number, number] = [0, 0, 1];
	let time = 0;
	let lastAt: number | undefined;
	let resizeFrame = 0;
	// Cursor ring (desktop only, as in the original): the pointer in the hero's NDC, eased
	let mouseOver = false;
	let mouseNdc: [number, number] = [0, 0];
	let hover = 0;
	let mouseWorld: [number, number] = [0, 0];
	let palette = readPalette();
	let paletteObserver: MutationObserver | undefined;

	const onMove = (e: MouseEvent) => {
		const r = canvas.getBoundingClientRect();
		if (r.width === 0 || r.height === 0) return;
		mouseNdc = [
			((e.clientX - r.left) / r.width) * 2 - 1,
			-(((e.clientY - r.top) / r.height) * 2 - 1)
		];
		mouseOver = true;
	};
	const onLeave = () => {
		mouseOver = false;
	};
	const onVisibility = () => {
		visible = !document.hidden;
		reconcile();
	};

	// Pointer ray -> galaxy plane (the inverse of the shaders' projection, roll = 0)
	function pointerOnPlane(): [number, number] | undefined {
		const [w, h] = surface!.size;
		const sx = (mouseNdc[0] - center[0]) * (w / h);
		const sy = mouseNdc[1] - center[1];
		const c = Math.cos(TILT);
		const s = Math.sin(TILT);
		const oy = s * dist;
		const oz = c * dist;
		const focal = FOCAL * center[2];
		const dy = c * sy - s * focal;
		const dz = -s * sy - c * focal;
		const t = -oz / dz;
		return t > 0 ? [sx * t, oy + dy * t] : undefined;
	}

	const camUniforms = () => ({
		res: surface!.size,
		center: [center[0], center[1]],
		time,
		tilt: TILT,
		roll: 0,
		dist,
		focal: FOCAL * center[2],
		spin: time * SPIN_RATE,
		gain: 0.22 * (REF_STARS / stars),
		hover,
		mouse: mouseWorld,
		ring: (0.5 + Math.sin(time) * 0.1) * SCALE
	});

	// The theme colours live in CSS variables (season, day/night, terminal palettes)
	function applyPalette() {
		palette = readPalette();
		const pal = { c: palette.colors, space: palette.space };
		starsDraw?.set({ pal });
		post?.set({ pal });
		composite?.set({ composite: { space: palette.display } });
	}

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
		const pal = { c: palette.colors, space: palette.space };
		post.set({ stars: color(t.stars), linearSampler: sampler, pal });
		starsDraw?.set({ pal });
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
			composite: { params: [0.8, 1.0, 0, 0], space: palette.display }
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
				if (lastPresented !== undefined) watchFrameRate(now - lastPresented);
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
		hover += ((mouseOver ? 1 : 0) - hover) * Math.min(1, dt * 3);
		const hit = mouseOver && !light ? pointerOnPlane() : undefined;
		if (hit) {
			// Snap when the ring (re)appears, ease while it follows the cursor
			const k = hover < 0.05 ? 1 : 1 - Math.exp(-dt / 0.1);
			mouseWorld = [
				mouseWorld[0] + (hit[0] - mouseWorld[0]) * k,
				mouseWorld[1] + (hit[1] - mouseWorld[1]) * k
			];
		}
		const cam = camUniforms();
		starsDraw.set({ cam });
		post.set({ cam });
		frame.pass({ target: targets.stars, clear: CLEAR }, (p) =>
			p.draw(starsDraw!, { instances: stars })
		);
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

	// Median of the presented frame gaps over ~60 frames (after a warm-up): step down, then give up
	function watchFrameRate(gap: number) {
		if (gaveUp || gap > 500) return; // a stall (tab switch, scroll jank) says nothing
		if (++warm <= 30) return;
		gaps.push(gap);
		if (gaps.length < 60) return;
		const median = gaps.sort((a, b) => a - b)[30]!;
		gaps.length = 0;
		warm = 0;
		if (median > SLOW_FRAME_MS && level < levels.length - 1) {
			stars = levels[++level]!;
		} else if (median > GIVE_UP_FRAME_MS) {
			gaveUp = true;
			loop?.stop();
			loop = undefined;
			onSlow();
		}
	}

	function dispose() {
		if (disposed) return;
		disposed = true;
		loop?.stop();
		if (resizeFrame) cancelAnimationFrame(resizeFrame);
		observer?.disconnect();
		intersection?.disconnect();
		interaction.removeEventListener('mousemove', onMove);
		interaction.removeEventListener('mouseleave', onLeave);
		paletteObserver?.disconnect();
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
		if (!light) {
			interaction.addEventListener('mousemove', onMove);
			interaction.addEventListener('mouseleave', onLeave);
		}
		let lastKey = '';
		paletteObserver = new MutationObserver(() => {
			const key = document.body.className + '|' + (document.body.getAttribute('style') ?? '');
			if (key === lastKey) return;
			lastKey = key;
			applyPalette();
		});
		paletteObserver.observe(document.body, {
			attributes: true,
			attributeFilter: ['class', 'style']
		});
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

const DEFAULT_PALETTE = [
	'#ffffff',
	'#f5f0ff',
	'#ede4ff',
	'#ddd0ff',
	'#c4b5fd',
	'#a78bfa',
	'#8b5cf6',
	'#7c3aed',
	'#7e5cdb',
	'#8a7ace',
	'#9d9ad4',
	'#b8b8e0'
];

/** Reads --galaxy-c1..c12 and --bg-dark; the browser resolves the colours, so any CSS syntax works */
function readPalette() {
	const probe = document.createElement('span');
	probe.style.display = 'none';
	document.body.appendChild(probe);
	const style = getComputedStyle(document.body);
	const rgb = (value: string, fallback: string): [number, number, number] => {
		probe.style.color = '';
		probe.style.color = value.trim() || fallback;
		const resolved = getComputedStyle(probe).color;
		const m = resolved.match(/[\d.]+/g);
		if (!m || m.length < 3) return rgb(fallback, '#ffffff');
		const k = resolved.startsWith('color(') ? 1 : 1 / 255;
		return [Number(m[0]) * k, Number(m[1]) * k, Number(m[2]) * k];
	};
	// The pipeline works in linear light and gamma-encodes at the end
	const linear = (c: [number, number, number]) => [c[0] ** 2.2, c[1] ** 2.2, c[2] ** 2.2, 1];
	const colors = DEFAULT_PALETTE.map((fallback, i) =>
		linear(rgb(style.getPropertyValue(`--galaxy-c${i + 1}`), fallback))
	);
	const display = [...rgb(style.getPropertyValue('--bg-dark'), '#07090f'), 1];
	probe.remove();
	return { colors, space: [0, 0, 0, 1], display };
}
