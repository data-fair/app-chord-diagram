import type { Application, Dataset, Field, AnyConfig } from '@/types'
import { inject, computed, ref, type App, type Ref } from 'vue'

export interface ConfigState {
  application: Application
  config: Ref<AnyConfig>
  setConfig: (newConfig: AnyConfig) => void
  notifyConfigChange: (field: string, value: unknown) => void
  dataset: Ref<Dataset | undefined>
  fields: Ref<Record<string, Field>>
  datasetUrl: Ref<string | undefined>
  finalizedAt: Ref<string | undefined>
  error: Ref<string | null>
}

export function createConfig () {
  const application = window.APPLICATION
  const config = ref<AnyConfig>((application?.configuration || {}) as AnyConfig)

  // Visu mono-dataset : le premier jeu de données configuré
  const dataset = computed(() => config.value?.datasets?.[0] as Dataset | undefined)

  const fields = computed(() => {
    const schema = dataset.value?.schema || []
    return schema.reduce((acc: Record<string, Field>, field: Field) => {
      if (field.key) acc[field.key] = field
      return acc
    }, {})
  })

  const datasetUrl = computed(() => dataset.value?.href)
  const finalizedAt = computed(() => dataset.value?.finalizedAt)

  // clés i18n : App.vue les traduit si elles existent, sinon affiche la valeur brute
  const error = computed(() => {
    const c = config.value
    if (!c) return 'noConfig'
    if (!dataset.value) return 'noDataset'
    if (!c.sourceField?.key) return 'noSourceField'
    if (!c.targetField?.key) return 'noTargetField'
    return null
  })

  function setConfig (newConfig: AnyConfig) {
    config.value = newConfig
  }

  function notifyConfigChange (field: string, value: unknown) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'set-config',
        content: { field, value }
      }, window.location.origin)
    }
  }

  const forbiddenKeys = new Set(['__proto__', 'constructor', 'prototype'])

  function setByPath (obj: Record<string, unknown>, path: string, value: unknown) {
    const keys = path.split('.')
    if (keys.some(key => forbiddenKeys.has(key))) return
    let current: Record<string, unknown> = obj
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {}
      } else {
        current[key] = Array.isArray(current[key]) ? [...current[key] as unknown[]] : { ...current[key] }
      }
      current = current[key] as Record<string, unknown>
    }
    current[keys[keys.length - 1]] = value
  }

  return {
    install (app: App) {
      app.provide('data-fair-app-config', {
        application,
        config,
        setConfig,
        notifyConfigChange,
        dataset,
        fields,
        datasetUrl,
        finalizedAt,
        error
      })

      let allowedOrigin: string | null = null
      try { allowedOrigin = new URL(window.APPLICATION?.href).origin } catch { /* pas de href exploitable */ }

      window.addEventListener('message', (event) => {
        if (allowedOrigin && event.origin !== allowedOrigin) return
        if (event.data?.type === 'set-config' && event.data?.content) {
          const { content } = event.data
          // UI → app : la config complète directement dans content ;
          // app → UI : { field, value } (update par path)
          if (content.configuration) {
            config.value = content.configuration
          } else if (content.datasets) {
            config.value = content
          } else if (content.field && 'value' in content) {
            const newConfig = JSON.parse(JSON.stringify(config.value))
            setByPath(newConfig, content.field, content.value)
            config.value = newConfig
          }
        }
      })
    }
  }
}

export function useConfig (): ConfigState {
  const config = inject<ConfigState>('data-fair-app-config')
  if (!config) throw new Error('useConfig requires using the plugin createConfig')
  return config
}

export default useConfig
