import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import { settingsPath } from '@data-fair/lib-vuetify/vite.js'
import { fileURLToPath, URL } from 'node:url'

// `loadEnv`, et non `process.env` : Vite ne peuple jamais process.env depuis un
// fichier .env — lire les ports autrement retombe en silence sur 3000 et la
// collision repart. Un process.env déjà exporté reste prioritaire : c'est ainsi
// que Playwright injecte son APP_PORT au serveur qu'il démarre.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.APP_PORT ?? 3000)
  return {
    base: env.PUBLIC_URL ?? '/app/',
    plugins: [
      vueI18n({}),
      vue({ template: { transformAssetUrls } }),
      vuetify({ autoImport: true, styles: { configFile: settingsPath } })
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    server: {
      // pré-transforme le graphe de modules au démarrage : sans lui la première
      // page paie toute la cascade de transformation et les e2e courent leur propre
      // démarrage à froid
      warmup: { clientFiles: ['./src/main.ts', './src/**/*.vue'] },
      port,
      strictPort: !!env.APP_PORT,
      // hmr suit le port du serveur : un websocket resté sur 3000 ferait tenir
      // deux ports à l'application et annulerait le décalage
      hmr: { port, protocol: 'ws' }
    }
  }
})
