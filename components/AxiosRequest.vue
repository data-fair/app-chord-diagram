<script>
import axios from 'axios'
import * as palette from 'google-palette'

// ---------------------------------------------------------

function createMatrix (dataValues) {
  const regionsList = []
  const numMaxRegion = dataValues.total_values

  for (let r = 0; r < numMaxRegion; r++) {
    regionsList.push(dataValues.aggs[r].value)
  }

  const newMatrix = []
  for (let i = 0; i < numMaxRegion; i++) {
    const numRegion = dataValues.aggs[i].total_values
    const newRow = []
    const rowRegion = []
    for (let j = 0; j < numRegion; j++) {
      rowRegion.push(dataValues.aggs[i].aggs[j].value)
    }
    regionsList.forEach((region) => {
      if (!(rowRegion.includes(region))) { newRow.push(0) }
      for (let j = 0; j < numRegion; j++) {
        if (region === dataValues.aggs[i].aggs[j].value) {
          newRow.push(dataValues.aggs[i].aggs[j].total)
        }
      }
    })
    newMatrix.push(newRow)
  }
  return newMatrix
}

function listeRegion (dataValues) {
  const regionsList = []
  for (let i = 0; i < dataValues.total_values; i++) {
    regionsList.push(dataValues.aggs[i].value)
  }
  return regionsList
}

const config = window.APPLICATION.configuration

const url = `${config.datasets[0].href}/values_agg?field=${config.sourceField.key};${config.targetField.key}`

function selectPalette (preselect, nb) {
  const colorSelection = []
  const colorPalette = palette(preselect, nb)
  colorPalette.forEach((color) => {
    colorSelection.push('#' + color)
  })
  console.log(colorPalette)
  return colorSelection
}

function changeColor (preselect, number) {
  let colorSelection = []
  if (preselect === 'rgb') {
    colorSelection = selectPalette('rainbow', 3)
  } else if (preselect === 'bw') {
    colorSelection = ['#000000', '#e3e3e3']
  } else if (preselect === 'rainbow') {
    colorSelection = selectPalette('rainbow', number)
  } else if (preselect === 'grayscale') {
    if (number > 8) { number = 8 }
    colorSelection = selectPalette('sol-base', number)
  } else if (preselect === 'mpn65') {
    colorSelection = selectPalette('mpn65', number)
  } else if (preselect === 'accent') {
    if (number > 8) { number = 8 }
    colorSelection = selectPalette('cb-Accent', number)
  }
  return colorSelection
}

let data
const axiosData = async () => {
  try {
    data = await axios.get(url)
  } catch (error) {
    console.log(error)
  }
  return data.data
}

const globalData = await axiosData()

const dataMatrix = [createMatrix(globalData), listeRegion(globalData), changeColor(config.colors.name, config.colors.colorNumber)]

export { dataMatrix }

export default {
  data () {
    return {
      dataMatrix,
      testCol
    }
  }
}

</script>

<template>
  <div>
    <h1>Test requêtes Axios:</h1>
  </div>
</template>

<style scoped>
</style>
