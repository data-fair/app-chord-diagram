import { test, expect } from '@playwright/test'
import { buildChordMatrix, sortMatrix, OTHERS_LABEL, type ValuesAggResponse } from '@/utils/matrix'

// IDF → AURA (12), IDF → Bretagne (7), AURA → IDF (5),
// Bretagne → Bretagne (3), Bretagne → Normandie (2)
// Normandie n'apparaît qu'en valeur cible : c'est précisément le cas que
// l'ancienne implémentation perdait en ne lisant que les buckets source.
const response: ValuesAggResponse = {
  total_values: 4,
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
      total_values: 2,
      aggs: [
        { value: 'Bretagne', total: 3 },
        { value: 'Normandie', total: 2 }
      ]
    }
  ]
}

test.describe('buildChordMatrix', () => {
  test('builds a square matrix over the union of source and target values', () => {
    const { labels, matrix } = buildChordMatrix(response)
    // Normandie n'est jamais source : elle doit quand même avoir son nœud
    expect(labels).toHaveLength(4)
    expect(matrix).toHaveLength(4)
    matrix.forEach(row => expect(row).toHaveLength(4))
    expect(new Set(labels)).toEqual(new Set([
      'Île-de-France',
      'Auvergne-Rhône-Alpes',
      'Bretagne',
      'Normandie'
    ]))
  })

  test('keeps flow direction and values, including self-flows', () => {
    const { labels, matrix } = buildChordMatrix(response, { nodeSort: 'alpha' })
    const i = (label: string) => labels.indexOf(label)
    expect(matrix[i('Île-de-France')][i('Auvergne-Rhône-Alpes')]).toBe(12)
    expect(matrix[i('Auvergne-Rhône-Alpes')][i('Île-de-France')]).toBe(5)
    expect(matrix[i('Bretagne')][i('Bretagne')]).toBe(3)
    expect(matrix[i('Bretagne')][i('Normandie')]).toBe(2)
  })

  test('merges duplicate source buckets instead of overwriting them', () => {
    const duplicated: ValuesAggResponse = {
      aggs: [
        { value: 'A', aggs: [{ value: 'B', total: 2 }] },
        { value: 'A', aggs: [{ value: 'B', total: 3 }, { value: 'B', total: 1 }] }
      ]
    }
    const { matrix } = buildChordMatrix(duplicated, { nodeSort: 'alpha' })
    expect(matrix[0][1]).toBe(6)
    expect(matrix).toHaveLength(2)
  })

  test('renames empty values to « Autre »', () => {
    const { labels } = buildChordMatrix({ aggs: [{ value: '', aggs: [{ value: 'B', total: 1 }] }] }, { nodeSort: 'alpha' })
    expect(labels).toEqual(['Autre', 'B'])
  })

  test('returns empty lists on an empty response', () => {
    expect(buildChordMatrix({})).toEqual({ labels: [], matrix: [] })
    expect(buildChordMatrix({ aggs: [] })).toEqual({ labels: [], matrix: [] })
  })

  test('groups the least connected nodes into « Autres » beyond maxNodes', () => {
    const { labels, matrix } = buildChordMatrix(response, { maxNodes: 3 })
    // poids : IDF 24, AURA 17, Bretagne 15, Normandie 2
    // → on garde IDF et AURA, « Autres » agrège Bretagne et Normandie
    expect(labels).toHaveLength(3)
    expect(labels[2]).toBe(OTHERS_LABEL)
    const idf = labels.indexOf('Île-de-France')
    const aura = labels.indexOf('Auvergne-Rhône-Alpes')
    expect(matrix[idf][aura]).toBe(12)
    expect(matrix[idf][2]).toBe(7)
    expect(matrix[aura][idf]).toBe(5)
    // les flux internes des nœuds regroupés rejoignent la diagonale de « Autres »
    expect(matrix[2][2]).toBe(5)
  })

  test('keeps maxNodes - 1 real nodes plus « Autres »', () => {
    const { labels } = buildChordMatrix(response, { maxNodes: 2 })
    expect(labels.filter(l => l !== OTHERS_LABEL)).toHaveLength(1)
    expect(labels[1]).toBe(OTHERS_LABEL)
  })

  test('does not create « Autres » when all nodes fit', () => {
    const { labels } = buildChordMatrix(response, { maxNodes: 20 })
    expect(labels).not.toContain(OTHERS_LABEL)
  })

  test('sorts by decreasing weight by default and alphabetically on demand', () => {
    const defaultSorted = buildChordMatrix(response)
    // IDF (24) puis AURA (17) puis Bretagne (15) puis Normandie (2)
    expect(defaultSorted.labels).toEqual([
      'Île-de-France',
      'Auvergne-Rhône-Alpes',
      'Bretagne',
      'Normandie'
    ])

    const alphaSorted = buildChordMatrix(response, { nodeSort: 'alpha' })
    expect(alphaSorted.labels[0]).toBe('Auvergne-Rhône-Alpes')
    expect(alphaSorted.labels).toHaveLength(4)
  })
})

test.describe('sortMatrix', () => {
  test('forces « Autres » last, whatever the sort order', () => {
    const sorted = sortMatrix({
      labels: [OTHERS_LABEL, 'Zèbre', 'Abeille'],
      matrix: [
        [0, 1, 1],
        [1, 0, 5],
        [1, 5, 0]
      ]
    }, 'alpha')
    expect(sorted.labels[2]).toBe(OTHERS_LABEL)
    expect(sorted.labels[0]).toBe('Abeille')
    expect(sorted.labels[1]).toBe('Zèbre')
  })

  test('reorders the matrix rows and columns consistently', () => {
    const sorted = sortMatrix({
      labels: ['B', 'A'],
      matrix: [[1, 2], [3, 4]]
    }, 'alpha')
    expect(sorted.labels).toEqual(['A', 'B'])
    expect(sorted.matrix).toEqual([[4, 3], [2, 1]])
  })

  test('breaks weight ties alphabetically', () => {
    const sorted = sortMatrix({
      labels: ['B', 'A'],
      matrix: [[0, 2], [2, 0]]
    }, 'total')
    expect(sorted.labels).toEqual(['A', 'B'])
  })

  test('leaves single-node matrices untouched', () => {
    const single = { labels: ['Seul'], matrix: [[3]] }
    expect(sortMatrix(single, 'alpha')).toBe(single)
  })
})
