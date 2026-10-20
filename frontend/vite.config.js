import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // A production build must say where the API is. Fail here, at build time,
  // rather than shipping a site that sends visitors to localhost.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (mode === 'production' && !env.VITE_API_BASE) {
    throw new Error('Set VITE_API_BASE to your API address (https://...) before building for production.');
  }
  return {
    plugins: [react(), tailwindcss()],
  };
});
