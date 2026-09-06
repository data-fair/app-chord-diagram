<template>
  <v-app>
    <v-main>
      <chord-diagram
        v-if="!error"
        class="chord-app"
      />
      <v-empty-state
        v-else
        :headline="errorText"
        :title="t('incompleteConfig')"
        :icon="mdiChartDonut"
      />
    </v-main>
    <df-ui-notif />
  </v-app>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiChartDonut } from '@mdi/js'
import DfUiNotif from '@data-fair/lib-vuetify/ui-notif.vue'
import { useConfig } from '@/composables/config'

const { t, te } = useI18n()
const { error } = useConfig()

const errorText = computed(() => {
  if (!error.value) return undefined
  return te(error.value) ? t(error.value) : error.value
})

const ChordDiagram = defineAsyncComponent(() => import('@/components/ChordDiagram.vue'))

// capture immédiate même sur une config invalide : le service attend triggerCapture
watch(error, async (message) => {
  if (message) {
    await nextTick()
    window.triggerCapture?.()
  }
}, { immediate: true })
</script>

<i18n lang="yaml">
fr:
  incompleteConfig: Configuration incomplète
  noConfig: Il n'y a pas de configuration définie
  noDataset: Veuillez sélectionner une source de données
  noSourceField: Veuillez sélectionner la colonne source
  noTargetField: Veuillez sélectionner la colonne cible
en:
  incompleteConfig: Incomplete configuration
  noConfig: No configuration defined
  noDataset: Please select a data source
  noSourceField: Please select the source column
  noTargetField: Please select the target column
</i18n>

<style scoped>
.chord-app {
  height: 100%;
}
</style>
