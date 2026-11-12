import type { Chord, ChordGroup, Ribbon } from 'd3-chord'
import { chord, ribbon } from 'd3-chord'
import { arc } from 'd3-shape'

export interface ChordLabel {
  label: string
  transform: string
  anchor: 'start' | 'end'
}

export interface ChordGeometry {
  groups: ChordGroup[]
  chords: Chord[]
  arcPaths: string[]
  ribbonPaths: string[]
  labels: ChordLabel[]
  outerRadius: number
  innerRadius: number
}

/**
 * Full geometry of the diagram: d3-chord layout of the matrix, paths of the arcs
 * and ribbons, label positions. d3 angles start at 12 o'clock and go
 * clockwise; a label on the right half (angle < π) points
 * outwards in natural reading, a label on the left side is flipped to
 * stay readable. The rotation is applied by the caller to the parent SVG group
 * (arcs, ribbons and labels rotate together); `rotationDeg` is only used here to
 * decide whether to flip labels once the actual rotation is applied.
 */
export function buildChordGeometry (labels: string[], matrix: number[][], radius: number, rotationDeg = 0): ChordGeometry {
  const outerRadius = radius * 0.42
  const innerRadius = outerRadius - Math.max(10, radius * 0.02)
  // the gap between arcs narrows when there are many nodes
  const padAngle = Math.min(0.025, Math.PI / (4 * matrix.length))
  const layout = chord().padAngle(padAngle)(matrix)
  const arcGenerator = arc()
  const ribbonGenerator = ribbon().radius(innerRadius)

  const arcPaths = layout.groups.map(group => arcGenerator({
    innerRadius,
    outerRadius,
    startAngle: group.startAngle,
    endAngle: group.endAngle
  }) ?? '')

  // the ribbon reads radius through its accessor (set above): the strict type of
  // d3-shape requires radius on the subgroup, which d3-chord does not carry
  const ribbonPaths = layout.map(c => ribbonGenerator(c as unknown as Ribbon) ?? '')

  const rotationRad = (rotationDeg * Math.PI) / 180
  const textLabels: ChordLabel[] = layout.groups.map((group, i) => {
    const middle = (group.startAngle + group.endAngle) / 2
    // actual angle after rotation, normalized in [0, 2π)
    const effective = (((middle + rotationRad) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const flip = effective >= Math.PI
    const degrees = (middle * 180) / Math.PI - 90
    return {
      label: labels[group.index] ?? labels[i],
      transform: `rotate(${degrees}) translate(${outerRadius + 8},0)${flip ? ' rotate(180)' : ''}`,
      anchor: flip ? 'end' : 'start'
    }
  })

  return { groups: layout.groups, chords: [...layout], arcPaths, ribbonPaths, labels: textLabels, outerRadius, innerRadius }
}
