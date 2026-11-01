/**
 * Renders a voxel character into a small transparent WebGL canvas:
 * one InstancedMesh of slightly overlapping rounded cubes (the overlap is what
 * makes the bevels read as one chunky body), clear-coated, under a strong
 * ambient + one key light, seen by an orthographic camera at a 3/4 angle.
 * The host component owns the animation loop and calls tick().
 */
import {
	AmbientLight,
	Color,
	DirectionalLight,
	DynamicDrawUsage,
	Group,
	InstancedMesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	Object3D,
	OrthographicCamera,
	Scene,
	Matrix4,
	Vector3,
	WebGLRenderer,
	BoxGeometry
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
	CHARACTERS,
	MODELS,
	BLINKS,
	EXPRESSIONS,
	TEAR_DROP,
	faceCells,
	hash3,
	hatFor,
	type Hat,
	type Character,
	type CharacterId,
	type ModelId,
	type Expression,
	type Role
} from './characters';

export interface Motion {
	/** Screen velocity of the mascot (px/s) */
	vx: number;
	vy: number;
	/** Spin from the physics, radians */
	angle: number;
}

export interface VoxelMascot {
	setCharacter(id: ModelId): void;
	setExpression(e: Expression): void;
	setTalking(on: boolean): void;
	/** Held by the user: turns red, shakes and throws off sparks */
	setAngry(on: boolean): void;
	/** Pointer offset from the mascot centre, in px */
	lookAt(dx: number, dy: number): void;
	/** Squash on impact, strength 0..1 */
	bump(strength: number): void;
	/** A little voxel rocket under the bot (needs a taller canvas, see the host) */
	setRocket(on: boolean): void;
	/** Flames from the rocket nozzle */
	setThrust(on: boolean): void;
	/** A gag for the muted bot: tape over the mouth, a crossed-out speaker, or powered off */
	setGag(g: Gag): void;
	refreshColors(): void;
	tick(dtMs: number, motion: Motion): void;
	dispose(): void;
}

export type Gag = 'none' | 'tape' | 'speaker' | 'off';

// Faces for the gags (the lit cells replace the whole face)
const GAG_FACES: Record<Exclude<Gag, 'none'>, string[]> = {
	tape: ['..#.#..', '.#...#.', '.#...#.', '.......', '.......'],
	speaker: ['.......', '.##.#.#', '###..#.', '.##.#.#', '.......'],
	off: ['.......', '.......', '.......', '.......', '.......']
};

const PARTICLES = 110;

// Rocket voxels, rows from the nose (touching the bot) downwards; [dy, radius², colour]
const ROCKET_ROWS: [number, number, string][] = [
	[-1, 1, '#94a3b8'],
	[-2, 3.3, '#f1f5f9'],
	[-3, 5.3, '#f1f5f9'],
	[-4, 5.3, '#ef4444'],
	[-5, 5.3, '#f1f5f9'],
	[-6, 5.3, '#f1f5f9'],
	[-7, 2.3, '#334155']
];

export function createVoxelMascot(
	canvas: HTMLCanvasElement,
	character: ModelId,
	reducedMotion: boolean
): VoxelMascot {
	const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x000000, 0);

	const scene = new Scene();
	scene.add(new AmbientLight(0xffffff, 2.2));
	const key = new DirectionalLight(0xffffff, 2);
	key.position.set(4, 7, 6);
	scene.add(key);

	const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
	camera.position.set(5, 4, 20);
	camera.lookAt(0, 0, 0);

	const root = new Group(); // idle bob, squash, physics spin
	const body = new Group(); // look-at yaw/pitch
	root.add(body);
	scene.add(root);

	const voxelGeo = new RoundedBoxGeometry(1.12, 1.12, 1.12, 3, 0.12);
	const voxelMat = new MeshPhysicalMaterial({
		roughness: 0.55,
		metalness: 0,
		clearcoat: 0.45,
		clearcoatRoughness: 0.5
	});

	// Sparkles and trail: tiny unlit cubes, recycled round-robin
	const sparkGeo = new BoxGeometry(0.42, 0.42, 0.42);
	const sparkMat = new MeshBasicMaterial({ transparent: true, opacity: 0.9 });
	const sparks = new InstancedMesh(sparkGeo, sparkMat, PARTICLES);
	sparks.instanceMatrix.setUsage(DynamicDrawUsage);
	scene.add(sparks);
	const sparkState = Array.from({ length: PARTICLES }, () => ({
		p: new Vector3(),
		v: new Vector3(),
		life: 0,
		size: 1,
		decay: 0.9
	}));
	let nextSpark = 0;

	const dummy = new Object3D();
	const color = new Color();

	let model: Character;
	let mesh: InstancedMesh | null = null;
	let cells: number[] = [];
	let center = new Vector3();
	let radius = 8;
	let palette: Record<Role, string>;
	let surface: Vector3[] = [];

	let expression: Expression = 'normal';
	let talking = false;
	let mouthOpen = false;
	let mouthMs = 0;
	let blinkMs = 2500;
	let tearMs = 0;
	let tearDrop = false;
	let blinking = false;
	let time = 0;
	let yaw = 0;
	let pitch = 0;
	let targetYaw = 0;
	let targetPitch = 0;
	let squash = 0;
	let spawnBudget = 0;
	let flameBudget = 0;
	let spinning: number[] = [];
	let spinAngle = 0;
	let rocket: InstancedMesh | null = null;
	let rocketOn = false;
	let gag: Gag = 'none';
	let tape: InstancedMesh | null = null;
	// Powered off: it topples sideways (fall: 0 upright .. 1 on its side), with a little bounce
	let fall = 0;
	let fallV = 0;
	let fallDir = 1;
	let thrust = 0;
	let thrustTarget = 0;
	/** Where the flames start, relative to the model centre */
	const nozzle = new Vector3();

	function css(name: string, fallback: string) {
		return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
	}

	let currentId: ModelId = character;
	let currentHat: Hat = 'propeller';

	function build(id: ModelId) {
		if (mesh) {
			body.remove(mesh);
			mesh.dispose();
		}
		if (tape) {
			body.remove(tape);
			tape.dispose();
			tape = null;
		}
		currentId = id;
		currentHat = hatFor(document.body.classList);
		model =
			id in MODELS
				? MODELS[id as keyof typeof MODELS]()
				: CHARACTERS[id as CharacterId](currentHat);
		const vs = model.voxels;
		const min = new Vector3(Infinity, Infinity, Infinity);
		const max = new Vector3(-Infinity, -Infinity, -Infinity);
		// Frame the body only: hats, glasses and the glass vary per theme, and must not
		// change the mascot's size
		for (const v of vs) {
			if (v.color) continue;
			min.min(new Vector3(v.x, v.y, v.z));
			max.max(new Vector3(v.x, v.y, v.z));
		}
		if (model.frameTop !== undefined) max.y = Math.max(max.y, model.frameTop);
		center = min.clone().add(max).multiplyScalar(0.5);
		radius = (Math.max(max.x - min.x, max.y - min.y, max.z - min.z) / 2 + 1) * 1.28; // room to lean and squash
		mesh = new InstancedMesh(voxelGeo, voxelMat, vs.length);
		// The sparks reuse dummy and leave it scaled to 0
		dummy.rotation.set(0, 0, 0);
		dummy.scale.setScalar(1);
		vs.forEach((v, i) => {
			dummy.position.set(v.x - center.x, v.y - center.y, v.z - center.z);
			dummy.updateMatrix();
			mesh!.setMatrixAt(i, dummy.matrix);
		});
		body.add(mesh);
		buildRocket(min.y);
		spinning = vs.flatMap((v, i) => (v.spin ? [i] : []));
		cells = faceCells(model);
		buildTape();
		// Voxels with an open neighbour emit the sparkles
		const taken = new Set(vs.map((v) => `${v.x},${v.y},${v.z}`));
		surface = vs
			.filter(
				(v) => !taken.has(`${v.x},${v.y + 1},${v.z}`) || !taken.has(`${v.x + 1},${v.y},${v.z}`)
			)
			.map((v) => new Vector3(v.x - center.x, v.y - center.y, v.z - center.z));
		resize();
		refreshColors();
	}

	// A rocket under the lowest body voxel: grey nose, white body, red stripe and fins
	function buildRocket(bottomY: number) {
		if (rocket) {
			body.remove(rocket);
			rocket.dispose();
		}
		const cells: { x: number; y: number; z: number; c: string }[] = [];
		for (const [dy, r2, c] of ROCKET_ROWS)
			for (let x = -2; x <= 2; x++)
				for (let z = -2; z <= 2; z++)
					if (x * x + z * z <= r2) cells.push({ x, y: bottomY + dy, z, c });
		// Fins on the four sides, longer than the body
		for (const [fx, fz] of [
			[3, 0],
			[-3, 0],
			[0, 3],
			[0, -3]
		])
			for (let dy = -4; dy >= -7; dy--) cells.push({ x: fx, y: bottomY + dy, z: fz, c: '#dc2626' });
		rocket = new InstancedMesh(voxelGeo, voxelMat, cells.length);
		dummy.rotation.set(0, 0, 0);
		dummy.scale.setScalar(1);
		cells.forEach((v, i) => {
			dummy.position.set(v.x - center.x, v.y - center.y, v.z - center.z);
			dummy.updateMatrix();
			rocket!.setMatrixAt(i, dummy.matrix);
			rocket!.setColorAt(i, color.set(v.c));
		});
		rocket.visible = rocketOn;
		body.add(rocket);
		nozzle.set(0, bottomY - 8 - center.y, 0);
	}

	// A strip of grey duct tape across the mouth, a hair crooked, floating just off the face
	function buildTape() {
		const onFace = cells.filter((i) => i >= 0);
		if (!onFace.length) return;
		const z = Math.max(...onFace.map((i) => model.voxels[i].z)) + 1;
		const cs: { x: number; y: number }[] = [];
		for (let fx = 0; fx < 7; fx++)
			for (const fy of [3, 4]) cs.push({ x: model.face.x0 + fx, y: model.face.y0 - fy });
		tape = new InstancedMesh(voxelGeo, voxelMat, cs.length);
		cs.forEach((v, i) => {
			dummy.position.set(v.x - center.x, v.y - center.y, z - center.z);
			dummy.rotation.set(0, 0, 0);
			dummy.scale.set(1, 1, 0.5);
			dummy.updateMatrix();
			// Tilt the whole strip a little around the mouth
			const tilt = new Matrix4().makeRotationZ(-0.1);
			const pivot = new Vector3(model.face.x0 + 3 - center.x, model.face.y0 - 3.5 - center.y, 0);
			const t1 = new Matrix4().makeTranslation(pivot.x, pivot.y, 0);
			const t2 = new Matrix4().makeTranslation(-pivot.x, -pivot.y, 0);
			tape!.setMatrixAt(i, t1.multiply(tilt).multiply(t2).multiply(dummy.matrix));
			tape!.setColorAt(i, color.set('#9ca3af').offsetHSL(0, 0, (hash3(v.x, v.y, 7) - 0.5) * 0.06));
		});
		tape.visible = gag === 'tape';
		body.add(tape);
	}

	function tintSparks() {
		sparkMat.color.copy(sparkCalm).lerp(rage, anger).lerp(flame, thrust);
	}

	function refreshColors() {
		// Season and night swap Turi's hat, which changes the geometry
		if (hatFor(document.body.classList) !== currentHat) return build(currentId);
		palette = model.palette(css, document.body.classList.contains('tod-night'));
		paint();
		sparkCalm.set(palette.glow);
		tintSparks();
	}

	const rage = new Color('#f2552c');
	const flame = new Color('#ffb020');
	const sparkCalm = new Color();
	let anger = 0;
	let angryTarget = 0;

	function paint() {
		if (!mesh) return;
		// Still fuming: the face stays angry until the red has mostly faded
		const base =
			gag !== 'none'
				? GAG_FACES[gag]
				: anger > 0.35 && expression !== 'dizzy'
					? EXPRESSIONS.angry
					: expression === 'tear' && tearDrop
						? TEAR_DROP
						: EXPRESSIONS[expression];
		// Eyes and brows keep the mood while talking (only the mouth moves) and while blinking
		// (only the eyes close), so a sad bot talks sad
		const rows =
			gag !== 'none'
				? base
				: talking && mouthOpen && expression !== 'talk'
					? [...base.slice(0, 3), ...EXPRESSIONS.talk.slice(3)]
					: blinking
						? [...EXPRESSIONS.blink.slice(0, 3), ...base.slice(3)]
						: talking && mouthOpen
							? EXPRESSIONS.talk
							: base;
		const lit = new Set<number>();
		rows.forEach((row, fy) =>
			[...row].forEach((ch, fx) => {
				const i = cells[fy * 7 + fx];
				if (ch === '#' && i >= 0) lit.add(i);
			})
		);
		model.voxels.forEach((v, i) => {
			color.set(lit.has(i) ? palette[model.faceOn] : (v.color ?? palette[v.role]));
			// Anger floods the body (not the face or the screen) with a hot red-orange
			// Hats and other accessories (fixed colour) don't get angry, only the body
			if (anger > 0 && !lit.has(i) && v.role !== 'dark' && !v.color) color.lerp(rage, anger * 0.75);
			// Powered off: the whole body goes dull
			if (gag === 'off' && !lit.has(i)) color.multiplyScalar(0.55);
			// ±7% lightness jitter so flat areas read as individual cubes
			if (!lit.has(i))
				color.offsetHSL(
					0,
					0,
					(hash3(v.x, v.y, v.z) - 0.5) * (v.role === 'dark' ? 0.04 : v.color ? 0.06 : 0.14)
				);
			mesh!.setColorAt(i, color);
		});
		if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
	}

	function resize() {
		const w = canvas.clientWidth || 160;
		const h = canvas.clientHeight || 160;
		renderer.setSize(w, h, false);
		// The canvas is square at rest; a host that makes it taller (the rocket's flames) only
		// adds room below, the bot keeps its scale and place
		const perPx = (2 * radius) / w;
		camera.left = -radius;
		camera.right = radius;
		camera.top = radius;
		camera.bottom = radius - h * perPx;
		camera.updateProjectionMatrix();
	}

	function emit(at: Vector3, velocity: Vector3, size = 1, decay = 0.9) {
		const s = sparkState[nextSpark];
		nextSpark = (nextSpark + 1) % PARTICLES;
		s.p.copy(at);
		s.v.copy(velocity);
		s.life = 1;
		s.size = size;
		s.decay = decay;
	}

	// Propeller: rotate the flagged voxels around the vertical axis through x = z = 0
	function tickSpin(dt: number, motion: Motion) {
		if (!mesh || !spinning.length) return;
		// Spins faster while the mascot flies
		const speed = reducedMotion ? 0 : 4 + Math.min(Math.hypot(motion.vx, motion.vy) / 120, 18);
		// Powered off: the propeller stops where it is
		if (!speed || gag === 'off') return;
		spinAngle += speed * dt;
		const c = Math.cos(spinAngle);
		const s = Math.sin(spinAngle);
		for (const i of spinning) {
			const v = model.voxels[i];
			dummy.position.set(
				v.x * c + v.z * s - center.x,
				v.y - center.y,
				-v.x * s + v.z * c - center.z
			);
			dummy.rotation.set(0, spinAngle, 0);
			dummy.scale.setScalar(1);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	}

	function tickSparks(dt: number, motion: Motion) {
		if (!reducedMotion) {
			const speed = Math.hypot(motion.vx, motion.vy);
			// A few ambient sparkles, many more as a trail while it flies
			spawnBudget += dt * (1.2 + Math.min(speed / 60, 30) + anger * 75);
			while (spawnBudget >= 1 && surface.length) {
				spawnBudget -= 1;
				const from = surface[Math.floor(Math.random() * surface.length)].clone();
				from.applyEuler(body.rotation).applyEuler(root.rotation);
				const drift =
					anger > 0.3
						? new Vector3(
								(Math.random() - 0.5) * 9,
								Math.random() * 7 - 1,
								(Math.random() - 0.5) * 4
							)
						: speed > 250
							? new Vector3(-motion.vx, motion.vy, 0).multiplyScalar(0.012)
							: new Vector3((Math.random() - 0.5) * 2, 1.5 + Math.random(), 0);
				emit(from, drift);
			}
		}
		if (thrust > 0.05 && rocketOn && !reducedMotion) {
			// Flames: many big, fast, short-lived cubes shot down from the nozzle
			flameBudget += dt * 130 * thrust;
			while (flameBudget >= 1) {
				flameBudget -= 1;
				const from = nozzle
					.clone()
					.add(new Vector3((Math.random() - 0.5) * 1.6, 0, (Math.random() - 0.5) * 1.6));
				from.applyEuler(body.rotation).applyEuler(root.rotation);
				emit(
					from,
					new Vector3(
						(Math.random() - 0.5) * 2.6,
						-(9 + Math.random() * 7),
						(Math.random() - 0.5) * 2.2
					),
					2.7,
					1.45
				);
			}
		}
		sparkState.forEach((s, i) => {
			if (s.life > 0) {
				s.life -= dt * s.decay;
				s.p.addScaledVector(s.v, dt);
			}
			const k = Math.max(0, s.life);
			dummy.position.copy(s.p);
			dummy.rotation.set(0, 0, 0);
			// Angry sparks are bigger, so the burst reads at a glance
			dummy.scale.setScalar(k * s.size * (1 + anger * 0.9));
			dummy.updateMatrix();
			sparks.setMatrixAt(i, dummy.matrix);
		});
		sparks.instanceMatrix.needsUpdate = true;
	}

	build(character);
	const ro = new ResizeObserver(resize);
	ro.observe(canvas);

	return {
		setCharacter: build,
		setExpression(e) {
			if (e === expression) return;
			expression = e;
			tearDrop = false;
			tearMs = 0;
			paint();
		},
		setAngry(on) {
			angryTarget = on ? 1 : 0;
		},
		setTalking(on) {
			talking = on;
			mouthOpen = on;
			mouthMs = 0;
			paint();
		},
		lookAt(dx, dy) {
			const clamp = (v: number) => Math.max(-1, Math.min(1, v));
			targetYaw = clamp(dx / 500) * 0.6;
			targetPitch = clamp(dy / 500) * 0.35;
		},
		bump(strength) {
			squash = Math.min(1, Math.max(squash, strength));
		},
		setGag(g) {
			if (g === gag) return;
			gag = g;
			if (tape) tape.visible = g === 'tape';
			if (g === 'off') {
				fallDir = Math.random() < 0.5 ? 1 : -1;
				fallV = 0;
			}
			paint();
		},
		setRocket(on) {
			rocketOn = on;
			if (rocket) rocket.visible = on;
			if (!on) thrustTarget = 0;
		},
		setThrust(on) {
			thrustTarget = on && rocketOn ? 1 : 0;
		},
		refreshColors,
		tick(dtMs, motion) {
			const dt = Math.min(dtMs, 50) / 1000;
			time += dt;
			if (talking) {
				mouthMs += dtMs;
				if (mouthMs >= 150) {
					mouthMs = 0;
					mouthOpen = !mouthOpen;
					paint();
				}
			} else if (!reducedMotion) {
				if (expression === 'tear') {
					tearMs += dtMs;
					if (tearMs >= 650) {
						tearMs = 0;
						tearDrop = !tearDrop;
						paint();
					}
				}
				blinkMs -= dtMs;
				const blinkNow = BLINKS.includes(expression) && blinkMs < 0;
				if (blinkNow !== blinking) {
					blinking = blinkNow;
					paint();
				}
				if (blinkMs < -130) blinkMs = 2500 + Math.random() * 3000;
			}
			const ease = 1 - Math.exp(-dt * 8);
			yaw += (targetYaw - yaw) * ease;
			pitch += (targetPitch - pitch) * ease;
			body.rotation.set(pitch, yaw, 0);

			const speed = Math.hypot(motion.vx, motion.vy);
			const bob = reducedMotion ? 0 : Math.sin(time * 2.2) * 0.35;
			const sway = reducedMotion ? 0 : Math.sin(time * 1.3) * 0.06;
			// Lean into the direction of travel, plus the spin from the physics
			const lean = Math.max(-0.5, Math.min(0.5, -motion.vx / 2500));
			// Powered off: tips over and bounces once, then lies still
			const fallTarget = gag === 'off' ? 1 : 0;
			if (reducedMotion) fall = fallTarget;
			else {
				fallV += (fallTarget - fall) * 90 * dt;
				fallV *= Math.exp(-dt * 7);
				fall = Math.max(0, fall + fallV * dt);
				if (fall > 1) {
					fall = 1;
					fallV *= -0.35;
				}
			}
			const lying = gag === 'off' ? 0 : 1;
			root.rotation.set(0, 0, -motion.angle + (lean + sway) * lying + fall * 1.5 * fallDir);
			// Anger fades in and out; repaint only while it is changing
			const prevAnger = anger;
			// Flares up in ~0.2 s, calms down over ~2.5 s
			anger += (angryTarget - anger) * (1 - Math.exp(-dt * (angryTarget ? 9 : 1.1)));
			if (Math.abs(anger - angryTarget) < 0.01) anger = angryTarget;
			if (anger !== prevAnger) paint();
			const prevThrust = thrust;
			thrust += (thrustTarget - thrust) * (1 - Math.exp(-dt * 10));
			if (Math.abs(thrust - thrustTarget) < 0.01) thrust = thrustTarget;
			if (anger !== prevAnger || thrust !== prevThrust) tintSparks();
			const shake = reducedMotion ? 0 : anger * 0.35;
			root.position.set((Math.random() - 0.5) * shake, bob + (Math.random() - 0.5) * shake, 0);
			squash = Math.max(0, squash - dt * 3);
			const sq = Math.sin(squash * Math.PI) * 0.25;
			const stretch = Math.min(speed / 4000, 0.12);
			root.scale.set(1 + sq - stretch * 0.5, 1 - sq + stretch, 1);

			tickSpin(dt, motion);
			tickSparks(dt, motion);
			renderer.render(scene, camera);
		},
		dispose() {
			ro.disconnect();
			mesh?.dispose();
			rocket?.dispose();
			tape?.dispose();
			voxelGeo.dispose();
			voxelMat.dispose();
			sparkGeo.dispose();
			sparkMat.dispose();
			sparks.dispose();
			renderer.dispose();
		}
	};
}
