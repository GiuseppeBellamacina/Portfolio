declare module '*.wgsl' {
	import type { ShaderSource } from 'vgpu';
	const shader: ShaderSource;
	export default shader;
}
