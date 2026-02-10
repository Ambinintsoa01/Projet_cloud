import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Forcer l'utilisation du build ESM bundler de Vue afin d'éviter
      // des résolutions vers le fichier CommonJS qui cassent les imports nommés.
      'vue': 'vue/dist/vue.runtime.esm-bundler.js',
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Écoute sur toutes les interfaces réseau
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  },
})
