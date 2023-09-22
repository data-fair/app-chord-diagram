<template>
  <h1 title="Test">D3 Chord Diagram</h1>
  <div id="diagram">
    <div id="displayDiagram">
      <h2>Diagramme Chord</h2>
      <!--svg id="svgChord2" width="1200" height="1200"-->
      <svg id="svgChord2" width="1200" height="1200" :transform="test(testInput)">
        <g id="gChord2" transform="translate(600, 600)">
          
          <g id="gRibbons2">
            <g  v-for="ribbon in ribbonList" :key="ribbon.ribbonId">
                <path
                :d="ribbon.ribbonPath"
                :fill="ribbon.ribbonColor"
                @mouseover="ribbon.ribbonMouseHover = true, oneRibbonHover=true, ribbonHoverByMouse = ribbon.mouseOverRibbon, displayElementsInfo(ribbonHoverByMouse, arcHoverByMouse)"
                @mouseleave="ribbon.ribbonMouseHover = false, oneRibbonHover=false, ribbonHoverByMouse = -1"
                :class="[{ activeRibbon: ribbon.ribbonMouseHover }, 
                  {inactiveRibbons: oneRibbonHover}, 
                  {activeRibbonByArc: MouseOverArcActive(arcHoverByMouse, ribbon.arcsByRibbon)},
                  {inactiveRibbonByArc: MouseOverArcInactive(arcHoverByMouse, ribbon.arcsByRibbon)}]" />
                
            </g>
          </g>

          <g id="gGroups2">
            <g  v-for="arc in arcList" :key="arc.arcId" >
                <path
                :d="arc.arcPath"
                :fill="arc.arcColor"
                @mouseover="arc.arcMouseHover = true, oneArcHover=true, arcHoverByMouse=arc.mouseOverArc, displayElementsInfo(ribbonHoverByMouse, arcHoverByMouse)"
                @mouseleave="arc.arcMouseHover = false, oneArcHover=false, arcHoverByMouse=-1"
                :class="[{ activeArc: arc.arcMouseHover }, 
                  {inactiveArcs: oneArcHover},]" />
            </g>
          </g>

          <g id="gText">
            <g v-for="text in textList" :key="text.textId">
              <text  
              :transform=text.textPos 
              :font-size="text.textSize"
              >{{ text.textValue }}</text>
            </g>
          </g>

        </g>
      </svg>
      <input id="getInputRange" type="range" min="0" max="360" step="1" v-model="testInput">
      <br/>
      <input v-model="testInput" type="number">
      <p>{{ testInput }}</p>
    </div>

    <div id="diagramInfo">
      <h2>Informations éléments</h2>
      <p>{{displayElementsInfo(ribbonHoverByMouse, arcHoverByMouse)[0]}}</p>
      <p>{{displayElementsInfo(ribbonHoverByMouse, arcHoverByMouse)[1]}}</p>
    </div>
  </div>
</template>

<script setup>

import * as d3 from 'd3'
import { ref } from 'vue'
import { dataMatrix } from './AxiosRequest.vue';


// Création Matrice ===============================================================================
const width = 900;
const height = width;
const outerRadius = Math.min(width, height) * 0.5 - 30;
const innerRadius = outerRadius - 20;
const matrix = dataMatrix[0]
const arcsNamesList = dataMatrix[1]


// Création des Arcs ==============================================================================

// Fonction Calcul Début et Fin Arcs ------------------------------------- 

const arcsSumValuesList = []
function calculateArc(matrix) {
  // Calcule de la somme de toute les valeurs de la matrice
  let sumAllValues = 0;
  matrix.forEach(rows => {
      rows.forEach((column) => sumAllValues += column)
  });
  // Calcule la taille des arcs
  let newArcStartAngle = 0;
  let arrayArcsValues = [];
  const sizeCircle = (32/31) * sumAllValues;
  const arcPadSize = (Math.PI*(1/16))/matrix.length;

  for(let row = 0; row<matrix.length; row++){
    let sumRows = 0;
    matrix[row].forEach((column) => sumRows += column);
    let newStartAngle = 0
    if (row == 0) {newStartAngle = newArcStartAngle;}
    else {newStartAngle = newArcStartAngle + arcPadSize;}
    const newEndAngle = newStartAngle + (Math.PI*2)*(sumRows/sizeCircle);
    newArcStartAngle = newEndAngle;
    let newArcValue = [newStartAngle, newEndAngle];
    arrayArcsValues.push(newArcValue)
  }
  return(arrayArcsValues)
}
const arcsPostionsList = calculateArc(matrix)

// Affichage Arcs --------------------------------------------------------

// Création du Path des Arcs
let arcsPathsList = [];
function buildArcsPaths(arcsPostionsList){
  for (let i=0; i<arcsPostionsList.length; i++) {
    arcsPathsList.push(d3.arc()({
        innerRadius: innerRadius-2,
        outerRadius: outerRadius,
        startAngle: arcsPostionsList[i][0],
        endAngle: arcsPostionsList[i][1]
    }))
  }
}
buildArcsPaths(arcsPostionsList)


// Affichage Arcs avec v-for
const arcList = ref([])
const color = ['#48118a', '#d60d06', '#0d309e', '#1a1a1a', '#0b996c']
let arcId = 0
function addArc(arcsPathsList) {
  for(let i=0; i<arcsPathsList.length; i++) {
      arcList.value.push({ 
        id: arcId++, 
        arcPath: arcsPathsList[i], 
        arcColor: color[(arcId-1)%5],
        arcMouseHover: ref(false),
        mouseOverArc: i,
        arcTitle: arcsNamesList[i] + ': ' + arcsSumValuesList[i]
      })
  }
}
addArc(arcsPathsList)


// Création des Rubans ============================================================================

// Affichage Rubans

function calculateRibbon(matrix) {

  let sumAllValues = 0;
  matrix.forEach(rows => {
      rows.forEach((column) => sumAllValues += column)
  });
  // Calcule la taille des rubans
  let newRibbonStartAngle = 0; // startAngle pour chaque ruban
  let arrayRibbonsValues = []; // tables où seront enregistré start/endAngle de chaque ruban
  const sizeCircle = (32/31) * sumAllValues; // taille du cercle complet
  const ribbonPadSize = (Math.PI*(1/16))/matrix.length; // écart entre chaque groupe de rubans

  for(let row = 0; row<matrix.length; row++){
      let rowMatrix = []
      for(let column = 0; column<matrix[row].length; column++) {
          let sumRows = matrix[row][column]
          let newStartAngle = newRibbonStartAngle
          if (row > 0 && column == 0) {newStartAngle += ribbonPadSize}
          const newEndAngle = newStartAngle + (Math.PI*2)*(sumRows/sizeCircle)
          newRibbonStartAngle = newEndAngle
          let newRibbonValue = [matrix[row][column], [newStartAngle, newEndAngle]];
          rowMatrix.push(newRibbonValue)
      }
      arrayRibbonsValues.push(rowMatrix)
  }
  return(arrayRibbonsValues)
}
const ribbons = calculateRibbon(matrix)


let ribbonsPathsList = []
let arcsForRibbons = []
let indexColorRibbon = []
function buildRibbonsPaths() {
const dejaVu = []
  for (let i=0; i<ribbons.length; i++) {
    for (let j=0; j<ribbons[i].length; j++) {
        if (!(dejaVu.includes(j))) {
          arcsForRibbons.push([i, j])
          // max entre end-start(source) et end-start(target)
          if ((ribbons[i][j][1][1]-ribbons[i][j][1][0]) >= (ribbons[j][i][1][1]-ribbons[j][i][1][0])) {
            indexColorRibbon.push(i)
          } else {indexColorRibbon.push(j)}
          ribbonsPathsList.push(d3.ribbon()({
            source: {startAngle: ribbons[i][j][1][0], endAngle: ribbons[i][j][1][1], radius: innerRadius},
            target: {startAngle: ribbons[j][i][1][0], endAngle: ribbons[j][i][1][1], radius: innerRadius}
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
function addRibbon(ribbonsPathsList) {
  for(let i=0; i<ribbonsPathsList.length; i++) {
      ribbonList.value.push({ 
        id: ribbonId++, 
        ribbonPath: ribbonsPathsList[i], 
        ribbonColor: color[indexColorRibbon[i]%5],
        ribbonMouseHover: ref(false),
        arcsByRibbon: arcsForRibbons[i],
        mouseOverRibbon: i
      })
  }
}
addRibbon(ribbonsPathsList)


// Création des Balises Texte =====================================================================

function createText(textValue) {
  const middleArcsArray = []
  textValue.forEach(value => {
    const middleArc = value[1] - (value[1] - value[0]) / 2
    middleArcsArray.push(middleArc)
  })
  const textPercent = []
  for (let i=0; i<middleArcsArray.length; i++) {
    const a = (middleArcsArray[i] / (Math.PI*2))*100
    textPercent.push(a*3.6)
  }
  return textPercent
}
const textsPosition = createText(arcsPostionsList)

const textList = ref([])
let textId = 0
function addText(textsPosition) {
  for(let i=0; i<textsPosition.length; i++) {
    const rotate = textsPosition[i]+270.8
    let fontSize = "16px"
    if (arcsNamesList[i] == "") {arcsNamesList[i] = "Autre"}
    if ((rotate-(textsPosition[i-1]+270.8)) < 2) {fontSize="9px"}
    textList.value.push({ 
      id: textId++, 
      textPos: "rotate("+rotate+")translate("+(430)+","+(0)+")", 
      textValue: arcsNamesList[i], 
      textSize: fontSize
    })
  }
}
addText(textsPosition)


// Mise en évidences des Arcs et Rubans ===========================================================

let arcHoverByMouse = -1
const oneRibbonHover = ref(false)
const oneArcHover = ref(false)

function MouseOverArcActive(arcHoverByMouse, valRibbon) {
  if (valRibbon.includes(arcHoverByMouse)) {
    return true
  }else {return false}
}

function MouseOverArcInactive(arcHoverByMouse, valRibbon) {
  if (arcHoverByMouse != -1 && !(valRibbon.includes(arcHoverByMouse))) {
      return true
  }else {return false}
}


// Affichage Informations Eléments ================================================================

const arcsValuesList = []
  let arcValue = 0;
  matrix.forEach(rows => {
      rows.forEach((column) => arcValue += column)
      arcsValuesList.push(arcValue)
      arcValue = 0
  });

let ribbonHoverByMouse = -1
function displayElementsInfo(idRibbon, idArc) {
  if (idRibbon > -1) {
    const arcs = arcsForRibbons[idRibbon]
    const ribbonInfo1 = arcsNamesList[arcs[0]] + " → " + arcsNamesList[arcs[1]] + ": " + matrix[arcs[0]][arcs[1]]
    let ribbonInfo2 = ""
    if (arcs[0] != arcs[1]) {
      ribbonInfo2 = arcsNamesList[arcs[1]] + " → " + arcsNamesList[arcs[0]] + ": " + matrix[arcs[1]][arcs[0]]}
    return([ribbonInfo1, ribbonInfo2])
  }
  else if (idArc > -1) {
    const arcInfo = arcsNamesList[idArc] + ": " + arcsValuesList[idArc]
    return ([arcInfo, ""])
  }
  else{return (["", ""])}
}


// Rotation du Diagramme ==========================================================================

const testInput = ref(0)
function test(testInput) {
  const testRotate = "rotate("+ testInput + ")"
  return testRotate
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


#diagram{
  display: flex;
  flex-direction: row;
}
#displayDiagram{
  background-color: #fff0f0;
  padding: 10px;
}
#diagramInfo{
  background-color: #d9e2ff;
  padding: 10px;
  width: auto;
}

input[type="range"] {
  width:360px;
}


</style>
