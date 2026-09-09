<template>
  <div class="chord-wrapper">
    <v-empty-state
      v-if="dataError"
      :title="t('dataUnavailable')"
      :text="t('dataUnavailableDesc')"
      :icon="mdiChartDonut"
    />
    <template v-else>
      <div class="chord-chart">
        <svg
          v-if="geometry"
          :width="size"
          :height="size"
          role="img"
          :aria-label="t('ariaChart')"
          class="chord-svg"
        >
          <g :transform="`translate(${size / 2}, ${size / 2}) rotate(${rotation})`">
            <g class="chord-ribbons">
              <path
                v-for="(ribbonPath, i) in geometry.ribbonPaths"
                :key="i"
                :d="ribbonPath"
                :fill="ribbonColor(i)"
                :class="ribbonClasses(i)"
                @click="showRibbonInfo(i)"
                @mouseenter="hover = { type: 'ribbon', index: i }"
                @mouseleave="hover = null"
              />
            </g>
            <g class="chord-arcs">
              <path
                v-for="(arcPath, i) in geometry.arcPaths"
                :key="i"
                :d="arcPath"
                :fill="arcColor(i)"
                :class="arcClasses(i)"
                @click="showArcInfo(i)"
                @mouseenter="hover = { type: 'arc', index: i }"
                @mouseleave="hover = null"
              />
            </g>
            <g
              class="chord-labels"
              fill="currentColor"
            >
              <text
                v-for="(label, i) in geometry.labels"
                :key="i"
                :transform="label.transform"
                :text-anchor="label.anchor"
                :font-size="labelFontSize"
              >{{ label.label }}</text>
            </g>
          </g>
        </svg>
        <v-empty-state
          v-else-if="!loading"
          :title="t('noData')"
          :icon="mdiChartDonut"
        />
      </div>
      <div class="chord-controls">
        <v-slider
          v-model="rotation"
          :label="t('rotation')"
          :min="0"
          :max="360"
          :step="1"
          hide-details
          density="compact"
        />
      </div>
      <v-progress-linear
        v-if="loading"
        class="chord-loading"
        indeterminate
      />
      <v-dialog
        v-model="dialog"
        width="480"
      >
        <v-card :title="dialogTitle">
          <v-card-text>
            <div
              v-for="(line, i) in dialogLines"
              :key="i"
              class="chord-info-line"
            >
              {{ line }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              :text="t('close')"
              @click="dialog = false"
            />
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { useWindowSize } from '@vueuse/core'
import { mdiChartDonut } from '@mdi/js'
import { useConfig } from '@/composables/config'
import { useChordData } from '@/composables/useChordData'
import getColors, { type ThemeColors } from '@/utils/colors'
import { buildChordGeometry } from '@/utils/chord'

const { t, n } = useI18n()
const { config } = useConfig()
const { chordMatrix, loading, dataError } = useChordData()

// couleurs du thème courant : suivent le mode (clair/sombre) et le site
const theme = useTheme()
const sessionColors = computed(() => theme.current.value.colors as unknown as ThemeColors)
const colors = computed(() => getColors(config.value.colorscheme, chordMatrix.value.labels, sessionColors.value))

const { width, height } = useWindowSize()
// la marge basse réserve le slider de rotation
const size = computed(() => Math.max(280, Math.min(width.value, height.value - 88)))
const labelFontSize = computed(() => Math.max(9, Math.min(13, Math.floor(size.value / 38))))

const rotation = ref(0)
const geometry = computed(() => {
  if (!chordMatrix.value.labels.length) return null
  return buildChordGeometry(chordMatrix.value.labels, chordMatrix.value.matrix, size.value, rotation.value)
})

// ── survol : ruban actif, ou arc actif (les rubans reliés s'allument, les autres s'estompent)
const hover = ref<{ type: 'ribbon' | 'arc', index: number } | null>(null)

function ribbonClasses (i: number) {
  const h = hover.value
  if (!h || !geometry.value) return {}
  const { source, target } = geometry.value.chords[i]
  if (h.type === 'ribbon') {
    return { 'is-active': h.index === i, 'is-dim': h.index !== i }
  }
  const connected = h.index === source.index || h.index === target.index
  return { 'is-active': connected, 'is-dim': !connected }
}

function arcClasses (i: number) {
  const h = hover.value
  if (!h || h.type !== 'arc') return {}
  return { 'is-active': h.index === i, 'is-dim': h.index !== i }
}

function ribbonColor (i: number) {
  const chordItem = geometry.value?.chords[i]
  if (!chordItem) return '#9E9E9E'
  return colors.value[chordMatrix.value.labels[chordItem.source.index]] ?? '#9E9E9E'
}

function arcColor (i: number) {
  return colors.value[chordMatrix.value.labels[i]] ?? '#9E9E9E'
}

// ── détails des éléments au clic
const dialog = ref(false)
const dialogTitle = ref('')
const dialogLines = ref<string[]>([])

function showArcInfo (i: number) {
  const { labels, matrix } = chordMatrix.value
  dialogTitle.value = labels[i]
  const groupValue = geometry.value?.groups[i].value ?? matrix[i].reduce((a, v) => a + v, 0)
  dialogLines.value = [`${t('total')} : ${n(groupValue)}`]
  matrix[i]
    .map((value, j) => ({ value, label: labels[j] }))
    .filter(f => f.value > 0)
    .sort((a, b) => b.value - a.value)
    .forEach(f => dialogLines.value.push(`${labels[i]} → ${f.label} : ${n(f.value)}`))
  dialog.value = true
}

function showRibbonInfo (i: number) {
  const chordItem = geometry.value?.chords[i]
  if (!chordItem) return
  const { labels, matrix } = chordMatrix.value
  const si = chordItem.source.index
  const ti = chordItem.target.index
  dialogTitle.value = `${labels[si]} → ${labels[ti]}`
  dialogLines.value = [`${labels[si]} → ${labels[ti]} : ${n(matrix[si][ti])}`]
  if (si !== ti) dialogLines.value.push(`${labels[ti]} → ${labels[si]} : ${n(matrix[ti][si])}`)
  dialog.value = true
}

// ── capture : triggerCapture fiable, y compris sur résultat vide ou erreur
// (une app qui ne déclenche jamais fait attendre au service son timeout complet)
const readyFired = ref(false)

async function fireCapture () {
  if (readyFired.value) return
  readyFired.value = true
  await nextTick()
  window.triggerCapture?.()
}

watch([geometry, loading], ([g, l]) => {
  if (g && !l) fireCapture()
}, { immediate: true })

// résultat vide sans erreur : la capture part quand même, sans attendre le délai du service
watch(loading, (l) => {
  if (!l && !geometry.value && !dataError.value) fireCapture()
})

watch(dataError, (message) => {
  if (message) fireCapture()
})
</script>

<i18n lang="yaml">
fr:
  ariaChart: Diagramme de cordes des flux entre les valeurs des champs source et cible
  rotation: Rotation
  close: Fermer
  total: Total
  noData: Aucune donnée à afficher
  dataUnavailable: Données indisponibles
  dataUnavailableDesc: Le chargement des données a échoué. Le détail de l'erreur a été signalé dans les notifications.
en:
  ariaChart: Chord diagram of flows between source and target field values
  rotation: Rotation
  close: Close
  total: Total
  noData: No data to display
  dataUnavailable: Data unavailable
  dataUnavailableDesc: Data loading failed. The error details were reported in the notifications.
</i18n>

<style scoped>
.chord-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.chord-chart {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.chord-svg {
  overflow: visible;
}
.chord-ribbons path {
  fill-opacity: 0.6;
  cursor: pointer;
}
.chord-ribbons path.is-active {
  fill-opacity: 0.85;
}
.chord-ribbons path.is-dim {
  fill-opacity: 0.15;
}
.chord-arcs path {
  fill-opacity: 1;
  cursor: pointer;
}
.chord-arcs path.is-dim {
  fill-opacity: 0.3;
}
.chord-labels {
  pointer-events: none;
}
.chord-controls {
  flex: none;
  padding: 0 24px;
  /* la ripple du thumb (40px) dépasse du slider (32px) : sans ce clip elle
     ajoute quelques pixels au scrollHeight et fait apparaître une scrollbar */
  overflow: hidden;
}
.chord-loading {
  flex: none;
}
.chord-info-line {
  white-space: pre-wrap;
}
</style>
