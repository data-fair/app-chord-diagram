import type { Filter } from '@data-fair/lib-utils/filters/index.js'
import type { ChordMatrix } from '@/utils/matrix'
import type { ValuesAggResponse } from '@/utils/matrix'
import { computed, watch } from 'vue'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { getErrorMsg, useUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { useConceptFilters } from '@data-fair/lib-vue/concept-filters.js'
import { filters2params } from '@data-fair/lib-utils/filters/index.js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useConfig } from './config'
import { buildChordMatrix } from '@/utils/matrix'

export function useChordData () {
  const { config, dataset, datasetUrl, finalizedAt } = useConfig()
  const { sendUiNotif } = useUiNotif()

  const conceptFilters = useConceptFilters(reactiveSearchParams, dataset.value?.id)

  const sourceKey = computed(() => config.value.sourceField?.key)
  const targetKey = computed(() => config.value.targetField?.key)

  function staticFilterParams (): Record<string, string> {
    const sf = (config.value.staticFilters ?? []).map((f: Record<string, unknown>) => ({
      ...f,
      field: typeof f.field === 'string' ? { key: f.field } : f.field
    })) as Filter[]
    return sf.length ? filters2params(sf) : {}
  }

  // null url as long as the config is incomplete: useFetch stays inactive
  const url = computed(() =>
    (datasetUrl.value && sourceKey.value && targetKey.value)
      ? `${datasetUrl.value}/values_agg`
      : null)

  const query = computed(() => ({
    field: `${sourceKey.value};${targetKey.value}`,
    // two levels of buckets (source then target), capped at the number of nodes
    agg_size: `${config.value.maxNodes ?? 20};${config.value.maxNodes ?? 20}`,
    finalizedAt: finalizedAt.value,
    ...staticFilterParams(),
    ...conceptFilters
  }))

  const { data, loading, error } = useFetch<ValuesAggResponse>(url, { query, notifError: false })

  // fleet convention (see app-charts): the details of a failure go to a global
  // notification, the visualization area only shows that there is nothing to draw
  watch(error, (e) => {
    if (e) sendUiNotif({ type: 'error', msg: getErrorMsg(e) })
  })

  const chordMatrix = computed<ChordMatrix>(() =>
    buildChordMatrix(data.value ?? {}, {
      maxNodes: config.value.maxNodes,
      nodeSort: config.value.nodeSort
    }))

  return { chordMatrix, loading, dataError: error }
}
