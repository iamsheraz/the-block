/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Docker-on-Mac/Windows hosts: bind-mount file events often don't propagate
  // into the container. If `docker compose up` HMR feels broken, uncomment the
  // block below to fall back to polling. Costs CPU, so keep it opt-in.
  // server: {
  //   watch: {
  //     usePolling: true,
  //   },
  // },
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
