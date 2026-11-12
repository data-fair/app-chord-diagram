export interface AggBucket {
  value?: string
  total?: number
  total_values?: number
  aggs?: AggBucket[]
}

// shape of the /values_agg?field=source;target response: one bucket per source
// value, each embedding one bucket per target value with the aggregated total
export interface ValuesAggResponse {
  total_values?: number
  aggs?: AggBucket[]
}

export interface ChordMatrix {
  labels: string[]
  matrix: number[][]
}

export const OTHERS_LABEL = 'Autres'

/**
 * Builds the square flow matrix from the values_agg response.
 * - Nodes are the union of source AND target values (a value that only appears
 *   as target must have its arc, otherwise its ribbons have no end).
 * - Empty values are renamed « Autre ».
 * - Beyond maxNodes, the least connected nodes are grouped into « Autres ».
 * - nodeSort: 'alpha' alphabetical order, 'total' (default) decreasing weight;
 *   « Autres » always stays last.
 */
export function buildChordMatrix (response: ValuesAggResponse, options: { maxNodes?: number, nodeSort?: string } = {}): ChordMatrix {
  const nodes: string[] = []
  const seen = new Set<string>()
  const flows = new Map<string, Map<string, number>>()

  const addNode = (raw: string | undefined) => {
    const label = raw === undefined || raw === '' ? 'Autre' : raw
    if (!seen.has(label)) {
      seen.add(label)
      nodes.push(label)
    }
    return label
  }

  for (const sourceBucket of response?.aggs ?? []) {
    const source = addNode(sourceBucket.value)
    let row = flows.get(source)
    if (!row) {
      row = new Map()
      flows.set(source, row)
    }
    for (const targetBucket of sourceBucket.aggs ?? []) {
      const target = addNode(targetBucket.value)
      row.set(target, (row.get(target) ?? 0) + (targetBucket.total ?? 0))
    }
  }

  if (!nodes.length) return { labels: [], matrix: [] }

  // node weight = outgoing flows + incoming flows (the diagonal counts only once)
  const weights = new Map<string, number>()
  for (const node of nodes) {
    let weight = 0
    for (const value of flows.get(node)?.values() ?? []) weight += value
    for (const source of nodes) {
      if (source === node) continue
      weight += flows.get(source)?.get(node) ?? 0
    }
    weights.set(node, weight)
  }

  let kept = nodes.slice()
  let hasOthers = false
  const maxNodes = options.maxNodes ?? 20
  if (maxNodes < nodes.length) {
    const sorted = nodes.slice().sort((a, b) => (weights.get(b) ?? 0) - (weights.get(a) ?? 0))
    kept = sorted.slice(0, Math.max(1, maxNodes - 1))
    hasOthers = true
  }
  const finalNodes = hasOthers ? [...kept, OTHERS_LABEL] : kept
  const index = new Map(finalNodes.map((label, i) => [label, i]))

  const matrix = finalNodes.map(() => finalNodes.map(() => 0))
  for (const [source, row] of flows) {
    const si = index.get(!hasOthers || index.has(source) ? source : OTHERS_LABEL)
    if (si === undefined) continue
    for (const [target, value] of row) {
      const ti = index.get(!hasOthers || index.has(target) ? target : OTHERS_LABEL)
      if (ti === undefined) continue
      matrix[si][ti] += value
    }
  }

  return sortMatrix({ labels: finalNodes, matrix }, options.nodeSort)
}

/**
 * Reorders nodes and matrix: 'alpha' alphabetical, 'total' (default) decreasing
 * weight with alphabetical tie-break. « Autres » stays last.
 */
export function sortMatrix (chordMatrix: ChordMatrix, nodeSort?: string): ChordMatrix {
  const { labels, matrix } = chordMatrix
  if (labels.length <= 1) return chordMatrix

  const weightOf = (i: number) => {
    let weight = 0
    for (let j = 0; j < labels.length; j++) {
      weight += matrix[i][j]
      if (j !== i) weight += matrix[j][i]
    }
    return weight
  }

  const order = labels.map((label, i) => i)
  order.sort((a, b) => {
    if (labels[a] === OTHERS_LABEL) return 1
    if (labels[b] === OTHERS_LABEL) return -1
    if (nodeSort === 'alpha') return labels[a].localeCompare(labels[b], 'fr')
    return (weightOf(b) - weightOf(a)) || labels[a].localeCompare(labels[b], 'fr')
  })

  return {
    labels: order.map(i => labels[i]),
    matrix: order.map(i => order.map(j => matrix[i][j]))
  }
}
