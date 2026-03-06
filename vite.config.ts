import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  
  return {
    base: env.VITE_BASE_PATH || '/',
    build: {
      sourcemap: 'hidden',
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
    },
    plugins: [
      react({
        babel: {
          plugins: [
            'react-dev-locator',
          ],
        },
      }),
      traeBadgePlugin({
        variant: 'dark',
        position: 'bottom-right',
        prodOnly: true,
        clickable: true,
        clickUrl: 'https://www.trae.ai/solo?showJoin=1',
        autoTheme: true,
        autoThemeTarget: '#root'
      }), 
      tsconfigPaths()
    ],
  };
})
