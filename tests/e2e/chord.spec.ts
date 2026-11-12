import type { Locator } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { baseConfig, buildApplication, setupMocks } from './fixtures'

async function boundingBox (locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('bounding box introuvable')
  return box
}

test.beforeEach(async ({ page }) => {
  await setupMocks(page, { application: buildApplication(baseConfig()) })
})

test('renders arcs, ribbons and labels for a valid configuration', async ({ page }) => {
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })

  const svg = page.locator('svg.chord-svg')
  await expect(svg).toBeVisible()

  // positive check: TEST_AGGS has 3 nodes; d3-chord merges the reciprocal
  // IDF↔AURA flows into a single ribbon → 3 ribbons
  // (IDF ↔ AURA, IDF → Bretagne, Bretagne → Bretagne)
  await expect(svg.locator('.chord-arcs path')).toHaveCount(3)
  await expect(svg.locator('.chord-ribbons path')).toHaveCount(3)

  const labels = svg.locator('.chord-labels text')
  await expect(labels).toHaveCount(3)
  await expect(svg.getByText('Île-de-France')).toBeVisible()
  await expect(svg.getByText('Auvergne-Rhône-Alpes')).toBeVisible()
})

test('rotates the whole diagram, not only the labels', async ({ page }) => {
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })
  const svg = page.locator('svg.chord-svg')
  await expect(svg).toBeVisible()

  // the rotation is carried by the parent group: arcs, ribbons and labels
  // rotate together (the bug only rotated the text transforms)
  const root = svg.locator('> g')
  const firstArc = svg.locator('.chord-arcs path').first()
  const before = await boundingBox(firstArc)

  await page.locator('[role=slider]').focus()
  await page.keyboard.press('ArrowRight')

  await expect(root).toHaveAttribute('transform', /rotate\(1\)/)
  // the rendered position of the arc changes: the path is indeed in the rotated group
  const after = await boundingBox(firstArc)
  expect(after.x).not.toBeCloseTo(before.x, 3)
})

test('fits the viewport without a scrollbar', async ({ page }) => {
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('svg.chord-svg')).toBeVisible()

  // the slider thumb ripple overflowed below the viewport by a few pixels
  // and made a vertical scrollbar appear (df:overflow = false)
  const metrics = await page.evaluate(() => {
    const el = document.documentElement
    return {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth
    }
  })
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight)
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth)
})

test('hovering an arc dims the ribbons it is not connected to', async ({ page }) => {
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })
  const svg = page.locator('svg.chord-svg')
  await expect(svg).toBeVisible()

  // without hover: no dimmed ribbon (positive check of the negative assertion)
  await expect(svg.locator('.chord-ribbons path.is-dim')).toHaveCount(0)

  // dispatchEvent rather than hover(): the center of the bounding box of an
  // arc falling in the middle of the circle would not hit the path itself
  await svg.locator('.chord-arcs path').first().dispatchEvent('mouseenter')
  // at least one connected ribbon lights up and the others dim
  await expect(svg.locator('.chord-ribbons path.is-dim')).not.toHaveCount(0)
  await expect(svg.locator('.chord-ribbons path.is-active')).not.toHaveCount(0)
})

test('clicking a ribbon opens the flow details dialog', async ({ page }) => {
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })
  const svg = page.locator('svg.chord-svg')
  await expect(svg).toBeVisible()

  // the IDF → AURA ribbon carries 12: the dialog shows both directions of the flow
  // (dispatchEvent: the center of a ribbon's bbox may fall outside its shape)
  await svg.locator('.chord-ribbons path').first().dispatchEvent('click')
  const dialog = page.locator('.v-dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Île-de-France → Auvergne-Rhône-Alpes').first()).toBeVisible()
  await expect(dialog.getByText('Auvergne-Rhône-Alpes → Île-de-France')).toBeVisible()

  await dialog.getByRole('button', { name: 'Fermer' }).click()
  await expect(dialog).not.toBeVisible()
})

test('clicking an arc opens the per-node flows dialog', async ({ page }) => {
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })
  const svg = page.locator('svg.chord-svg')
  await expect(svg).toBeVisible()

  await svg.locator('.chord-arcs path').first().dispatchEvent('click')
  const dialog = page.locator('.v-dialog')
  await expect(dialog).toBeVisible()
  // node details: total then sorted outgoing flows
  await expect(dialog.getByText(/Total/)).toBeVisible()
  await expect(dialog.getByText('Île-de-France → Auvergne-Rhône-Alpes')).toBeVisible()
})

test('shows the incomplete-configuration empty state on a bad config', async ({ page }) => {
  // negative check paired with the positive render test above
  await setupMocks(page, { application: buildApplication({ datasets: [{}] }) })
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('svg.chord-svg')).toHaveCount(0)
  await expect(page.locator('.v-empty-state')).toBeVisible()
  await expect(page.getByText('Configuration incomplète')).toBeVisible()
})

test('shows the no-data empty state and still triggers capture on empty results', async ({ page }) => {
  await setupMocks(page, { application: buildApplication(baseConfig()), aggs: { aggs: [] } })
  await page.addInitScript(() => {
    let calls = 0
    Object.defineProperty(window, 'triggerCapture', {
      configurable: true,
      value: async () => { calls++; return false }
    })
    Object.defineProperty(window, '__captureCalls', {
      configurable: true,
      get: () => calls
    })
  })
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('svg.chord-svg')).toHaveCount(0)
  await expect(page.locator('.v-empty-state').first()).toBeVisible()
  await expect(page.getByText('Aucune donnée à afficher')).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __captureCalls: number }).__captureCalls)).toBeGreaterThanOrEqual(1)
})

test('calls window.triggerCapture once the diagram is rendered', async ({ page }) => {
  await setupMocks(page, { application: buildApplication(baseConfig()) })
  await page.addInitScript(() => {
    let calls = 0
    Object.defineProperty(window, 'triggerCapture', {
      configurable: true,
      value: async () => { calls++; return false }
    })
    Object.defineProperty(window, '__captureCalls', {
      configurable: true,
      get: () => calls
    })
  })
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })

  const svg = page.locator('svg.chord-svg')
  await expect(svg).toBeVisible()
  await expect(svg.locator('.chord-ribbons path')).toHaveCount(3)
  expect(await page.evaluate(() => (window as unknown as { __captureCalls: number }).__captureCalls)).toBeGreaterThanOrEqual(1)
})

test('applies the theme color mode from the config', async ({ page }) => {
  await setupMocks(page, {
    application: buildApplication(baseConfig({
      colorscheme: { type: 'theme', colors: ['primary', 'secondary'] }
    }))
  })
  await page.goto('/app/', { waitUntil: 'domcontentloaded' })
  const svg = page.locator('svg.chord-svg')
  await expect(svg).toBeVisible()

  // the test theme defines primary #1e88e5: the arcs carry no color
  // from the Accent palette (chroma interpolation), hence at least two
  // identical arc colors (primary/secondary cycle over 3 nodes)
  const fills = await svg.locator('.chord-arcs path').evaluateAll(
    nodes => nodes.map(node => node.getAttribute('fill'))
  )
  expect(fills).toHaveLength(3)
  expect(fills[0]).toBe(fills[2])
})
