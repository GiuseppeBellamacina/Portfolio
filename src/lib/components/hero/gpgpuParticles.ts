/**
 * Three.js GPGPU Particle System — 3D Tilted Spiral Galaxy.
 * Renders ~16K particles on GPU with simulation shaders, raycasting for cursor interaction.
 */
export async function initGpgpuParticles(
	container: HTMLElement,
	interactionTarget: HTMLElement
): Promise<(() => void) | undefined> {
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
		Clock,
		Color,
		AdditiveBlending
	} = THREE;

	const SIZE = 192; // 192x192 = 36864 particelle
	const LENGTH = SIZE * SIZE;
	let W = container.offsetWidth;
	let H = container.offsetHeight;

	// ── Renderer ──
	const renderer = new WebGLRenderer({
		antialias: true,
		alpha: true,
		powerPreference: 'high-performance',
		stencil: false
	});
	renderer.setSize(W, H);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x000000, 0);
	const canvas = renderer.domElement;
	canvas.style.cssText =
		'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
	container.prepend(canvas);

	// Supporto Float Texture
	const gl = renderer.getContext();
	const extFloat = gl.getExtension('EXT_color_buffer_float');
	if (!extFloat) {
		canvas.remove();
		return;
	}

	// ── Camera (Inquadratura per un disco ampio) ──
	const camera = new PerspectiveCamera(45, W / H, 0.1, 1000);
	camera.position.set(0, -6.5, 4.5); // Angolazione a ~45 gradi
	camera.lookAt(0, 0, 0);

	// ── Scene ──
	const scene = new Scene();

	// ── Generazione Posizioni (Vero Disco Galattico) ──
	function createPositionData(): Float32Array {
		const data = new Float32Array(LENGTH * 4);
		const GALAXY_RADIUS = 8.0; // Disco più ampio
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

				// Dispersione attorno al braccio teorico (cresce allontanandosi dal centro)
				const spread = 0.2 + r * 0.15;
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
	const posTex = new DataTexture(posData, SIZE, SIZE, RGBAFormat, FloatType);
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
	let rt1 = new WebGLRenderTarget(SIZE, SIZE, rtOptions);
	let rt2 = new WebGLRenderTarget(SIZE, SIZE, rtOptions);

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
                vec2 uv = gl_FragCoord.xy / ${SIZE.toFixed(1)};
                vec4 pFrame = texture2D(uPosition, uv);
                vec3 refPos = texture2D(uPosRefs, uv).xyz;
                
                vec3 pos = pFrame.xyz;
                float velocity = pFrame.w;

                vec2 seed = hash(uv);
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

                // Calcolo interazione (EFFETTO DELICATO)
                vec2 mDiff = pos.xy - uMousePos;
                float mDist = length(mDiff);
                
                // L'influenza del mouse cala morbidamente allontanandosi dal cursore
                float mouseInfluence = smoothstep(uRingRadius + 0.4, 0.0, mDist) * uIsHovering;
                
                if (mDist > 0.001) {
                    // 1. Spinta Radiale: allontana le particelle sul piano XY (effetto onda)
                    targetPos.xy += (mDiff / mDist) * mouseInfluence * 0.3;
                }
                // 2. Spinta Verticale: alzata millimetrica su Z
                targetPos.z += mouseInfluence * 0.15;

                velocity = mouseInfluence;

                // Elastico verso la posizione target
                vec3 toRef = targetPos - pos;
                pos += toRef * 0.06; 

                if (lifeTime < 0.01) {
                    pos = rotRef;
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
	for (let i = 0; i < SIZE; i++) {
		for (let j = 0; j < SIZE; j++) {
			const idx = i * SIZE + j;
			uvs[idx * 2 + 0] = (j + 0.5) / SIZE;
			uvs[idx * 2 + 1] = (i + 0.5) / SIZE;
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
		renderMaterial.uniforms.uColorC2.value.copy(getCSSColor('--galaxy-c2', '#f0e0ff'));
		renderMaterial.uniforms.uColorC3.value.copy(getCSSColor('--galaxy-c3', '#e879f9'));
		renderMaterial.uniforms.uColorC4.value.copy(getCSSColor('--galaxy-c4', '#818cf8'));
		renderMaterial.uniforms.uColorC5.value.copy(getCSSColor('--galaxy-c5', '#a78bfa'));
		renderMaterial.uniforms.uColorC6.value.copy(getCSSColor('--galaxy-c6', '#1e1b4b'));
	}

	// ── Render shader ──
	const renderMaterial = new ShaderMaterial({
		uniforms: {
			uPosition: { value: posTex },
			uTime: { value: 0 },
			uParticleScale: { value: 1.0 },
			uPixelRatio: { value: renderer.getPixelRatio() },
			uIsHovering: { value: 0 },
			uColorC1: { value: new Color(0xffffff) },
			uColorC2: { value: new Color(0xf0e0ff) },
			uColorC3: { value: new Color(0xe879f9) },
			uColorC4: { value: new Color(0x818cf8) },
			uColorC5: { value: new Color(0xa78bfa) },
			uColorC6: { value: new Color(0x1e1b4b) },
			uAlpha: { value: 1.0 }
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

            vec2 hash(vec2 p) {
                p = vec2(dot(p,vec2(2127.1,81.17)), dot(p,vec2(1269.5,283.37)));
                return fract(sin(p)*43758.5453);
            }

            void main() {
                vec4 pos = texture2D(uPosition, uv);
                vLocalPos = pos.xyz;
                vVelocity = pos.w;

                vec2 seed = hash(uv);
                float lifeEnd = 3.0 + sin(seed.y * 100.0) * 1.5;
                float lifeTime = mod(seed.x * 100.0 + uTime * 0.5, lifeEnd);
                float animScale = smoothstep(0.01, 0.5, lifeTime) - smoothstep(0.5, 1.0, lifeTime / lifeEnd);
                
                vScale = animScale + (vVelocity * 1.5);

                vec4 viewSpace = modelViewMatrix * vec4(pos.xyz, 1.0);
                gl_Position = projectionMatrix * viewSpace;

                float depthFade = 1.0 / -viewSpace.z; 
                // Dimensione calibrata (le polveri saranno piccole, i flare più visibili)
                gl_PointSize = (vScale * 35.0) * uPixelRatio * uParticleScale * depthFade;
            }
        `,
		fragmentShader: `
            precision highp float;

            varying vec3 vLocalPos;
            varying float vScale;
            varying float vVelocity;

            uniform vec3 uColorC1;
            uniform vec3 uColorC2;
            uniform vec3 uColorC3;
            uniform vec3 uColorC4;
            uniform vec3 uColorC5;
            uniform vec3 uColorC6;
            uniform float uAlpha;

            void main() {
                float dist = length(vLocalPos.xy) / 8.0;

                // 6-stop gradient: center → edge
                vec3 col = mix(uColorC1, uColorC2, smoothstep(0.0, 0.06, dist));
                col = mix(col, uColorC3, smoothstep(0.06, 0.15, dist));
                col = mix(col, uColorC4, smoothstep(0.15, 0.35, dist));
                col = mix(col, uColorC5, smoothstep(0.35, 0.6, dist));
                col = mix(col, uColorC6, smoothstep(0.6, 1.0, dist));

                col += vec3(vVelocity * 0.8); // Si illuminano quando scostate dal mouse

                // Rendering della singola stella: sfumata e naturale
                vec2 uv = gl_PointCoord.xy - 0.5;
                float pDist = length(uv);
                float alpha = max(0.0, 0.5 - pDist) * 2.0;
                alpha = pow(alpha, 1.8) * vScale * uAlpha; 

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

	// ── Raycasting ──
	const raycaster = new Raycaster();
	const mouseNDC = new Vector2(-9, -9);
	const intersectionPoint = new Vector3();
	let isIntersecting = false;
	let mouseIsOver = false;

	// Piano enorme per intercettare il mouse ovunque
	const rayPlaneGeo = new PlaneGeometry(80, 80);
	const rayPlaneMat = new ShaderMaterial({ visible: false });
	const rayPlane = new Mesh(rayPlaneGeo, rayPlaneMat);
	scene.add(rayPlane);

	// ── Animazione ──
	const clock = new Clock();
	let time = 0;
	let lastTime = 0;
	let hoverProgress = 0;
	let everRendered = false;
	let raf: number;
	let skipFrame = false;

	function animate() {
		raf = requestAnimationFrame(animate);

		const elapsed = clock.getElapsedTime();
		const dt = elapsed - lastTime;
		lastTime = elapsed;
		time += dt;

		const targetHover = mouseIsOver ? 1 : 0;
		hoverProgress += (targetHover - hoverProgress) * (dt * 3);

		skipFrame = !skipFrame;
		if (!skipFrame) {
			if (mouseIsOver) {
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

		const mouseUV = isIntersecting
			? new Vector2(intersectionPoint.x, intersectionPoint.y)
			: new Vector2(-9, -9);

		simMaterial.uniforms.uPosition.value = everRendered ? rt1.texture : posTex;
		simMaterial.uniforms.uTime.value = elapsed;
		simMaterial.uniforms.uDeltaTime.value = dt;
		simMaterial.uniforms.uMousePos.value = mouseUV;
		simMaterial.uniforms.uIsHovering.value = hoverProgress;
		simMaterial.uniforms.uRingRadius.value = 0.5 + Math.sin(time) * 0.1;

		simMaterial.uniforms.uRotation.value += dt * 0.05; // Rotazione lenta

		renderer.setRenderTarget(rt2);
		renderer.render(simScene, simCamera);
		renderer.setRenderTarget(null);

		renderMaterial.uniforms.uPosition.value = everRendered ? rt2.texture : posTex;
		renderMaterial.uniforms.uTime.value = elapsed;
		renderMaterial.uniforms.uIsHovering.value = hoverProgress;

		renderer.autoClear = true;
		renderer.render(scene, camera);

		const temp = rt1;
		rt1 = rt2;
		rt2 = temp;
		everRendered = true;
	}

	animate();

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
		camera.aspect = W / H;
		camera.updateProjectionMatrix();
	}

	interactionTarget.addEventListener('mousemove', onMouseMove);
	interactionTarget.addEventListener('mouseleave', onMouseLeave);
	window.addEventListener('resize', onResize);

	// Sync galaxy colors with CSS seasonal variables
	updateGalaxyColors();
	const seasonObserver = new MutationObserver(() => updateGalaxyColors());
	seasonObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

	return () => {
		cancelAnimationFrame(raf);
		seasonObserver.disconnect();
		interactionTarget.removeEventListener('mousemove', onMouseMove);
		interactionTarget.removeEventListener('mouseleave', onMouseLeave);
		window.removeEventListener('resize', onResize);
		renderer.dispose();
		geo.dispose();
		renderMaterial.dispose();
		simMaterial.dispose();
		rt1.dispose();
		rt2.dispose();
		posTex.dispose();
		rayPlaneGeo.dispose();
		rayPlaneMat.dispose();
		canvas.remove();
	};
}
