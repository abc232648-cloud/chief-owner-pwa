import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), microphone=(), payment=(), camera=(self)'
};

export default defineConfig(() => {
  // Google AI Studio remains a construction environment only. This switch changes
  // development file-watching behavior; it does not enable Chief DEV identities or data.
  const isAiStudioDevContainer = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: !isAiStudioDevContainer,
      watch: isAiStudioDevContainer ? null : {},
      headers: securityHeaders,
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
      headers: securityHeaders,
    },
  };
});
