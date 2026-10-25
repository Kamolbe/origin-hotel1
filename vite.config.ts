import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

let revision = 'unknown';
try { revision = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* Source archives may not contain Git metadata. */ }

export default defineConfig({
  define: { 'import.meta.env.VITE_APP_REVISION': JSON.stringify(revision) },
  plugins: [tailwindcss(), react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: ['.manus.computer'],
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
});
