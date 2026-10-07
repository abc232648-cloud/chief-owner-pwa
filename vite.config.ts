import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  // Compatibility isolation:
  // In standard development (local dev, CI, staging), standard Vite behavior is default:
  // HMR is active and file watching is fully enabled.
  // Only when running inside the Google AI Studio development container (where DISABLE_HMR=true
  // is passed by the web environment runner to save CPU during rapid agent file updates),
  // file watching and HMR are throttled.
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
    },
  };
});

