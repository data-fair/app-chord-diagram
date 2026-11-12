import type { Page } from '@playwright/test'

export const mockSite = {
  _id: 'test-site',
  type: 'site',
  name: 'Test site',
  url: 'http://mock.test',
  owner: { type: 'organization', id: 'test-org', department: '' },
  settings: { defaultLocale: 'fr-FR' },
  theme: { primaryColor: '#1e88e5' }
}

export interface MockApplication {
  id: string
  title: string
  configuration: Record<string, unknown>
  exposedUrl: string
  href: string
  apiUrl: string
  wsUrl: string
  owner: { type: string, id: string, department: string }
}

export function buildApplication (configuration: Record<string, unknown>): MockApplication {
  return {
    id: 'test-app',
    title: 'Test app',
    configuration,
    exposedUrl: 'http://mock.test/app',
    href: 'http://mock.test/config',
    apiUrl: 'http://mock.test/data-fair/api/v1',
    wsUrl: 'ws://mock.test/data-fair',
    owner: { type: 'organization', id: 'test-org', department: '' }
  }
}

export const TEST_DATASET = {
  href: 'http://mock.test/data-fair/api/v1/datasets/test',
  title: 'Jeu de données de test',
  id: 'test',
  finalizedAt: '2026-01-01T00:00:00Z',
  schema: [
    { key: 'region_depart', type: 'string', label: 'Région de départ' },
    { key: 'region_arrivee', type: 'string', label: "Région d'arrivée" }
  ]
}

// Mirrors the VJSF 3 schema (public/config-schema.json): datasets, sourceField,
// targetField, maxNodes, nodeSort, colorscheme, staticFilters.
export function baseConfig (overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    datasets: [TEST_DATASET],
    sourceField: { key: 'region_depart', label: 'Région de départ' },
    targetField: { key: 'region_arrivee', label: "Région d'arrivée" },
    maxNodes: 20,
    nodeSort: 'total',
    colorscheme: { type: 'qualitative', name: 'Accent', reverse: false },
    staticFilters: [],
    ...overrides
  }
}

// Format of /values_agg?field=source;target: one bucket per source value,
// each embedding one bucket per target value with the aggregated total.
// IDF → AURA (12), IDF → Bretagne (7), AURA → IDF (5), Bretagne → Bretagne (3)
export const TEST_AGGS = {
  total_values: 3,
  aggs: [
    {
      value: 'Île-de-France',
      total_values: 2,
      aggs: [
        { value: 'Auvergne-Rhône-Alpes', total: 12 },
        { value: 'Bretagne', total: 7 }
      ]
    },
    {
      value: 'Auvergne-Rhône-Alpes',
      total_values: 1,
      aggs: [{ value: 'Île-de-France', total: 5 }]
    },
    {
      value: 'Bretagne',
      total_values: 1,
      aggs: [{ value: 'Bretagne', total: 3 }]
    }
  ]
}

export interface SetupOptions {
  application: MockApplication
  aggs?: unknown
}

export async function setupMocks (page: Page, options: SetupOptions): Promise<void> {
  await page.route('**/simple-directory/**', (route) => {
    const url = route.request().url()
    if (url.endsWith('.js')) {
      // _public.js is a classic script, not JSON: serving it this way lets
      // the session read window.__PUBLIC_SITE_INFO instead of the deprecated fetch
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `window.__PUBLIC_SITE_INFO = ${JSON.stringify(mockSite)}`
      })
      return
    }
    if (url.endsWith('.css')) {
      route.fulfill({ status: 200, contentType: 'text/css', body: '' })
      return
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSite) })
  })
  await page.route('**/values_agg**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.aggs ?? TEST_AGGS)
    })
  })
  // index.html contient `<script>window.APPLICATION=%APPLICATION%;</script>`.
  // In dev the placeholder is not substituted: this inline script throws a
  // SyntaxError that the parser ignores, and the app still starts provided
  // window.APPLICATION is already defined — hence addInitScript, run
  // before any page script. `writable: false` then locks the
  // property against the (failed) assignment of the inline script.
  await page.addInitScript((app) => {
    Object.defineProperty(window, 'APPLICATION', {
      configurable: true, enumerable: true, writable: false, value: app
    })
  }, options.application)
}
