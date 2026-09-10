import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  css: { postcss: { plugins: [tailwindcss()] } },
  define: {
    'process.env.NEXT_PUBLIC_ORDER_API': JSON.stringify('https://trusted-empire-stream.pastel-note-1586.chatgpt.site/api/notify-order'),
  },
  build: { outDir: 'dist-vercel' },
});
