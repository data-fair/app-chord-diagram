import { test, expect } from '@playwright/test'
import getColors, { type ThemeColors } from '@/utils/colors'
import type { ModeDeColoration } from '@/config'

const LABELS = ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Bretagne', 'Normandie']
const HEX = /^#[0-9a-f]{6}$/i

test.describe('qualitative palettes', () => {
  test('gives every node a distinct color from the brewer palette', () => {
    const colors = getColors({ type: 'qualitative', name: 'Accent' } as ModeDeColoration, LABELS)
    expect(Object.keys(colors).sort()).toEqual([...LABELS].sort())
    const values = Object.values(colors)
    values.forEach(color => expect(color).toMatch(HEX))
    expect(new Set(values).size).toBe(LABELS.length)
  })

  test('falls back to a neutral scale for an unknown palette name', () => {
    const colors = getColors({ type: 'qualitative', name: 'inexistant' } as unknown as ModeDeColoration, LABELS)
    Object.values(colors).forEach(color => expect(color).toMatch(HEX))
    expect(new Set(Object.values(colors)).size).toBeGreaterThan(1)
  })

  test('reverses the palette order', () => {
    const straight = getColors({ type: 'qualitative', name: 'Accent' } as ModeDeColoration, LABELS)
    const reversed = getColors({ type: 'qualitative', name: 'Accent', reverse: true } as ModeDeColoration, LABELS)
    expect(reversed[LABELS[0]]).toBe(straight[LABELS[3]])
  })

  test('cycles when there are more nodes than palette steps', () => {
    const many = Array.from({ length: 30 }, (_, i) => `valeur-${i}`)
    const colors = getColors({ type: 'qualitative', name: 'Accent' } as ModeDeColoration, many)
    expect(Object.keys(colors)).toHaveLength(30)
    Object.values(colors).forEach(color => expect(color).toMatch(HEX))
  })
})

test.describe('theme colors', () => {
  const themeColors: ThemeColors = { primary: '#111111', secondary: '#222222', accent: '#333333' }

  test('cycles through the selected theme colors', () => {
    const colors = getColors({ type: 'theme', colors: ['primary', 'secondary'] } as ModeDeColoration, LABELS, themeColors)
    expect(colors[LABELS[0]]).toBe('#111111')
    expect(colors[LABELS[1]]).toBe('#222222')
    expect(colors[LABELS[2]]).toBe('#111111')
    expect(colors[LABELS[3]]).toBe('#222222')
  })

  test('falls back to primary for a missing theme color', () => {
    const colors = getColors({ type: 'theme', colors: ['primary', 'accent'] } as ModeDeColoration, LABELS, { primary: '#111111' })
    expect(colors[LABELS[0]]).toBe('#111111')
    expect(colors[LABELS[1]]).toBe('#111111')
  })

  test('cycles primary, secondary, accent when no color list is set', () => {
    const colors = getColors({ type: 'theme' } as ModeDeColoration, LABELS, themeColors)
    expect(colors[LABELS[0]]).toBe('#111111')
    expect(colors[LABELS[1]]).toBe('#222222')
    expect(colors[LABELS[2]]).toBe('#333333')
    expect(colors[LABELS[3]]).toBe('#111111')
  })

  test('cycles primary, secondary, accent when there is no colorscheme at all', () => {
    const colors = getColors(undefined, LABELS, themeColors)
    expect(colors[LABELS[0]]).toBe('#111111')
    expect(colors[LABELS[1]]).toBe('#222222')
    expect(colors[LABELS[2]]).toBe('#333333')
    expect(colors[LABELS[3]]).toBe('#111111')
  })

  test('falls back to a neutral gray without theme colors', () => {
    const colors = getColors(undefined, LABELS)
    Object.values(colors).forEach(color => expect(color).toBe('#9E9E9E'))
  })
})

test.describe('manual colors', () => {
  test('applies per-value colors and colorForOthers for the rest', () => {
    const colorscheme = {
      type: 'manual',
      colorForOthers: '#654321',
      styles: [
        { value: 'Île-de-France', color: '#123456' },
        { value: 'Bretagne', color: '#abcdef' }
      ]
    } as ModeDeColoration
    const colors = getColors(colorscheme, LABELS)
    expect(colors['Île-de-France']).toBe('#123456')
    expect(colors.Bretagne).toBe('#abcdef')
    expect(colors.Normandie).toBe('#654321')
  })

  test('falls back to primary when colorForOthers is not set', () => {
    const colorscheme = { type: 'manual', styles: [] } as ModeDeColoration
    const colors = getColors(colorscheme, LABELS, { primary: '#111111' })
    expect(colors.Normandie).toBe('#111111')
  })

  test('ignores style entries without a value', () => {
    const colorscheme = {
      type: 'manual',
      colorForOthers: '#654321',
      styles: [{ value: undefined as unknown as string, color: '#123456' }]
    } as ModeDeColoration
    const colors = getColors(colorscheme, LABELS)
    Object.values(colors).forEach(color => expect(color).toBe('#654321'))
  })
})
