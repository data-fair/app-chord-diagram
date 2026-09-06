import { defineConfig, devices } from '@playwright/test'

// Port Vite pour les e2e. Il vient du `.env` git-ignoré généré par `df-dev-env`
// (voir le script npm `test-e2e`), jamais d'un `$RANDOM` dans le script : le port
// est tiré une fois puis reste stable. Il doit rester distinct d'`APP_PORT` —
// avec `reuseExistingServer`, un run pointant sur `APP_PORT` s'accrocherait au
// Vite de développement au lieu de démarrer le sien.
const TEST_PORT = Number(process.env.E2E_PORT ?? 3100)

// `webServer` est global à la config : il démarrerait Vite même pour un run
// purement unitaire. Ne le sauter que quand tous les `--project` de la ligne de
// commande visent `unit` — toute autre invocation (pas de filtre, `--project e2e`,
// ou un mélange) a besoin du serveur.
function getProjectArgs () {
  const projects: string[] = []
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i]
    if (arg === '--project') projects.push(process.argv[i + 1])
    else if (arg.startsWith('--project=')) projects.push(arg.slice('--project='.length))
  }
  return projects
}
const projectArgs = getProjectArgs()
const isUnitOnly = projectArgs.length > 0 && projectArgs.every(p => p === 'unit')

export default defineConfig({
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 5_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  outputDir: './tests/output',
  webServer: isUnitOnly
    ? undefined
    : {
        // `PUBLIC_URL` est vidé ici (plutôt que de compter sur l'ordre des étapes
        // CI) pour que le serveur serve toujours sous `/app/`, ce que sonde
        // l'`url` ci-dessous. Le port voyage par `APP_PORT`, jamais par
        // `vite --port` : le flag laisserait `hmr.port` sur le port de dev.
        command: 'PUBLIC_URL= npm run dev-app',
        env: { ...process.env, APP_PORT: String(TEST_PORT), DATA_FAIR_TEST: 'true' },
        url: `http://localhost:${TEST_PORT}/app/`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000
      },
  projects: [
    {
      name: 'unit',
      testDir: './tests/unit'
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${TEST_PORT}`,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
      }
    }
  ]
})
