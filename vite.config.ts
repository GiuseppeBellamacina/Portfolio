import { sveltekit } from '@sveltejs/kit/vite';
import wgslVitePlugin from '@vgpu/wgsl/loader-vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), wgslVitePlugin({ minify: true })],
	build: {
		chunkSizeWarningLimit: 750
	}
});
