import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		chunkSizeWarningLimit: 750,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules/three')) {
						return 'three';
					}
				}
			}
		}
	}
});
