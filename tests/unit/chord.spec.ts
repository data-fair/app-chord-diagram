import { test, expect } from '@playwright/test'
import { buildChordGeometry } from '@/utils/chord'

const LABELS = ['A', 'B', 'C']
// A → B (5), B → A (2), C → C (1) : 3 arcs ; d3-chord fusionne les flux
// réciproques A↔B en un seul ruban → 2 rubans
const MATRIX = [
  [0, 5, 0],
  [2, 0, 0],
  [0, 0, 1]
]
const RADIUS = 400

test.describe('buildChordGeometry', () => {
  test('produces one group per node and one ribbon per flow pair', () => {
    const geometry = buildChordGeometry(LABELS, MATRIX, RADIUS)
    expect(geometry.groups).toHaveLength(3)
    expect(geometry.chords).toHaveLength(2)
    expect(geometry.arcPaths).toHaveLength(3)
    expect(geometry.ribbonPaths).toHaveLength(2)
    // le ruban fusionné porte le flux A → B en source et B → A en cible
    expect(geometry.chords[0].source.index).toBe(0)
    expect(geometry.chords[0].target.index).toBe(1)
  })

  test('emits valid path strings', () => {
    const geometry = buildChordGeometry(LABELS, MATRIX, RADIUS)
    geometry.arcPaths.forEach(path => {
      expect(path).toMatch(/^M[\d.-]+/)
      expect(path).toContain('A') // arc de cercle
    })
    geometry.ribbonPaths.forEach(path => {
      expect(path).toMatch(/^M[\d.-]+/)
    })
  })

  test('scales radii with the available size', () => {
    const big = buildChordGeometry(LABELS, MATRIX, 1000)
    const small = buildChordGeometry(LABELS, MATRIX, 200)
    expect(big.outerRadius).toBeCloseTo(1000 * 0.42)
    expect(small.outerRadius).toBeCloseTo(200 * 0.42)
    expect(big.outerRadius).toBeGreaterThan(big.innerRadius)
    // l'épaisseur de l'anneau suit la taille, avec un plancher minimal
    expect(big.outerRadius - big.innerRadius).toBeGreaterThan(small.outerRadius - small.innerRadius)
  })

  test('spreads groups over the full circle with padding gaps', () => {
    const geometry = buildChordGeometry(LABELS, MATRIX, RADIUS)
    const span = geometry.groups
      .reduce((total, group) => total + (group.endAngle - group.startAngle), 0)
    const padAngle = Math.min(0.025, Math.PI / (4 * MATRIX.length))
    expect(span).toBeCloseTo(Math.PI * 2 - MATRIX.length * padAngle)
    // les groupes ne se chevauchent pas
    for (let i = 1; i < geometry.groups.length; i++) {
      expect(geometry.groups[i].startAngle).toBeGreaterThanOrEqual(geometry.groups[i - 1].endAngle)
    }
  })

  test('matches each label to its group and positions it outside the arc', () => {
    const geometry = buildChordGeometry(LABELS, MATRIX, RADIUS)
    geometry.labels.forEach((label, i) => {
      expect(label.label).toBe(LABELS[geometry.groups[i].index])
      expect(label.transform).toContain(`translate(${geometry.outerRadius + 8},0)`)
      expect(['start', 'end']).toContain(label.anchor)
    })
  })

  test('keeps labels readable through any rotation', () => {
    // un demi-tour inverse exactement l'ensemble des ancres : chaque libellé
    // passé du côté droit au côté gauche se retourne pour rester lisible
    const straight = buildChordGeometry(LABELS, MATRIX, RADIUS, 0)
    const flipped = buildChordGeometry(LABELS, MATRIX, RADIUS, 180)
    const startsAt0 = straight.labels.filter(l => l.anchor === 'start').length
    const endsAt180 = flipped.labels.filter(l => l.anchor === 'end').length
    expect(endsAt180).toBe(startsAt0)
    straight.labels.forEach((label, i) => {
      expect(flipped.labels[i].label).toBe(label.label)
    })
  })
})
