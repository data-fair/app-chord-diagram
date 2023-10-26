<template>
  <v-row>
    <v-spacer />
    <v-col class="pa-1" cols="auto">
      <svg id="svgChord2" :width="size" :height="size" :transform="changeRotation(rangeInput)">
        <g id="gChord2" :transform="`translate(${size/2}, ${size / 2})`">

          <g id="gRibbons2">
            <g v-for="ribbon in ribbonList" :key="ribbon.ribbonId">
              <path
                :d="ribbon.ribbonPath"
                :fill="ribbon.ribbonColor"
                :class="[{ activeRibbon: ribbon.ribbonMouseHover },
                         {inactiveRibbons: oneRibbonHover},
                         {activeRibbonByArc: MouseOverArcActive(arcHoverByMouse, ribbon.arcsByRibbon)},
                         {inactiveRibbonByArc: MouseOverArcInactive(arcHoverByMouse, ribbon.arcsByRibbon)}]"
                @click="displayElementsInfo(ribbonHoverByMouse, arcHoverByMouse)"
                @mouseover="ribbon.ribbonMouseHover = true,
                            oneRibbonHover=true,
                            ribbonHoverByMouse = ribbon.mouseOverRibbon"
                @mouseleave="ribbon.ribbonMouseHover = false,
                             oneRibbonHover=false,
                             ribbonHoverByMouse = -1"
              />

            </g>
          </g>

          <g id="gGroups2">
            <g v-for="arc in arcList" :key="arc.arcId">
              <path
                :d="arc.arcPath"
                :fill="arc.arcColor"
                :class="[{ activeArc: arc.arcMouseHover },
                         {inactiveArcs: oneArcHover},]"
                @click="displayElementsInfo(ribbonHoverByMouse, arcHoverByMouse)"
                @mouseover="arc.arcMouseHover = true,
                            oneArcHover=true, arcHoverByMouse=arc.mouseOverArc"
                @mouseleave="arc.arcMouseHover = false,
                             oneArcHover=false,
                             arcHoverByMouse=-1"
              />
            </g>
          </g>

          <g id="gText">
            <g v-for="text in textList" :key="text.textId">
              <text
                :transform="text.textPos"
                :font-size="text.textSize"
              >{{ text.textValue }}</text>
            </g>
          </g>

        </g>
      </svg>
      <input
        id="getInputRange"
        v-model="rangeInput"
        type="range"
        min="0"
        max="360"
        step="1"
        style="width:90%;margin-left:16px;"
      >
    </v-col>
    <v-spacer />
  </v-row>
  <v-menu v-model="dialog" width="500" style="margin-top:32px;margin-left:32px">
    <v-card title="Informations éléments">
      <v-card-text>
        <div v-for="info in infoList" :id="info.idInfo" :key="info.id">
          <text>{{ info.listInfo }}</text>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />

        <v-btn
          text="Fermer"
          @click="dialog = false"
        />
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup>

import * as d3c from 'd3-chord'
import * as d3s from 'd3-shape'
import { ref } from 'vue'
import { useWindowSize } from 'vue-window-size'
import { dataMatrix } from './AxiosRequest.vue'

const { width, height } = useWindowSize()
const size = Math.min(width.value, height.value - 30)
// Création Matrice ===============================================================================
const outerRadius = size * 0.4 - 30
const innerRadius = outerRadius - 20
const matrix = dataMatrix[0]
const arcsNamesList = dataMatrix[1]
const colors = dataMatrix[2]

// Création des Arcs ==============================================================================

// Fonction Calcul Début et Fin Arcs -------------------------------------

const arcsSumValuesList = []
function calculateArc (matrix) {
  // Calcule de la somme de toute les valeurs de la matrice
  let sumAllValues = 0
  matrix.forEach((rows) => {
    rows.forEach((column) => { sumAllValues += column })
  })
  // Calcule la taille des arcs
  let newArcStartAngle = 0
  const arrayArcsValues = []
  const sizeCircle = (32 / 31) * sumAllValues
  const arcPadSize = (Math.PI * (1 / 16)) / matrix.length

  for (let row = 0; row < matrix.length; row++) {
    let sumRows = 0
    matrix[row].forEach((column) => { sumRows += column })
    let newStartAngle = 0
    if (row === 0) { newStartAngle = newArcStartAngle } else { newStartAngle = newArcStartAngle + arcPadSize }
    const newEndAngle = newStartAngle + (Math.PI * 2) * (sumRows / sizeCircle)
    newArcStartAngle = newEndAngle
    const newArcValue = [newStartAngle, newEndAngle]
    arrayArcsValues.push(newArcValue)
  }
  return (arrayArcsValues)
}
const arcsPostionsList = calculateArc(matrix)

// Affichage Arcs --------------------------------------------------------

// Création du Path des Arcs
const arcsPathsList = []
function buildArcsPaths (arcsPostionsList) {
  for (let i = 0; i < arcsPostionsList.length; i++) {
    arcsPathsList.push(d3s.arc()({
      innerRadius: innerRadius - 2,
      outerRadius,
      startAngle: arcsPostionsList[i][0],
      endAngle: arcsPostionsList[i][1]
    }))
  }
}
buildArcsPaths(arcsPostionsList)

// Affichage Arcs avec v-for
const arcList = ref([])
let arcId = 0
function addArc (arcsPathsList) {
  for (let i = 0; i < arcsPathsList.length; i++) {
    arcList.value.push({
      id: arcId++,
      arcPath: arcsPathsList[i],
      arcColor: colors[(arcId - 1) % colors.length],
      arcMouseHover: ref(false),
      mouseOverArc: i,
      arcTitle: arcsNamesList[i] + ': ' + arcsSumValuesList[i]
    })
  }
}
addArc(arcsPathsList)

// Création des Rubans ============================================================================

// Affichage Rubans

function calculateRibbon (matrix) {
  let sumAllValues = 0
  matrix.forEach((rows) => {
    rows.forEach((column) => { sumAllValues += column })
  })
  // Calcule la taille des rubans
  let newRibbonStartAngle = 0
  const arrayRibbonsValues = []
  const sizeCircle = (32 / 31) * sumAllValues
  const ribbonPadSize = (Math.PI * (1 / 16)) / matrix.length

  for (let row = 0; row < matrix.length; row++) {
    const rowMatrix = []
    for (let column = 0; column < matrix[row].length; column++) {
      const sumRows = matrix[row][column]
      let newStartAngle = newRibbonStartAngle
      if (row > 0 && column === 0) { newStartAngle += ribbonPadSize }
      const newEndAngle = newStartAngle + (Math.PI * 2) * (sumRows / sizeCircle)
      newRibbonStartAngle = newEndAngle
      const newRibbonValue = [matrix[row][column], [newStartAngle, newEndAngle]]
      rowMatrix.push(newRibbonValue)
    }
    arrayRibbonsValues.push(rowMatrix)
  }
  return (arrayRibbonsValues)
}
const ribbons = calculateRibbon(matrix)

const ribbonsPathsList = []
const arcsForRibbons = []
const indexColorRibbon = []
function buildRibbonsPaths () {
  const dejaVu = []
  for (let i = 0; i < ribbons.length; i++) {
    for (let j = 0; j < ribbons[i].length; j++) {
      if (!(dejaVu.includes(j))) {
        arcsForRibbons.push([i, j])
        if ((ribbons[i][j][1][1] - ribbons[i][j][1][0]) >= (ribbons[j][i][1][1] - ribbons[j][i][1][0])) {
          indexColorRibbon.push(i)
        } else { indexColorRibbon.push(j) }
        ribbonsPathsList.push(d3c.ribbon()({
          source: { startAngle: ribbons[i][j][1][0], endAngle: ribbons[i][j][1][1], radius: innerRadius },
          target: { startAngle: ribbons[j][i][1][0], endAngle: ribbons[j][i][1][1], radius: innerRadius }
        }))
      }
    }
    dejaVu.push(i)
  }
}
buildRibbonsPaths()

// Affichage Rubans avec v-for
const ribbonList = ref([])
let ribbonId = 0
function addRibbon (ribbonsPathsList) {
  for (let i = 0; i < ribbonsPathsList.length; i++) {
    ribbonList.value.push({
      id: ribbonId++,
      ribbonPath: ribbonsPathsList[i],
      ribbonColor: colors[indexColorRibbon[i] % colors.length],
      ribbonMouseHover: ref(false),
      arcsByRibbon: arcsForRibbons[i],
      mouseOverRibbon: i
    })
  }
}
addRibbon(ribbonsPathsList)

// Création des Balises Texte =====================================================================

function createText (textValue) {
  const middleArcsArray = []
  textValue.forEach((value) => {
    const middleArc = value[1] - (value[1] - value[0]) / 2
    middleArcsArray.push(middleArc)
  })
  const textPercent = []
  for (let i = 0; i < middleArcsArray.length; i++) {
    const a = (middleArcsArray[i] / (Math.PI * 2)) * 100
    textPercent.push(a * 3.6)
  }
  return textPercent
}
const textsPosition = createText(arcsPostionsList)

const textList = ref([])
let textId = 0
function addText (textsPosition) {
  for (let i = 0; i < textsPosition.length; i++) {
    const rotate = textsPosition[i] + 270.8
    let fontSize = '16px'
    if (arcsNamesList[i] === '') { arcsNamesList[i] = 'Autre' }
    if ((rotate - (textsPosition[i - 1] + 270.8)) < 2) { fontSize = '9px' }
    textList.value.push({
      id: textId++,
      textPos: 'rotate(' + rotate + ')translate(' + (outerRadius + 10) + ',' + (0) + ')',
      textValue: arcsNamesList[i],
      textSize: fontSize
    })
  }
}
addText(textsPosition)

// Mise en évidences des Arcs et Rubans ===========================================================

const arcHoverByMouse = -1
const oneRibbonHover = ref(false)
const oneArcHover = ref(false)
const dialog = ref(false)

function MouseOverArcActive (arcHoverByMouse, valRibbon) {
  if (valRibbon.includes(arcHoverByMouse)) {
    return true
  } else { return false }
}

function MouseOverArcInactive (arcHoverByMouse, valRibbon) {
  if (arcHoverByMouse !== -1 && !(valRibbon.includes(arcHoverByMouse))) {
    return true
  } else { return false }
}

// Affichage Informations Eléments ================================================================

const arcsValuesList = []
let arcValue = 0
matrix.forEach((rows) => {
  rows.forEach((column) => { arcValue += column })
  arcsValuesList.push(arcValue)
  arcValue = 0
})

const ribbonHoverByMouse = -1

let infoList = ref([])

function displayElementsInfo (idRibbon, idArc) {
  infoList = ref([])
  const elementInfo = []
  if (idRibbon > -1) {
    const arcs = arcsForRibbons[idRibbon]
    const ribbonInfo1 = arcsNamesList[arcs[0]] + ' → ' + arcsNamesList[arcs[1]] + ': ' + matrix[arcs[0]][arcs[1]]
    let ribbonInfo2 = ''
    if (arcs[0] !== arcs[1]) {
      ribbonInfo2 = arcsNamesList[arcs[1]] + ' → ' + arcsNamesList[arcs[0]] + ': ' + matrix[arcs[1]][arcs[0]]
    }
    elementInfo.push(ribbonInfo1, ribbonInfo2)
  } else if (idArc > -1) {
    elementInfo.push(arcsNamesList[idArc] + ': ' + arcsValuesList[idArc])
    for (let i = 0; i < arcsNamesList.length; i++) {
      elementInfo.push(' - ' + arcsNamesList[idArc] + ' → ' + arcsNamesList[i] + ': ' + matrix[idArc][i])
    }
  }
  let infoId = 0

  for (let i = 0; i < elementInfo.length; i++) {
    infoList.value.push({
      id: infoId++,
      idInfo: 'info' + infoId,
      listInfo: elementInfo[i]
    })
  }
  dialog.value = true
}

// Rotation du Diagramme ==========================================================================

const rangeInput = ref(0)
function changeRotation (rangeInput) {
  const newRotation = 'rotate(' + rangeInput + ')'
  return newRotation
}

</script>

<style>

#gRibbons2{
  fill-opacity: 0.6;
}
.inactiveRibbons{
  fill-opacity: 0.15;
}
.activeRibbon{
  fill-opacity: 0.8;
}

#gGroups2{
  fill-opacity: 1;
}
.inactiveArcs{
  fill-opacity: 0.3;
}
.activeArc{
  fill-opacity: 1;
}

.inactiveRibbonByArc{
  fill-opacity: 0.15;
}
.activeRibbonByArc{
  fill-opacity: 0.8;
}
</style>
