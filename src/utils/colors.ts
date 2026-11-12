import type { ModeDeColoration } from '@/config'
import chroma from 'chroma-js'

export type ThemeColorName = 'primary' | 'secondary' | 'accent'
export type ThemeColors = Partial<Record<ThemeColorName, string>>

// the schema offers primary/secondary/accent: never primary alone (minimal
// contract of a portal), the three colors cycle through the nodes
const DEFAULT_THEME_NAMES: ThemeColorName[] = ['primary', 'secondary', 'accent']
const FALLBACK_COLOR = '#9E9E9E'

/**
 * Color of each node according to the configured coloring mode:
 * - qualitative palette: chroma interpolation of a ColorBrewer palette;
 * - theme colors: cycle of the selected colors (primary, secondary, accent);
 * - manual: color per value, falling back to colorForOthers then the primary color.
 */
export default function getColors (colorscheme: ModeDeColoration | undefined, labels: string[], themeColors: ThemeColors = {}): Record<string, string> {
  const colors: Record<string, string> = {}
  if (!labels.length) return colors
  const fallback = themeColors.primary ?? FALLBACK_COLOR

  if (!colorscheme || colorscheme.type === undefined || colorscheme.type === 'theme') {
    const selected = colorscheme?.type === 'theme' && colorscheme.colors?.length
      ? colorscheme.colors
      : DEFAULT_THEME_NAMES
    const palette = selected.map(name => themeColors[name as ThemeColorName] ?? fallback)
    labels.forEach((label, i) => {
      colors[label] = palette[i % palette.length]
    })
    return colors
  }

  if (colorscheme.type === 'manual') {
    const styleColors = new Map((colorscheme.styles ?? [])
      .filter(style => typeof style.value === 'string')
      .map(style => [style.value as string, style.color]))
    labels.forEach((label) => {
      colors[label] = styleColors.get(label) ?? colorscheme.colorForOthers ?? fallback
    })
    return colors
  }

  // chroma ColorBrewer palettes: lookup by name with fallback to Accent
  const brewer = chroma.brewer as unknown as Record<string, string[]>
  let scale: string[]
  try {
    scale = chroma.scale(brewer[String(colorscheme.name)] ?? brewer.Accent).colors(labels.length)
  } catch {
    scale = chroma.scale(['#888888', '#cccccc']).colors(labels.length)
  }
  if (colorscheme.reverse) scale = scale.slice().reverse()
  labels.forEach((label, i) => {
    colors[label] = scale[i % scale.length]
  })
  return colors
}
