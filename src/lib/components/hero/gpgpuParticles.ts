export interface GalaxyOptions {
	/** Called if the galaxy gave up on its own (a phone too slow to run it) */
	onAbort?: () => void;
}

/**
 * Three.js GPGPU Particle System — 3D Tilted Spiral Galaxy.
 * Renders particles on GPU with simulation shaders, raycasting for cursor interaction.
 * Phones and touch screens get a lighter version of the same galaxy (see `light`).
 */
export async function initGpgpuParticles(
	container: HTMLElement,
	interactionTarget: HTMLElement,
	options: GalaxyOptions = {}
): Promise<(() => void) | undefined> {
	// Respect users who prefer reduced motion — skip the heavy particle system.
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	const THREE = await import('three');
	const {
		Scene,
		PerspectiveCamera,
		WebGLRenderer,
		ShaderMaterial,
		BufferGeometry,
		Float32BufferAttribute,
		Points,
		DataTexture,
		RGBAFormat,
		FloatType,
		NearestFilter,
		ClampToEdgeWrapping,
		WebGLRenderTarget,
		OrthographicCamera,
		PlaneGeometry,
		Mesh,
		Raycaster,
		Vector2,
		Vector3,
		Timer,
		Color,
		AdditiveBlending,
		Sprite,
		SpriteMaterial,
		CanvasTexture
	} = THREE;

	let W = container.offsetWidth;
	let H = container.offsetHeight;

	const SIZE = 192; // 192x192 = 36864 particelle
	// Phones and touch screens: the same simulation and look, but a quarter of the particles,
	// a smaller disc seen from further away so it fits a portrait screen, a lower pixel ratio,
	// 30 fps and no cursor ring. Desktop is untouched.
	const light = W <= 768 || window.matchMedia('(pointer: coarse)').matches;
	const LIGHT_SIZE = 96; // 96x96 = 9216 particelle
	const ACTIVE_SIZE = light ? LIGHT_SIZE : SIZE;
	const LENGTH = ACTIVE_SIZE * ACTIVE_SIZE;
	const GALAXY_RADIUS = light ? 4.6 : 8.0;
	const CAM_ZOOM = light ? 1.6 : 1;
	const MAX_PIXEL_RATIO = light ? 1.5 : 2;

	// ── Renderer ──
	const renderer = new WebGLRenderer({
		antialias: false,
		alpha: true,
		powerPreference: light ? 'default' : 'high-performance',
		stencil: false
	});
	renderer.setSize(W, H);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
	renderer.setClearColor(0x000000, 0);
	const canvas = renderer.domElement;
	canvas.style.cssText =
		'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
	container.prepend(canvas);

	// Supporto Float Texture
	const gl = renderer.getContext();
	const extFloat = gl.getExtension('EXT_color_buffer_float');
	if (!extFloat) {
		renderer.dispose();
		canvas.remove();
		return;
	}

	// ── Camera ──
	const BASE_FOV = 45;
	const camera = new PerspectiveCamera(BASE_FOV, W / H, 0.1, 1000);
	camera.position.set(0, -6.5 * CAM_ZOOM, 4.5 * CAM_ZOOM); // Angolazione a ~45 gradi
	camera.lookAt(0, 0, 0);

	// The canvas hangs below the hero (it fades into About), so frame the scene as if
	// it were hero-sized: same scale, centred on the hero, the extra strip below is
	// just more of the same view.
	function frameToHero() {
		const heroH = interactionTarget.offsetHeight || H;
		const ext = Math.max(0, H - heroH);
		const fullH = heroH + 2 * ext;
		const halfFov = ((BASE_FOV / 2) * Math.PI) / 180;
		camera.fov = (2 * Math.atan((Math.tan(halfFov) * fullH) / heroH) * 180) / Math.PI;
		camera.aspect = W / fullH;
		// On phones the bright core sits behind the photo, not behind the typed subtitle
		camera.setViewOffset(W, fullH, 0, ext + (light ? 0.17 * heroH : 0), W, H);
		camera.updateProjectionMatrix();
	}
	frameToHero();

	// ── Scene ──
	const scene = new Scene();

	// ── Generazione Posizioni ──
	function createPositionData(): Float32Array {
		const data = new Float32Array(LENGTH * 4);

		// Vero Disco Galattico
		const ARMS = 3;

		function gauss(): number {
			const u1 = Math.random() || 1e-6;
			const u2 = Math.random();
			return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
		}

		for (let i = 0; i < LENGTH; i++) {
			let px: number, py: number, pz: number;

			// "t" è la distanza dal centro (da 0 a 1).
			// Math.pow concentra più particelle al centro sfumando verso l'esterno.
			const t = Math.pow(Math.random(), 1.5);
			const r = t * GALAXY_RADIUS;
			let theta = 0;

			const roll = Math.random();

			if (roll < 0.2) {
				// 20% — Nucleo: Sferoide schiacciato (assolutamente NO colonna)
				const coreR = Math.pow(Math.random(), 2.0) * 1.2; // raggio del nucleo limitato
				theta = Math.random() * Math.PI * 2;
				px = Math.cos(theta) * coreR;
				py = Math.sin(theta) * coreR;
				// Z è proporzionale a coreR ma molto piccolo
				pz = gauss() * 0.15 * Math.exp(-coreR * 2.0);
			} else {
				// 80% — Bracci e disco
				const armIndex = Math.floor(Math.random() * ARMS);
				const armOffset = ((Math.PI * 2) / ARMS) * armIndex;

				// Il moltiplicatore (ad es. 1.8) decide quanto si "avvolgono" i bracci
				theta = armOffset + r * 1.8;

				// Dispersione attorno al braccio teorico (cresce allontanandosi dal centro).
				// Tight enough that the 3 arms read as distinct bands rather than
				// blurring into a uniform disc (they're ~2.1 rad apart at any radius).
				const spread = 0.12 + r * 0.06;
				const jitterX = gauss() * spread;
				const jitterY = gauss() * spread;

				px = Math.cos(theta) * r + jitterX;
				py = Math.sin(theta) * r + jitterY;

				// Spessore del disco estremamente sottile
				pz = gauss() * 0.08;
			}

			data[i * 4 + 0] = px;
			data[i * 4 + 1] = py;
			data[i * 4 + 2] = pz;
			data[i * 4 + 3] = 0;
		}
		return data;
	}

	const posData = createPositionData();
	const posTex = new DataTexture(posData, ACTIVE_SIZE, ACTIVE_SIZE, RGBAFormat, FloatType);
	posTex.minFilter = NearestFilter;
	posTex.magFilter = NearestFilter;
	posTex.wrapS = ClampToEdgeWrapping;
	posTex.wrapT = ClampToEdgeWrapping;
	posTex.needsUpdate = true;

	// ── GPGPU Render Targets ──
	const rtOptions = {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		format: RGBAFormat,
		type: FloatType,
		depthBuffer: false,
		stencilBuffer: false
	};
	let rt1 = new WebGLRenderTarget(ACTIVE_SIZE, ACTIVE_SIZE, rtOptions);
	let rt2 = new WebGLRenderTarget(ACTIVE_SIZE, ACTIVE_SIZE, rtOptions);

	renderer.setRenderTarget(rt1);
	renderer.clear();
	renderer.setRenderTarget(rt2);
	renderer.clear();
	renderer.setRenderTarget(null);

	// ── GPGPU Simulation shader ──
	const simMaterial = new ShaderMaterial({
		uniforms: {
			uPosition: { value: posTex },
			uPosRefs: { value: posTex },
			uMousePos: { value: new Vector2(0, 0) },
			uTime: { value: 0 },
			uDeltaTime: { value: 0 },
			uIsHovering: { value: 0 },
			uRingRadius: { value: 0.2 },
			uRotation: { value: 0 }
		},
		vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
		fragmentShader: `
            precision highp float;
            uniform sampler2D uPosition;
            uniform sampler2D uPosRefs;
            uniform vec2 uMousePos;
            uniform float uRotation;
            uniform float uTime;
            uniform float uIsHovering;
            uniform float uRingRadius;

            vec2 hash(vec2 p) {
                p = vec2(dot(p,vec2(2127.1,81.17)), dot(p,vec2(1269.5,283.37)));
                return fract(sin(p)*43758.5453);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / ${ACTIVE_SIZE.toFixed(1)};
                vec4 pFrame = texture2D(uPosition, uv);
                vec3 refPos = texture2D(uPosRefs, uv).xyz;
                
                vec3 pos = pFrame.xyz;
                float velocity = pFrame.w;

                vec2 seed = hash(uv);

                {
                    // ─── Galaxy ───
                    float lifeEnd = 3.0 + sin(seed.y * 100.0) * 1.5;
                    float lifeTime = mod(seed.x * 100.0 + uTime * 0.5, lifeEnd);

                    float cr = cos(uRotation);
                    float sr = sin(uRotation);
                    vec3 rotRef = vec3(
                        refPos.x * cr - refPos.y * sr,
                        refPos.x * sr + refPos.y * cr,
                        refPos.z
                    );

                    vec3 targetPos = rotRef;

                    vec2 mDiff = pos.xy - uMousePos;
                    float mDist = length(mDiff);
                    float mouseInfluence = smoothstep(uRingRadius + 0.4, 0.0, mDist) * uIsHovering;
                    
                    if (mDist > 0.001) {
                        targetPos.xy += (mDiff / mDist) * mouseInfluence * 0.3;
                    }
                    targetPos.z += mouseInfluence * 0.15;
                    velocity = mouseInfluence;

                    vec3 toRef = targetPos - pos;
                    pos += toRef * 0.06;

                    if (lifeTime < 0.01) {
                        pos = rotRef;
                    }
                }

                gl_FragColor = vec4(pos, velocity);
            }
        `
	});

	const simScene = new Scene();
	const simCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
	const simQuad = new Mesh(new PlaneGeometry(2, 2), simMaterial);
	simScene.add(simQuad);

	// ── Dati Render ──
	const seeds = new Float32Array(LENGTH * 4);
	for (let i = 0; i < LENGTH; i++) {
		seeds[i * 4 + 0] = Math.random();
		seeds[i * 4 + 1] = Math.random();
	}

	const geo = new BufferGeometry();
	const uvs = new Float32Array(LENGTH * 2);
	for (let i = 0; i < ACTIVE_SIZE; i++) {
		for (let j = 0; j < ACTIVE_SIZE; j++) {
			const idx = i * ACTIVE_SIZE + j;
			uvs[idx * 2 + 0] = (j + 0.5) / ACTIVE_SIZE;
			uvs[idx * 2 + 1] = (i + 0.5) / ACTIVE_SIZE;
		}
	}
	geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(LENGTH * 3), 3));
	geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
	geo.setAttribute('seeds', new Float32BufferAttribute(seeds, 4));

	// ── Read galaxy colors from CSS variables ──
	function getCSSColor(varName: string, fallback: string) {
		const val = getComputedStyle(document.body).getPropertyValue(varName).trim();
		return new Color(val || fallback);
	}

	function updateGalaxyColors() {
		renderMaterial.uniforms.uColorC1.value.copy(getCSSColor('--galaxy-c1', '#ffffff'));
		renderMaterial.uniforms.uColorC2.value.copy(getCSSColor('--galaxy-c2', '#f5f0ff'));
		renderMaterial.uniforms.uColorC3.value.copy(getCSSColor('--galaxy-c3', '#ede4ff'));
		renderMaterial.uniforms.uColorC4.value.copy(getCSSColor('--galaxy-c4', '#ddd0ff'));
		renderMaterial.uniforms.uColorC5.value.copy(getCSSColor('--galaxy-c5', '#c4b5fd'));
		renderMaterial.uniforms.uColorC6.value.copy(getCSSColor('--galaxy-c6', '#a78bfa'));
		renderMaterial.uniforms.uColorC7.value.copy(getCSSColor('--galaxy-c7', '#8b5cf6'));
		renderMaterial.uniforms.uColorC8.value.copy(getCSSColor('--galaxy-c8', '#7c3aed'));
		renderMaterial.uniforms.uColorC9.value.copy(getCSSColor('--galaxy-c9', '#7e5cdb'));
		renderMaterial.uniforms.uColorC10.value.copy(getCSSColor('--galaxy-c10', '#8a7ace'));
		renderMaterial.uniforms.uColorC11.value.copy(getCSSColor('--galaxy-c11', '#9d9ad4'));
		renderMaterial.uniforms.uColorC12.value.copy(getCSSColor('--galaxy-c12', '#b8b8e0'));
		// c2, not c1: c1 is pure white in every variant, which as a big soft
		// sprite reads as a flat white blob — c2 carries each palette's actual
		// tint (the "just past white" tone) so the glow still looks tinted.
		if (coreGlowMat) coreGlowMat.color.copy(getCSSColor('--galaxy-c2', '#f5f0ff'));
	}

	// ── Core glow sprite: a soft radial bloom over the galactic
	// bulge, additive-blended under the fine particle detail so the center
	// reads as a luminous haze instead of just a denser cluster of dots. A
	// Sprite (not a rotated plane) always faces the camera with no per-frame
	// orientation math, which is all that's needed since the camera is static.
	function createGlowTexture() {
		const size = 128;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		gradient.addColorStop(0, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.15, 'rgba(255,255,255,0.5)');
		gradient.addColorStop(0.4, 'rgba(255,255,255,0.12)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, size, size);
		const texture = new CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}

	let coreGlowTex: InstanceType<typeof CanvasTexture> | null = null;
	let coreGlowMat: InstanceType<typeof SpriteMaterial> | null = null;
	let coreGlow: InstanceType<typeof Sprite> | null = null;
	coreGlowTex = createGlowTexture();
	coreGlowMat = new SpriteMaterial({
		map: coreGlowTex,
		color: getCSSColor('--galaxy-c2', '#f5f0ff'),
		transparent: true,
		blending: AdditiveBlending,
		depthWrite: false,
		depthTest: false,
		opacity: 0
	});
	coreGlow = new Sprite(coreGlowMat);
	const glowSize = 4.2 * (GALAXY_RADIUS / 8);
	coreGlow.scale.set(glowSize, glowSize, 1);
	scene.add(coreGlow);

	// ── Render shader ──
	const renderMaterial = new ShaderMaterial({
		uniforms: {
			uPosition: { value: posTex },
			uTime: { value: 0 },
			// Same dot size on screen whatever the camera distance (the vertex shader divides by it)
			uParticleScale: { value: light ? CAM_ZOOM * 1.0 : 1.0 },
			uPixelRatio: { value: renderer.getPixelRatio() },
			uIsHovering: { value: 0 },
			uColorC1: { value: new Color(0xffffff) },
			uColorC2: { value: new Color(0xf5f0ff) },
			uColorC3: { value: new Color(0xede4ff) },
			uColorC4: { value: new Color(0xddd0ff) },
			uColorC5: { value: new Color(0xc4b5fd) },
			uColorC6: { value: new Color(0xa78bfa) },
			uColorC7: { value: new Color(0x8b5cf6) },
			uColorC8: { value: new Color(0x7c3aed) },
			uColorC9: { value: new Color(0x7e5cdb) },
			uColorC10: { value: new Color(0x8a7ace) },
			uColorC11: { value: new Color(0x9d9ad4) },
			uColorC12: { value: new Color(0xb8b8e0) },
			uAlpha: { value: 1.0 },
			uGalaxyR: { value: GALAXY_RADIUS },
			uCamRef: { value: 7.9 * CAM_ZOOM }
		},
		vertexShader: `
            precision highp float;

            uniform sampler2D uPosition;
            uniform float uTime;
            uniform float uParticleScale;
            uniform float uPixelRatio;

            varying vec3 vLocalPos;
            varying float vVelocity;
            varying float vScale;
            varying float vCamDist;

            vec2 hash(vec2 p) {
                p = vec2(dot(p,vec2(2127.1,81.17)), dot(p,vec2(1269.5,283.37)));
                return fract(sin(p)*43758.5453);
            }

            void main() {
                vec4 pos = texture2D(uPosition, uv);
                vLocalPos = pos.xyz;
                vVelocity = pos.w;

                vec2 seed = hash(uv);
                // Second, decorrelated hash pass: a per-particle "intrinsic
                // luminosity" so the field isn't made of uniformly-sized dots —
                // some particles read as brighter foreground stars, others as
                // faint background dust, independent of position or lifecycle.
                vec2 seed2 = hash(seed + 7.31);

                float lifeEnd = 3.0 + sin(seed.y * 100.0) * 1.5;
                float lifeTime = mod(seed.x * 100.0 + uTime * 0.5, lifeEnd);
                float animScale = smoothstep(0.01, 0.5, lifeTime) - smoothstep(0.5, 1.0, lifeTime / lifeEnd);

                float sizeVariance = 0.55 + seed2.x * 1.2;
                vScale = (animScale + (vVelocity * 1.5)) * sizeVariance;

                vec4 viewSpace = modelViewMatrix * vec4(pos.xyz, 1.0);
                gl_Position = projectionMatrix * viewSpace;

                vCamDist = -viewSpace.z;
                float depthFade = 1.0 / vCamDist;
                float basePtSize = 35.0;
                gl_PointSize = (vScale * basePtSize) * uPixelRatio * uParticleScale * depthFade;
            }
        `,
		fragmentShader: `
            precision highp float;

            varying vec3 vLocalPos;
            varying float vScale;
            varying float vVelocity;
            varying float vCamDist;

            uniform vec3 uColorC1;
            uniform vec3 uColorC2;
            uniform vec3 uColorC3;
            uniform vec3 uColorC4;
            uniform vec3 uColorC5;
            uniform vec3 uColorC6;
            uniform vec3 uColorC7;
            uniform vec3 uColorC8;
            uniform vec3 uColorC9;
            uniform vec3 uColorC10;
            uniform vec3 uColorC11;
            uniform vec3 uColorC12;
            uniform float uAlpha;
            uniform float uGalaxyR;
            uniform float uCamRef;

            void main() {
                float dist = length(vLocalPos.xy) / uGalaxyR;

                // 12-stop gradient: center → edge. Wider bright core (c1-c5 now
                // hold until dist ~0.25, up from ~0.18) before easing into the
                // darker stops, which still fully resolve by the rim.
                vec3 col = mix(uColorC1, uColorC2, smoothstep(0.0, 0.05, dist));
                col = mix(col, uColorC3, smoothstep(0.05, 0.1, dist));
                col = mix(col, uColorC4, smoothstep(0.1, 0.17, dist));
                col = mix(col, uColorC5, smoothstep(0.17, 0.25, dist));
                col = mix(col, uColorC6, smoothstep(0.25, 0.34, dist));
                col = mix(col, uColorC7, smoothstep(0.34, 0.44, dist));
                col = mix(col, uColorC8, smoothstep(0.44, 0.54, dist));
                col = mix(col, uColorC9, smoothstep(0.54, 0.64, dist));
                col = mix(col, uColorC10, smoothstep(0.64, 0.74, dist));
                col = mix(col, uColorC11, smoothstep(0.74, 0.86, dist));
                col = mix(col, uColorC12, smoothstep(0.86, 1.0, dist));

                // Reduced from 0.8: this term brightened every particle regardless
                // of position, fighting the dark edge colors above.
                col += vec3(vVelocity * 0.4);

                // Depth cueing: the disc tilts through a camera-distance range of roughly
                // 1.3 to 14.5 units from near edge to far edge (centre ~7.9, scaled with the
                // camera on phones): particles nearer the camera read brighter, farther ones
                // dimmer, on top of the size falloff already in the vertex shader. Together
                // they sell the tilt, so the disc reads as a plane in space, not a flat sheet.
                float depthDim = clamp(1.0 + (uCamRef - vCamDist) * 0.045 * (7.9 / uCamRef), 0.55, 1.35);
                col *= depthDim;

                // Two-term falloff instead of one hard cone: a tight bright core
                // (what makes a point read as a crisp star) plus a wide, dim halo
                // (what makes it glow) — additive blending piles the halos up into
                // a soft bloom wherever particles cluster, with no postprocessing pass.
                float pDist = length(gl_PointCoord.xy - 0.5) * 2.0;
                float core = pow(max(0.0, 1.0 - pDist), 4.0);
                float halo = pow(max(0.0, 1.0 - pDist), 1.2) * 0.35;
                float alpha = (core + halo) * vScale * uAlpha;

                if (alpha < 0.01) discard;

                gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
            }
        `,
		transparent: true,
		blending: AdditiveBlending, // L'Additive crea l'effetto neon e fiammante al centro
		depthWrite: false,
		depthTest: false
	});

	const points = new Points(geo, renderMaterial);
	scene.add(points);

	// ── Raycasting (desktop only) ──
	const raycaster = new Raycaster();
	const scratchMouseUV = new Vector2(-9, -9);
	const mouseNDC = new Vector2(-9, -9);
	const intersectionPoint = new Vector3();
	let isIntersecting = false;
	let mouseIsOver = false;

	let rayPlaneGeo: InstanceType<typeof PlaneGeometry> | null = null;
	let rayPlaneMat: InstanceType<typeof ShaderMaterial> | null = null;
	let rayPlane: InstanceType<typeof Mesh> | null = null;
	if (!light) {
		rayPlaneGeo = new PlaneGeometry(80, 80);
		rayPlaneMat = new ShaderMaterial({ visible: false });
		rayPlane = new Mesh(rayPlaneGeo, rayPlaneMat);
		scene.add(rayPlane);
	}

	// ── Animazione ──
	const clock = new Timer();
	let time = 0;
	let hoverProgress = 0;
	let everRendered = false;
	let raf = 0;
	let skipFrame = false;
	let isOnScreen = true;
	let pageVisible = !document.hidden;
	const FADE_MS = 1400;
	let fadeStart = 0;

	// Phones render at 30 fps, and give the galaxy up if they can't even keep ~20 fps once
	// warmed up: the CSS background that was there before takes over
	const FRAME_MS = light ? 1000 / 30 - 3 : 0;
	let lastRendered = 0;
	let warmFrames = 0;
	const gaps: number[] = [];

	function animate() {
		raf = requestAnimationFrame(animate);

		if (light) {
			const now = performance.now();
			if (now - lastRendered < FRAME_MS) return;
			const gap = now - lastRendered;
			lastRendered = now;
			if (everRendered && gap < 500 && ++warmFrames > 45) {
				gaps.push(gap);
				// The median, so one stall (a scroll, an image decoding) doesn't doom it
				if (gaps.length === 90 && gaps.sort((a, b) => a - b)[45] > 50) {
					cleanup();
					options.onAbort?.();
					return;
				}
			}
		}

		clock.update();
		const dt = clock.getDelta();
		time += dt;

		const targetHover = mouseIsOver ? 1 : 0;
		hoverProgress += (targetHover - hoverProgress) * (dt * 3);

		skipFrame = !skipFrame;
		if (!skipFrame && !light) {
			if (mouseIsOver && rayPlane) {
				raycaster.setFromCamera(mouseNDC, camera);
				const hits = raycaster.intersectObject(rayPlane);
				if (hits.length > 0) {
					intersectionPoint.copy(hits[0].point);
					isIntersecting = true;
				} else {
					isIntersecting = false;
				}
			} else {
				isIntersecting = false;
			}
		}

		const mouseUV = scratchMouseUV.set(
			isIntersecting ? intersectionPoint.x : -9,
			isIntersecting ? intersectionPoint.y : -9
		);

		simMaterial.uniforms.uPosition.value = everRendered ? rt1.texture : posTex;
		simMaterial.uniforms.uTime.value = time;
		simMaterial.uniforms.uDeltaTime.value = dt;
		simMaterial.uniforms.uMousePos.value = mouseUV;
		simMaterial.uniforms.uIsHovering.value = hoverProgress;
		simMaterial.uniforms.uRingRadius.value = 0.5 + Math.sin(time) * 0.1;

		simMaterial.uniforms.uRotation.value += dt * 0.05; // Rotazione lenta

		renderer.setRenderTarget(rt2);
		renderer.render(simScene, simCamera);
		renderer.setRenderTarget(null);

		renderMaterial.uniforms.uPosition.value = everRendered ? rt2.texture : posTex;
		renderMaterial.uniforms.uTime.value = time;
		renderMaterial.uniforms.uIsHovering.value = hoverProgress;

		// Gradual fade-in so the galaxy materializes smoothly instead of popping in.
		if (fadeStart === 0) fadeStart = performance.now();
		const fadeT = Math.min(1, (performance.now() - fadeStart) / FADE_MS);
		renderMaterial.uniforms.uAlpha.value = fadeT * fadeT;

		if (coreGlowMat) {
			// Same fade-in curve as the particles, plus a small hover boost so the
			// core visibly brightens together with the particle ring interaction.
			coreGlowMat.opacity = fadeT * fadeT * (0.3 + hoverProgress * 0.12);
		}

		renderer.render(scene, camera);

		const temp = rt1;
		rt1 = rt2;
		rt2 = temp;
		everRendered = true;
	}

	function start() {
		if (raf) return;
		clock.update(); // reset delta to avoid a time jump after a pause
		raf = requestAnimationFrame(animate);
	}
	function stop() {
		if (!raf) return;
		cancelAnimationFrame(raf);
		raf = 0;
	}
	function updateRunState() {
		if (isOnScreen && pageVisible) start();
		else stop();
	}

	// Pause the whole simulation when the Hero scrolls out of view…
	const visObs = new IntersectionObserver(
		(entries) => {
			isOnScreen = entries[0].isIntersecting;
			updateRunState();
		},
		{ threshold: 0 }
	);
	visObs.observe(container);

	// …or when the tab is hidden.
	function onVisibility() {
		pageVisible = !document.hidden;
		updateRunState();
	}
	document.addEventListener('visibilitychange', onVisibility);

	start();

	// ── Eventi ──
	function onMouseMove(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;
		mouseNDC.x = x * 2 - 1;
		mouseNDC.y = -(y * 2 - 1);
		mouseIsOver = true;
	}

	function onMouseLeave() {
		mouseIsOver = false;
		mouseNDC.set(-9, -9);
	}

	function onResize() {
		W = container.offsetWidth;
		H = container.offsetHeight;
		renderer.setSize(W, H);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
		frameToHero();
	}

	interactionTarget.addEventListener('mousemove', onMouseMove);
	interactionTarget.addEventListener('mouseleave', onMouseLeave);
	window.addEventListener('resize', onResize);

	// Sync galaxy colors with CSS season/day-night variables — both prefixes
	// affect --galaxy-c* (season owns hue, day/night owns the OLED duotone).
	// Also re-syncs on inline `style` changes (rainbow/palette terminal
	// commands set --galaxy-c* directly on body.style, with no class change
	// at all — a class-only comparison here would silently miss them).
	updateGalaxyColors();
	let lastSeasonClass = '';
	let lastStyleSignature = document.body.getAttribute('style') ?? '';
	const seasonObserver = new MutationObserver(() => {
		const seasonClass = Array.from(document.body.classList)
			.filter((name) => name.startsWith('season-') || name.startsWith('tod-'))
			.join(' ');
		const styleSignature = document.body.getAttribute('style') ?? '';
		if (seasonClass !== lastSeasonClass || styleSignature !== lastStyleSignature) {
			lastSeasonClass = seasonClass;
			lastStyleSignature = styleSignature;
			updateGalaxyColors();
		}
	});
	seasonObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });

	let disposed = false;
	function cleanup() {
		if (disposed) return;
		disposed = true;
		cancelAnimationFrame(raf);
		visObs.disconnect();
		document.removeEventListener('visibilitychange', onVisibility);
		seasonObserver.disconnect();
		interactionTarget.removeEventListener('mousemove', onMouseMove);
		interactionTarget.removeEventListener('mouseleave', onMouseLeave);
		window.removeEventListener('resize', onResize);
		renderer.forceContextLoss();
		renderer.dispose();
		geo.dispose();
		renderMaterial.dispose();
		simMaterial.dispose();
		rt1.dispose();
		rt2.dispose();
		posTex.dispose();
		if (rayPlaneGeo) rayPlaneGeo.dispose();
		if (rayPlaneMat) rayPlaneMat.dispose();
		if (coreGlow) scene.remove(coreGlow);
		if (coreGlowMat) coreGlowMat.dispose();
		if (coreGlowTex) coreGlowTex.dispose();
		canvas.remove();
	}
	return cleanup;
}
