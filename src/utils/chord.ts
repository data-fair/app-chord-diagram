import { chord, ribbon } from 'd3-chord'
import { arc } from 'd3-shape'
import type { Chord, ChordGroup, Ribbon } from 'd3-chord'

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
 * Géométrie complète du diagramme : layout d3-chord de la matrice, paths des arcs
 * et des rubans, position des libellés. Les angles d3 partent de 12h et tournent
 * dans le sens horaire ; un libellé du demi-côté droit (angle < π) sort vers
 * l'extérieur en lecture naturelle, un libellé du côté gauche est retourné pour
 * rester lisible — indépendamment de la rotation appliquée au diagramme.
 */
export function buildChordGeometry (labels: string[], matrix: number[][], radius: number, rotationDeg = 0): ChordGeometry {
  const outerRadius = radius * 0.42
  const innerRadius = outerRadius - Math.max(10, radius * 0.02)
  // l'écart entre arcs s'amincit quand les nœuds sont nombreux
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

  // le ruban lit radius via son accesseur (posé plus haut) : le type strict de
  // d3-shape exige radius sur le sous-groupe, que d3-chord ne porte pas
  const ribbonPaths = layout.map(c => ribbonGenerator(c as unknown as Ribbon) ?? '')

  const rotationRad = (rotationDeg * Math.PI) / 180
  const textLabels: ChordLabel[] = layout.groups.map((group, i) => {
    const middle = (group.startAngle + group.endAngle) / 2
    // angle effectif après rotation, normalisé dans [0, 2π)
    const effective = (((middle + rotationRad) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const flip = effective >= Math.PI
    const degrees = (middle * 180) / Math.PI - 90 + rotationDeg
    return {
      label: labels[group.index] ?? labels[i],
      transform: `rotate(${degrees}) translate(${outerRadius + 8},0)${flip ? ' rotate(180)' : ''}`,
      anchor: flip ? 'end' : 'start'
    }
  })

  return { groups: layout.groups, chords: [...layout], arcPaths, ribbonPaths, labels: textLabels, outerRadius, innerRadius }
}
