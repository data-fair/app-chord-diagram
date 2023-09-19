<template>
  <div>
    <h1>D3 Chord Diagram</h1>
    <svg id="svgChord2" width="1200" height="1200">
      <g id="gChord2" transform="translate(600, 600)">
        
        <g id="gRibbons2">
          <g  v-for="ribbon in ribbonList" :key="ribbon.ribbonId" >
              <path
              :d="ribbon.ribbonPath"
              :fill="ribbon.ribbonColor"
              @mouseover="hover = true"
              @mouseleave="hover = false"
              :class="{ active: hover }" />
          </g>
        </g>

        <g id="gGroups2">
          <g  v-for="arc in arcList" :key="arc.arcId" >
              <path
              :d="arc.arcPath"
              :fill="arc.arcColor"
              class="arc" />
          </g>
        </g>

        <g id="gText">
          <g v-for="text in textList" :key="text.textId">
            <text  :transform=text.textPos :font-size="text.textSize">{{ text.textValue }}</text>
          </g>
        </g>

      </g>
    </svg>
  </div>
</template>

<script setup>

import * as d3 from 'd3'
import { ref } from 'vue'
import { dataMatrix } from './AxiosRequest.vue';

const hover = ref(false)

// Création Matrice ===============================================================================
const width = 900;
const height = width;
const outerRadius = Math.min(width, height) * 0.5 - 30;
const innerRadius = outerRadius - 20;
const matrix = dataMatrix[0]
const valueList = dataMatrix[1]
/*const matrix = [
  [11975,  5871, 8916, 2868],
  [ 1951, 10048, 2060, 6171],
  [ 8010, 16145, 8090, 8045],
  [ 1013,   990,  940, 6907]];*/

/*const matrix = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]*/

  /*const matrix = [
    [3, 3, 3, 3],
    [4, 4, 4, 4],
    [5, 5, 5, 5],
    [6, 6, 6, 6]
  ]*/


// Création des Arcs ==============================================================================

// Fonction Calcul Début et Fin Arcs ------------------------------------- 

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
const arcsStartEndAngle = calculateArc(matrix)

// Affichage Arcs --------------------------------------------------------

// Création du Path des Arcs
let arcsPathArray = [];
for (let i=0; i<arcsStartEndAngle.length; i++) {
  arcsPathArray.push(d3.arc()({
      innerRadius: innerRadius-2,
      outerRadius: outerRadius,
      startAngle: arcsStartEndAngle[i][0],
      endAngle: arcsStartEndAngle[i][1]
  }))
}


// Affichage Arcs avec v-for
const arcList = ref([])
//const color = ['#d43333', '#3353d4', '#d4b933', '#33d435', '#d9d9d9', '#d48633', '#f266d4', '#525252']#4d226e
const color = ['#44206e', '#acdb56', '#173799', '#e6f728', '#2a9c78']
let arcId = 0
function addArc(arcsPathArray) {
  for(let i=0; i<arcsPathArray.length; i++) {
      arcList.value.push({ 
        id: arcId++, 
        arcPath: arcsPathArray[i], 
        arcColor: color[(arcId-1)%5]
      })
  }
}
addArc(arcsPathArray)


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


let ribbonsPathArray = [];
let dejaVu = []
let indexColorRibbon = []
for (let i=0; i<ribbons.length; i++) {
  for (let j=0; j<ribbons[i].length; j++) {
      if (!(dejaVu.includes(j))) {
        // max entre end-start(source) et end-start(target)
        if ((ribbons[i][j][1][1]-ribbons[i][j][1][0]) >= (ribbons[j][i][1][1]-ribbons[j][i][1][0])) {
          indexColorRibbon.push(i)
        } else {indexColorRibbon.push(j)}
        // source: i / target: j -> k
        // k%8 = color
        ribbonsPathArray.push(d3.ribbon()({
          source: {startAngle: ribbons[i][j][1][0], endAngle: ribbons[i][j][1][1], radius: innerRadius},
          target: {startAngle: ribbons[j][i][1][0], endAngle: ribbons[j][i][1][1], radius: innerRadius}
        }))
      }
  }
  dejaVu.push(i)
}
console.log(indexColorRibbon)



// Affichage Rubans avec v-for
const ribbonList = ref([])
let ribbonId = 0
function addRibbon(ribbonsPathArray) {
  for(let i=0; i<ribbonsPathArray.length; i++) {
      ribbonList.value.push({ 
        id: ribbonId++, 
        ribbonPath: ribbonsPathArray[i], 
        ribbonColor: color[indexColorRibbon[i]%5]
      })
  }
}
addRibbon(ribbonsPathArray)


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
const textsPosition = createText(arcsStartEndAngle)

const textList = ref([])
let textId = 0
function addText(textsPosition) {
  for(let i=0; i<textsPosition.length; i++) {
    const rotate = textsPosition[i]+270.8
    let fontSize = "16px"
    if (valueList[i] == "") {valueList[i] = "Autre"}
    if ((rotate-(textsPosition[i-1]+270.8)) < 2) {/*valueList[i] = "-";*/ fontSize="9px"}
    textList.value.push({ 
      id: textId++, 
      textPos: "rotate("+rotate+")translate("+(430)+","+(0)+")", 
      textValue: valueList[i], 
      textSize: fontSize
    })
  }
}
addText(textsPosition)


/*
Mouse :Over
Ruban: Les Rubans non sélectionné voient leurs opacité réduite, les Arcs ne changent pas
Arc: Les Arcs non sélectionné voient leurs opacité réduite, les Ruban n'appartenant pas à l'Arc sélectionné voient leurs opacité réduite
*/



</script>


<style>

#gRibbons2{
  fill-opacity: 0.5;
}
.active {
  fill-opacity: 0.7;
}

#gGroups2{
  fill-opacity: 1;
}

</style>
