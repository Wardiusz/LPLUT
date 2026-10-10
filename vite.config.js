import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base './' pozwala hostować build w podkatalogu (np. GitHub Pages)
export default defineConfig({ base: './', plugins: [react()] });
